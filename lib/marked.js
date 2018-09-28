/**
 * marked - a markdown parser
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */
import {Parser} from './parser.mjs';
import {Renderer,TextRenderer} from './renderer.mjs';
import {Lexer} from './lexer.js';
import {InlineLexer} from './lexer-inline.js';
import {Marked} from './marked-class.js';
;(function(root) {
'use strict';

marked = Marked;
marked.defaults = marked.getDefaults();

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  root.marked = marked;
}
})(this || (typeof window !== 'undefined' ? window : global));
