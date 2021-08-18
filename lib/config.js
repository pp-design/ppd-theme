const { cosmiconfig } = require("cosmiconfig");
const { chalk, logger } = require("ppd-utils");

const cwd = process.cwd();

const explorer = cosmiconfig("theme");

async function loadConfig() {
    const result = await explorer.search(cwd);
    const config = result ? result.config : {};
    const { themes = [] } = config;
    const themeNames = [];

    themes.map(theme => {
        const { name } = theme;
        if (themeNames.indexOf(name) >= 0) {
            isDuplicate = true;
            logger.warn(chalk.yellow(`Warnning: There are duplicate theme name "${chalk.cyan(name)}", please modify the theme configuration.`));
        }
        themeNames.push(name);
    });
    return config;
}

module.exports = loadConfig;