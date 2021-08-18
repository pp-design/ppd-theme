
const path = require("path");
const { fs, file: File, chalk } = require("ppd-utils");

const getUrls = require("./geturls");

let httpUrlRegexp = /((http:|ftp:|https:|file:|)\/\/([\w\-]+\.)+[\w\-]+(\/[\w\u4e00-\u9fa5\-\.\/?\@\%\!\&=\+\~\:\#\;\,]*)?)/ig;

async function checkUrls(source, value) {
    let result = "";
    const urls = getUrls(value);
    const dirname = path.dirname(source);
    let i = 0, len = urls ? urls.length : 0, url, extname, isCss;
    for (i = 0; i < len; i++) {
        url = urls[i].url.replace(/\?.*/g, "");
        extname = path.extname(url);
        if (extname && !url.match(httpUrlRegexp)) {
            if (!path.isAbsolute(url)) {
                url = path.join(dirname, url);
            }
            let isExists = await fs.pathExistsSync(url);
            if (!isExists) {
                isCss = extname === ".css";
                if (isCss) {
                    url = File.modifyExtname(url, ".scss");
                    isExists = await fs.pathExistsSync(url);
                }
                if (!isExists && isCss) {
                    url = File.modifyExtname(url, ".sass");
                    isExists = await fs.pathExistsSync(url);
                }
            }
            if (!isExists) {
                result =
                    `\nURL ERROR: ${chalk.red(`URL does not exist:`)}\n` +
                    `       ${chalk.cyan(urls[i].url)}\n` +
                    `       at ${chalk.yellow(source)}\n`;
            }
        }
    }
    return result;
}

module.exports = checkUrls;