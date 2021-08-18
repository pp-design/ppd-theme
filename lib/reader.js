const iconv = require("iconv-lite");
const { fs } = require("ppd-utils");

async function reader(path) {
    if (fs.pathExistsSync(path)) {
        let value = await fs.readFileSync(path, { encoding: "binary" });
        let buff = Buffer.from(value, "binary");
        return iconv.decode(buff, "utf-8");
    }
    return "";
}

module.exports = (path) => {
    return reader(path);
}