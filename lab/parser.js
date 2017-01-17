"use strict";

const Base = require("../base/base");

/* Parse strings to build ast given BNF like notation.

    For example, BNF for expression looks like:

    <expression> ::=
            <expression> + <term>
        | 	<expression> - <term>
        |	<term>

    <term> ::=
            <term> * <factor>
        |	<term> / <factor>
        | 	<factor>

    <factor> ::=
            <primary> ** <factor>
        |	<primary>

    <primary> ::=
            <primary>
        |	<element>

    <element> ::=
            ( <expression> )
        |	<variable>
        | 	<number>
*/

function defineRules(callback) {
    /* Define rules in BNF notation, which is returned as a multi-value map
    from rule names to rule definitions.
    */

    const rules = new Map();

    function def() {
        if (arguments.length < 2) {
            throw `Require at least two arguments for rhs and lhs, not just ${arguments}`;
        }
        let args = Array.from(arguments);
        let name = args.shift();
        args = args.map(
            (arg, idx, _) => typeof arg === "string" ? rule(arg) : arg);
        if (!rules.has(name)) {
            rules.set(name, []);
        }
        rules.get(name).push(args);
    }

    function rule(name) {
        return { type: "rule", value: name };
    }

    function str(s) {
        return { type: "string", value: s };
    }

    function re(s) {
        return { type: "regex", value: s };
    }

    callback(def, str, re);

    return rules;
}

if (false) {
    // Test defineRules

    // rules for simple expressions
    let rules = defineRules((def, str, re) => {
        def("expression", "expression", str("+"), "term");
        def("expression", "term");

        def("term", "term", str("*"), "factor");
        def("term", "term", str("/"), "factor");
        def("term", "factor");

        def("factor", "primary", str("**"), "factor");
        def("factor", "primary");

        def("primary", "primary");
        def("primary", "element");

        def("element", str("("), "expression", str(")"));
        def("element", "variable");
        def("element", "number");

        def("variable", re(/\w+/y));

        def("number", re(/\d+/y));
    });

    Base.log(rules);
}

/*
    Now, lets sketch the way to parse with BNF grammar here:

    Data:
    - input string is a sequence of characters that can be marked
    - a mark record parsing info: start-index, rule and end-index

    Process:
    - with each rule, find the longest match among alternatives
        - note: repeat the rule while can still expand the match (for recursive rule)
    - with each alternative, match each subrule in the sequence

    Optimization:
    - place marks for each success and failure
    - use marks to cache previous computation
*/

/*
    First, let's try the Interpreter Pattern here:
    Create a structure representing the grammar such that evaluating
    the structure becomes the parsing process.

    Grammar
        Rule
            Alt
                Term
                    Literal
                    Regex
                    RuleName

    Then, the parsing is just comparing an input sequence
    with the grammar. Each element in the Grammar tree represents
    a context for comparison.
 */

function Grammar() {
    this.rules = [];
}
Grammar.prototype.rule = function(name) {
    // TODO use map name->rule here for performance
    for (let r of this.rules) {
        if (r.name === name) {
            return r;
        }
    }
    return null;
};
Grammar.prototype.parse = function(input, initRule) {
    const rule = this.rule(initRule);
    if (rule) {
        return rule.parse(input);
    }
    else {
        throw `Found no rule named: ${initRule}`;
    }
};

function Rule(grammar, name) {
    grammar.rules.push(this);
    this.grammar = grammar;
    this.name = name;
    this.alts = [];
}
Rule.prototype.parse = function(input) {
    /* Find the longest match among alternatives */

    const start = input.pos();
    input.saveStartMatch(this.name, start);

    // keep expanding the match with doParse
    let end = start;
    while (this.doParse(input)) {
        let canExpandMatch = input.pos() > end;
        if (canExpandMatch) {
            end = input.pos();
            input.pos(start);
        }
        else {
            input.pos(end);
            return true;
        }
    }

    return false;
};
Rule.prototype.doParse = function(input) {
    let match = false;
    const start = input.pos();
    let end = start;

    // match each alt, track longest match
    for (let alt of this.alts) {
        // all alt starts at the same position when the rule starts
        input.pos(start);
        if (alt.parse(input)) {
            // some alt matches = the whole rule match
            match = true;
            end = Base.max(end, input.pos());
        }
    }

    if (match) {
        // consume the longest match
        input.pos(end);
        return true;
    }
    else {
        // rule fails, remember this
        input.saveMismatch(this.name, start);
        input.pos(start);
        return false;
    }
};
Rule.prototype.rule = function(name) {
    return this.grammar.rule(name);
};

