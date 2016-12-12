"use strict";

// use events as global communication means
const EventEmitter = require('events');
const ee = new EventEmitter();

// core needs only events
const Core = require("./core");
const App = require("./app");
const app = new App(new Core(), ee);

// these are I/O components
// use events to decouple them from the core
const fs = require("fs");
const dl = require("dialog");
const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
}).on("line", function(line) {
    // just send input as event
    ee.emit("request", line);
});

ee.on("error", function(err) {
    console.error(`Found a bug: ${err}`);
    rl.prompt();
}).on("request", function(request) {
    let response = app.handle(request);
    if (response === null || response === undefined) {
        ee.emit("error", new Error(`No response for request: ${request}`));
    }
    else {
        ee.emit("response", response);
    }
}).on("exit", function() {
    console.log("Bye!...");
    rl.close();
    process.exit();
}).on("response", function(response) {
    // TODO if on input prompt, then need to add a new line: state handling?
    console.log(response);
    rl.prompt();
}).on("writeFile", function(file, data) {
    fs.writeFile(file, data, {}, function(err) {
        if (err) {
            ee.emit("response", `Writing file: ${file} has error: ${err}`);
        }
    });
}).on("readFile", function(file, onData) {
    if (!fs.existsSync(file)) {
        ee.emit("response", `No file found at: ${file}`);
        return;
    }

    fs.readFile(file, function(err, data) {
        if (err) {
            ee.emit("response", `Reading file: ${file} has error: ${err}`);
        }
        else {
            onData(data);
        }
    });
}).on("dialog", function(delayInSecs, msg) {
    if (!delayInSecs || isNaN(delayInSecs)) {
        ee.emit("response", "Delay time not valid: ${delayInSecs}");
        return;
    }

    setTimeout(function() {
        ee.emit("response", `Alert! ${msg}`);
        dl.warn(msg, "Alert!");
    }, delayInSecs * 1000);
});

// show initial prompt
rl.prompt();
