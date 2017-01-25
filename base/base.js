/**
 * Facade over Node core modules.
 */

"use strict";

const util = require("util");
const os = require("os");

module.exports = {
    max, maxIter, log, inspect, EOL: os.EOL
};

function max() {
    return maxIter(arguments);
}

function maxIter(iter) {
    if (!iter) {
        throw `Invalid iterable: ${iter}`;
    }
    return Math.max(...iter);
}

function log(obj) {
    if (obj && typeof obj === "object") {
        console.log(inspect(obj));
    }
    else {
        console.log(obj);
    }
}

function inspect(obj) {
    return util.inspect(obj, {
        showHidden: false,
        depth: 10
    });
}
