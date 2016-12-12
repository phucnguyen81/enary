"use strict";

/**
 * Tokenize a string given some token specs.
 * The specs are map of { tokenRegex: tokenType }.
 *
 * The tokenRegex should have at least 'sticky' option since
 * we need to match at the beginning of input.
 *
 * Return an object:
 *  { remaining: the_remaining_of_input_not_matched,
 *    tokens: the_tokens_created_from_matching }
 */
function tokenize(str, tokenSpecs) {
    const regexps = {
        // make iterable from iterator
        [Symbol.iterator]() {
            return tokenSpecs.keys();
        }
    };
    const matchResult = match(str, regexps);

    const tokens = [];

    for (let m of matchResult.matches) {
        // token has type and text
        tokens.push({
            type: tokenSpecs.get(m.regex),
            text: m.match[0]
        });
    }

    return { remaining: matchResult.remaining, tokens };
}

// console.log(tokenize("abc", new Map([
    // [/a/y, "a"],
    // [/b/y, "b"]])));

exports.tokenize = tokenize;

/**
 * Given a string and some regexps,
 * alternate between the regexps to find matches.
 * Return an object capturing the matching result.
 */
function match(str, regexps) {
    for (let re of regexps) {
        if (!re.flags.includes("y")) {
            throw `Require 'y' flag for regexp ${re}`;
        }
    }

    const matches = [];

    let match;
    do {
        for (let re of regexps) {
            re.lastIndex = 0;
            match = re.exec(str);
            if (match) {
                // remaining string not yet matched
                str = str.slice(re.lastIndex);
                matches.push({ match, regex: re });
                break;
            }
        }
    } while (match);

    return { remaining: str, matches };
}

// console.log(match("abc", [/a/y, /b/y]));
// console.log(match("ababc", [/a/y, /b/y]));
