
## Instruction
本工具主要用于基于 SASS 的皮肤编译，

## Install
```shell
npm install ppd-theme -g
```

## Features
+ 可对单样式文件进行编译
+ 可对文件夹进行循环遍历编译
+ 支持皮肤和变量的自定义配置
+ 支持编译时 SASS 变量的动态注入
+ 支持编译时 URL 路径检测（网络地址除外）
+ 支持编译时 CSS 兼容性处理
+ 支持编译时 CSS变量 添加

## Usage
```shell
const theme = require('ppd-theme');
theme.render([, options..]);
```

## Command Line Interface
```shell
ppd-theme [themeName] [options]
```

## Options
### source
* Type: `String`
* Default: `undefined`

样式的SASS源，可以是单独的 scss 文件，也可以是文件夹，地址可以是绝对路径，也可以是相对于命令所在地址的路径，如果没有该参数，则会在命令所在路径寻找 theme 的配置文件进行解析编译。

### output
* Type: `String`
* Default: `undefined`

编译 source 样式后输出的样式地址，地址可以是绝对路径，也可以是相对于命令所在地址的路径，如果没有参数，则会输出在 source 同目录下。

### watch
* Type: `Boolean`
* Default: `false`

编译时监视文件改动

**注意**：如果 source 参数是文件夹，则会监视整个文件夹内的文件变动，从而编译对应的皮肤，原因是SASS变量使用的不确定性。

### postcss
* Type: `Boolean`
* Default: `true`

编译时兼容性样式处理

**注意**：默认使用 `["> 1%", "last 2 versions"]` 兼容性处理样式，如要修改兼容版本，可自定义 browserlist 的内容

### cssVariable
* Type: `Boolean`
* Default: `true`

编译时是否对Sass变量补充CSS变量格式

### cssVariableShake
* Type: `Boolean`
* Default: `true`

编译时是否对Sass变量补充CSS变量格进行提取优化

### map
* Type: `Boolean`
* Default: `false`

是否生成 sourcemap 文件

### outputStyle
* Type: `String`
* Default: `nested`
* Values: `nested`, `expanded`, `compact`, `compressed`

输出的皮肤压缩样式

### importer
* Type: `String`
* Default: `undefined`

编译时的 import 解析函数


## Theme Config
说明：皮肤配置是使用命令行模式进行编译所用的，皮肤配置可以配置多套皮肤和皮肤引用的变量文件，旨在便捷的批量编译皮肤。


### 配置文件说明
**在项目根目录下添加 theme.config.js 文件，该文件输出皮肤配置**

### 参数说明：
- importer                   自定义导入函数，为目标函数 js 地址，一般用不上，可无视
- themes                     皮肤数据，是一个数组
    - name 
        * Type：`String`
        * Desc：皮肤名称，编译时的 themeName 参数所引用的数据
    - source
        * Type：`String`
        * Desc：皮肤源文件夹或者文件路径地址
    - output
        * Type：`String`
        * Desc：皮肤输出目标路径地址
    - variables
        * Type：`Object|Array`
        * Desc：皮肤的变量合集，如果是使用全量注入的方式，使用`Array`的数据结构；如果是按需注入的方式，使用`Object`的数据结构；

**开发者注**：推荐使用全量注入的方式来进行皮肤编译

### 全量注入
**example**
```shell
module.exports = {
    themes: [
        {
            name: "cn",
            source: "we-button.scss",
            output: "we-button-cn.css",
            variables: [
                "_vars_cn.scss"
            ]
        },
        {
            name: "global",
            source: "we-button.scss",
            output: "we-button-global.css",
            variables: [
                    "_vars_global.scss"
            ]
        }
    ]
};
```

### 按需注入
**example**
```shell
module.exports = {
    themes: [
        {
            name: "cn",
            source: "we-button.scss",
            output: "we-button-cn.css",
            variables: {
                "token”: [
                    "_vars_cn.scss"
                ]
            }
        },
        {
            name: "global",
            source: "we-button.scss",
            output: "we-button-global.css",
            variables: {
                "token”: [
                    "_vars_global.scss"
                ]
            }
        }
    ],
    entries: [
        {
            path: 'xxx/index.css'
        }
    ]
};
```
**注意**：按需注入的方式，要在需要注入的SASS文件头部 `@import` 在 `variables` 中配置的 `token` 值。
```
# we-button.scss

@import "token";
.we-button {
    font-size: $font-size-xs;
    color: $color-text0-1;
    background-color: $color-fill0-1;
}
```

### CSS变量提取
**example**
首先在theme.config.js添加入口样式:
```
// theme.config.js
module.exports = {
    default: 'theme-cn-light',
    themes: [...],
    entries: [
        {
            path: 'xx/index.css'
        }
    ]
}
```

然后在入口样式中引用css变量前添加注释:
```
@import "xx.css";
// @import-var("./extract-variable.css")
@import "variable.css;
body {
    ...
}
```
这样引用就会替换成注释中指定的路径，并且样式会根据入口进行筛选提取