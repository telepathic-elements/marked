import {Renderer} from './renderer.mjs';
import {Parser} from './parser.mjs';
import {Lexer} from './lexer.mjs';
import {escape,merge} from './helpers.mjs';
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 * Refactored by Sara Garmin @saragarmee
 * https://github.com/telepathic-elements/marked
 */
  
export default class Marked{
    constructor(src, opt, callback) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
        throw new Error('Marked(): input parameter is undefined or null');
        }
        if (typeof src !== 'string') {
        throw new Error('Marked(): input parameter is of type '
            + Object.prototype.toString.call(src) + ', string expected');
        }

        if (callback || typeof opt === 'function') {
        if (!callback) {
            callback = opt;
            opt = null;
        }

        opt = merge({}, Marked.defaults, opt || {});

        let highlight = opt.highlight,
            tokens,
            pending,
            i = 0;

        try {
            tokens = Lexer.lex(src, opt);
        } catch (e) {
            return callback(e);
        }

        pending = tokens.length;

        let done = function(err) {
            if (err) {
                opt.highlight = highlight;
            return callback(err);
            }

            let out;

            try {
                out = Parser.parse(tokens, opt);
            } catch (e) {
                err = e;
            }
            opt.highlight = highlight;

            return err ? callback(err) : callback(null, out);
        };

        if (!highlight || highlight.length < 3) {
            return done();
        }

        delete opt.highlight;

        if (!pending) return done();

        for (; i < tokens.length; i++) {
            (function(token) {
            if (token.type !== 'code') {
                return --pending || done();
            }
            return highlight(token.text, token.lang, function(err, code) {
                if (err) return done(err);
                if (code == null || code === token.text) {
                return --pending || done();
                }
                token.text = code;
                token.escaped = true;
                --pending || done();
            });
            })(tokens[i]);
        }

        return;
    }
    try {
        if (opt) opt = merge({}, Marked.defaults, opt);
        return Parser.parse(Lexer.lex(src, opt), opt);
    } catch (e) {
        e.message += '\nPlease report this to https://github.com/markedjs/marked.';
        if ((opt || Marked.defaults).silent) {
            return '<p>An error occurred:</p><pre>'
            + escape(e.message + '', true)
            + '</pre>';
        }
        throw e;
    }
    }

    options = setOptions;
    setOptions(opt) {
        merge(Marked.defaults, opt);
        return Marked;
    };

    getDefaults() {
        return {
          baseUrl: null,
          breaks: false,
          gfm: true,
          headerIds: true,
          headerPrefix: '',
          highlight: null,
          langPrefix: 'language-',
          mangle: true,
          pedantic: false,
          renderer: new Renderer(),
          sanitize: false,
          sanitizer: null,
          silent: false,
          smartLists: false,
          smartypants: false,
          tables: true,
          xhtml: false
        };
    };
    defaults = Marked.getDefaults();
}    

