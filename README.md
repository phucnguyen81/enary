# Description
Do various little things:

- quick note
- reminder
- calculate simple expressions

There are exelent tools for these but they are scattered and too big for my
needs.

# Example
Show example sessions running the program with Node.
The $ is the command prompt while > is our program's prompt.

First session:

```
$ node main.js
> remind in 15 min to feed the dog
> note fix the sink
> note call mum
> notes
0. fix the sink
1. call mum
> findnote mum
1. call mum
> delnote 0
> notes
0. call mum
> save
> Session file saved to /home/phuc/projects/enary/src/session.json
> exit
Closing...
```

Second session that restores the first one:

```
$ node main.js
> open
> Session file openned!
> notes
0. call mum
>
```
