/**
 * Facade over Node core modules.
 */

"use strict";

const util = require('util');

module.exports = {
    max, maxIter, log, inspect
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
    console.log(inspect(obj));
}

function inspect(obj) {
    return util.inspect(obj, {
        showHidden: false,
        depth: 10
    });
}
