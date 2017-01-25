# TODO-15 - have a Tree structure
Again I'm back to needing a tree structure for the parse-tree
of form: { name, children }.
Also, specifically each node has start-end indices for the matched texts.

Why do I need a specific Tree for the parse-tree?
Well, because the parse-tree is quite specific.
It is the sole structure representing the parsed source code.
I will need to do transformations on it quite a bit also.

# TODO-14 - extend Node REPL
Find a way to just extend the Node REPL, which allows:
- make use of everything Node has to offer
- add my own commands

# TODO-13 - compute simple math expressions
Should be fun to do, can use the Interpreter Pattern here.
Nah, a simple stack machine to eval expressions should be enough.
Uhmm, this blows up to writing a BNF parser generator :(.

Uhmm, no need to do this, just extend the Node REPL.

# TODO-12 - DONE show the prompt after each complete response
The prompt does not show after saving session.
The prompt does show after openning session, though.

This is because saving file is async,
so the task is finished after the prompt is reset.

Currently, handle this by manually adding an endResponse()
at the end of each command to reset the prompt.
Not super clean but works for now.

# TODO-11 - DONE save/open session
Ok, what format to use here?
json should be the first choice because of off-the-shelf support for serialization.

The session is saved in current dir.
Lets see if we can save file relative to a javascript file.
Yes, we have '__dirname' and '__filename' for that.

# TODO-10 - DONE add some more commands
Add commands to add note, show notes, find notes, delete notes.

To add a command:

- commands.js: add command-parsing to commands.js, follows the signature cmd(line, context)
- commands.js: add the new command to exported list of commands
- context.js: add command-logic

Is this the simplest way?

# TODO-9 - DONE consider using Command and Chain-of-Responsibility
Parsing a general command-string proves to be difficult.
The parser complexity increases with each command added.

Another way to look at this is:
There is a bunch of commands that handles specific command-phrases.
Given a phrase, each command can try to handle the phrase until one of them succeeds.
This sounds like Command and Chain-of-Responsibility patterns.

- have different commands, each handles a specific command phrase
- if a command cannot handle the phrase, use the next command

# TODO-8 - DONE recognize duration like 5 min
For phrase starting with 'in', what follows is either time or space.
Lets do time first.

Uhmm, this gets closer to natural language processing.
Hopefully I can still get by with direct coding.

Lets deal with the parsing of '5 min' first.

Parse phrase like '5 min':
- go through the phrases
- if a phrase preposition is 'in', parse the phrase body

Parse the phrase body:
- if start with a number then a word then got them
- verify the word to be 'min' or 'hour' or whatever later

Ok, screw this, I will write the BNF and do the parser generator for it.
Should be able to write:

command = action (phrase)+
action = word
phrase = preposition noun_phrase
preposition = one-of-those-prepositions
noun_phrase = oh-god-this-is-painful
word = javascript-regex-for-word

Nah, going this way will eventually lead to parsing natural english sentence,
too much effort.

# TODO-7 - DONE parse simple command phrase
Parse simple command pharses such as 'remind in 5 min to feed the dog'.
Interesting enough, huh?

# TODO-6 - DONE enter alert command
Let user enter command like: remind in {time} that {message}
Then show the message after the timeout.

# TODO-5 - DONE make a program that show an alert after a period
Use setTimer and just write the alert to console.

# TODO-4 - DONE make echo program with readline
Done, something fun there.

# TODO-3 - DONE use readline
readline package seems to be a right fit.
It is a basic command prompt for doing line I/O.

# TODO-2 - DONE explore usage of Node REPL
Lets go over the example code.
Nah, the REPL is too heavy for this, lets use its component readline.

# TODO-1 - DONE initial exploration
Ok, first lets do a simple thing based on node's strength:
pop up an alert after some period of time

user: remind in 5min
system: after that time elapsed, show an alert

Looks like I need to run a sort of REPL thing here.

Lets explore the usage of Node REPL for making command-prompt.

