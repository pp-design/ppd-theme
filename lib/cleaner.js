const nonAsciiReg = /^[\x00-\x7F]$/gi;
const charsetReg = /@charset ('|").*('|");/gi;
const { clearComment } = require("./utils");

module.exports = (codes, comments) => {
    codes = codes.replace(nonAsciiReg, "").replace(charsetReg, "");
    if (comments) {
        codes = clearComment(codes);
    }
    return codes;
}