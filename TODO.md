# TODO1 - DONE initial exploration
Ok, first lets do a simple thing based on node's strength:
pop up an alert after some period of time

user: remind in 5min
system: after that time elapsed, show an alert

Looks like I need to run a sort of REPL thing here.

Lets explore the usage of Node REPL for making command-prompt.

# TODO2 - DONE explore usage of Node REPL
Lets go over the example code.
Nah, the REPL is too heavy for this, lets use its component readline.

# TODO3 - DONE use readline
readline package seems to be a right fit.
It is a basic command prompt for doing line I/O.

# TODO4 - DONE make echo program with readline
Done, something fun there.

# TODO5 - DONE make a program that show an alert after a period
Use setTimer and just write the alert to console.

# TODO6 - DONE enter alert command
Let user enter command like: remind in {time} that {message}
Then show the message after the timeout.

# TODO7 - DONE parse simple command phrase
Parse simple command pharses such as 'remind in 5 min to feed the dog'.
Interesting enough, huh?

# TODO8 - DONE recognize duration like 5 min
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

# TODO9 consider using Command and Chain-of-Responsibility
Parsing a general sentence proves to be difficult.
To support a new command, its structure would have to be recognized by the parser.
So the parser complexity increases with each command added.

Here I don't care about general sentence.
I have a set of commands that handles specific command-phrases.
If a command cannot handle a phrase, we use the next command.
So, lets go with Command and Chain-of-Responsibility patterns.

- make difference Cmd, each handle a specific command phrase
- if a command cannot handle the phrase, we call the next command
