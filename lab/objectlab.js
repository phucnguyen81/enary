// Usage of object literal
function newObject() {
    const arr = [];
    return {
        push: function(x) {
            arr.push(x);
        },
        contents() {
            return arr;
        }
    };
}

var o = newObject();
o.push(1);
console.log(o.contents());

var o2 = newObject();
o2.push(2);
console.log(o2.contents());

