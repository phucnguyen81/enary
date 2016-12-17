/**
 * Implement a binary tree.
 */

"use strict";

/*
    Binary tree that has a value and two optional non-emtpy left and right nodes.
    The left and right nodes, if exist, must exist together.
*/
function Btree(value, left, right) {
    this.value = value;

    if (left && !right) {
        throw `Has left node: ${left} but not right node: ${right}`;
    }
    if (right && !left) {
        throw `Has right node: ${right} but not left node: ${left}`;
    }

    if (left !== undefined) {
        if (left instanceof Btree) {
            this.left = left;
        } else {
            throw "Left node must be Btree";
        }
    }
    if (right !== undefined) {
        if (right instanceof Btree) {
            this.right = right;
        } else {
            throw "Right node must be Btree";
        }
    }
}

Btree.prototype.isLeaf = function() {
    if (this.left && this.right) {
        return true;
    }
    else if (!this.left && !this.right) {
        return false;
    }
    else {
        throw `Left: ${this.left} and right: ${this.right} must either exist together or not at all`;
    }
}

/**
    Build a generic binary-tree with a callback that accepts two arguments:
    a function to add nodes and a constant to indicate node's level.

    For example, to build a tree for 1 + 2:

    let exp = buildGenericBinaryTree((a, _) => {
        a("+");
        a(_, 1);
        a(_, 2);
    };

    The result would look like::
    { value: "+",
        left:  { value: 1 },
        right: { value: 2 }
    }

    TODO this should be moved to a util package
*/
function buildGenericBinaryTree(callback) {
    const nodes = [];

    const indent = new Object();
    function addNode() {
        let level = 0;
        let value = null;
        for (let arg of arguments) {
            if (arg === indent) {
                level += 1;
            }
            else {
                value = arg;
            }
        }
        nodes.push([value, level]);
    }

    // let client add the nodes with callback
    callback(addNode, indent);

    // collect nodes to build the tree
    const trees = [];
    for (let n of nodes) {
        let value = n[0];
        let level = n[1];
        let tree = { value };
        for (let prev of trees) {
            let prevLevel = prev[1];
            if (level > prevLevel) {
                // parent is the immediate previous tree with lower level
                let parent = prev[0];
                // new tree is left right or right child
                if (parent.left) {
                    parent.right = tree;
                }
                else {
                    parent.left = tree;
                }
            }
        }
        trees.unshift([tree, level]);
    }

    if (trees.length === 0) {
        throw "No node added";
    }

    return trees.pop()[0];
}

/**
    Build a Btree with a callback that accepts two arguments:
    a function to add nodes and a constant to indicate node's level.

    For example, to build a tree for 1 + 2:

    let exp = Tree.build((a, _) => {
        a("+");
        a(_, 1);
        a(_, 2);
    };

    The result would look like::
    Btree { value: "+",
        left:  Btree { value: 1 },
        right: Btree { value: 2 }
    }
*/
Btree.build = function(callback) {
    // convert generic binary tree to Btree
    function toBtree(tree) {
        if (tree.left && tree.right) {
            let left = toBtree(tree.left);
            let right = toBtree(tree.right);
            return new Btree(tree.value, left, right);
        }
        else {
            return new Btree(tree.value);
        }
    }

    const genericTree = buildGenericBinaryTree(callback);
    return toBtree(genericTree);
}

console.log("Btree.build:");
console.log(Btree.build(
    (a, _) => {
        a("+");
        a(_, 1);
        a(_, 2);
    }
));

const STOP = new Object();

/*
    Walk the tree with both pre-order and post-order callbacks.
    Each callback accepts two arguments: the visiting node and
    a stop constant.
    If the callback returns the stop constant, the walk is terminated.
 */
Btree.prototype.walk = function(enter, leave) {
    if (enter(this, STOP) === STOP) {
        return STOP;
    }
    if (this.left && this.left.walk(enter, leave) === STOP) {
        return STOP;
    }
    if (this.right && this.right.walk(enter, leave) === STOP) {
        return STOP;
    }
    if (leave(this, STOP) === STOP) {
        return STOP;
    }
}

Btree.prototype.prewalk = function(enter) {
    this.walk(enter, Function.prototype);
}

Btree.prototype.postwalk = function(leave) {
    this.walk(Function.prototype, leave);
}

/*
    Reduction on btree given a reduce-function that takes
    three arguments: a node value and the reduced value
    of its left and right children.
 */
Btree.prototype.reduce = function(f) {
    // map from node to the value
    const values = new Map();
    this.postwalk(node => {
        let leftValue = values.get(node.left);
        let rightValue = values.get(node.right);
        let value = f(node.value, leftValue, rightValue);
        values.set(node, value);
    });
    return values.get(this);
}

console.log("reduce:");
console.log(
    new Btree("+", new Btree(1), new Btree(2)).reduce((value, left, right) => {
        if (value === "+") {
            return left + right;
        }
        else {
            return value;
        }
    })
);
