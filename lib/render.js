const os = require("os");
const path = require("path");
const { fs, ora, chalk, generator, logger, file: File, rm } = require("ppd-utils");

const watch = require("./watch");

const cwd = process.cwd();

const tokenSync = require("./token");
const compileSync = require("./compiler");

module.exports = class Render {
    constructor(options) {
        this.options = options;
        this.themeName = "";
        this.isCollective = false;
        this.compileProgress = null;
    }

    async render(options) {
        this.options = options || this.options;

        let { uuid = v1(), themeName: name, variables, collective, source, output, watch: isWatch } = this.options || {};
        
        let { tokens, variables: token } = await tokenSync(name, variables, this.options);

        this.options.token = token;

        this.themeName = name;
        this.isCollective = collective;

        output = this.getOutput(source, output);

        const outputname = path.basename(output);

        this.tmpdir = path.join(os.tmpdir(), `ppd-theme-${this.themeName}-${outputname}-${uuid}`);

        const stat = fs.statSync(source);
        if (stat) {
            if (stat.isDirectory()) {
                await this.walkSync(source, output, this.options);
            } else if (File.isExtname(source, [".scss", ".sass"])) {
                await compileSync(source, output, output, this.options);
            }
        }
        if (isWatch) {
            await this.watchTokens(`token-${this.themeName}-${outputname}`, tokens, this.options);
            await this.watchTheme(`source-${this.themeName}-${outputname}`, tokens, source, output, this.options);
        }
    }

    async watchTheme(themeName, tokens, source, output, options) {
        let watcher = watch(themeName, source, { ignored: tokens });
        watcher
            .on("add", async path => {
                if (this.isEscape(path)) return;
                if (this.isCollective) {
                    await this.render(options);
                } else {
                    await this.onThemeWatch(path, source, output, options);
                }
            })
            .on("change", async path => {
                if (this.isEscape(path)) return;
                if (this.isCollective) {
                    await this.render(options);
                } else {
                    await this.onThemeWatch(path, source, output, options);
                }
            })
            .on("unlink", async path => {
                await this.clean(source, output, path);
            });
    }

    async onThemeWatch(path, source, output, options) {
        this.startCompile(path);
        const result = await this.compile(path, source, output, options);
        await this.generate(output);
        this.stopCompile(result, path);
    }

    async watchTokens(themeName, tokens, options) {
        let watcher = watch(themeName, tokens);
        watcher.on("change", async path => {
            await this.render(options);
        });
    }

    async clean(source, output, file) {
        if (!path.isAbsolute(source)) {
            source = path.join(cwd, source);
        }
        if (File.isExtname(source, [".scss", ".sass"])) {
            await this.remove(output);
        } else {
            if (File.isExtname(file, [".scss", ".sass"])) {
                file = File.modifyExtname(file, ".css");
            }
            file = file.replace(/\\/g, "/").replace(source, "");

            const sourcePath = path.join(cwd, source);
            const outputPath = path.join(cwd, output);
            let filePath = this.splitPath(file, sourcePath);
            let outputFile = path.join(outputPath, filePath);
            await this.remove(outputFile);
        }
    }

    async walkSync(source, output, options) {
        output = path.join(cwd, output);

        this.startCompile();

        let files = await File.readdirSync(source, (fileName) => {
            return !this.isEscape(fileName);
        });
        let urlResult = "";
        let renderResult = "";
        const len = files.length;
        for (let i = 0; i < len; i++) {
            const file = files[i];
            const result = await this.compile(file, source, output, options);
            urlResult += result.urlResult || "";
            renderResult += result.renderResult || "";
        }
        await this.generate(output);

        this.stopCompile({ urlResult, renderResult });
    }

    isEscape(url) {
        url = path.basename(url);
        const fileName = File.getFileName(url);
        if (fileName && fileName[0] === "_") {
            return true;
        }
        return false;
    }

    async compile(file, source, output, options) {
        const sourcePath = path.join(cwd, source);
        let filePath = this.splitPath(file, sourcePath);
        let tempFile = path.join(this.tmpdir, filePath);
        let outputFile = path.join(output, filePath);
        if (File.isExtname(outputFile, [".scss", ".sass"])) {
            tempFile = File.modifyExtname(tempFile, ".css");
            outputFile = File.modifyExtname(outputFile, ".css");
        }
        return await compileSync(file, tempFile, outputFile, options);
    }

    async generate(output) {
        if (!path.isAbsolute(output)) {
            output = path.join(cwd, output);
        }
        if (fs.pathExistsSync(this.tmpdir)) {
            await generator({}, null, this.tmpdir, output);
        }
    }

    async remove(target) {
        try {
            const isExist = await fs.existsSync(target);
            if (isExist) {
                await rm.sync(target);
            }
        } catch (error) { }
    }

    getOutput(source, output) {
        if (source && !output) {
            let stat = fs.statSync(source);
            let dirname = path.dirname(source);
            let basename = path.basename(source);
            if (stat && stat.isDirectory()) {
                output = path.join(dirname, basename === "css" ? `${basename}-output` : "css");
            } else {
                output = File.modifyExtname(source, ".css");
            }
        }
        return output;
    }

    splitPath(target, prefix) {
        if (!path.isAbsolute(target)) {
            target = path.join(cwd, target);
        }
        target = target.toString();
        const index = target.indexOf(prefix);
        if (index >= 0) {
            target = target.substring(prefix.length, target.length);
            target = target.replace(/^\//g, "");
        }
        return target;
    }

    startCompile(target) {
        if (!this.compileProgress) {
            this.compileProgress = ora(chalk.green(`Compiling theme "${chalk.cyan(`${this.themeName}${target ? target : ''}`)}"...`));
            this.compileProgress.start();
        }
    }

    stopCompile(result, target) {
        const { urlResult = "", renderResult = "" } = result || {};
        if (renderResult) logger.log(renderResult);
        if (urlResult) logger.log(urlResult);
        if (!this.compileProgress) {
            this.compileProgress = ora("");
        }
        this.compileProgress.succeed(chalk.green(`Compiled theme "${chalk.cyan(`${this.themeName}${target ? target : ''}`)}"...`));
        this.compileProgress = null;
    }
}