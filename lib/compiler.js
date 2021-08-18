const nodeSass = require("node-sass");
const { fs, file: File, logger, type, chalk, rm } = require("ppd-utils");

const postcss = require("./postcss");
const urlcheck = require("./urlcheck");
const cleaner = require("./cleaner");
const reader = require("./reader");

const { escapeRegExp } = require("./utils");

const prexReg = /.*?ppd-prefix-/gi;
const cssVarReg = /(\w|-|\$)+\:( |\w|-)+?\$(.|\n|\r|\n\r).*(\n|\r|\n\r)?(;|\}$)/gi;
const cssFuncReg = /(rgb|rgba|linear-gradient)\(.*?\$.*?\)/gi;

async function compileSync(source, temp, output, options) {
    source = source || "";
    temp = temp || "";
    output = output || "";
    let urlResult, renderResult, css;
    let { themeName, token: variables, data = null, map: sourceMap = false, importer, cssVariable = false, outputStyle = "expanded", postcss: isPostcss = true, quiet: isQuiet = false } = options;

    if (File.isExtname(source, [".scss", ".sass"]) || data) {
        if (source) {
            data = await reader(source);
        }
        data = cleaner(data);

        if (cssVariable) {
            data = formatCSSVariable(data);
        }
        let line = 0;
        if (variables && type.isString(variables)) {
            line = variables.split(/\r\n|\r|\n/).length;
            data = `${variables}\n${data}`;
        }

        const renderOptions = {
            data: data,
            file: source,
            outFile: output,
            sourceMap: sourceMap,
            outputStyle: outputStyle,
            importer: (url, prev, done) => {
                return importer(url, prev, done, variables);
            }
        };
        try {
            const nodeResult = await nodeSass.renderSync(renderOptions);
            css = nodeResult.css.toString();
            let map = nodeResult.map;
            urlResult = await urlcheck(source, css);
            if (isPostcss) {
                css = await postcss(source, output, css, sourceMap);
            }
            css = await outputFileSync(temp, output, css);

            if (sourceMap && map && temp && output) {
                await outputFileSync(`${temp}.map`, `${output}.map`, map);
            }

            if (!isQuiet && themeName && output && source) {
                logger.log(`正在编译${themeName ? ` ${chalk.cyan(themeName)} 皮肤` : ''}样式：${chalk.cyan(source)}  输出路径：${chalk.green(output)}`);
            }
        } catch (err) {
            renderResult = formatRenderError(source, err, line);
        }
    } else {
        await fs.copySync(source, temp);
    }
    return { css, urlResult, renderResult };
}

async function outputFileSync(temp, output, css) {
    css = `@charset "utf-8";\n${css.replace(/@charset ('|").*('|");/gi, "")}`;
    css = css.replace(/ppd-prefix-/gi, "--")
    if (output) {
        const isChange = await compareContent(output, css);
        if (isChange && temp) {
            await fs.outputFileSync(temp, css);
        }
    }
    return css;
}

function outputSource(source, value) {
    if (source) {
        fs.outputFileSync(File.modifyExtname(source, ".scss"), value);
    }
}

function formatRenderError(source, err, prefixLine) {
    let { formatted } = err;
    if (formatted) {
        let result = "\n", info = "";
        const errors = err.formatted.split(/\r\n|\r|\n/).filter(value => value && value.indexOf("^") < 0);
        const len = errors ? errors.length : 0;
        for (let i = 0; i < len; i++) {
            info = errors[i];
            if (i === len - 2) {
                let line = info.match(/line [0-9]+/g);
                if (line) {
                    line = line[0].match(/[0-9]+/g)[0];
                    info = info.replace(/line [0-9]+/g, `line ${line - prefixLine - 1}`);
                }
            } else if (i === len - 1) {
                info = `        ${chalk.yellow(info)}`;
            } else if (i === 0) {
                info = chalk.red(info);
            }
            info = info.replace(/line [0-9]+/g, function (substring) {
                return chalk.cyan(substring);
            });
            result += `${info}\n`;
        }
        return `${result}        at：${chalk.yellow(source)}\n`;
    }
    return err;
}

async function compareContent(file, content) {
    if (await fs.existsSync(file)) {
        const urlContent = await fs.readFileSync(file, { encoding: "UTF-8" });
        return urlContent !== content;
    }
    return true;
}

function formatCSSVariable(value) {
    let matchs = value.match(cssVarReg);
    let hasReplace = {};
    let len = matchs ? matchs.length : 0;
    for (let i = 0; i < len; i++) {
        let matchValue = matchs[i];
        let replaceReg = null;
        let replaceValue = "";
        matchValue = matchValue.trim();
        if (!matchValue.match(/(\*|\+|\/| - )/gi) && !matchValue.match(prexReg) && matchValue[0] !== "$" && !hasReplace[matchValue]) {
            hasReplace[matchValue] = true;
            let tempMatchValue = matchValue;
            tempMatchValue = tempMatchValue.replace(/(\n|)\}$/gi, ";");

            let values = tempMatchValue.match(/.*?\$.*?( |,|;|\:|\}|\))+/gi);
            let valueLen = values ? values.length : 0;

            for (let j = 0; j < valueLen; j++) {
                let currValue = values[j];
                if (currValue.match(/.*?\(\$.*?\)/gi) && !currValue.match(cssFuncReg)) {
                    continue;
                }

                let currValues = currValue.match(/\$.*?( |,|;|\:|\}|\))+/gi);
                if (currValues && currValues.length > 0) {
                    currValue = currValues[0];
                    let currReplaceValue = "";

                    if (!currValue.match(/\$.*?\:/gi)) {
                        currReplaceValue = currValue.replace(/^\$/gi, "var(--");
                        currReplaceValue = currReplaceValue.replace(/( |\||,|;|\)|\})+$/gi, ")$&");
                        replaceReg = escapeRegExp(currValue);
                        replaceReg = `(?<!-)${replaceReg}`;
                        replaceReg = new RegExp(replaceReg, "gi");
                        tempMatchValue = tempMatchValue.replace(currValue, currReplaceValue);
                        replaceValue = tempMatchValue;
                    }
                }
            }

            if (replaceValue) {
                matchValue = matchValue.replace(/(\n|)\}$/gi, "");
                replaceReg = escapeRegExp(matchValue);
                replaceReg = `(?<!-)${replaceReg}`;
                replaceReg = new RegExp(replaceReg, "gi");

                if (replaceValue) {
                    replaceValue = `\$&;${replaceValue}`;
                    value = value.replace(replaceReg, replaceValue);
                }
            }
        }
    }
    return value;
}

module.exports = (source, temp, output, options) => {
    return compileSync(source, temp, output, options);
};