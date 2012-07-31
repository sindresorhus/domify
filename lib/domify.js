
/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Convert the given `html` into DOM elements.
 *
 * @api public
 */

module.exports = function(html){
  html = String(html);
  var tag = /<([\w:]+)/.exec(html)[1];

  if (tag == 'body') {
    html = html.replace(/^\s*<body[^>]*>/, '').replace(/<\/body>\s*$/, '');
    var el = document.createElement('body');
    el.innerHTML = html;
    return el;
  }

  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  if (el.lastChild.nextElementSibling || el.lastChild.previousElementSibling){
    throw new Error('More than one element was generated.');
  }

  return el.lastChild;
};