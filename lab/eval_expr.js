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

// Test evalExp
if (false) {
    console.log(evalExp("1 + 2 * 3"));
}

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
                exp.head = text;
                expect = "op";
            }
            else {
                throw `Expect number, see ${tok}`;
            }
        }
        else if (expect === "op") {
            if (type === "operator") {
                exp.left = exp.head;
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
    enter(btree);
    if (btree) {
        if (btree.hasOwnProperty("left")) {
            walk(btree.left, enter, leave);
        }
        if (btree.hasOwnProperty("right")) {
            walk(btree.right, enter, leave);
        }
    }
    leave(btree);
}

// Test walk
if (false) {
    walk({
        head: "+",
        left: {
            head: "*",
            left: 1,
            right: 2 },
        right: 3
    }, n => console.log("enter " + n),
       n => console.log("leave " + n));
}

/**
 * Walk binary tree, visit parents before children
 */
function prewalk(btree, visit) {
    walk(btree, visit, n => {});
}

/**
 * Walk binary tree, visit children before parents
 */
function postwalk(btree, visit) {
    walk(btree, n => {}, visit);
}

/**
 * Return a map containing matching result from matching a btree with a pattern
 * tree. The pattern can have names to retrieve the matched nodes.
 */
function match(btree, pattern) {
    const matches = new Map();
    let isMatch = doMatch(btree, pattern, matches);
    return isMatch ? matches : null;
}

// Test match
if (false) {
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
}

/**
 * Internal use.
 * For note value, undefined means whatever value,
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
 * Pattern for btree that might need fixing operator precedence
 */
const precedencePattern = { name: "a",
    head: undefined,
    left: undefined,
    right: { name: "b",
        head: undefined,
        left: undefined,
        right: undefined
    }
}

/**
 * Get the fixed version for operator precedence for btree that represents
 * expressions.
 *
 * If the tree looks like:
 * [* 1 [+ 2 3]]
 * then it should be changed to:
 * [+ [* 1 2] 3]
 *
 * pmap: map from operator to their precedence, higher value means higher
 * precedence.
 */
function getPrecedenceFix(btree, pmap) {
    const m = match(btree, precedencePattern);
    if (m) {
        let a = m.get("a");
        let b = m.get("b");
        if (pmap.has(a.head) && pmap.has(b.head) && pmap.get(a.head) > pmap.get(b.head)) {
            // make the fixed tree
            return {
                head: b.head,
                left: {
                    head: a.head,
                    left: a.left,
                    right: b.left
                },
                right: b.right
            }
        }
    }
}

// Test getPrecedenceFix
if (false) {
    const tofix = {
        head: "*",
        left: 1,
        right: {
            head: "+",
            left: 2,
            right: 3
        }
    };

    const pmap = new Map([["*", 2], ["+", 1]]);

    console.log(getPrecedenceFix(tofix, pmap));
}

function fixOperatorPrecedence(btree) {
    // for now simply consider * and +
    const pmap = new Map([["*", 2], ["+", 1]]);

    const fixPrecedence = function(n) {
        if (n && n.left) {
            let fixed = getPrecedenceFix(n.left, pmap);
            if (fixed) {
                n.left = fixed;
            }
        }
        if (n && n.right) {
            let fixed = getPrecedenceFix(n.right, pmap);
            if (fixed) {
                n.right = fixed;
            }
        }
    }

    // fix the inner nodes
    postwalk(btree, fixPrecedence);

    // fix the root
    let fixed = getPrecedenceFix(btree, pmap);
    if (fixed) {
        if (btree.hasOwnProperty("head")) {
            btree.head = fixed.head;
        }
        if (btree.hasOwnProperty("left")) {
            btree.left = fixed.left;
        }
        if (btree.hasOwnProperty("right")) {
            btree.right = fixed.right;
        }
    }
}

// Test fixOperatorPrecedence
if (false) {
    const tofix = {
        head: "*",
        left: 1,
        right: {
            head: "+",
            left: 2,
            right: {
                head: "*",
                left: 3,
                right: {
                    head: "+",
                    left: 4,
                    right: 5
                }
            }
        }
    };

    fixOperatorPrecedence(tofix);
    console.log(tofix);
}

/**
 * Make a new tree from an old one.
 *
 * f: map each old node to a new node, the new node should
 * not have left and right children
 */
function map(btree, f) {
    var top;

    // stack of nodes visited in pre-order
    const stack = [];

    // entering, make new node on top of stack
    const enter = n => {
        // make new node
        let newnode = f(n);
        if (newnode.hasOwnProperty("left") || newnode.hasOwnProperty("right")) {
            throw `Should not create left/right child for ${newnode}`;
        }

        // add new node to parent
        if (stack.length > 0) {
            let parent = stack[0];
            if (parent.hasOwnProperty("left")) {
                if (parent.hasOwnProperty("right")) {
                    throw `Parent node ${parent} has both children already.`;
                }
                else {
                    parent.right = newnode;
                }
            }
            else {
                parent.left = newnode;
            }
        }

        stack.unshift(newnode);
    };

    const leave = n => {
        // leaving, pop current node off of stack
        top = stack.shift();
    };

    // create new nodes
    walk(btree, enter, leave);

    // last node visited in post-order is the (new) root
    return top;
}

if (false) {
    const tree = {
        head: "*",
        left: 1,
        right: {
            head: "+",
            left: 2,
            right: 3
        }
    };

    console.log(map(tree, n => n.head ? { head: n.head } : n));
}
