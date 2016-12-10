/**
 * Events is the default way in Node to communicate between processes.
 * Need to learn how to use events.
 */

"use strict";

/**
 * Pure model, work with data only.
 */
function Core() {
    this.notes = [];
}

Core.prototype.time = function() {
    return new Date();
};

Core.prototype.addNote = function(note) {
    this.notes.push(String(note));
};

Core.prototype.findNote = function(key, callback) {
    key = key.toLowerCase();
    for (let i = 0; i < this.notes.length; i += 1) {
        let note = this.notes[i];
        if (note.toLowerCase().includes(key)) {
            callback(note, i);
        }
    }
};

/**
 * Show all notes.
 * Accept a callback with 2 arguments: note and its index.
 */
Core.prototype.listNotes = function(callback) {
    this.notes.forEach(function(note, i, _) {
        callback(note, i);
    });
};

/**
 * Delete note given its id.
 * Accept a callback with 1 argument: the note being deleted.
 */
Core.prototype.deleteNote = function(idx, callback) {
    let deleted = [];
    this.notes.forEach(function(note, i, _) {
        if (i === idx) {
            callback(note);
        }
        else {
            deleted.push(note);
        }
    });
    this.notes = deleted;
};

/**
 * Convert state to json string
 */
Core.prototype.toJson = function() {
    return JSON.stringify(this.notes);
};

/**
 * Restore state from json string
 */
Core.prototype.fromJson = function(jsonStr) {
    this.notes = JSON.parse(jsonStr);
}

/**
 * Convert variations of time unit such as 'minutes', 'min'
 * to contracted version: m for 'minute', h for 'hour'.
 * Return empty string if cannot recognize the unit.
 */
function parseTimeUnit(tu) {
    if (tu === "hours" || tu === "hour" || tu === "h") {
        return "h";
    }
    else if (tu === "minute" || tu === "minutes" ||
        tu === "min" || tu === "mins" || tu === "m") {
        return "m";
    }
    else if (tu === "seconds" || tu === "second" ||
        tu === "sec" || tu === "secs" || tu === "s") {
        return "s";
    }
    else {
        return "";
    }
}

/**
 * Get time in seconds from a time value and unit.
 * e.g. if value=2 and unit=m then it evals to 120.
 */
function timeInSeconds(value, unit) {
    if (unit === "h") {
        return value * 60 * 60;
    }
    else if (unit === "m") {
        return value * 60;
    }
    else if (unit === "s") {
        return value;
    }
}

/**
 * Parse 'remind command'.  If succeeded, callback is called with two
 * arguments: the time in secconds and the message. For example, if str is
 * "remind in 1 min to sneeze", then the call is callback(60, "sneeze").
 */
function parseRemind(str, callback) {
    // parse the cmd to get the timeout and the message
    // the cmd should look like: alert in 5 min
    if (!(str.startsWith("alert") || str.startsWith("remind"))) {
        return;
    }

    // find the 'to feed the dog' phrase
    let toPhrase = (/to(((?!in).)+)/).exec(str);
    let message = toPhrase ? toPhrase[1].trim() : "Alert!";

    // now find the 'in 5 min' phrase
    let inPhrase = (/in\s+(\w+)\s+(\w+)/).exec(str);
    if (inPhrase === null) {
        callback(1, message);
        return;
    }

    // first group would be the time value
    let timeValue = inPhrase[1];
    timeValue = parseInt(timeValue);
    if (!timeValue) {
        callback(1, message);
        return;
    }

    // second group is the time unit
    let timeUnit = inPhrase[2];
    timeUnit = parseTimeUnit(timeUnit);
    if (!timeUnit) {
        callback(1, message);
        return;
    }

    // time made from the time value-unit pairs
    let time = timeInSeconds(timeValue, timeUnit);
    if (!time) {
        callback(1, message);
        return;
    }

    callback(time, message);
}

