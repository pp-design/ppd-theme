const path = require("path");
const { v1 } = require("uuid");
const { fs, logger, chalk } = require("ppd-utils");

const loadConfig = require("../lib/config");
const Render = require("../lib/Render");
const cssShake = require('../lib/css-shake');

let config = null;
const uuid = v1();

async function theme(themeName, options) {
    options = Object.assign(options, { importer: getImporter(options) });
    watcher = {};
    await render(themeName, options);
}

async function render(themeName, options) {
    const { source, watch: isWatch } = options;
    config = await loadConfig();
    if (source) {
        renderTheme(null, options);
    } else {
        const themes = getThemes(themeName);
        const len = themes ? themes.length : 0;
        for (let i = 0; i < len; i++) {
            await renderTheme(themes[i], options);
        }
    }
    if (isWatch) {
        logger.log(chalk(`\n${chalk.cyan("正在监视皮肤更改...")}\n`));
    }
}

async function renderTheme(theme, options) {
    theme = theme || {};
    const themeName = theme.name;

    options = options || {};
    let {
        map,
        watch,
        postcss,
        importer,
        collective,
        quiet = true,
        cssVariable = false,
        cssVariableShake = false,
        outputStyle = "expanded",
        source = theme.source || theme.src,
        output = theme.output,
        variables = theme.variables
    } = options;

    if (themeName) {
        logger.log(chalk(`\n正在编译皮肤：${chalk.cyan(themeName)}   输出路径：${chalk.cyan(output)}\n`));
    }

    const themeOptions = {
        uuid, themeName, source, output, variables, map, watch, quiet, postcss, importer, outputStyle, collective, cssVariable
    };

    const render = new Render(themeOptions);
    await render.render();

    if(cssVariableShake) {
        await cssShake(config);
    }    
}

function getThemes(themeName) {
    let _themes = [];
    const { themes = [] } = config;
    if (themeName) {
        const themeNames = themeName.split(",");
        themes.forEach(theme => {
            if (theme && themeNames.indexOf(theme.name) >= 0) {
                _themes.push(theme);
            }
        });
    }
    if (_themes.length <= 0 && themes) {
        _themes = themes;
    }
    return _themes;
}

function getImporter(options) {
    let importer = null;
    let { importer: importerPath = (config ? config.importer : "") } = options;
    if (importerPath) {
        if (!(path.resolve(importerPath) === path.normalize(importerPath).replace(/(.+)([\/|\\])$/, '$1'))) {
            importerPath = path.resolve(importerPath);
        }
    }
    if (fs.pathExistsSync(importerPath)) {
        importer = require(importerPath);
    } else {
        importer = require("./../lib/importer");
    }
    return importer;
}

module.exports = (themeName, options) => {
    return theme(themeName, options);
}