"use strict";

/**
 * Parse 'remind request'.  If succeeded, callback is called with two
 * arguments: the time in seconds and the message. For example, if str is
 * "remind in 1 min to have dinner", then the call is callback(60, "have dinner").
 *
 * Return whether the callback is called, i.e. parsing succceeds.
 */
function parseRemind(str, callback) {
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

    // parse the cmd to get the timeout and the message
    // the cmd should look like: alert in 5 min
    if (!(str.startsWith("alert") || str.startsWith("remind"))) {
        return false;
    }

    // find the 'to feed the dog' phrase
    let toPhrase = (/to(((?!in).)+)/).exec(str);
    let message = toPhrase ? toPhrase[1].trim() : "Alert!";

    // now find the 'in 5 min' phrase
    let inPhrase = (/in\s+(\w+)\s+(\w+)/).exec(str);
    if (inPhrase === null) {
        return false;
    }

    // first group would be the time value
    let timeValue = inPhrase[1];
    timeValue = parseInt(timeValue);
    if (!timeValue) {
        return false;
    }

    // second group is the time unit
    let timeUnit = inPhrase[2];
    timeUnit = parseTimeUnit(timeUnit);
    if (!timeUnit) {
        return false;
    }

    // time made from the time value-unit pairs
    let time = timeInSeconds(timeValue, timeUnit);
    if (!time) {
        return false;
    }

    callback(time, message);
    return true;
}

/**
 * Control a core logic and has an event-emitter to communicate with outside
 * world.
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
    const ee = this.ee;
    const core = this.core;
    const file = this.sessionfile;

    if (req === "exit") {
        ee.emit("exit");
        return "Exiting...";
    }

    if (req === "time") {
        return String(core.time());
    }

    if (parseRemind(req, function(delayInSecs, msg) {
        ee.emit("dialog", delayInSecs, msg);
    })) {
        return "Noted!";
    }

    if (req.startsWith("note")) {
        // match phrases like: note feed the dog
        let match = (/^note\s+(.+)/).exec(req);
        if (match !== null) {
            core.addNote(match[1]);
            return "Note added!";
        }
    }

    if (req.startsWith("findnote")) {
        // match phrases like: findnote birthday
        let match = (/^findnote\s+(.+)/).exec(req);
        if (match !== null) {
            let notes = [];
            core.findNote(match[1], function(note, idx) {
                notes.push(`${idx}. ${note}`);
            });
            return notes.join("\n");
        }
    }

    if (req === "notes") {
        let notes = [];
        core.listNotes(function(note, idx) {
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
                core.deleteNote(idx, function(note) {
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
        let json = core.toJson();
        ee.emit("writeFile", file, json);
        return `Saving session to ${file}`;
    }

    if (req === "open") {
        ee.emit("readFile", file, function(data) {
            try {
                core.fromJson(data);
            }
            catch(err) {
                throw `Error restoring state from json: ${data}, error is ${err}`;
            }
        });
        return `Openning session file ${file}`;
    }

    return `Don't understand request: ${req}`;
};

module.exports = App;
