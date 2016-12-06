/*
 * Start the app, should works like:
 * - user enters a command-string
 * - system finds a command that can handle the command-string
 * - system executes the command
 */
(function () {
    "use strict";

    const core = {
        context: require("./context").newContext(),
        // let each command handle the line till one succeeds
        handle(line) {
            for (let cmd of require("./commands")) {
                let handled = cmd(line, this.context);
                if (handled === true) {
                    return true;
                }
                else if (handled === false) {
                    continue;
                }
                else {
                    throw "Expect either true or false, not expect: " + handled;
                }
            }
            return false;
        }
    };

    const rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "> "
    });

    rl.on("line", function (line) {
        line = line.trim();
        if (line === "exit") {
            console.log("Exiting...");
            this.close();
        }
        else if (!core.handle(line)) {
            console.log("Found no commands for: " + line);
        }
        this.prompt();
    });

    rl.on("close", () => {
        console.log("Have a great day!");
        // exit after the prompt closed
        process.exit(0);
    });

    rl.prompt();

})();
