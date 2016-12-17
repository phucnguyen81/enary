/**
 * Implement a tree, which keeps a value and being itself
 * an iterable of children.
 */

"use strict";

/**
 * First, define tree, well just make a class Tree?
 * Nah, lets just do the old way function stuff, see how it goes
 */
function Tree(value, children) {
    if (value == undefined) {
        throw `Value must be defined`;
    }
    this.value = value;
    if (children) {
        this._children = children;
    }
}

/* Add a child */
Tree.prototype.add = function(child) {
    if (!(child instanceof Tree)) {
        throw `Child node must be Tree, not ${typeof child}`;
    }
    if (!this._children) {
        this._children = [];
    }
    this._children.push(child);
}

console.log("add");
const tree = new Tree("+", []);
console.log(tree);
tree.add(new Tree(1));
console.log(tree);
tree.add(new Tree(2));
console.log(tree);

Tree.prototype.children = function(idx) {
    return this._children ? this._children : [];
}

/* Tree is iterable of its children */
Tree.prototype[Symbol.iterator] = function() {
    return children()[Symbol.iterator]();
}

console.log("Symbol.iterator");
for (let child of tree) {
    console.log(child);
}

// indicate traversal should stop as soon as possible
const STOP = new Object();

Tree.prototype.walk = function(enter, leave) {
    let s = enter(this, STOP);
    if (s === STOP) {
        return s;
    }
    for (let child of this) {
        s = child.walk(enter, leave);
        if (s === STOP) {
            return s;
        }
    }
    return leave(this, STOP);
}

console.log("walk");
tree.walk(n => {
    console.log(`Entering ${n.value}`);
}, n => {
    console.log(`Leaving ${n.value}`);
});

Tree.prototype.prewalk = function(visit) {
    this.walk(visit, new Function());
}

console.log("prewalk");
tree.prewalk(n => {
    console.log(`Entering ${n.value}`);
});

Tree.prototype.postwalk = function(visit) {
    this.walk(new Function(), visit);
}

console.log("postwalk");
tree.postwalk(n => {
    console.log(`Leaving ${n.value}`);
});

/**
    Build tree with a callback that accepts two arguments:
    a function to add nodes and a constant to indicate node's level.

    For example, to build a tree for 1 + 2:

    let exp = Tree.build((a, _) => {
        a("+");
        a(_, 1);
        a(_, 2);
    };
*/
Tree.build = function(callback) {
    const indent = new Object();
    const nodes = [];
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
        let tree = new Tree(value);
        for (let prev of trees) {
            let prevLevel = prev[1];
            if (level > prevLevel) {
                // parent is the immediate previous tree with lower level
                let parent = prev[0];
                parent.add(tree);
            }
        }
        trees.unshift([tree, level]);
    }

    if (trees.length === 0) {
        throw "No node added";
    }
    else {
        return trees.pop()[0];
    }
}

console.log("buildTree:");
const tree2 = Tree.build((b, _) => {
    b("+");
    b(_, 1);
    b(_, 2);
});
console.log(tree2);

Tree.prototype.match = function(other, isEqual) {
    /** Match a tree with an example tree. */

    if (!isEqual(this, other)) {
        return false;
    }

    let idx = 0;
    // now compare children
    for (let child of this) {
        if (idx >= other.children().length) {
            return false;
        }
        else if (!child.match(other.children()[idx])) {
            return false;
        }
        idx += 1;
    }
    return true;
}
