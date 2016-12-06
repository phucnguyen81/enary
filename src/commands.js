/**
 * Implement commands that recognizes and executes a command-phrase.
 * All commands assume a context which provides what they need to
 * carry out execution.
 */

"use strict";

/**
 * Convert variations of time unit such as 'minutes', 'min', ect.
 * to contracted version: m for 'minute', h for 'hour'.
 * Return null if cannot recognize the unit.
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
        return null;
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
function alert(cmd, ctx) {
    // parse the cmd to get the timeout and the message
    // the cmd should look like: alert in 5 min
    if (!(cmd.startsWith("alert") || cmd.startsWith("remind"))) {
        return false;
    }

    // find the 'to feed the dog' phrase
    let toPhrase = (/to(((?!in).)+)/).exec(cmd);
    let message = toPhrase ? toPhrase[1].trim() : "Alert!";

    // now find the 'in 5 min' phrase
    let inPhrase = (/in\s+(\w+)\s+(\w+)/).exec(cmd);
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
function note(cmd, ctx) {
    // match phrases like: 'note find the book Gone with the Wind'
    let notePhrase = (/note\s+(.+)/).exec(cmd);
    if (notePhrase === null) {
        return false;
    }
    else {
        ctx.note(notePhrase[1]);
        return true;
    }
}

/**
 * Find a note containing a key word
 */
function findNote(cmd, ctx) {
    // match phrases like: 'note-find keyword'
    let phrase = (/findnote\s+(.+)/).exec(cmd);
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
function listNotes(cmd, ctx) {
    if (cmd !== "notes") {
        return false;
    }
    ctx.listNotes();
    return true;
}

// export array of all commands
module.exports = [alert, note, findNote, listNotes];
