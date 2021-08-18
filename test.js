const {ora} = require("ppd-utils");
const result = require("autoprefixer/data/prefixes");
const { escapeRegExp, clearScssFunc } = require("./lib/utils");
// const sp = ora("fadfasdfa");
// sp.start();

const commentReg = /((\t|\n|\r| )+\/\/.*?(;|\n|\r|\n\r)|\/\*+(.|\n|\r)*?(\*+\/))/gi;
const commentReg2 = /\/\*+(.|\n|\r)*?(\*+\/)/g;


let a = `@charset "UTF-8";
 //.widget-videoRecom-item{
	margin-bottom: url(http://www.baidu.com);
	height: 60px;
	/* * 
	position: relative;
}
.widget-videoRecom-item:last-of-type{
	margin-bottom: url(http://www.baidu.com);
}
.widget-videoRecom-link{
	display: block;
	overflow: hidden;
	cursor: pointer;
    position: relative;
    padding-left: 110px;
}*/
.widget-videoRecom-figure{
	width: 105px;
	height: 60px;
	float: left;
	margin-right: 5px;
	overflow: hidden;
	border-radius: 3px;    
	position: absolute;
    left: 0;
}
/************
.widget-videoRecom-item:hover .widget-videoRecom-figure:after{
	display: block;
}
.widget-videoRecom-img{
	width: 105px;
	height: 60px;
	object-fit: cover;
	object-position: left top;
}*/
.icon-mask-play{
	position: absolute;
	background-color: rgba(0,0,0,0.3);
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 3;
	display: none;
	border: 1px solid transparent;
	border-radius: 3px;
}
.widget-videoRecom-item:hover .icon-mask-play {
	display: block;
}

.widget-videoRecom-item:hover .widget-video-mode-bd-item-figure:after {
	display: block;
}
.widget-videoRecom-content{
	width: auto;
	float: left;
	padding-left: 3px;
}
.widget-videoRecom-des{
	color: $color-text-video;
	font-size: 12px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	cursor: pointer;
}
.widget-videoRecom-para{
	margin-top: 5px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.ico-videoPlay{
	display: inline-block;
	width: 13px;
	height: 11px;
	background: url(../../images/common/ico-played.png) no-repeat center top;
	background-size: 13px 11px;
	margin-right: 4px;
}
.widget-video-mode-bd-item-num{
	color: $color-text-comment-a;
	font-size: 12px;
}
.widget-videoRecom-figure:after {
	content: "";
	width: 36px;
	height: 36px;
	background-image: url(../../images/common/ico-player--small.png);
	background-size: 100% auto;
	position: absolute;
	left: 50%;
	top: 50%;
	margin-left: -18px;
	margin-top: -18px;
	display: none;
	z-index: 4;
}`
a = `

$font-size: 14px;
$padding: 10px 0;
$color-fill: #000;
$color-fill-1: #fff;
$card-bg-color-fill-default: red;

//颜色
//$store-color-1: #3b9cff !default; //下载蓝
$store-color-2: #d1d1d1 !default; //按钮描边色--白色底 //购物车按钮disabled状态
$store-color-3: #a4a4a4 !default; //按钮描边色--深色底
$store-color-9: #f64949 !default; //出错色
$store-color-11: #999999 !default; //用户评测防剧透色

$store-color-16: #353535 !default;
$store-color-20: #04b53d !default; //价格绿 hover态
$store-color-21: #e5f6ff !default; //个我资产文本提示背景色--普通信息提示
$store-color-22: #04c743 !default; //价格绿
$store-color-25: #fff5f5 !default; //错误输入框背景色
$store-color-26: #c0c0c0 !default; //scrollbar thumb 背景色
$store-color-27: #a8a8a8 !default; //scrollbar thumb hover 背景色
$store-color-29: #8c4312 !default; //优惠券文本
$store-color-30: #d84315 !default; //优惠倒计时x
$store-color-31: #3791ed !default; //下载蓝 hover
$store-color-32: #efb70c !default; //加入购物车
$store-color-33: #deaa0b !default; //加入购物车hover
$store-color-35: #edbc25 !default; //FFCA28 hover
/**
$store-color-38: #f2f2f2 !default;
$store-color-39: #f9f9f9 !default;
$store-color-40: #fff0e5 !default;
*/
`
a = a.replace(/(\n|\r|\n\r)/gi, "\n\n")
console.log(a.replace(commentReg, "\n"))

// let va = ";";
// console.log(va.match(/(\w|-|\$)+/gi))

// let mathValue = 'color: $color-text-video;';
// mathValue = escapeRegExp(mathValue);
// let rr = new RegExp(mathValue);
// console.log(rr, a.match(rr))

return;

// let aareg = /function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}/gi;
// aareg = /function\s*([\w$]*)\s*\(([\w\s,$]*)\)\s*\{([\w\W\s\S]*)\}/gi;
// let results = a.match(aareg);
// console.log("Result; ", results.length)
// if(results){
//     results.forEach((value)=>{
//         console.log("Value: ", value)
//     })
// }


// const clean = require("./lib/cleaner");
// const clean = require("strip-css-comments")
// const content = "/**fasfasfsdfas*/ //fasdfasfasfas \nfasdfasfsd//";

// const asd = {
//     a:1,b:2
// };
// let a, b;
// ({a,b} = asd);
// console.log(a,b)
// const watcher = require("./lib/watch");

// const tokens = [
//     "./lib/cleaner.js",
//     "./examples/full-mode/index-theme-1.html",
//     "./cmd/theme.js"
// ];

// const wat = watcher("test", ".", {
//     // ignoreInitial: true,
//     ignored: tokens
// });
// wat
//     .on("add", path => {
//         console.log("Watcher Add File Path : ", path);
//     })
//     .on("change", path => {
//         console.log("Watcher Change File Path : ", path);
//     })
//     .on("unlink", path => {
//         console.log("Watcher Remove File Path : ", path);
//     })

// console.log(clean(content, {preserve: false}))

// const chokidar = require("chokidar");

// const watcher = chokidar.watch([
//     "./lib/cleaner.js",
//     "./examples/full-mode/index-theme-1.html",
//     "./cmd/theme.js"
// ]);
// watcher
//     .on("change", path => {
//         console.log("Watcher File Path : ", path);
//     })

// const watcher2 = chokidar.watch(".", {
//     ignored: [
//         "./lib/cleaner.js",
//         "./examples/full-mode/index-theme-1.html",
//         "./cmd/theme.js"
//     ]
// });
// watcher2
//     .on("change", path => {
//         console.log("Watcher2 File Path: ", path)
//     })