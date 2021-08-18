
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const { cosmiconfig } = require("cosmiconfig");

const cwd = process.cwd();

const explorer = cosmiconfig("browserslist");

let browserslist;

async function postcssSync(source, output, css, sourcemap) {
    const result = await explorer.search(cwd);
    if (!browserslist) {
        if (result && result.config) {
            browserslist = result.config || ["> 1%", "last 2 versions"];
        } else {
            browserslist = ["> 1%", "last 2 versions"];
        }
    }
    return new Promise((resolve, reject) => {
        const options = {
            from: source,
            to: output,
            map: sourcemap ? { inline: false } : null
        };

        postcss([autoprefixer({ overrideBrowserslist: browserslist })])
            .process(css, options)
            .then(result => {
                css = result.css.toString();
                resolve(css);
            })
            .catch(err => {
                reject(err);
            });
    });
}

module.exports = (source, output, css, sourcemap) => {
    return postcssSync(source, output, css, sourcemap);
}