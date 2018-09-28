import {noop, edit, merge}  from './helpers.mjs';

/**
 * Block-Level Grammar
 */
let grammar = {
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  bullet : /(?:[*+-]|\d+\.)/,
  code: /^( {4}[^\n]+\n*)+/,
  _comment : /<!--(?!-?>)[\s\S]*?-->/,
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  fences: noop,
  heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  html: '^ {0,3}(?:' // optional indentation
        + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
        + '|comment[^\\n]*(\\n+|$)' // (2)
        + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
        + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
        + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
        + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
        + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
        + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
        + ')', 
  item : /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/,
  _label : /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  newline: /^\n+/,
  nptable: noop,
  paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  table: noop,  
  text: /^[^\n]+/,
  _title : /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
  _tag : 'address|article|aside|base|basefont|blockquote|body|caption'
          + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
          + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
          + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
          + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
          + '|track|ul'
};

/**
 * Normal Block Grammar
 */
let block = {
    def : edit(grammar.def)
            .replace('label', grammar._label)
            .replace('title', grammar._title)
            .getRegex(),
    
    item : edit(grammar.item, 'gm')
            .replace(/bull/g, grammar.bullet)
            .getRegex(),

    list : edit(grammar.list)
            .replace(/bull/g, block.bullet)
            .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
            .replace('def', '\\n+(?=' + block.def.source + ')')
            .getRegex(),

    html : edit(grammar.html, 'i')
            .replace('comment', grammar._comment)
            .replace('tag', grammar._tag)
            .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
            .getRegex(),

    paragraph : edit(grammar.paragraph)
                  .replace('hr', grammar.hr)
                  .replace('heading', grammar.heading)
                  .replace('lheading', grammar.lheading)
                  .replace('tag', grammar._tag) // pars can be interrupted by type (6) html blocks
                  .getRegex(),

    blockquote : edit(grammar.blockquote)
                  .replace('paragraph', grammar.paragraph)
                  .getRegex(),
    
    normal : merge({}, block)
};

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\n? *\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = edit(block.paragraph)
  .replace('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  .getRegex();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
});
    
/**
 * Pedantic grammar
 */

block.pedantic = merge({}, block.normal, {
  html: edit(
    '^ *(?:comment *(?:\\n|\\s*$)'
    + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
    .replace('comment', grammar._comment)
    .replace(/tag/g, '(?!(?:'
      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
      + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
      + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
    .getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/
});

//Need to copy the properties of grammar to block, because other stuff could still be relying on the old stuff
for(let prop of Object.getOwnPropertyNames(grammar)){
  if(!block[prop]){
    block[prop]  = grammar[prop];
  }
}
export default block;