/**
 * Run the program, work like:
 * - user enters a command-string
 * - system finds a command that can handle the command-string
 * - system runs the command
 */
(function () {
    "use strict";

    const context = require("./context").newContext();
    const handle = require("./commands").handle;

    context.onLine(function(line) {
        try {
            handle(line.trim(), context);
        }
        catch(err) {
            context.response("Sorry, found a bug: " + err);
        }
    });

    context.onClose(function() {
        // here closing means exiting
        process.exit(0);
    });

    context.start();
})();
