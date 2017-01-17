"use strict";

/*
TODO support grouping of expression with parentheses
ex; (1 + 2) * 3

so a grouping represents operand, which can contain
other groups recursively

 */

// tokenize string with regexps
const tokenize = require("./lexer").tokenize;

// pattern for btree that might need fixing operator precedence
const precedencePattern = {
    name: "a",
    left: {},
    right: { name: "b" }
};

function evalExp(str) {
    /* Evaluate a basic expression: numbers, +, -, *, /
     */
    let tokens = tokenizeExp(str);
    let ast = parseExpTokens(tokens);
    coerceNumbers(ast);
    fixOperatorPrecedence(ast);
    return evalBtree(ast);
}

if (false) {
    // Main test: evalTexp
    // expect 5
    console.log(evalExp("2 + 1 * 3"));

    // expect 5
    console.log(evalExp("2 * 1 + 3"));

    // expect -1
    console.log(evalExp("2 * 1 - 3"));

    // expect -1
    console.log(evalExp("4 / 2 - 3"));
}

function tokenizeExp(str) {
    /* Tokenize a string representing an arithmetic expression.

    Return tokens, each token has type and text.

    For example, str can be: 1 + 2 * 3, return tokens containing
    objects like { type: 'space', text: ' ' } or { type: 'number', text: '1' }.
    */
    if (!str) {
        throw `Empty argument: ${str}`;
    }

    // map token regexs to token types
    const specs = new Map([
        [/\s+/y, "space"],
        [/[+\-*/]/y, "operator"],
        [/\d+/y, "number"],
        [/\(/y, "open_paren"],
        [/\)/y, "closed_paren"],
    ]);

    let lexing = tokenize(str, specs);
    if (lexing.remaining) {
        throw `Failed to tokenize remaining string: ${lexing.remaining}`;
    }
    // skip spaces
    return lexing.tokens.filter(tok => tok.type !== "space");
}

if (false) {
    // Test tokenizeExp
    console.log(tokenizeExp("1 + 2 * 3"));
    // with parentheses
    console.log(tokenizeExp("(1 + 2) * 3"));
}

