/**
 * Evaluate a basic expression: + and * with numbers.
 */

"use strict";

const tokenize = require("./lexer").tokenize;

/**
 * Given a string, eval it as an expression.
 *
 * For example, str can be: 1 + 2 * 3, evals to 7.
 */
function evalExp(str) {
    if (!str) {
        throw `Empty argument: ${str}`;
    }

    // for now, only do: space, operator (+, *) and number
    let specs = new Map([
        [/\s+/y, "space"],
        [/[+*]/y, "operator"],
        [/\d+/y, "number"]
    ]);

    let lexing = tokenize(str, specs);

    let remaining = lexing.remaining;
    if (remaining) {
        throw `Failed to parse remaining: ${remaining}`;
    }

    let tokens = lexing.tokens;
    // skip spaces
    tokens = tokens.filter(tok => tok.type !== "space");

    const ast = parseExp(tokens);
    return ast;
}

// console.log(evalExp("1 + 2 * 3"));

// // TODO need to handle operator precedence here
// console.log(evalExp("1 * 2 + 3"));

/**
 * Given an iterable of tokens of an expression,
 * create a binary tree representing the structure of the expression.
 */
function parseExp(tokens) {
    let exp = {};
    const root = exp;
    let expect = "number";

    for (let tok of tokens) {
        let type = tok.type;
        let text = tok.text;
        if (expect === "number") {
            if (type === "number") {
                exp.left = text;
                expect = "op";
            }
            else {
                throw `Expect number, see ${tok}`;
            }
        }
        else if (expect === "op") {
            if (type === "operator") {
                exp.head = text;
                exp.right = {};
                exp = exp.right;
                expect = "number";
            }
            else {
                throw `Expect operator, see ${tok}`;
            }
        }
        else {
            throw `Unrecognized token type ${expect}`;
        }
    }

    return root;
}

/**
 * Walk a btree top-down, called enter and leave
 * in pre-order and post-order visits, respectively.
 */
function walk(btree, enter, leave) {
    if (btree) {
        enter(btree.head || btree);
        walk(btree.left, enter, leave);
        walk(btree.right, enter, leave);
        leave(btree.head || btree);
    }
}

/* Test
walk({
    head: "+",
    left: {
        head: "*",
        left: 1,
        right: 2 },
    right: 3
}, n => console.log("enter " + n),
   n => console.log("leave " + n));
*/

/**
 * Return a map containing matching result from matching a btree with a pattern
 * tree. The pattern can have names to retrieve the matched nodes.
 */
function match(btree, pattern) {
    const matches = new Map();
    let isMatch = doMatch(btree, pattern, matches);
    return isMatch ? matches : null;
}

/*
const btree = {
    head: "+", left: 1, right: { head: "*", left: 2, right: 3 } };
const pattern = {
    name: "sum",
    head: "+", left: undefined, right: {} };
console.log(match(btree, pattern));

const btree2 = {
    head: "+", left: 1, right: { head: "*", left: 2, right: 3 } };
const pattern2 = {
    name: "sum",
    head: "+", left: 1, right: { head: "-" } };
console.log(match(btree2, pattern2));
*/

/**
 * Internal use.
 * Some notes: for note value, undefined means whatever value,
 * empty object means whatever object node.
 */
function doMatch(btree, pattern, matches) {
    if (btree === pattern || typeof pattern === "undefined") {
        if (pattern && pattern.hasOwnProperty("name")) {
            matches.set(pattern.name, btree);
        }
        return true;
    }
    else if (pattern === undefined) {
        // here 'undefined' means 'whatever'
        return true;
    }
    else if (btree && pattern && typeof btree === "object" && typeof pattern === "object") {
        let matchHead = doMatch(btree.head, pattern.head, matches);
        let matchLeft = doMatch(btree.left, pattern.left, matches);
        let matchRight = doMatch(btree.right, pattern.right, matches);

        if (matchHead && matchLeft && matchRight) {
            if (pattern.hasOwnProperty("name")) {
                matches.set(pattern.name, btree);
            }
            return true
        }
    }
    else {
        return false;
    }
}

/**
 * Fix operator precedence for btree that represents expressions.
 *
 * If the tree looks like:
 * [* 1 [+ 2 3]]
 * then it should be changed to:
 * [+ [* 1 2] 3]
 */
function getPrecedenceFix(btree, isHigher) {
    const pattern = { name: "a",
        head: undefined,
        left: undefined,
        right: { name: "b",
            head: undefined,
            left: undefined,
            right: undefined
        }
    }

    const matches = match(btree, pattern);
    if (matches) {
        let a = matches.get("a");
        let b = matches.get("b");
        if (isHigher(a.head, b.head)) {
            // create a new tree
            let fixed = {
                head: b.head,
                left: {
                    head: a.head,
                    left: a.left,
                    right: b.left
                },
                right: b.right
            }
            return fixed;
        }
    }
}

const requireFix = {
    head: "*",
    left: 1,
    right: {
        head: "+",
        left: 2,
        right: 3
    }
};
console.log(getPrecedenceFix(requireFix, (a, b) => a === "*" && b === "+"));