function Alt(rule) {
    rule.alts.push(this);
    this._rule = rule;
    this.terms = [];
}
Alt.prototype.parse = function(input) {
    const save = input.pos();
    for (let term of this.terms) {
        if (term.parse(input)) {
            continue;
        }
        else {
            input.pos(save);
            // fail if any fails
            return false;
        }
    }
    // alt matched, cache the result both for performance and avoiding recursion
    // TODO decouple caching from parsing
    input.saveMatch(this._rule.name, save, input.pos());
    return true;
};
Alt.prototype.rule = function(name) {
    return this._rule.rule(name);
};

function Str(alt, str) {
    alt.terms.push(this);
    this.str = str;
}
Str.prototype.parse = function(input) {
    // TODO better to literal regex here?
    // or, just compare characters
    const s = input.str.slice(input.pos());
    if (s.startsWith(this.str)) {
        input.pos(input.pos() + this.str.length);
        return true;
    }
    else {
        return false;
    }
};

function Regex(alt, regex) {
    alt.terms.push(this);
    if (regex.flags.includes("y")) {
        this.regex = regex;
    }
    else {
        throw `Require 'y' flag for regexp: ${regex}`;
    }
}
Regex.prototype.parse = function(input) {
    const start = input.pos();
    const re = this.regex;
    re.lastIndex = start;
    if (re.exec(input.str)) {
        input.pos(re.lastIndex);
        return true;
    }
    else {
        input.pos(start);
        return false;
    }
};

function RuleName(alt, name) {
    alt.terms.push(this);
    this.alt = alt;
    this.name = name;
}
RuleName.prototype.parse = function(input) {
    // first, just search to the longest match of the rule
    // at current position to avoid left recursion
    // matchRule() : find longest previous match set with saveMatch()
    const matched = input.matchRule(this.name);
    if (matched === null) {
        // no previous match, do it the first time
        return this.doParse(input);
    }
    else if (matched) {
        return true;
    }
    else {
        // could not match previously
        return false;
    }
};
RuleName.prototype.doParse = function(input) {
    /* Use the referenced-rule to parse
     */
    const rule = this.alt.rule(this.name);
    if (rule) {
        return rule.parse(input);
    }
    else {
        throw `No rule named: ${this.name}`;
    }
};

function newGrammar(aGrammar) {
    /* Create Grammar from the grammar-map returned by defineRules() */
    let grammar = new Grammar();
    for (let [aName, aRule] of aGrammar) {
        let rule = new Rule(grammar, aName);
        for (let anAlt of aRule) {
            let alt = new Alt(rule);
            for (let aTerm of anAlt) {
                if (aTerm.type === "string") {
                    new Str(alt, aTerm.value);
                }
                else if (aTerm.type === "regex") {
                    new Regex(alt, aTerm.value);
                }
                else if (aTerm.type === "rule") {
                    new RuleName(alt, aTerm.value);
                }
                else {
                    throw `Unknown type: ${aTerm.type}`;
                }
            }
        }
    }
    return grammar;
}

if (false) {
    // Test newGrammar

    // rules for simple expressions
    let rules = defineRules((def, str, re) => {
        def("expression", "expression", str("+"), "term");
        def("expression", "term");
        def("term", "term", str("*"), "number");
        def("term", "term", str("/"), "number");
        def("term", "number");
        def("number", re(/\d+/y));
    });

    let g = newGrammar(rules);
    Base.log(g);
}

