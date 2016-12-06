"use strict";

const dialog = require("dialog");

/**
 * Make a new context for passing data/functions shared between commands.
 */
exports.newContext = function () {
    return {
        log(str) {
            /* log a message without processing it */
            console.log(str);
        },
        alert(delay, message) {
            /* show a system dialog box after a delay period in seconds */
            setTimeout(function() {
                dialog.warn(message, "Alert!");
            }, delay ? delay * 1000 : 1000);
        },
        notes: [],
        note(note) {
            /* save a note */
            this.notes.push(note);
        },
        findNote(key) {
            /* find notes that contains key, case insensitive */
            key = key.toLowerCase();
            for (let i = 0; i < this.notes.length; i += 1) {
                if (this.notes[i].toLowerCase().includes(key)) {
                    this.log(i + ". " + this.notes[i]);
                }
            }
        },
        listNotes() {
            for (let i = 0; i < this.notes.length; i += 1) {
                this.log(i + ". " + this.notes[i]);
            }
        },
    };
};
