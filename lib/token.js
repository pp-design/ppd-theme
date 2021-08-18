const path = require("path");
const { fs, type, file: File } = require("ppd-utils");

const reader = require("./reader");
const getUrls = require("./geturls");
const cleaner = require("./cleaner");
const compiler = require("./compiler");

const { clearScssFunc, escapeRegExp, clearComment } = require("./utils");

const cwd = process.cwd();

let isCssVariable = false;

async function readVariables(themeName, target) {
    let variable, tokens = [], cssVariables = [];
    let len = target ? target.length : 0;
    if (len > 0) {
        variable = "";
        for (let i = 0; i < len; i++) {
            let { value, tokens: variableTokens } = await readVariable(target[i]);
            tokens = tokens.concat(variableTokens);
            variable += `${value}\n`;
            if (isCssVariable) {
                let result = formatCssVariable(target[i], value);
                if(result) {
                    cssVariables.push(result);
                }
            }
        }
    }
    await exportCssVariables(themeName, cssVariables, variable);
    return { variable, tokens };
}

function formatCssVariable(file, value) {
    value = clearScssFunc(value);
    let variables = value.match(/\$.*?:(.|\n|\r|\n\r)*?;/gi);
    let tokenReg = /\$.*?:/gi;
    let cssToken = "";
    let hasExits = {};
    let len = variables ? variables.length : 0;
    for (let i = 0; i < len; i++) {
        let token = variables[i].match(tokenReg)[0];
        if (hasExits[token]) continue;
        hasExits[token] = true;

        token = token.substring(0, token.length - 1);
        cssToken += `\n    ${token.replace(/\$/gi, "--")}: #{${token}};`
        // cssToken += `\n    ${token.replace(/\$/gi, "ppd-prefix-")}: ${token};`
    }

    if (cssToken) {
        cssToken = `:root{\n${cssToken}}`;
        return { file: file, value: cssToken }
    } else {
        return null;
    }
}

async function exportCssVariables(themeName, cssVars, variable) {
    let len = cssVars ? cssVars.length : 0;
    for (let i = 0; i < len; i++) {
        let { file, value } = cssVars[i];
        if (file && value) {
            let { css } = await compiler(null, null, null, {
                data: value,
                token: variable
            });

            if(css) {
                let basename = File.getFileName(path.basename(file));

                let realName = basename;
                if (realName[0] === "_") {
                    realName = realName.substring(1, realName.length);
                }

                let fileName = realName;
                fileName = `${themeName}-${fileName}`;
                fileName = file.replace(basename, fileName);

                await exportCssVariable(fileName, css);

                let mixinName = `${themeName}-${realName}`;
                
                fileName = `_mixin-${mixinName}`;
                fileName = file.replace(basename, fileName);
                await exportCssVariableMixins(fileName, mixinName, css);
            }
        }
    }
}

async function exportCssVariable(file, value) {
    await fs.outputFileSync(file, value);
}

async function exportCssVariableMixins(file, mixinName, value) {
    value = value.replace(/:root/gi, `@mixin ${mixinName}`);
    await fs.outputFileSync(file, value);
}

async function readVariable(url) {
    const tokens = [formatUrl(url)];
    if (!path.isAbsolute(url)) {
        url = path.join(cwd, url);
    }
    let importTokens,
        value = await reader(url);

    value = cleaner(value, true);

    ({ value, tokens: importTokens } = await completion(value, path.dirname(url)));

    return { value, tokens: tokens.concat(importTokens) };
}

async function completion(value, source) {
    let tokens = [];
    let urls = getUrls(value);
    for (let i = 0; i < urls.length; i++) {
        let { src, url, type } = urls[i] || {};
        if (type === "style") {
            let urlPath = path.join(source, url);
            let { value: urlContent, tokens: completionTokens } = await getUrlContent(urlPath);
            if (urlContent) {
                tokens = tokens.concat(completionTokens);
                let srcReg = new RegExp(escapeRegExp(src));
                value = value.replace(srcReg, urlContent);
            }
        }
    }
    return { value, tokens };
}

async function getUrlContent(url) {
    url = await getUrlPath(url);
    if (url) {
        return await readVariable(url);
    }
    return null;
}

function formatUrl(url) {
    return path.relative(cwd, url).split(path.sep).join("/");
}

async function getUrlPath(url) {
    let isExist = false;
    let dirname = path.dirname(url);
    let basename = path.basename(url);
    let extname = path.extname(basename);

    if (!extname) {
        basename = `_${basename}.scss`;
        url = path.join(dirname, basename);
        isExist = await fs.pathExistsSync(url);
        if (!isExist) {
            basename = basename.substr(1, basename.length - 1);
            url = path.join(dirname, basename);
            isExist = await fs.pathExistsSync(url);
        }
    } else if (extname === ".scss") {
        isExist = await fs.pathExistsSync(url);
    }
    return isExist ? url : "";
}

module.exports = async (themeName, config, options) => {
    let { cssVariable = false } = options || {};
    isCssVariable = cssVariable;

    let variable, variables, tokens = [], variableTokens;
    if (type.isArray(config)) {
        ({ variable, tokens: variableTokens } = await readVariables(themeName, config));
        variables = variable;
        tokens = variableTokens;
    } else if (type.isObject(config)) {
        variables = {};
        for (let key in config) {
            ({ variable, tokens: variableTokens } = await readVariables(themeName, config[key]));
            if (variable) {
                variables[key] = variable;
            }
            tokens = tokens.concat(variableTokens);
        }
    }
    return { variables, tokens };
}