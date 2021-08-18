
const path = require('path');
const fs = require('fs');
const postcss = require('postcss');
const { logger, chalk } = require("ppd-utils");


const cwd = process.cwd();

const FILE_READ_OPTION = {encoding: 'utf-8'};
const cssImportUrlParseReg = /url\((.*)\)/;
const variableMatchAllReg = /var\(--([0-9|a-z|A-Z]+(-[0-9|a-z|A-Z]+)*)\)/g;
const variableReg = /^var\(--([0-9|a-z|A-Z]+(-[0-9|a-z|A-Z]+)*)\)$/;
const cssVariableReg = /^--([0-9|a-z|A-Z]+(-[0-9|a-z|A-Z]+)*)$/;
const importVarCssReg = /@import-var(\((.+)\))?/;

function walk(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (error, files) => {
        if (error) {
          return reject(error);
        }
        Promise.all(files.map((file) => {
          return new Promise((resolve, reject) => {
            const filepath = path.join(dir, file);
            fs.stat(filepath, (error, stats) => {
              if (error) {
                return reject(error);
              }
              if (stats.isDirectory()) {
                walk(filepath).then(resolve);
              } else if (stats.isFile()) {
                resolve(filepath);
              }
            });
          });
        }))
        .then((foldersContents) => {
          resolve(foldersContents.reduce((all, folderContents) => all.concat(folderContents), []));
        });
      });
    });
  }

/**
 * 
 * @param {*} entry 
 * 
 * @param entry.path 入口css路径
 * @param entry.output 变量css输出路径(非必传)
 */
async function shakeCssVarForEntry(entry) {
    
    
    const { path: entryPath } = entry;

    
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(cwd, entryPath), FILE_READ_OPTION, async (err) => {
            if(err) {
                logger.log(chalk.red(`读取${entryPath}出错：${err}`));
                reject(err);
                return;
            }
    
            const entryDirPath = path.dirname(path.resolve(cwd, entryPath));
    
            const _entryCSSList = await walk(entryDirPath);
            const entryCSSList = _entryCSSList.filter(filePath => /\.css/.test(filePath));
    
            const cssImportedLists = await Promise.all(entryCSSList.map(cssPath => getImportedCSSList(cssPath)))
            
            const entryImportedCSSList = [];
            cssImportedLists.forEach(cssImportedList => {
                entryImportedCSSList.push(...cssImportedList);
            });
    
            const finalCSSList = Array.from(new Set(entryCSSList.concat(entryImportedCSSList)));
    
            const deps = await Promise.all(finalCSSList.map(cssPath => collectVarReferDeps(cssPath)));
    
            const depsMapping = deps.reduce((acc, cur) => {
                Object.assign(acc, cur);
                return acc;
            }, {});

    
            await processEntryCSS(entryPath, depsMapping);

            resolve();
        });
    });
    
}

async function getImportedCSSList(cssPath) {
    return new Promise((resolve) => {
        fs.readFile(cssPath, FILE_READ_OPTION, async (err, css) => {
            if(err) {
                logger.log(chalk.red(`读取${cssPath}出错：${err}`)); 
                resolve([]);
                return;
            }

            const importedCssList = [];
            const nestedParsePromises = [];
            postcss.parse(css).walkAtRules('import', rule => {
                const [,importedRelativePath] = cssImportUrlParseReg.exec(rule.params);
                const importedPath = path.resolve(path.dirname(cssPath), importedRelativePath.replace(/"|'/g, ''));
                nestedParsePromises.push(getImportedCSSList(importedPath));
                importedCssList.push(importedPath);
            });

            const nestedImportedLists = await Promise.all(nestedParsePromises);

            nestedImportedLists.forEach(nestedImportedList => {
                importedCssList.push(...nestedImportedList);
            });

            resolve(importedCssList);
        });
    });
    
}

async function collectVarReferDeps(cssPath) {
    return new Promise(resolve => {
        fs.readFile(cssPath, FILE_READ_OPTION, (err, css) => {
            if (err) {
                logger.log(chalk.red(`读取${cssPath}出错：${err}`));
                resolve({});
                return;
            }

            const resultMapping = {};
            postcss.parse(css).walkDecls(decl => {

                ((decl.value || '').match(variableMatchAllReg) || []).map(s => variableReg.exec(s)).forEach((execArr = []) => {
                    const [, variable] = execArr;
                    resultMapping[variable] = true;
                });
            });

            resolve(resultMapping);
        });
    })
}

function processVariableCSS(cssPath, depsMapping, output) {

    return new Promise((resolve, reject) => {
        fs.readFile(cssPath, FILE_READ_OPTION, (err, css) => {
            if (err) {
                logger.log(chalk.red(`读取${cssPath}出错：${err}`));
                reject(err);
                return;
            }
    
            const root = postcss.parse(css);

            root.walkDecls(decl => {
                const {prop} = decl;
                if(cssVariableReg.test(prop) && !depsMapping[prop.substring(2)]) {
                    decl.remove();
                }
            });
    
            fs.writeFile(output, root.toString(), () => {
                resolve();
            });
    
        })
    });
   
}

function processEntryCSS(cssPath, depsMapping) {
    return new Promise((resolve, reject) => {
        fs.readFile(cssPath, FILE_READ_OPTION, async (err, css) => {
            if (err) {
                logger.log(chalk.red(`读取${cssPath}出错：${err}`));
                reject(err);
                return;
            }
    
            const root = postcss.parse(css);
    
            const processVarCssPromises = [];

            root.walkComments(async comment => {
                
                if (importVarCssReg.test(comment.text) && comment.next() && comment.next().name === 'import') {
                    
                    const [,, varTargetPath] = importVarCssReg.exec(comment.text);
                    const [,importVarCssPath] = cssImportUrlParseReg.exec(comment.next().params);
    
                    const curDirPath = path.dirname(cssPath);
                    const importVarAbsolutePath = path.resolve(curDirPath, importVarCssPath.replace(/"|'/g, ''));
                    const importVarFilename = path.basename(importVarAbsolutePath);
                    const generatedVarTargetPath = varTargetPath ? varTargetPath.replace(/"|'/g, '') : `./_var-${importVarFilename}`;
                    logger.log(chalk(`\n正在对"${cssPath}" => ${importVarCssPath} 进行变量提取, 输出路径："${path.resolve(curDirPath, generatedVarTargetPath)}"\n`))
    
                    const processPromise = processVariableCSS(importVarAbsolutePath, depsMapping, path.resolve(curDirPath, generatedVarTargetPath));
                    processVarCssPromises.push(processPromise);

                    await processPromise;
    
                    comment.next().params = `url("${generatedVarTargetPath}")`;
                    comment.remove();
                }
            });
    
            await Promise.all(processVarCssPromises);
            fs.writeFile(cssPath, root.toString(), () => {
                resolve();
            });
            
        });
    });
}

async function cssShake(config) {
    const {entries = []} = config;
    await Promise.all(entries.map((entry) => shakeCssVarForEntry(entry)));
}

module.exports = cssShake;