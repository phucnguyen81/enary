/**
 * Run the app, work like:
 * - user enters a command-string
 * - system finds a command that can handle the command-string
 * - system runs the command
 */
(function () {
    "use strict";

    const context = require("./context").newContext();
    const handle = require("./commands").handle

    context.onLine(function(line) {
        handle(line.trim(), context);
    });

    context.onClose(function() {
        // here closing means exiting process
        process.exit(0);
    });

    context.start();
})();
