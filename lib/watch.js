const chokidar = require("chokidar");

const watchers = {};

function addWatcher(name, source, options) {
    options = initOptions(options);
    if (!hasWatcher(name)) {
        const watcher = chokidar.watch(source, options);
        watchers[name] = watcher;
        return watcher;
    } else {
        return getWatcher(name);
    }
}

function initOptions(options) {
    options = options || {};
    if (!options.hasOwnProperty("ignoreInitial")) {
        options.ignoreInitial = true;
    }
    return options;
}

function hasWatcher(name) {
    if (watchers && watchers.hasOwnProperty(name)) {
        return true;
    }
    return false;
}

function getWatcher(name) {
    if (watchers && watchers.hasOwnProperty(name)) {
        return watchers[name];
    }
    return null;
}

module.exports = (name, source, options) => {
    return addWatcher(name, source, options);
}