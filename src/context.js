"use strict";

const dialog = require("dialog");
const fs = require("fs");
const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
});

/**
 * Make a new context containing data/functions shared between commands.
 */
exports.newContext = function() {
    return {
        start() {
            /* show the prompt, start taking input */
            rl.prompt();
        },
        onLine(f) {
            /* set callback on reading a new line */
            rl.on("line", f);
        },
        onClose(f) {
            /* set callback on closing the instance */
            rl.on("close", f);
        },
        log(msg) {
            /* write to stdout */
            console.log(msg);
        },
        endResponse() {
            /* signal end of output */
            rl.prompt();
        },
        close() {
            this.log("Closing...");
            rl.close();
            // closed, no need to end response
        },
        response(msg) {
            this.log(msg);
            this.endResponse();
        },
        alert(delay, message) {
            /* display a system dialog box after a delay period in seconds */
            setTimeout(function() {
                let title = "Alert!";
                dialog.warn(message, title);
            }, delay ? delay * 1000 : 1000);

            this.endResponse();
        },
        notes: [],
        addNote(note) {
            /* save a note */
            this.notes.push(String(note));

            this.endResponse();
        },
        findNote(key) {
            /* find notes that contains key, case insensitive */
            key = key.toLowerCase();
            for (let i = 0; i < this.notes.length; i += 1) {
                let note = this.notes[i];
                if (note.toLowerCase().includes(key)) {
                    this.log(i + ". " + note);
                }
            }

            this.endResponse();
        },
        listNotes() {
            for (let i = 0; i < this.notes.length; i += 1) {
                this.log(i + ". " + this.notes[i]);
            }

            this.endResponse();
        },
        deleteNote(id) {
            this.notes = this.notes.filter((_, idx) => idx !== id);

            this.endResponse();
        },
        sessionfile: __dirname + "/session.json",
        save() {
            const str = JSON.stringify(this.notes);
            const _this = this;
            fs.writeFile(this.sessionfile, str, {}, function(err) {
                if (err) {
                    _this.log("Failed to save session file to " + _this.sessionfile, err);
                }
                else {
                    _this.log("Session file saved to " + _this.sessionfile);
                }

                _this.endResponse();
            });

            this.endResponse();
        },
        open() {
            if (!fs.existsSync(this.sessionfile)) {
                this.log("No session file to open");
                this.endResponse();
            }

            const _this = this;
            fs.readFile(this.sessionfile, function (err, data) {
                if (err) {
                    _this.log(err);
                }
                else {
                    _this.notes = JSON.parse(data);
                    _this.log("Session file openned!");
                }
                _this.endResponse();
            });

            this.endResponse();
        }
    };
};
