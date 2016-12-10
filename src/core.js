"use strict";

/**
 * Pure model, work with data only, no I/O.
 */
function Core() {
    this.notes = [];
}

/**
 * Return current date-time.
 */
Core.prototype.time = function() {
    return new Date();
};

/**
 * Add a note. The note is kept as string.
 */
Core.prototype.addNote = function(note) {
    this.notes.push(String(note));
};

/**
 * Find all notes containing a sub-string (case-insensitive).
 * For each note found, callback is called with two arguments:
 * the note and its index in the note list.
 */
Core.prototype.findNote = function(substr, callback) {
    substr = substr.toLowerCase();
    for (let i = 0; i < this.notes.length; i += 1) {
        let note = this.notes[i];
        if (note.toLowerCase().includes(substr)) {
            callback(note, i);
        }
    }
};

/**
 * Find all notes. For each note, onNote is called
 * with two arguments: the node and its index in the note-list.
 */
Core.prototype.listNotes = function(onNote) {
    this.notes.forEach(function(note, i, _) {
        onNote(note, i);
    });
};

/**
 * Delete note given its id.
 * Accept a callback onFound with one argument:
 * the note being deleted.
 */
Core.prototype.deleteNote = function(idx, onFound) {
    let deleted = [];
    this.notes.forEach(function(note, i, _) {
        if (i === idx) {
            onFound(note);
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
};

module.exports = Core;