function parseExpTokens(tokens) {
    /* Create a binary tree from tokens of an expression.
     */
    let exp = {};
    const root = exp;
    let expect = "number";

    for (let tok of tokens) {
        let type = tok.type;
        let text = tok.text;
        if (expect === "number") {
            if (type === "number") {
                exp.text = text;
                exp.type = "number";
                expect = "op";
            }
            else {
                throw `Expect number, see ${tok}`;
            }
        }
        else if (expect === "op") {
            if (type === "operator") {
                exp.left = { text: exp.text, type: exp.type };
                exp.text = text;
                delete exp.type;
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

function walk(btree, enter, leave) {
    /** Walk a btree top-down, depth-first.

    Call enter and leave on each node,
    enter(node) is called in pre-order, leave(node) is called in post-order.
    */
    enter(btree);
    if (btree.left) {
        walk(btree.left, enter, leave);
    }
    if (btree.right) {
        walk(btree.right, enter, leave);
    }
    leave(btree);
}

if (false) {
    // Test walk
    let visit = n => console.log(n);
    walk({
        text: "+",
        left: {
            text: "*",
            left: { text: "1" },
            right: { text: "2" }
        },
        right: {
            text: "3"
        }
    }, visit, visit);
}

function prewalk(btree, visit) {
    /* Walk binary tree depth-first, visit parents before children
     */
    walk(btree, visit, Function.prototype);
}

function postwalk(btree, visit) {
    /* Walk binary tree depth-first, visit children before parents
     */
    walk(btree, Function.prototype, visit);
}

function match(btree, pattern) {
    /* Get results from matching a btree with a pattern tree.

    Return a map containing matching results.
    The keys in the map are names in pattern nodes.

    For example, if pattern is:
        { name: "sum", text: "+" },
    then it matches tree that looks like:
        { text: "text", left: { text: "1" }, right: { text: "2" } }.
    And the returned map looks like:
        { "sum": { text: "text", left ... } }
    */
    const matches = new Map();
    let isMatch = _doMatch(btree, pattern, matches);
    return isMatch ? matches : null;
}

if (false) {
    // Test match
    let btree = {
        text: "+",
        left: { text: "1" },
        right: { text: "*",
            left: { text: "2" },
            right: { text: "3" }
        }
    };
    let pattern = {
        name: "sum",
        text: "+",
        right: { text: "*" }
    };
    console.log(match(btree, pattern));

    btree = {
        text: "+",
        left: { text: "1" },
        right: { text: "*",
            left: { text: "2" },
            right: { text: "3" }
        }
    };
    pattern = {
        name: "sum",
        text: "+",
        left: { text: "1" },
        right: { text: "-" }
    };
    console.log(match(btree, pattern));
}

function _doMatch(btree, pattern, matches) {
    /* Do the matching and save result to the map matches.
    */
    if (btree && pattern && typeof btree === "object" && typeof pattern === "object") {
        let matchText = !pattern.hasOwnProperty("text");
        matchText = matchText || btree.text === pattern.text;

        let matchLeft = !pattern.hasOwnProperty("left");
        matchLeft = matchLeft || _doMatch(btree.left, pattern.left, matches);

        let matchRight = !pattern.hasOwnProperty("right");
        matchRight = matchRight || _doMatch(btree.right, pattern.right, matches);

        if (matchText && matchLeft && matchRight) {
            if (pattern.hasOwnProperty("name")) {
                matches.set(pattern.name, btree);
            }
            return true;
        }
    }
    return false;
}

function coerceNumbers(btree) {
    /* Set value to nodes of type number.
     */
    postwalk(btree, n => {
        if (n.type === "number" && n.hasOwnProperty("text")) {
            n.value = parseInt(n.text);
        }
    });
}

function getPrecedenceFix(btree, pmap) {
    /* Get fixed version for operator precedence for btree.

    pmap: map from operator to their precedence, higher value
    means higher precedence.

    For example, if the tree looks like: [* 1 [+ 2 3]],
    then it should be changed to: [+ [* 1 2] 3]
    */

    const m = match(btree, precedencePattern);
    if (m) {
        let a = m.get("a");
        let b = m.get("b");
        if (pmap.has(a.text) && pmap.has(b.text) &&
            pmap.get(a.text) > pmap.get(b.text)) {
            // rearrange to make the fixed tree
            return {
                text: b.text,
                left: {
                    text: a.text,
                    left: a.left,
                    right: b.left
                },
                right: b.right
            };
        }
    }
}

if (false) {
    // Test getPrecedenceFix
    let tofix = {
        text: "*",
        left: { text: "1" },
        right: {
            text: "+",
            left: { text: "2" },
            right: { text: "3" }
        }
    };
    let pmap = new Map([["*", 2], ["+", 1]]);

    console.log(getPrecedenceFix(tofix, pmap));
}

function fixOperatorPrecedence(btree) {
    // map operators to their precedence of evaluation
    const pmap = new Map([
        ["+", 1],
        ["-", 1],
        ["*", 2],
        ["/", 2]
    ]);

    const fixPrecedence = function(n) {
        let fixed = getPrecedenceFix(n, pmap);
        if (fixed) {
            if (fixed.hasOwnProperty("text")) {
                n.text = fixed.text;
            }
            if (fixed.hasOwnProperty("left")) {
                n.left = fixed.left;
            }
            if (fixed.hasOwnProperty("right")) {
                n.right = fixed.right;
            }
        }
    };

    postwalk(btree, fixPrecedence);
}

if (false) {
    // Test fixOperatorPrecedence
    let tofix = {
        text: "*",
        left: { text: "1" },
        right: {
            text: "+",
            left: { text: "2" },
            right: {
                text: "*",
                left: { text: "3" },
                right: {
                    text: "+",
                    left: { text: "4" },
                    right: { text: "5" }
                }
            }
        }
    };

    fixOperatorPrecedence(tofix);

    console.log(tofix);
}

function map(btree, f) {
    /* Make a new tree from an old one.

    f: map each old node to a new node, the new node should
    not have left and right children
    */
    var top;

    // stack of nodes visited in pre-order
    const stack = [];

    const enter = n => {
        // entering, make new node on top of stack
        let newnode = f(n);
        if (newnode.hasOwnProperty("left") || newnode.hasOwnProperty("right")) {
            throw `Should not create left/right child for: ${newnode}`;
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
    // Test map
    let tomap = {
        text: "*",
        left: { text: "1" },
        right: {
            text: "+",
            left: { text: "2" },
            right: { text: "3" }
        }
    };

    console.log(map(tomap, n => {
        // retain the text only
        return { text: n.text };
    }));
}

function evalBtree(btree) {
    /* Eval a btree representing simple arithmetic expressions.

    For now consider only the four basic operations: +, -, *, /
    */
    return reduce(btree, (n, left, right) => {
        if (n.text === "+") {
            return left + right;
        }
        else if (n.text === "*") {
            return left * right;
        }
        else if (n.text === "-") {
            return left - right;
        }
        else if (n.text === "/") {
            return left / right;
        }
        else if (n.hasOwnProperty("value")) {
            return n.value;
        }
        else {
            throw `Cannot eval node ${n}`;
        }
    });
}

if (false) {
    // Test evalBtree

    // should be 5 here
    console.log(evalBtree({
        text: "*",
        left: { text: "1", value: 1 },
        right: {
            text: "+",
            left: { text: "2", value: 2 },
            right: { text: "3", value: 3 }
        }
    }));
}

function reduce(btree, f) {
    /* Reduce btree to a value.

    f: a reduce-function that takes three arguments:
    a node and the reduced value of its left and right children.
    */

    // map from nodes to their reduced value
    const values = new Map();

    postwalk(btree, node => {
        let leftValue = values.get(node.left);
        let rightValue = values.get(node.right);
        let value = f(node, leftValue, rightValue);
        values.set(node, value);
    });

    return values.get(btree);
}

if (false) {
    // Test reduce

    // tree for 1 + 2 * 3
    let tree = {
        text: "+",
        left: { text: "1", value: 1 },
        right: {
            text: "*",
            left: { text: "2", value: 2 },
            right: { text: "3", value: 3 }
        }
    };

    console.log(reduce(tree, (n, left, right) => {
        if (n.text === "*") {
            return left * right;
        }
        else if (n.text === "+") {
            return left + right;
        }
        else {
            return n.value;
        }
    }));
}

