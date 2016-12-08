/**
 * Use i/o functions of node.js
 */

"use strict";

const fs = require("fs");

/**
 * Write to a file then reads its back
 */
function readwritefile() {
    var str = "Hello World!";

    // write str to file
    fs.writeFile("readwritefile.txt", str, {}, err => console.log(err));

    // read back the file
    fs.readFile("readwritefile.txt", function (err, data) {
        if (err) {
            return console.error(err);
        }
        console.log("Asynchronous read: " + data.toString());
    });

    // delete the file
    fs.unlink("readwritefile.txt", err => console.log(err));
}

readwritefile();