function Input(str) {
    /*  Wrap a string to annotate it with match/mismatch */

    this.str = str;
    this._pos = 0;
    this.matches = [];
    this.mismatches = [];
    this.startMatches = [];
}
Input.prototype.pos = function(p) {
    /* With argument p, set position; without argument p, return position */

    if (p === 0) {
        this._pos = p;
    }
    else if (p && p > 0) {
        this._pos = p;
    }
    else if (p === undefined) {
        return this._pos;
    }
    else {
        throw `Invalid position: ${p}`;
    }
};
Input.prototype.matchRule = function(name) {
    /* Try to match by finding longest previously saved match/mismatch.

    Return true if found a saved match at current pos,
    false if found a saved mismatch at current pos,
    and null if no info about match/mismatch at current pos.
    */

    const start = this.pos();

    for (let m of this.mismatches) {
        if (m[0] === name && m[1] === start) {
            return false;
        }
    }

    const ends = [];
    for (let m of this.matches) {
        if (m[0] === name && m[1] === start) {
            ends.push(m[2]);
        }
    }

    if (ends.length > 0) {
        this.pos(Base.maxIter(ends));
        return true;
    }
    else {
        // check previous start rule to prevent left recursion
        for (let m of this.startMatches) {
            if (m[0] === name && m[1] === start) {
                return false;
            }
        }

        // should be the first time matching this rule
        return null;
    }
};
Input.prototype.saveMatch = function(name, start, end) {
    if (name === undefined || start === undefined || end === undefined) {
        throw `Missing one of name: ${name} or start: ${start} or end: ${end}`;
    }
    const match = [name, start, end];
    for (let m of this.matches) {
        if (m[0] === match[0] && m[1] === match[1] && m[2] === match[2]) {
            // don't save duplicate
            return false;
        }
    }
    this.matches.push(match);
    return true;
};
Input.prototype.saveMismatch = function(name, start) {
    if (name === undefined || start === undefined) {
        throw `Missing one of name: ${name} or start: ${start}`;
    }
    const match = [name, start];
    for (let m of this.mismatches) {
        if (m[0] === match[0] && m[1] === match[1]) {
            // don't save duplicate
            return false;
        }
    }
    this.mismatches.push(match);
    return true;
};
Input.prototype.saveStartMatch = function(name, start) {
    /* Save a match that has been started but not sure whether
     * it can yield a match */

    if (name === undefined || start === undefined) {
        throw `Missing one of name: ${name} or start: ${start}`;
    }

    const match = [name, start];
    for (let m of this.startMatches) {
        if (m[0] === match[0] && m[1] === match[1]) {
            // don't save duplicate
            return false;
        }
    }
    this.startMatches.push(match);
    return true;
}

if (false) {
    // Test Input

    const input = new Input(" Hello World!");
    // should see initial state
    Base.log(input);

    // should see 0 here
    Base.log(input.pos());

    // now change position
    input.pos(1);
    // should see 1 here
    Base.log(input.pos());

    // now save a match for the word 'Hello'
    input.saveMatch("word", 1, 6);
    Base.log(input);

    // save another one with same name but longer
    input.saveMatch("word", 1, 7);
    Base.log(input);

    // another same one, should be ignored
    input.saveMatch("word", 1, 7);
    Base.log(input);

    // save a mismatch
    input.saveMismatch("space", 1, 2);
    Base.log(input);

    // now try to match
    Base.log(input.matchRule("word"));
    // should consume the longest match
    Base.log(input);
}

if (false) {
    // test grammar

    // rules for simple string match
    const rules = defineRules((def, str, re) => {
        def("word", re(/\w+/y));
        def("space", str(" "));
        def("words", "word", "space");
        def("words", "words", "word", "space");
    });

    const g = newGrammar(rules);
    base.log(g);

    const input3 = new input("abc def ");
    base.log(g.parse(input3, "words"));
    base.log(input3);
}

if (true) {
    // test grammar

    // rules for simple string match
    const rules = defineRules((def, str, re) => {
        def("number", re(/\d+/y));
        def("var", re(/[a-zA-Z_]\w*/y));

        def("element", "number");
        def("element", "var");
        def("element", str("("), "exp", str(")"));

        def("factor", "element");
        def("factor", "factor", str("*"), "element");

        def("exp", "factor");
        def("exp", "exp", str("+"), "factor");
    });

    const g = newGrammar(rules);
    Base.log(g);

    const input = new Input("1*2*3");
    Base.log(g.parse(input, "factor"));
    Base.log(input);

    const input2 = new Input("1*2+2*3");
    Base.log(g.parse(input2, "exp"));
    Base.log(input2);

    const input3 = new Input("(1+2)*3");
    Base.log(g.parse(input3, "exp"));
    Base.log(input3);

    const input4 = new Input("1+a");
    Base.log(g.parse(input4, "exp"));
    Base.log(input4);
}

