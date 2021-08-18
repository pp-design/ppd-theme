module.exports = (url, prev, done, variables) => {
    let variable = variables ? variables[url] : null;
    if (!variable) {
        return {
            file: url
        };
    }
    return {
        contents: variable
    }
}