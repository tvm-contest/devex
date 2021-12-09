"use strict";

import * as PEG from "pegjs";
import * as fs from "fs";
import * as path from "path";
const tonsolidity = require("./build/parser");
const imports =  require("./build/imports_parser");
const builtParsers = {
    "tonsolidity": tonsolidity,
    "imports": imports
};

export class Parser {
    public getParser (parser_name, rebuild) {
        if (rebuild == true) {
            let parserfile = fs.readFileSync(path.resolve("./" + parser_name + ".pegjs"), {encoding: "utf8"});
            return PEG.generate(parserfile);
        } else {
            return builtParsers[parser_name];
        }
    }
    public parse (source:string, _parser_name?:string, _rebuild?:boolean, options?:any) {
        const parser_name = _parser_name ? _parser_name: "tonsolidity";
        const rebuild = _rebuild ? _rebuild: false;
        
        let parser = this.getParser(parser_name, rebuild);
        let result;
        try {
            result = parser.parse(source);
        } catch (e) {
            if (e instanceof parser.SyntaxError) {
                e.message += " Line: " + e.location.start.line + ", Column: " + e.location.start.column;
            }

            throw e;
        }

        if (typeof options === "object" && options.comment === true) {
            result.comments = this.parseComments(source);
        }

        return result;
    }

    public parseFile(file, parser_name, rebuild) {
        return this.parse(fs.readFileSync(path.resolve(file), {encoding: "utf8"}), parser_name, rebuild);
    }

    public parseComments(sourceCode) {
        // for Line comment regexp, the "." doesn't cover line termination chars so we're good :)
        const comments = [], commentParser = /(\/\*(\*(?!\/)|[^*])*\*\/)|(\/\/.*)/g;
        let nextComment;
    
        // eslint-disable-next-line no-cond-assign
        while (nextComment = commentParser.exec(sourceCode)) {
            const text = nextComment[0], types = { "//": "Line", "/*": "Block" };
    
            comments.push({
                text,
                type: types[text.slice(0, 2)],
                start: nextComment.index,
                end: nextComment.index + text.length
            });
        }
    
        return comments;
    }
}
