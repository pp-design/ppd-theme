const embeddedRegexp = /^data:(.*?),(.*?)/;
const styleRegexp = /@import/;
const urlsRegexp = /(?:@import\s+)?url\s*\(\s*(("(.*?)")|('(.*?)')|(.*?))\s*\)|(?:@import\s+)(("(.*?)")|('(.*?)')|(.*?))[\s;]/ig;

function isEmbedded(src) {
	embeddedRegexp.lastIndex = 0;
	return embeddedRegexp.test(src.trim());
}

function getType(src) {
	styleRegexp.lastIndex = 0;
	if (styleRegexp.test(src)) {
		return "style";
	} else {
		return "assets";
	}
}

function getUrls(value) {
	let urls = [];
	let urlMatch, url, src;
	while ((urlMatch = urlsRegexp.exec(value))) {
		src = urlMatch[0];
		url = urlMatch[3] || urlMatch[5] || urlMatch[6] || urlMatch[9] || urlMatch[11] || urlMatch[12];
		if (url && !isEmbedded(url) && urls.indexOf(url) === -1) {
			urls.push({ src: src, url: url, type: getType(src) });
		}
	}
	return urls;
}

module.exports = (value) => {
	return getUrls(value);
};