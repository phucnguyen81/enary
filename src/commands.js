/**
 * Implement commands that recognizes and executes a command-phrase.
 * All commands assume a context which provides what they need to
 * carry out execution.
 */

"use strict";

function close(str, ctx) {
    if (str === "exit") {
        ctx.close();
        return true;
    }
    else {
        return false;
    }
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
 * Executes a cmd shows an alert after timeout
 */
function alert(str, ctx) {
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
        ctx.alert(1, message);
        return true;
    }

    // first group would be the time value
    let timeValue = inPhrase[1];
    timeValue = parseInt(timeValue);
    if (!timeValue) {
        ctx.alert(1, message);
        return true;
    }

    // second group is the time unit
    let timeUnit = inPhrase[2];
    timeUnit = parseTimeUnit(timeUnit);
    if (!timeUnit) {
        ctx.alert(1, message);
        return true;
    }

    // time made from the time value-unit pairs
    let time = timeInSeconds(timeValue, timeUnit);
    if (!time) {
        ctx.alert(1, message);
        return true;
    }

    ctx.alert(time, message);
    return true;
}

/**
 * Add a note
 */
function addNote(str, ctx) {
    // match phrases like: 'note find the book Gone with the Wind'
    let notePhrase = (/^note\s+(.+)/).exec(str);
    if (notePhrase === null) {
        return false;
    }
    else {
        ctx.addNote(notePhrase[1]);
        return true;
    }
}

/**
 * Find a note containing a key word
 */
function findNote(str, ctx) {
    // match phrases like: 'note-find keyword'
    let phrase = (/^findnote\s+(.+)/).exec(str);
    if (phrase === null) {
        return false;
    }
    else {
        ctx.findNote(phrase[1]);
        return true;
    }
}

/**
 * Show all notes by their ids
 */
function listNotes(str, ctx) {
    if (str === "notes") {
        ctx.listNotes();
        return true;
    }
    else {
        return false;
    }
}

/**
 * Delete a note based on its index in note list
 */
function deleteNote(str, ctx) {
    // match phrases like: 'delnote 0'
    let phrase = (/^delnote\s+(.+)/).exec(str);
    if (phrase === null) {
        return false;
    }

    let noteid = Number(phrase[1]);
    if (isNaN(noteid)) {
        return false;
    }

    ctx.deleteNote(noteid);
    return true;
}

function saveSession(str, ctx) {
    if (str !== "save") {
        return false;
    }
    else {
        ctx.save();
        return true;
    }
}

function openSession(str, ctx) {
    if (str != "open") {
        return false;
    }
    else {
        ctx.open();
        return true;
    }
}

/**
 * If no commands handle a certain string,
 * this can be the last command to report that.
 */
function noHandle(str, ctx) {
    ctx.response("No commands for: " + str);
    return true;
}

const commands = [
    close, alert,
    addNote, findNote, listNotes, deleteNote,
    saveSession, openSession,
    // this must be the last command
    noHandle
];

/**
 * Attempt to handle a string assuming it is a command.
 * Return whether the line is handled.
 */
exports.handle = function(str, ctx) {
    // run each command till one succeeds
    for (let cmd of commands) {
        let handled = cmd(str, ctx);
        if (handled === true) {
            return true;
        }
        else if (handled === false) {
            continue;
        }
        else {
            throw "Expect either true or false, but get:" + handled;
        }
    }
    return false;
};
