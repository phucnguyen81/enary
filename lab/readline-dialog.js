/**
 * Show an alert dialog after a timeout.
 */

"use strict";

const dialog = require("dialog");

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
});

rl.prompt();

rl.on("line", function (line) {
    line = line.trim();
    if (line === "exit") {
        console.log("Exiting...")
        this.close();
    }
    else {
        console.log(line);
    }
    this.prompt();
});

rl.on("close", () => {
    console.log("Have a great day!");
    // exit after the prompt closed
    process.exit(0);
});

// alert after timeout
setTimeout(function () {
    dialog.warn("Timeout ...", "Alert");
}, 2000);
