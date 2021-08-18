#!/usr/bin/env node
const commander = require("commander");

const theme = require("./../cmd/theme");
const packageVersion = require("../package.json").version;

commander.version(packageVersion)
    .usage("ppd-theme [theme-name] [options]")
    .arguments("[theme-name]", "[options]")
    .option("-s, --source <source>", "source directory or file")
    .option("-o, --output <output>", "Output directory or file")
    .option("-w, --watch", "Watch a directory or file")
    .option("-m, --map", "Emit source map (boolean, or path to output .map file)")
    .option("-c, --collective", "Compile all styles when one of them changes")
    .option("--css-variable", "Support css variables")
    .option("--css-variable-shake", "Support css variables shaking")
    .option("--no-quiet", "Suppress log output except on error")
    .option("--no-postcss", "CSS output without postcss")
    .option("--no-recursive", "Recursively watch directories or files")
    .option("--importer [importer]", "Path to .js file containing custom importer")
    .option("--output-style [style]", "CSS output style (nested | expanded | compact | compressed)", /^(nested|expanded|compact|compressed)$/i)
    .action(theme);

commander.parse(process.argv);