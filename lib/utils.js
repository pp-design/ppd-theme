function escapeRegExp(value) {
    return value.replace(/[.*+\-?^${}()|[\]\\]/gi, '\\$&');
}

function clearComment(value) {
    const commentReg = /((\t|\n|\r| )+\/\/.*?(\n|\r|\n\r)|\/\*+(.|\n|\r)*?(\*+\/))/gi;
    value = value.replace(/(\n|\r|\n\r)/gi, "\n\n");
    return value.replace(commentReg, "");
}

function clearScssFunc(value) {
    let results = value.split(/\@(function|mixin)/);
    results.forEach(content => {
        let funcValue = content.substring(0, content.lastIndexOf("}") + 1);
        if (funcValue) {
            let funcReg = escapeRegExp(funcValue);
            funcReg = `\@(function|mixin).*${funcReg}`;
            funcReg = new RegExp(funcReg, "gi");
            value = value.replace(funcReg, "");
        }
    })
    return value;
}

exports.clearComment = clearComment;
exports.escapeRegExp = escapeRegExp;
exports.clearScssFunc = clearScssFunc;