/**
 * The app controls a core logic and has an event-emitter
 * to comminicate with outside world.
 */
function App(core, ee) {
    this.core = core;
    this.ee = ee;
    this.sessionfile = __dirname + "/session.json";
}

/**
 * Take a request string and return a reponse string.
 * Raise event if an external action is required.
 * Communicate via events only.
 */
App.prototype.handle = function(req) {
    if (req === "exit") {
        this.ee.emit("exit");
        return "Exiting...";
    }

    if (req === "time") {
        return String(this.core.time());
    }

    let remind = false;
    let ee = this.ee;
    parseRemind(req, function(delayInSecs, msg) {
        remind = true;
        ee.emit("dialog", delayInSecs, msg);
    });
    if (remind) {
        return "Noted!";
    }

    if (req.startsWith("note")) {
        // match phrases like: note feed the dog
        let match = (/^note\s+(.+)/).exec(req);
        if (match !== null) {
            this.core.addNote(match[1]);
            return "Note added!";
        }
    }

    if (req.startsWith("findnote")) {
        // match phrases like: findnote birthday
        let match = (/^findnote\s+(.+)/).exec(req);
        if (match !== null) {
            let notes = [];
            this.core.findNote(match[1], function(note, idx) {
                notes.push(`${idx}. ${note}`);
            });
            return notes.join("\n");
        }
    }

    if (req === "notes") {
        let notes = [];
        this.core.listNotes(function(note, idx) {
            notes.push(`${idx}. ${note}`);
        });
        return notes.join("\n");
    }

    if (req.startsWith("delnote")) {
        // match phrases like: delnote 0
        let match = (/^delnote\s+(.+)/).exec(req);
        if (match !== null) {
            let idx = Number(match[1]);
            if (!isNaN(idx)) {
                let notes = [];
                this.core.deleteNote(idx, function(note) {
                    notes.push(note);
                });
                if (notes.length === 0) {
                    return `Found no notes at ${idx}`;
                }
                else {
                    return `Deleted note: ${notes[0]}`;
                }
            }
        }
    }

    if (req === "save") {
        let file = this.sessionfile;
        let json = this.core.toJson();
        this.ee.emit("save", file, json);
        return `Saving session to ${file}`;
    }

    if (req === "open") {
        let file = this.sessionfile;
        let core = this.core;
        let ee = this.ee;
        this.ee.emit("open", file, function(data) {
            try {
                core.fromJson(data);
            }
            catch(err) {
                ee.emit("response", `Error restoring state from json: ${data}, error is ${err}`);
            }
        });
        return `Openning session file ${file}`;
    }

    return `Don't understand request: ${req}`;
}

const fs = require("fs");
const dl = require("dialog");

const EventEmitter = require('events');
const ee = new EventEmitter();

const app = new App(new Core(), ee);

const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
}).on("line", function(line) {
    // just send input as event
    ee.emit("request", line);
});

ee.on("request", function(request) {
    let response = null;
    try {
        response = app.handle(request);
        if (!response) {
            throw `No response for request ${request}`;
        }
    }
    catch(err) {
        response = `Found a bug: ${err}`;
    }
    finally {
        ee.emit("response", response);
    }
}).on("response", function(response) {
    // TODO if on input prompt, then need to add a new line: state handling?
    console.log(response);
    rl.prompt();
}).on("exit", function() {
    console.log("Bye!...");
    rl.close();
    process.exit();
}).on("save", function(file, data) {
    fs.writeFile(file, data, {}, function(err) {
        if (err) {
            ee.emit("response", `Writing file ${file} has error ${err}`);
        }
    });
}).on("open", function(file, onData) {
    if (!fs.existsSync(file)) {
        ee.emit("response", `No file found at ${file}`);
        return;
    }

    fs.readFile(file, function(err, data) {
        if (err) {
            ee.emit("response", `Reading file ${file} has error ${err}`);
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
