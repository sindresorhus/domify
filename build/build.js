
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-stack/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `stack()`.\n\
 */\n\
\n\
module.exports = stack;\n\
\n\
/**\n\
 * Return the stack.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
function stack() {\n\
  var orig = Error.prepareStackTrace;\n\
  Error.prepareStackTrace = function(_, stack){ return stack; };\n\
  var err = new Error;\n\
  Error.captureStackTrace(err, arguments.callee);\n\
  var stack = err.stack;\n\
  Error.prepareStackTrace = orig;\n\
  return stack;\n\
}//@ sourceURL=component-stack/index.js"
));
require.register("component-assert/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var stack = require('stack');\n\
\n\
/**\n\
 * Load contents of `script`.\n\
 *\n\
 * @param {String} script\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function getScript(script) {\n\
  var xhr = new XMLHttpRequest;\n\
  xhr.open('GET', script, false);\n\
  xhr.send(null);\n\
  return xhr.responseText;\n\
}\n\
\n\
/**\n\
 * Assert `expr` with optional failure `msg`.\n\
 *\n\
 * @param {Mixed} expr\n\
 * @param {String} [msg]\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(expr, msg){\n\
  if (expr) return;\n\
  if (!msg) {\n\
    if (Error.captureStackTrace) {\n\
      var callsite = stack()[1];\n\
      var fn = callsite.getFunctionName();\n\
      var file = callsite.getFileName();\n\
      var line = callsite.getLineNumber() - 1;\n\
      var col = callsite.getColumnNumber() - 1;\n\
      var src = getScript(file);\n\
      line = src.split('\\n\
')[line].slice(col);\n\
      expr = line.match(/assert\\((.*)\\)/)[1].trim();\n\
      msg = expr;\n\
    } else {\n\
      msg = 'assertion failed';\n\
    }\n\
  }\n\
\n\
  throw new Error(msg);\n\
};\n\
//@ sourceURL=component-assert/index.js"
));
require.register("visionmedia-mocha/mocha.js", Function("exports, require, module",
";(function(){\n\
\n\
// CommonJS require()\n\
\n\
function require(p){\n\
    var path = require.resolve(p)\n\
      , mod = require.modules[path];\n\
    if (!mod) throw new Error('failed to require \"' + p + '\"');\n\
    if (!mod.exports) {\n\
      mod.exports = {};\n\
      mod.call(mod.exports, mod, mod.exports, require.relative(path));\n\
    }\n\
    return mod.exports;\n\
  }\n\
\n\
require.modules = {};\n\
\n\
require.resolve = function (path){\n\
    var orig = path\n\
      , reg = path + '.js'\n\
      , index = path + '/index.js';\n\
    return require.modules[reg] && reg\n\
      || require.modules[index] && index\n\
      || orig;\n\
  };\n\
\n\
require.register = function (path, fn){\n\
    require.modules[path] = fn;\n\
  };\n\
\n\
require.relative = function (parent) {\n\
    return function(p){\n\
      if ('.' != p.charAt(0)) return require(p);\n\
\n\
      var path = parent.split('/')\n\
        , segs = p.split('/');\n\
      path.pop();\n\
\n\
      for (var i = 0; i < segs.length; i++) {\n\
        var seg = segs[i];\n\
        if ('..' == seg) path.pop();\n\
        else if ('.' != seg) path.push(seg);\n\
      }\n\
\n\
      return require(path.join('/'));\n\
    };\n\
  };\n\
\n\
\n\
require.register(\"browser/debug.js\", function(module, exports, require){\n\
\n\
module.exports = function(type){\n\
  return function(){\n\
  }\n\
};\n\
\n\
}); // module: browser/debug.js\n\
\n\
require.register(\"browser/diff.js\", function(module, exports, require){\n\
/* See LICENSE file for terms of use */\n\
\n\
/*\n\
 * Text diff implementation.\n\
 *\n\
 * This library supports the following APIS:\n\
 * JsDiff.diffChars: Character by character diff\n\
 * JsDiff.diffWords: Word (as defined by \\b regex) diff which ignores whitespace\n\
 * JsDiff.diffLines: Line based diff\n\
 *\n\
 * JsDiff.diffCss: Diff targeted at CSS content\n\
 *\n\
 * These methods are based on the implementation proposed in\n\
 * \"An O(ND) Difference Algorithm and its Variations\" (Myers, 1986).\n\
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927\n\
 */\n\
var JsDiff = (function() {\n\
  /*jshint maxparams: 5*/\n\
  function clonePath(path) {\n\
    return { newPos: path.newPos, components: path.components.slice(0) };\n\
  }\n\
  function removeEmpty(array) {\n\
    var ret = [];\n\
    for (var i = 0; i < array.length; i++) {\n\
      if (array[i]) {\n\
        ret.push(array[i]);\n\
      }\n\
    }\n\
    return ret;\n\
  }\n\
  function escapeHTML(s) {\n\
    var n = s;\n\
    n = n.replace(/&/g, '&amp;');\n\
    n = n.replace(/</g, '&lt;');\n\
    n = n.replace(/>/g, '&gt;');\n\
    n = n.replace(/\"/g, '&quot;');\n\
\n\
    return n;\n\
  }\n\
\n\
  var Diff = function(ignoreWhitespace) {\n\
    this.ignoreWhitespace = ignoreWhitespace;\n\
  };\n\
  Diff.prototype = {\n\
      diff: function(oldString, newString) {\n\
        // Handle the identity case (this is due to unrolling editLength == 0\n\
        if (newString === oldString) {\n\
          return [{ value: newString }];\n\
        }\n\
        if (!newString) {\n\
          return [{ value: oldString, removed: true }];\n\
        }\n\
        if (!oldString) {\n\
          return [{ value: newString, added: true }];\n\
        }\n\
\n\
        newString = this.tokenize(newString);\n\
        oldString = this.tokenize(oldString);\n\
\n\
        var newLen = newString.length, oldLen = oldString.length;\n\
        var maxEditLength = newLen + oldLen;\n\
        var bestPath = [{ newPos: -1, components: [] }];\n\
\n\
        // Seed editLength = 0\n\
        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);\n\
        if (bestPath[0].newPos+1 >= newLen && oldPos+1 >= oldLen) {\n\
          return bestPath[0].components;\n\
        }\n\
\n\
        for (var editLength = 1; editLength <= maxEditLength; editLength++) {\n\
          for (var diagonalPath = -1*editLength; diagonalPath <= editLength; diagonalPath+=2) {\n\
            var basePath;\n\
            var addPath = bestPath[diagonalPath-1],\n\
                removePath = bestPath[diagonalPath+1];\n\
            oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;\n\
            if (addPath) {\n\
              // No one else is going to attempt to use this value, clear it\n\
              bestPath[diagonalPath-1] = undefined;\n\
            }\n\
\n\
            var canAdd = addPath && addPath.newPos+1 < newLen;\n\
            var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;\n\
            if (!canAdd && !canRemove) {\n\
              bestPath[diagonalPath] = undefined;\n\
              continue;\n\
            }\n\
\n\
            // Select the diagonal that we want to branch from. We select the prior\n\
            // path whose position in the new string is the farthest from the origin\n\
            // and does not pass the bounds of the diff graph\n\
            if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {\n\
              basePath = clonePath(removePath);\n\
              this.pushComponent(basePath.components, oldString[oldPos], undefined, true);\n\
            } else {\n\
              basePath = clonePath(addPath);\n\
              basePath.newPos++;\n\
              this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);\n\
            }\n\
\n\
            var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);\n\
\n\
            if (basePath.newPos+1 >= newLen && oldPos+1 >= oldLen) {\n\
              return basePath.components;\n\
            } else {\n\
              bestPath[diagonalPath] = basePath;\n\
            }\n\
          }\n\
        }\n\
      },\n\
\n\
      pushComponent: function(components, value, added, removed) {\n\
        var last = components[components.length-1];\n\
        if (last && last.added === added && last.removed === removed) {\n\
          // We need to clone here as the component clone operation is just\n\
          // as shallow array clone\n\
          components[components.length-1] =\n\
            {value: this.join(last.value, value), added: added, removed: removed };\n\
        } else {\n\
          components.push({value: value, added: added, removed: removed });\n\
        }\n\
      },\n\
      extractCommon: function(basePath, newString, oldString, diagonalPath) {\n\
        var newLen = newString.length,\n\
            oldLen = oldString.length,\n\
            newPos = basePath.newPos,\n\
            oldPos = newPos - diagonalPath;\n\
        while (newPos+1 < newLen && oldPos+1 < oldLen && this.equals(newString[newPos+1], oldString[oldPos+1])) {\n\
          newPos++;\n\
          oldPos++;\n\
\n\
          this.pushComponent(basePath.components, newString[newPos], undefined, undefined);\n\
        }\n\
        basePath.newPos = newPos;\n\
        return oldPos;\n\
      },\n\
\n\
      equals: function(left, right) {\n\
        var reWhitespace = /\\S/;\n\
        if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {\n\
          return true;\n\
        } else {\n\
          return left === right;\n\
        }\n\
      },\n\
      join: function(left, right) {\n\
        return left + right;\n\
      },\n\
      tokenize: function(value) {\n\
        return value;\n\
      }\n\
  };\n\
\n\
  var CharDiff = new Diff();\n\
\n\
  var WordDiff = new Diff(true);\n\
  var WordWithSpaceDiff = new Diff();\n\
  WordDiff.tokenize = WordWithSpaceDiff.tokenize = function(value) {\n\
    return removeEmpty(value.split(/(\\s+|\\b)/));\n\
  };\n\
\n\
  var CssDiff = new Diff(true);\n\
  CssDiff.tokenize = function(value) {\n\
    return removeEmpty(value.split(/([{}:;,]|\\s+)/));\n\
  };\n\
\n\
  var LineDiff = new Diff();\n\
  LineDiff.tokenize = function(value) {\n\
    return value.split(/^/m);\n\
  };\n\
\n\
  return {\n\
    Diff: Diff,\n\
\n\
    diffChars: function(oldStr, newStr) { return CharDiff.diff(oldStr, newStr); },\n\
    diffWords: function(oldStr, newStr) { return WordDiff.diff(oldStr, newStr); },\n\
    diffWordsWithSpace: function(oldStr, newStr) { return WordWithSpaceDiff.diff(oldStr, newStr); },\n\
    diffLines: function(oldStr, newStr) { return LineDiff.diff(oldStr, newStr); },\n\
\n\
    diffCss: function(oldStr, newStr) { return CssDiff.diff(oldStr, newStr); },\n\
\n\
    createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {\n\
      var ret = [];\n\
\n\
      ret.push('Index: ' + fileName);\n\
      ret.push('===================================================================');\n\
      ret.push('--- ' + fileName + (typeof oldHeader === 'undefined' ? '' : '\\t' + oldHeader));\n\
      ret.push('+++ ' + fileName + (typeof newHeader === 'undefined' ? '' : '\\t' + newHeader));\n\
\n\
      var diff = LineDiff.diff(oldStr, newStr);\n\
      if (!diff[diff.length-1].value) {\n\
        diff.pop();   // Remove trailing newline add\n\
      }\n\
      diff.push({value: '', lines: []});   // Append an empty value to make cleanup easier\n\
\n\
      function contextLines(lines) {\n\
        return lines.map(function(entry) { return ' ' + entry; });\n\
      }\n\
      function eofNL(curRange, i, current) {\n\
        var last = diff[diff.length-2],\n\
            isLast = i === diff.length-2,\n\
            isLastOfType = i === diff.length-3 && (current.added !== last.added || current.removed !== last.removed);\n\
\n\
        // Figure out if this is the last line for the given file and missing NL\n\
        if (!/\\n\
$/.test(current.value) && (isLast || isLastOfType)) {\n\
          curRange.push('\\\\ No newline at end of file');\n\
        }\n\
      }\n\
\n\
      var oldRangeStart = 0, newRangeStart = 0, curRange = [],\n\
          oldLine = 1, newLine = 1;\n\
      for (var i = 0; i < diff.length; i++) {\n\
        var current = diff[i],\n\
            lines = current.lines || current.value.replace(/\\n\
$/, '').split('\\n\
');\n\
        current.lines = lines;\n\
\n\
        if (current.added || current.removed) {\n\
          if (!oldRangeStart) {\n\
            var prev = diff[i-1];\n\
            oldRangeStart = oldLine;\n\
            newRangeStart = newLine;\n\
\n\
            if (prev) {\n\
              curRange = contextLines(prev.lines.slice(-4));\n\
              oldRangeStart -= curRange.length;\n\
              newRangeStart -= curRange.length;\n\
            }\n\
          }\n\
          curRange.push.apply(curRange, lines.map(function(entry) { return (current.added?'+':'-') + entry; }));\n\
          eofNL(curRange, i, current);\n\
\n\
          if (current.added) {\n\
            newLine += lines.length;\n\
          } else {\n\
            oldLine += lines.length;\n\
          }\n\
        } else {\n\
          if (oldRangeStart) {\n\
            // Close out any changes that have been output (or join overlapping)\n\
            if (lines.length <= 8 && i < diff.length-2) {\n\
              // Overlapping\n\
              curRange.push.apply(curRange, contextLines(lines));\n\
            } else {\n\
              // end the range and output\n\
              var contextSize = Math.min(lines.length, 4);\n\
              ret.push(\n\
                  '@@ -' + oldRangeStart + ',' + (oldLine-oldRangeStart+contextSize)\n\
                  + ' +' + newRangeStart + ',' + (newLine-newRangeStart+contextSize)\n\
                  + ' @@');\n\
              ret.push.apply(ret, curRange);\n\
              ret.push.apply(ret, contextLines(lines.slice(0, contextSize)));\n\
              if (lines.length <= 4) {\n\
                eofNL(ret, i, current);\n\
              }\n\
\n\
              oldRangeStart = 0;  newRangeStart = 0; curRange = [];\n\
            }\n\
          }\n\
          oldLine += lines.length;\n\
          newLine += lines.length;\n\
        }\n\
      }\n\
\n\
      return ret.join('\\n\
') + '\\n\
';\n\
    },\n\
\n\
    applyPatch: function(oldStr, uniDiff) {\n\
      var diffstr = uniDiff.split('\\n\
');\n\
      var diff = [];\n\
      var remEOFNL = false,\n\
          addEOFNL = false;\n\
\n\
      for (var i = (diffstr[0][0]==='I'?4:0); i < diffstr.length; i++) {\n\
        if(diffstr[i][0] === '@') {\n\
          var meh = diffstr[i].split(/@@ -(\\d+),(\\d+) \\+(\\d+),(\\d+) @@/);\n\
          diff.unshift({\n\
            start:meh[3],\n\
            oldlength:meh[2],\n\
            oldlines:[],\n\
            newlength:meh[4],\n\
            newlines:[]\n\
          });\n\
        } else if(diffstr[i][0] === '+') {\n\
          diff[0].newlines.push(diffstr[i].substr(1));\n\
        } else if(diffstr[i][0] === '-') {\n\
          diff[0].oldlines.push(diffstr[i].substr(1));\n\
        } else if(diffstr[i][0] === ' ') {\n\
          diff[0].newlines.push(diffstr[i].substr(1));\n\
          diff[0].oldlines.push(diffstr[i].substr(1));\n\
        } else if(diffstr[i][0] === '\\\\') {\n\
          if (diffstr[i-1][0] === '+') {\n\
            remEOFNL = true;\n\
          } else if(diffstr[i-1][0] === '-') {\n\
            addEOFNL = true;\n\
          }\n\
        }\n\
      }\n\
\n\
      var str = oldStr.split('\\n\
');\n\
      for (var i = diff.length - 1; i >= 0; i--) {\n\
        var d = diff[i];\n\
        for (var j = 0; j < d.oldlength; j++) {\n\
          if(str[d.start-1+j] !== d.oldlines[j]) {\n\
            return false;\n\
          }\n\
        }\n\
        Array.prototype.splice.apply(str,[d.start-1,+d.oldlength].concat(d.newlines));\n\
      }\n\
\n\
      if (remEOFNL) {\n\
        while (!str[str.length-1]) {\n\
          str.pop();\n\
        }\n\
      } else if (addEOFNL) {\n\
        str.push('');\n\
      }\n\
      return str.join('\\n\
');\n\
    },\n\
\n\
    convertChangesToXML: function(changes){\n\
      var ret = [];\n\
      for ( var i = 0; i < changes.length; i++) {\n\
        var change = changes[i];\n\
        if (change.added) {\n\
          ret.push('<ins>');\n\
        } else if (change.removed) {\n\
          ret.push('<del>');\n\
        }\n\
\n\
        ret.push(escapeHTML(change.value));\n\
\n\
        if (change.added) {\n\
          ret.push('</ins>');\n\
        } else if (change.removed) {\n\
          ret.push('</del>');\n\
        }\n\
      }\n\
      return ret.join('');\n\
    },\n\
\n\
    // See: http://code.google.com/p/google-diff-match-patch/wiki/API\n\
    convertChangesToDMP: function(changes){\n\
      var ret = [], change;\n\
      for ( var i = 0; i < changes.length; i++) {\n\
        change = changes[i];\n\
        ret.push([(change.added ? 1 : change.removed ? -1 : 0), change.value]);\n\
      }\n\
      return ret;\n\
    }\n\
  };\n\
})();\n\
\n\
if (typeof module !== 'undefined') {\n\
    module.exports = JsDiff;\n\
}\n\
\n\
}); // module: browser/diff.js\n\
\n\
require.register(\"browser/events.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module exports.\n\
 */\n\
\n\
exports.EventEmitter = EventEmitter;\n\
\n\
/**\n\
 * Check if `obj` is an array.\n\
 */\n\
\n\
function isArray(obj) {\n\
  return '[object Array]' == {}.toString.call(obj);\n\
}\n\
\n\
/**\n\
 * Event emitter constructor.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function EventEmitter(){};\n\
\n\
/**\n\
 * Adds a listener.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
EventEmitter.prototype.on = function (name, fn) {\n\
  if (!this.$events) {\n\
    this.$events = {};\n\
  }\n\
\n\
  if (!this.$events[name]) {\n\
    this.$events[name] = fn;\n\
  } else if (isArray(this.$events[name])) {\n\
    this.$events[name].push(fn);\n\
  } else {\n\
    this.$events[name] = [this.$events[name], fn];\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
EventEmitter.prototype.addListener = EventEmitter.prototype.on;\n\
\n\
/**\n\
 * Adds a volatile listener.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
EventEmitter.prototype.once = function (name, fn) {\n\
  var self = this;\n\
\n\
  function on () {\n\
    self.removeListener(name, on);\n\
    fn.apply(this, arguments);\n\
  };\n\
\n\
  on.listener = fn;\n\
  this.on(name, on);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Removes a listener.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
EventEmitter.prototype.removeListener = function (name, fn) {\n\
  if (this.$events && this.$events[name]) {\n\
    var list = this.$events[name];\n\
\n\
    if (isArray(list)) {\n\
      var pos = -1;\n\
\n\
      for (var i = 0, l = list.length; i < l; i++) {\n\
        if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {\n\
          pos = i;\n\
          break;\n\
        }\n\
      }\n\
\n\
      if (pos < 0) {\n\
        return this;\n\
      }\n\
\n\
      list.splice(pos, 1);\n\
\n\
      if (!list.length) {\n\
        delete this.$events[name];\n\
      }\n\
    } else if (list === fn || (list.listener && list.listener === fn)) {\n\
      delete this.$events[name];\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Removes all listeners for an event.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
EventEmitter.prototype.removeAllListeners = function (name) {\n\
  if (name === undefined) {\n\
    this.$events = {};\n\
    return this;\n\
  }\n\
\n\
  if (this.$events && this.$events[name]) {\n\
    this.$events[name] = null;\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Gets all listeners for a certain event.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
EventEmitter.prototype.listeners = function (name) {\n\
  if (!this.$events) {\n\
    this.$events = {};\n\
  }\n\
\n\
  if (!this.$events[name]) {\n\
    this.$events[name] = [];\n\
  }\n\
\n\
  if (!isArray(this.$events[name])) {\n\
    this.$events[name] = [this.$events[name]];\n\
  }\n\
\n\
  return this.$events[name];\n\
};\n\
\n\
/**\n\
 * Emits an event.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
EventEmitter.prototype.emit = function (name) {\n\
  if (!this.$events) {\n\
    return false;\n\
  }\n\
\n\
  var handler = this.$events[name];\n\
\n\
  if (!handler) {\n\
    return false;\n\
  }\n\
\n\
  var args = [].slice.call(arguments, 1);\n\
\n\
  if ('function' == typeof handler) {\n\
    handler.apply(this, args);\n\
  } else if (isArray(handler)) {\n\
    var listeners = handler.slice();\n\
\n\
    for (var i = 0, l = listeners.length; i < l; i++) {\n\
      listeners[i].apply(this, args);\n\
    }\n\
  } else {\n\
    return false;\n\
  }\n\
\n\
  return true;\n\
};\n\
}); // module: browser/events.js\n\
\n\
require.register(\"browser/fs.js\", function(module, exports, require){\n\
\n\
}); // module: browser/fs.js\n\
\n\
require.register(\"browser/path.js\", function(module, exports, require){\n\
\n\
}); // module: browser/path.js\n\
\n\
require.register(\"browser/progress.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Expose `Progress`.\n\
 */\n\
\n\
module.exports = Progress;\n\
\n\
/**\n\
 * Initialize a new `Progress` indicator.\n\
 */\n\
\n\
function Progress() {\n\
  this.percent = 0;\n\
  this.size(0);\n\
  this.fontSize(11);\n\
  this.font('helvetica, arial, sans-serif');\n\
}\n\
\n\
/**\n\
 * Set progress size to `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @return {Progress} for chaining\n\
 * @api public\n\
 */\n\
\n\
Progress.prototype.size = function(n){\n\
  this._size = n;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set text to `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Progress} for chaining\n\
 * @api public\n\
 */\n\
\n\
Progress.prototype.text = function(str){\n\
  this._text = str;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set font size to `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @return {Progress} for chaining\n\
 * @api public\n\
 */\n\
\n\
Progress.prototype.fontSize = function(n){\n\
  this._fontSize = n;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set font `family`.\n\
 *\n\
 * @param {String} family\n\
 * @return {Progress} for chaining\n\
 */\n\
\n\
Progress.prototype.font = function(family){\n\
  this._font = family;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Update percentage to `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @return {Progress} for chaining\n\
 */\n\
\n\
Progress.prototype.update = function(n){\n\
  this.percent = n;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Draw on `ctx`.\n\
 *\n\
 * @param {CanvasRenderingContext2d} ctx\n\
 * @return {Progress} for chaining\n\
 */\n\
\n\
Progress.prototype.draw = function(ctx){\n\
  var percent = Math.min(this.percent, 100)\n\
    , size = this._size\n\
    , half = size / 2\n\
    , x = half\n\
    , y = half\n\
    , rad = half - 1\n\
    , fontSize = this._fontSize;\n\
\n\
  ctx.font = fontSize + 'px ' + this._font;\n\
\n\
  var angle = Math.PI * 2 * (percent / 100);\n\
  ctx.clearRect(0, 0, size, size);\n\
\n\
  // outer circle\n\
  ctx.strokeStyle = '#9f9f9f';\n\
  ctx.beginPath();\n\
  ctx.arc(x, y, rad, 0, angle, false);\n\
  ctx.stroke();\n\
\n\
  // inner circle\n\
  ctx.strokeStyle = '#eee';\n\
  ctx.beginPath();\n\
  ctx.arc(x, y, rad - 1, 0, angle, true);\n\
  ctx.stroke();\n\
\n\
  // text\n\
  var text = this._text || (percent | 0) + '%'\n\
    , w = ctx.measureText(text).width;\n\
\n\
  ctx.fillText(\n\
      text\n\
    , x - w / 2 + 1\n\
    , y + fontSize / 2 - 1);\n\
\n\
  return this;\n\
};\n\
\n\
}); // module: browser/progress.js\n\
\n\
require.register(\"browser/tty.js\", function(module, exports, require){\n\
\n\
exports.isatty = function(){\n\
  return true;\n\
};\n\
\n\
exports.getWindowSize = function(){\n\
  if ('innerHeight' in global) {\n\
    return [global.innerHeight, global.innerWidth];\n\
  } else {\n\
    // In a Web Worker, the DOM Window is not available.\n\
    return [640, 480];\n\
  }\n\
};\n\
\n\
}); // module: browser/tty.js\n\
\n\
require.register(\"context.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Expose `Context`.\n\
 */\n\
\n\
module.exports = Context;\n\
\n\
/**\n\
 * Initialize a new `Context`.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
function Context(){}\n\
\n\
/**\n\
 * Set or get the context `Runnable` to `runnable`.\n\
 *\n\
 * @param {Runnable} runnable\n\
 * @return {Context}\n\
 * @api private\n\
 */\n\
\n\
Context.prototype.runnable = function(runnable){\n\
  if (0 == arguments.length) return this._runnable;\n\
  this.test = this._runnable = runnable;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set test timeout `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {Context} self\n\
 * @api private\n\
 */\n\
\n\
Context.prototype.timeout = function(ms){\n\
  this.runnable().timeout(ms);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set test slowness threshold `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {Context} self\n\
 * @api private\n\
 */\n\
\n\
Context.prototype.slow = function(ms){\n\
  this.runnable().slow(ms);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Inspect the context void of `._runnable`.\n\
 *\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
Context.prototype.inspect = function(){\n\
  return JSON.stringify(this, function(key, val){\n\
    if ('_runnable' == key) return;\n\
    if ('test' == key) return;\n\
    return val;\n\
  }, 2);\n\
};\n\
\n\
}); // module: context.js\n\
\n\
require.register(\"hook.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Runnable = require('./runnable');\n\
\n\
/**\n\
 * Expose `Hook`.\n\
 */\n\
\n\
module.exports = Hook;\n\
\n\
/**\n\
 * Initialize a new `Hook` with the given `title` and callback `fn`.\n\
 *\n\
 * @param {String} title\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function Hook(title, fn) {\n\
  Runnable.call(this, title, fn);\n\
  this.type = 'hook';\n\
}\n\
\n\
/**\n\
 * Inherit from `Runnable.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Runnable.prototype;\n\
Hook.prototype = new F;\n\
Hook.prototype.constructor = Hook;\n\
\n\
\n\
/**\n\
 * Get or set the test `err`.\n\
 *\n\
 * @param {Error} err\n\
 * @return {Error}\n\
 * @api public\n\
 */\n\
\n\
Hook.prototype.error = function(err){\n\
  if (0 == arguments.length) {\n\
    var err = this._error;\n\
    this._error = null;\n\
    return err;\n\
  }\n\
\n\
  this._error = err;\n\
};\n\
\n\
}); // module: hook.js\n\
\n\
require.register(\"interfaces/bdd.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Suite = require('../suite')\n\
  , Test = require('../test')\n\
  , utils = require('../utils');\n\
\n\
/**\n\
 * BDD-style interface:\n\
 *\n\
 *      describe('Array', function(){\n\
 *        describe('#indexOf()', function(){\n\
 *          it('should return -1 when not present', function(){\n\
 *\n\
 *          });\n\
 *\n\
 *          it('should return the index when present', function(){\n\
 *\n\
 *          });\n\
 *        });\n\
 *      });\n\
 *\n\
 */\n\
\n\
module.exports = function(suite){\n\
  var suites = [suite];\n\
\n\
  suite.on('pre-require', function(context, file, mocha){\n\
\n\
    /**\n\
     * Execute before running tests.\n\
     */\n\
\n\
    context.before = function(fn){\n\
      suites[0].beforeAll(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute after running tests.\n\
     */\n\
\n\
    context.after = function(fn){\n\
      suites[0].afterAll(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute before each test case.\n\
     */\n\
\n\
    context.beforeEach = function(fn){\n\
      suites[0].beforeEach(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute after each test case.\n\
     */\n\
\n\
    context.afterEach = function(fn){\n\
      suites[0].afterEach(fn);\n\
    };\n\
\n\
    /**\n\
     * Describe a \"suite\" with the given `title`\n\
     * and callback `fn` containing nested suites\n\
     * and/or tests.\n\
     */\n\
\n\
    context.describe = context.context = function(title, fn){\n\
      var suite = Suite.create(suites[0], title);\n\
      suites.unshift(suite);\n\
      fn.call(suite);\n\
      suites.shift();\n\
      return suite;\n\
    };\n\
\n\
    /**\n\
     * Pending describe.\n\
     */\n\
\n\
    context.xdescribe =\n\
    context.xcontext =\n\
    context.describe.skip = function(title, fn){\n\
      var suite = Suite.create(suites[0], title);\n\
      suite.pending = true;\n\
      suites.unshift(suite);\n\
      fn.call(suite);\n\
      suites.shift();\n\
    };\n\
\n\
    /**\n\
     * Exclusive suite.\n\
     */\n\
\n\
    context.describe.only = function(title, fn){\n\
      var suite = context.describe(title, fn);\n\
      mocha.grep(suite.fullTitle());\n\
      return suite;\n\
    };\n\
\n\
    /**\n\
     * Describe a specification or test-case\n\
     * with the given `title` and callback `fn`\n\
     * acting as a thunk.\n\
     */\n\
\n\
    context.it = context.specify = function(title, fn){\n\
      var suite = suites[0];\n\
      if (suite.pending) var fn = null;\n\
      var test = new Test(title, fn);\n\
      suite.addTest(test);\n\
      return test;\n\
    };\n\
\n\
    /**\n\
     * Exclusive test-case.\n\
     */\n\
\n\
    context.it.only = function(title, fn){\n\
      var test = context.it(title, fn);\n\
      var reString = '^' + utils.escapeRegexp(test.fullTitle()) + '$';\n\
      mocha.grep(new RegExp(reString));\n\
      return test;\n\
    };\n\
\n\
    /**\n\
     * Pending test case.\n\
     */\n\
\n\
    context.xit =\n\
    context.xspecify =\n\
    context.it.skip = function(title){\n\
      context.it(title);\n\
    };\n\
  });\n\
};\n\
\n\
}); // module: interfaces/bdd.js\n\
\n\
require.register(\"interfaces/exports.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Suite = require('../suite')\n\
  , Test = require('../test');\n\
\n\
/**\n\
 * TDD-style interface:\n\
 *\n\
 *     exports.Array = {\n\
 *       '#indexOf()': {\n\
 *         'should return -1 when the value is not present': function(){\n\
 *\n\
 *         },\n\
 *\n\
 *         'should return the correct index when the value is present': function(){\n\
 *\n\
 *         }\n\
 *       }\n\
 *     };\n\
 *\n\
 */\n\
\n\
module.exports = function(suite){\n\
  var suites = [suite];\n\
\n\
  suite.on('require', visit);\n\
\n\
  function visit(obj) {\n\
    var suite;\n\
    for (var key in obj) {\n\
      if ('function' == typeof obj[key]) {\n\
        var fn = obj[key];\n\
        switch (key) {\n\
          case 'before':\n\
            suites[0].beforeAll(fn);\n\
            break;\n\
          case 'after':\n\
            suites[0].afterAll(fn);\n\
            break;\n\
          case 'beforeEach':\n\
            suites[0].beforeEach(fn);\n\
            break;\n\
          case 'afterEach':\n\
            suites[0].afterEach(fn);\n\
            break;\n\
          default:\n\
            suites[0].addTest(new Test(key, fn));\n\
        }\n\
      } else {\n\
        var suite = Suite.create(suites[0], key);\n\
        suites.unshift(suite);\n\
        visit(obj[key]);\n\
        suites.shift();\n\
      }\n\
    }\n\
  }\n\
};\n\
\n\
}); // module: interfaces/exports.js\n\
\n\
require.register(\"interfaces/index.js\", function(module, exports, require){\n\
\n\
exports.bdd = require('./bdd');\n\
exports.tdd = require('./tdd');\n\
exports.qunit = require('./qunit');\n\
exports.exports = require('./exports');\n\
\n\
}); // module: interfaces/index.js\n\
\n\
require.register(\"interfaces/qunit.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Suite = require('../suite')\n\
  , Test = require('../test')\n\
  , utils = require('../utils');\n\
\n\
/**\n\
 * QUnit-style interface:\n\
 *\n\
 *     suite('Array');\n\
 *\n\
 *     test('#length', function(){\n\
 *       var arr = [1,2,3];\n\
 *       ok(arr.length == 3);\n\
 *     });\n\
 *\n\
 *     test('#indexOf()', function(){\n\
 *       var arr = [1,2,3];\n\
 *       ok(arr.indexOf(1) == 0);\n\
 *       ok(arr.indexOf(2) == 1);\n\
 *       ok(arr.indexOf(3) == 2);\n\
 *     });\n\
 *\n\
 *     suite('String');\n\
 *\n\
 *     test('#length', function(){\n\
 *       ok('foo'.length == 3);\n\
 *     });\n\
 *\n\
 */\n\
\n\
module.exports = function(suite){\n\
  var suites = [suite];\n\
\n\
  suite.on('pre-require', function(context, file, mocha){\n\
\n\
    /**\n\
     * Execute before running tests.\n\
     */\n\
\n\
    context.before = function(fn){\n\
      suites[0].beforeAll(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute after running tests.\n\
     */\n\
\n\
    context.after = function(fn){\n\
      suites[0].afterAll(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute before each test case.\n\
     */\n\
\n\
    context.beforeEach = function(fn){\n\
      suites[0].beforeEach(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute after each test case.\n\
     */\n\
\n\
    context.afterEach = function(fn){\n\
      suites[0].afterEach(fn);\n\
    };\n\
\n\
    /**\n\
     * Describe a \"suite\" with the given `title`.\n\
     */\n\
\n\
    context.suite = function(title){\n\
      if (suites.length > 1) suites.shift();\n\
      var suite = Suite.create(suites[0], title);\n\
      suites.unshift(suite);\n\
      return suite;\n\
    };\n\
\n\
    /**\n\
     * Exclusive test-case.\n\
     */\n\
\n\
    context.suite.only = function(title, fn){\n\
      var suite = context.suite(title, fn);\n\
      mocha.grep(suite.fullTitle());\n\
    };\n\
\n\
    /**\n\
     * Describe a specification or test-case\n\
     * with the given `title` and callback `fn`\n\
     * acting as a thunk.\n\
     */\n\
\n\
    context.test = function(title, fn){\n\
      var test = new Test(title, fn);\n\
      suites[0].addTest(test);\n\
      return test;\n\
    };\n\
\n\
    /**\n\
     * Exclusive test-case.\n\
     */\n\
\n\
    context.test.only = function(title, fn){\n\
      var test = context.test(title, fn);\n\
      var reString = '^' + utils.escapeRegexp(test.fullTitle()) + '$';\n\
      mocha.grep(new RegExp(reString));\n\
    };\n\
\n\
    /**\n\
     * Pending test case.\n\
     */\n\
\n\
    context.test.skip = function(title){\n\
      context.test(title);\n\
    };\n\
  });\n\
};\n\
\n\
}); // module: interfaces/qunit.js\n\
\n\
require.register(\"interfaces/tdd.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Suite = require('../suite')\n\
  , Test = require('../test')\n\
  , utils = require('../utils');;\n\
\n\
/**\n\
 * TDD-style interface:\n\
 *\n\
 *      suite('Array', function(){\n\
 *        suite('#indexOf()', function(){\n\
 *          suiteSetup(function(){\n\
 *\n\
 *          });\n\
 *\n\
 *          test('should return -1 when not present', function(){\n\
 *\n\
 *          });\n\
 *\n\
 *          test('should return the index when present', function(){\n\
 *\n\
 *          });\n\
 *\n\
 *          suiteTeardown(function(){\n\
 *\n\
 *          });\n\
 *        });\n\
 *      });\n\
 *\n\
 */\n\
\n\
module.exports = function(suite){\n\
  var suites = [suite];\n\
\n\
  suite.on('pre-require', function(context, file, mocha){\n\
\n\
    /**\n\
     * Execute before each test case.\n\
     */\n\
\n\
    context.setup = function(fn){\n\
      suites[0].beforeEach(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute after each test case.\n\
     */\n\
\n\
    context.teardown = function(fn){\n\
      suites[0].afterEach(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute before the suite.\n\
     */\n\
\n\
    context.suiteSetup = function(fn){\n\
      suites[0].beforeAll(fn);\n\
    };\n\
\n\
    /**\n\
     * Execute after the suite.\n\
     */\n\
\n\
    context.suiteTeardown = function(fn){\n\
      suites[0].afterAll(fn);\n\
    };\n\
\n\
    /**\n\
     * Describe a \"suite\" with the given `title`\n\
     * and callback `fn` containing nested suites\n\
     * and/or tests.\n\
     */\n\
\n\
    context.suite = function(title, fn){\n\
      var suite = Suite.create(suites[0], title);\n\
      suites.unshift(suite);\n\
      fn.call(suite);\n\
      suites.shift();\n\
      return suite;\n\
    };\n\
\n\
    /**\n\
     * Pending suite.\n\
     */\n\
    context.suite.skip = function(title, fn) {\n\
      var suite = Suite.create(suites[0], title);\n\
      suite.pending = true;\n\
      suites.unshift(suite);\n\
      fn.call(suite);\n\
      suites.shift();\n\
    };\n\
\n\
    /**\n\
     * Exclusive test-case.\n\
     */\n\
\n\
    context.suite.only = function(title, fn){\n\
      var suite = context.suite(title, fn);\n\
      mocha.grep(suite.fullTitle());\n\
    };\n\
\n\
    /**\n\
     * Describe a specification or test-case\n\
     * with the given `title` and callback `fn`\n\
     * acting as a thunk.\n\
     */\n\
\n\
    context.test = function(title, fn){\n\
      var suite = suites[0];\n\
      if (suite.pending) var fn = null;\n\
      var test = new Test(title, fn);\n\
      suite.addTest(test);\n\
      return test;\n\
    };\n\
\n\
    /**\n\
     * Exclusive test-case.\n\
     */\n\
\n\
    context.test.only = function(title, fn){\n\
      var test = context.test(title, fn);\n\
      var reString = '^' + utils.escapeRegexp(test.fullTitle()) + '$';\n\
      mocha.grep(new RegExp(reString));\n\
    };\n\
\n\
    /**\n\
     * Pending test case.\n\
     */\n\
\n\
    context.test.skip = function(title){\n\
      context.test(title);\n\
    };\n\
  });\n\
};\n\
\n\
}); // module: interfaces/tdd.js\n\
\n\
require.register(\"mocha.js\", function(module, exports, require){\n\
/*!\n\
 * mocha\n\
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var path = require('browser/path')\n\
  , utils = require('./utils');\n\
\n\
/**\n\
 * Expose `Mocha`.\n\
 */\n\
\n\
exports = module.exports = Mocha;\n\
\n\
/**\n\
 * Expose internals.\n\
 */\n\
\n\
exports.utils = utils;\n\
exports.interfaces = require('./interfaces');\n\
exports.reporters = require('./reporters');\n\
exports.Runnable = require('./runnable');\n\
exports.Context = require('./context');\n\
exports.Runner = require('./runner');\n\
exports.Suite = require('./suite');\n\
exports.Hook = require('./hook');\n\
exports.Test = require('./test');\n\
\n\
/**\n\
 * Return image `name` path.\n\
 *\n\
 * @param {String} name\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function image(name) {\n\
  return __dirname + '/../images/' + name + '.png';\n\
}\n\
\n\
/**\n\
 * Setup mocha with `options`.\n\
 *\n\
 * Options:\n\
 *\n\
 *   - `ui` name \"bdd\", \"tdd\", \"exports\" etc\n\
 *   - `reporter` reporter instance, defaults to `mocha.reporters.Dot`\n\
 *   - `globals` array of accepted globals\n\
 *   - `timeout` timeout in milliseconds\n\
 *   - `bail` bail on the first test failure\n\
 *   - `slow` milliseconds to wait before considering a test slow\n\
 *   - `ignoreLeaks` ignore global leaks\n\
 *   - `grep` string or regexp to filter tests with\n\
 *\n\
 * @param {Object} options\n\
 * @api public\n\
 */\n\
\n\
function Mocha(options) {\n\
  options = options || {};\n\
  this.files = [];\n\
  this.options = options;\n\
  this.grep(options.grep);\n\
  this.suite = new exports.Suite('', new exports.Context);\n\
  this.ui(options.ui);\n\
  this.bail(options.bail);\n\
  this.reporter(options.reporter);\n\
  if (null != options.timeout) this.timeout(options.timeout);\n\
  this.useColors(options.useColors)\n\
  if (options.slow) this.slow(options.slow);\n\
}\n\
\n\
/**\n\
 * Enable or disable bailing on the first failure.\n\
 *\n\
 * @param {Boolean} [bail]\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.bail = function(bail){\n\
  if (0 == arguments.length) bail = true;\n\
  this.suite.bail(bail);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Add test `file`.\n\
 *\n\
 * @param {String} file\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.addFile = function(file){\n\
  this.files.push(file);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set reporter to `reporter`, defaults to \"dot\".\n\
 *\n\
 * @param {String|Function} reporter name or constructor\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.reporter = function(reporter){\n\
  if ('function' == typeof reporter) {\n\
    this._reporter = reporter;\n\
  } else {\n\
    reporter = reporter || 'dot';\n\
    var _reporter;\n\
    try { _reporter = require('./reporters/' + reporter); } catch (err) {};\n\
    if (!_reporter) try { _reporter = require(reporter); } catch (err) {};\n\
    if (!_reporter && reporter === 'teamcity')\n\
      console.warn('The Teamcity reporter was moved to a package named ' +\n\
        'mocha-teamcity-reporter ' +\n\
        '(https://npmjs.org/package/mocha-teamcity-reporter).');\n\
    if (!_reporter) throw new Error('invalid reporter \"' + reporter + '\"');\n\
    this._reporter = _reporter;\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set test UI `name`, defaults to \"bdd\".\n\
 *\n\
 * @param {String} bdd\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.ui = function(name){\n\
  name = name || 'bdd';\n\
  this._ui = exports.interfaces[name];\n\
  if (!this._ui) try { this._ui = require(name); } catch (err) {};\n\
  if (!this._ui) throw new Error('invalid interface \"' + name + '\"');\n\
  this._ui = this._ui(this.suite);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Load registered files.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Mocha.prototype.loadFiles = function(fn){\n\
  var self = this;\n\
  var suite = this.suite;\n\
  var pending = this.files.length;\n\
  this.files.forEach(function(file){\n\
    file = path.resolve(file);\n\
    suite.emit('pre-require', global, file, self);\n\
    suite.emit('require', require(file), file, self);\n\
    suite.emit('post-require', global, file, self);\n\
    --pending || (fn && fn());\n\
  });\n\
};\n\
\n\
/**\n\
 * Enable growl support.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Mocha.prototype._growl = function(runner, reporter) {\n\
  var notify = require('growl');\n\
\n\
  runner.on('end', function(){\n\
    var stats = reporter.stats;\n\
    if (stats.failures) {\n\
      var msg = stats.failures + ' of ' + runner.total + ' tests failed';\n\
      notify(msg, { name: 'mocha', title: 'Failed', image: image('error') });\n\
    } else {\n\
      notify(stats.passes + ' tests passed in ' + stats.duration + 'ms', {\n\
          name: 'mocha'\n\
        , title: 'Passed'\n\
        , image: image('ok')\n\
      });\n\
    }\n\
  });\n\
};\n\
\n\
/**\n\
 * Add regexp to grep, if `re` is a string it is escaped.\n\
 *\n\
 * @param {RegExp|String} re\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.grep = function(re){\n\
  this.options.grep = 'string' == typeof re\n\
    ? new RegExp(utils.escapeRegexp(re))\n\
    : re;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Invert `.grep()` matches.\n\
 *\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.invert = function(){\n\
  this.options.invert = true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Ignore global leaks.\n\
 *\n\
 * @param {Boolean} ignore\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.ignoreLeaks = function(ignore){\n\
  this.options.ignoreLeaks = !!ignore;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Enable global leak checking.\n\
 *\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.checkLeaks = function(){\n\
  this.options.ignoreLeaks = false;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Enable growl support.\n\
 *\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.growl = function(){\n\
  this.options.growl = true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Ignore `globals` array or string.\n\
 *\n\
 * @param {Array|String} globals\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.globals = function(globals){\n\
  this.options.globals = (this.options.globals || []).concat(globals);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit color output.\n\
 *\n\
 * @param {Boolean} colors\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.useColors = function(colors){\n\
  this.options.useColors = arguments.length && colors != undefined\n\
    ? colors\n\
    : true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set the timeout in milliseconds.\n\
 *\n\
 * @param {Number} timeout\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.timeout = function(timeout){\n\
  this.suite.timeout(timeout);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set slowness threshold in milliseconds.\n\
 *\n\
 * @param {Number} slow\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.slow = function(slow){\n\
  this.suite.slow(slow);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Makes all tests async (accepting a callback)\n\
 *\n\
 * @return {Mocha}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.asyncOnly = function(){\n\
  this.options.asyncOnly = true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Run tests and invoke `fn()` when complete.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Runner}\n\
 * @api public\n\
 */\n\
\n\
Mocha.prototype.run = function(fn){\n\
  if (this.files.length) this.loadFiles();\n\
  var suite = this.suite;\n\
  var options = this.options;\n\
  var runner = new exports.Runner(suite);\n\
  var reporter = new this._reporter(runner);\n\
  runner.ignoreLeaks = false !== options.ignoreLeaks;\n\
  runner.asyncOnly = options.asyncOnly;\n\
  if (options.grep) runner.grep(options.grep, options.invert);\n\
  if (options.globals) runner.globals(options.globals);\n\
  if (options.growl) this._growl(runner, reporter);\n\
  exports.reporters.Base.useColors = options.useColors;\n\
  return runner.run(fn);\n\
};\n\
\n\
}); // module: mocha.js\n\
\n\
require.register(\"ms.js\", function(module, exports, require){\n\
/**\n\
 * Helpers.\n\
 */\n\
\n\
var s = 1000;\n\
var m = s * 60;\n\
var h = m * 60;\n\
var d = h * 24;\n\
var y = d * 365.25;\n\
\n\
/**\n\
 * Parse or format the given `val`.\n\
 *\n\
 * Options:\n\
 *\n\
 *  - `long` verbose formatting [false]\n\
 *\n\
 * @param {String|Number} val\n\
 * @param {Object} options\n\
 * @return {String|Number}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val, options){\n\
  options = options || {};\n\
  if ('string' == typeof val) return parse(val);\n\
  return options.long\n\
    ? long(val)\n\
    : short(val);\n\
};\n\
\n\
/**\n\
 * Parse the given `str` and return milliseconds.\n\
 *\n\
 * @param {String} str\n\
 * @return {Number}\n\
 * @api private\n\
 */\n\
\n\
function parse(str) {\n\
  var match = /^((?:\\d+)?\\.?\\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);\n\
  if (!match) return;\n\
  var n = parseFloat(match[1]);\n\
  var type = (match[2] || 'ms').toLowerCase();\n\
  switch (type) {\n\
    case 'years':\n\
    case 'year':\n\
    case 'y':\n\
      return n * y;\n\
    case 'days':\n\
    case 'day':\n\
    case 'd':\n\
      return n * d;\n\
    case 'hours':\n\
    case 'hour':\n\
    case 'h':\n\
      return n * h;\n\
    case 'minutes':\n\
    case 'minute':\n\
    case 'm':\n\
      return n * m;\n\
    case 'seconds':\n\
    case 'second':\n\
    case 's':\n\
      return n * s;\n\
    case 'ms':\n\
      return n;\n\
  }\n\
}\n\
\n\
/**\n\
 * Short format for `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function short(ms) {\n\
  if (ms >= d) return Math.round(ms / d) + 'd';\n\
  if (ms >= h) return Math.round(ms / h) + 'h';\n\
  if (ms >= m) return Math.round(ms / m) + 'm';\n\
  if (ms >= s) return Math.round(ms / s) + 's';\n\
  return ms + 'ms';\n\
}\n\
\n\
/**\n\
 * Long format for `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function long(ms) {\n\
  return plural(ms, d, 'day')\n\
    || plural(ms, h, 'hour')\n\
    || plural(ms, m, 'minute')\n\
    || plural(ms, s, 'second')\n\
    || ms + ' ms';\n\
}\n\
\n\
/**\n\
 * Pluralization helper.\n\
 */\n\
\n\
function plural(ms, n, name) {\n\
  if (ms < n) return;\n\
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;\n\
  return Math.ceil(ms / n) + ' ' + name + 's';\n\
}\n\
\n\
}); // module: ms.js\n\
\n\
require.register(\"reporters/base.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var tty = require('browser/tty')\n\
  , diff = require('browser/diff')\n\
  , ms = require('../ms');\n\
\n\
/**\n\
 * Save timer references to avoid Sinon interfering (see GH-237).\n\
 */\n\
\n\
var Date = global.Date\n\
  , setTimeout = global.setTimeout\n\
  , setInterval = global.setInterval\n\
  , clearTimeout = global.clearTimeout\n\
  , clearInterval = global.clearInterval;\n\
\n\
/**\n\
 * Check if both stdio streams are associated with a tty.\n\
 */\n\
\n\
var isatty = tty.isatty(1) && tty.isatty(2);\n\
\n\
/**\n\
 * Expose `Base`.\n\
 */\n\
\n\
exports = module.exports = Base;\n\
\n\
/**\n\
 * Enable coloring by default.\n\
 */\n\
\n\
exports.useColors = isatty || (process.env.MOCHA_COLORS !== undefined);\n\
\n\
/**\n\
 * Inline diffs instead of +/-\n\
 */\n\
\n\
exports.inlineDiffs = false;\n\
\n\
/**\n\
 * Default color map.\n\
 */\n\
\n\
exports.colors = {\n\
    'pass': 90\n\
  , 'fail': 31\n\
  , 'bright pass': 92\n\
  , 'bright fail': 91\n\
  , 'bright yellow': 93\n\
  , 'pending': 36\n\
  , 'suite': 0\n\
  , 'error title': 0\n\
  , 'error message': 31\n\
  , 'error stack': 90\n\
  , 'checkmark': 32\n\
  , 'fast': 90\n\
  , 'medium': 33\n\
  , 'slow': 31\n\
  , 'green': 32\n\
  , 'light': 90\n\
  , 'diff gutter': 90\n\
  , 'diff added': 42\n\
  , 'diff removed': 41\n\
};\n\
\n\
/**\n\
 * Default symbol map.\n\
 */\n\
\n\
exports.symbols = {\n\
  ok: '✓',\n\
  err: '✖',\n\
  dot: '․'\n\
};\n\
\n\
// With node.js on Windows: use symbols available in terminal default fonts\n\
if ('win32' == process.platform) {\n\
  exports.symbols.ok = '\\u221A';\n\
  exports.symbols.err = '\\u00D7';\n\
  exports.symbols.dot = '.';\n\
}\n\
\n\
/**\n\
 * Color `str` with the given `type`,\n\
 * allowing colors to be disabled,\n\
 * as well as user-defined color\n\
 * schemes.\n\
 *\n\
 * @param {String} type\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
var color = exports.color = function(type, str) {\n\
  if (!exports.useColors) return str;\n\
  return '\\u001b[' + exports.colors[type] + 'm' + str + '\\u001b[0m';\n\
};\n\
\n\
/**\n\
 * Expose term window size, with some\n\
 * defaults for when stderr is not a tty.\n\
 */\n\
\n\
exports.window = {\n\
  width: isatty\n\
    ? process.stdout.getWindowSize\n\
      ? process.stdout.getWindowSize(1)[0]\n\
      : tty.getWindowSize()[1]\n\
    : 75\n\
};\n\
\n\
/**\n\
 * Expose some basic cursor interactions\n\
 * that are common among reporters.\n\
 */\n\
\n\
exports.cursor = {\n\
  hide: function(){\n\
    isatty && process.stdout.write('\\u001b[?25l');\n\
  },\n\
\n\
  show: function(){\n\
    isatty && process.stdout.write('\\u001b[?25h');\n\
  },\n\
\n\
  deleteLine: function(){\n\
    isatty && process.stdout.write('\\u001b[2K');\n\
  },\n\
\n\
  beginningOfLine: function(){\n\
    isatty && process.stdout.write('\\u001b[0G');\n\
  },\n\
\n\
  CR: function(){\n\
    if (isatty) {\n\
      exports.cursor.deleteLine();\n\
      exports.cursor.beginningOfLine();\n\
    } else {\n\
      process.stdout.write('\\n\
');\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Outut the given `failures` as a list.\n\
 *\n\
 * @param {Array} failures\n\
 * @api public\n\
 */\n\
\n\
exports.list = function(failures){\n\
  console.error();\n\
  failures.forEach(function(test, i){\n\
    // format\n\
    var fmt = color('error title', '  %s) %s:\\n\
')\n\
      + color('error message', '     %s')\n\
      + color('error stack', '\\n\
%s\\n\
');\n\
\n\
    // msg\n\
    var err = test.err\n\
      , message = err.message || ''\n\
      , stack = err.stack || message\n\
      , index = stack.indexOf(message) + message.length\n\
      , msg = stack.slice(0, index)\n\
      , actual = err.actual\n\
      , expected = err.expected\n\
      , escape = true;\n\
\n\
    // uncaught\n\
    if (err.uncaught) {\n\
      msg = 'Uncaught ' + msg;\n\
    }\n\
\n\
    // explicitly show diff\n\
    if (err.showDiff && sameType(actual, expected)) {\n\
      escape = false;\n\
      err.actual = actual = stringify(actual);\n\
      err.expected = expected = stringify(expected);\n\
    }\n\
\n\
    // actual / expected diff\n\
    if ('string' == typeof actual && 'string' == typeof expected) {\n\
      fmt = color('error title', '  %s) %s:\\n\
%s') + color('error stack', '\\n\
%s\\n\
');\n\
      var match = message.match(/^([^:]+): expected/);\n\
      msg = match ? '\\n\
      ' + color('error message', match[1]) : '';\n\
\n\
      if (exports.inlineDiffs) {\n\
        msg += inlineDiff(err, escape);\n\
      } else {\n\
        msg += unifiedDiff(err, escape);\n\
      }\n\
    }\n\
\n\
    // indent stack trace without msg\n\
    stack = stack.slice(index ? index + 1 : index)\n\
      .replace(/^/gm, '  ');\n\
\n\
    console.error(fmt, (i + 1), test.fullTitle(), msg, stack);\n\
  });\n\
};\n\
\n\
/**\n\
 * Initialize a new `Base` reporter.\n\
 *\n\
 * All other reporters generally\n\
 * inherit from this reporter, providing\n\
 * stats such as test duration, number\n\
 * of tests passed / failed etc.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function Base(runner) {\n\
  var self = this\n\
    , stats = this.stats = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 }\n\
    , failures = this.failures = [];\n\
\n\
  if (!runner) return;\n\
  this.runner = runner;\n\
\n\
  runner.stats = stats;\n\
\n\
  runner.on('start', function(){\n\
    stats.start = new Date;\n\
  });\n\
\n\
  runner.on('suite', function(suite){\n\
    stats.suites = stats.suites || 0;\n\
    suite.root || stats.suites++;\n\
  });\n\
\n\
  runner.on('test end', function(test){\n\
    stats.tests = stats.tests || 0;\n\
    stats.tests++;\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    stats.passes = stats.passes || 0;\n\
\n\
    var medium = test.slow() / 2;\n\
    test.speed = test.duration > test.slow()\n\
      ? 'slow'\n\
      : test.duration > medium\n\
        ? 'medium'\n\
        : 'fast';\n\
\n\
    stats.passes++;\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    stats.failures = stats.failures || 0;\n\
    stats.failures++;\n\
    test.err = err;\n\
    failures.push(test);\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    stats.end = new Date;\n\
    stats.duration = new Date - stats.start;\n\
  });\n\
\n\
  runner.on('pending', function(){\n\
    stats.pending++;\n\
  });\n\
}\n\
\n\
/**\n\
 * Output common epilogue used by many of\n\
 * the bundled reporters.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Base.prototype.epilogue = function(){\n\
  var stats = this.stats;\n\
  var tests;\n\
  var fmt;\n\
\n\
  console.log();\n\
\n\
  // passes\n\
  fmt = color('bright pass', ' ')\n\
    + color('green', ' %d passing')\n\
    + color('light', ' (%s)');\n\
\n\
  console.log(fmt,\n\
    stats.passes || 0,\n\
    ms(stats.duration));\n\
\n\
  // pending\n\
  if (stats.pending) {\n\
    fmt = color('pending', ' ')\n\
      + color('pending', ' %d pending');\n\
\n\
    console.log(fmt, stats.pending);\n\
  }\n\
\n\
  // failures\n\
  if (stats.failures) {\n\
    fmt = color('fail', '  %d failing');\n\
\n\
    console.error(fmt,\n\
      stats.failures);\n\
\n\
    Base.list(this.failures);\n\
    console.error();\n\
  }\n\
\n\
  console.log();\n\
};\n\
\n\
/**\n\
 * Pad the given `str` to `len`.\n\
 *\n\
 * @param {String} str\n\
 * @param {String} len\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function pad(str, len) {\n\
  str = String(str);\n\
  return Array(len - str.length + 1).join(' ') + str;\n\
}\n\
\n\
\n\
/**\n\
 * Returns an inline diff between 2 strings with coloured ANSI output\n\
 *\n\
 * @param {Error} Error with actual/expected\n\
 * @return {String} Diff\n\
 * @api private\n\
 */\n\
\n\
function inlineDiff(err, escape) {\n\
  var msg = errorDiff(err, 'WordsWithSpace', escape);\n\
\n\
  // linenos\n\
  var lines = msg.split('\\n\
');\n\
  if (lines.length > 4) {\n\
    var width = String(lines.length).length;\n\
    msg = lines.map(function(str, i){\n\
      return pad(++i, width) + ' |' + ' ' + str;\n\
    }).join('\\n\
');\n\
  }\n\
\n\
  // legend\n\
  msg = '\\n\
'\n\
    + color('diff removed', 'actual')\n\
    + ' '\n\
    + color('diff added', 'expected')\n\
    + '\\n\
\\n\
'\n\
    + msg\n\
    + '\\n\
';\n\
\n\
  // indent\n\
  msg = msg.replace(/^/gm, '      ');\n\
  return msg;\n\
}\n\
\n\
/**\n\
 * Returns a unified diff between 2 strings\n\
 *\n\
 * @param {Error} Error with actual/expected\n\
 * @return {String} Diff\n\
 * @api private\n\
 */\n\
\n\
function unifiedDiff(err, escape) {\n\
  var indent = '      ';\n\
  function cleanUp(line) {\n\
    if (escape) {\n\
      line = escapeInvisibles(line);\n\
    }\n\
    if (line[0] === '+') return indent + colorLines('diff added', line);\n\
    if (line[0] === '-') return indent + colorLines('diff removed', line);\n\
    if (line.match(/\\@\\@/)) return null;\n\
    if (line.match(/\\\\ No newline/)) return null;\n\
    else return indent + line;\n\
  }\n\
  function notBlank(line) {\n\
    return line != null;\n\
  }\n\
  msg = diff.createPatch('string', err.actual, err.expected);\n\
  var lines = msg.split('\\n\
').splice(4);\n\
  return '\\n\
      '\n\
         + colorLines('diff added',   '+ expected') + ' '\n\
         + colorLines('diff removed', '- actual')\n\
         + '\\n\
\\n\
'\n\
         + lines.map(cleanUp).filter(notBlank).join('\\n\
');\n\
}\n\
\n\
/**\n\
 * Return a character diff for `err`.\n\
 *\n\
 * @param {Error} err\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function errorDiff(err, type, escape) {\n\
  var actual   = escape ? escapeInvisibles(err.actual)   : err.actual;\n\
  var expected = escape ? escapeInvisibles(err.expected) : err.expected;\n\
  return diff['diff' + type](actual, expected).map(function(str){\n\
    if (str.added) return colorLines('diff added', str.value);\n\
    if (str.removed) return colorLines('diff removed', str.value);\n\
    return str.value;\n\
  }).join('');\n\
}\n\
\n\
/**\n\
 * Returns a string with all invisible characters in plain text\n\
 *\n\
 * @param {String} line\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
function escapeInvisibles(line) {\n\
    return line.replace(/\\t/g, '<tab>')\n\
               .replace(/\\r/g, '<CR>')\n\
               .replace(/\\n\
/g, '<LF>\\n\
');\n\
}\n\
\n\
/**\n\
 * Color lines for `str`, using the color `name`.\n\
 *\n\
 * @param {String} name\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function colorLines(name, str) {\n\
  return str.split('\\n\
').map(function(str){\n\
    return color(name, str);\n\
  }).join('\\n\
');\n\
}\n\
\n\
/**\n\
 * Stringify `obj`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function stringify(obj) {\n\
  if (obj instanceof RegExp) return obj.toString();\n\
  return JSON.stringify(obj, null, 2);\n\
}\n\
\n\
/**\n\
 * Check that a / b have the same type.\n\
 *\n\
 * @param {Object} a\n\
 * @param {Object} b\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function sameType(a, b) {\n\
  a = Object.prototype.toString.call(a);\n\
  b = Object.prototype.toString.call(b);\n\
  return a == b;\n\
}\n\
\n\
\n\
\n\
}); // module: reporters/base.js\n\
\n\
require.register(\"reporters/doc.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , utils = require('../utils');\n\
\n\
/**\n\
 * Expose `Doc`.\n\
 */\n\
\n\
exports = module.exports = Doc;\n\
\n\
/**\n\
 * Initialize a new `Doc` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function Doc(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , total = runner.total\n\
    , indents = 2;\n\
\n\
  function indent() {\n\
    return Array(indents).join('  ');\n\
  }\n\
\n\
  runner.on('suite', function(suite){\n\
    if (suite.root) return;\n\
    ++indents;\n\
    console.log('%s<section class=\"suite\">', indent());\n\
    ++indents;\n\
    console.log('%s<h1>%s</h1>', indent(), utils.escape(suite.title));\n\
    console.log('%s<dl>', indent());\n\
  });\n\
\n\
  runner.on('suite end', function(suite){\n\
    if (suite.root) return;\n\
    console.log('%s</dl>', indent());\n\
    --indents;\n\
    console.log('%s</section>', indent());\n\
    --indents;\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    console.log('%s  <dt>%s</dt>', indent(), utils.escape(test.title));\n\
    var code = utils.escape(utils.clean(test.fn.toString()));\n\
    console.log('%s  <dd><pre><code>%s</code></pre></dd>', indent(), code);\n\
  });\n\
}\n\
\n\
}); // module: reporters/doc.js\n\
\n\
require.register(\"reporters/dot.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `Dot`.\n\
 */\n\
\n\
exports = module.exports = Dot;\n\
\n\
/**\n\
 * Initialize a new `Dot` matrix test reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function Dot(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , width = Base.window.width * .75 | 0\n\
    , n = 0;\n\
\n\
  runner.on('start', function(){\n\
    process.stdout.write('\\n\
  ');\n\
  });\n\
\n\
  runner.on('pending', function(test){\n\
    process.stdout.write(color('pending', Base.symbols.dot));\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    if (++n % width == 0) process.stdout.write('\\n\
  ');\n\
    if ('slow' == test.speed) {\n\
      process.stdout.write(color('bright yellow', Base.symbols.dot));\n\
    } else {\n\
      process.stdout.write(color(test.speed, Base.symbols.dot));\n\
    }\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    if (++n % width == 0) process.stdout.write('\\n\
  ');\n\
    process.stdout.write(color('fail', Base.symbols.dot));\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    console.log();\n\
    self.epilogue();\n\
  });\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
Dot.prototype = new F;\n\
Dot.prototype.constructor = Dot;\n\
\n\
}); // module: reporters/dot.js\n\
\n\
require.register(\"reporters/html-cov.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var JSONCov = require('./json-cov')\n\
  , fs = require('browser/fs');\n\
\n\
/**\n\
 * Expose `HTMLCov`.\n\
 */\n\
\n\
exports = module.exports = HTMLCov;\n\
\n\
/**\n\
 * Initialize a new `JsCoverage` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function HTMLCov(runner) {\n\
  var jade = require('jade')\n\
    , file = __dirname + '/templates/coverage.jade'\n\
    , str = fs.readFileSync(file, 'utf8')\n\
    , fn = jade.compile(str, { filename: file })\n\
    , self = this;\n\
\n\
  JSONCov.call(this, runner, false);\n\
\n\
  runner.on('end', function(){\n\
    process.stdout.write(fn({\n\
        cov: self.cov\n\
      , coverageClass: coverageClass\n\
    }));\n\
  });\n\
}\n\
\n\
/**\n\
 * Return coverage class for `n`.\n\
 *\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function coverageClass(n) {\n\
  if (n >= 75) return 'high';\n\
  if (n >= 50) return 'medium';\n\
  if (n >= 25) return 'low';\n\
  return 'terrible';\n\
}\n\
}); // module: reporters/html-cov.js\n\
\n\
require.register(\"reporters/html.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , utils = require('../utils')\n\
  , Progress = require('../browser/progress')\n\
  , escape = utils.escape;\n\
\n\
/**\n\
 * Save timer references to avoid Sinon interfering (see GH-237).\n\
 */\n\
\n\
var Date = global.Date\n\
  , setTimeout = global.setTimeout\n\
  , setInterval = global.setInterval\n\
  , clearTimeout = global.clearTimeout\n\
  , clearInterval = global.clearInterval;\n\
\n\
/**\n\
 * Expose `HTML`.\n\
 */\n\
\n\
exports = module.exports = HTML;\n\
\n\
/**\n\
 * Stats template.\n\
 */\n\
\n\
var statsTemplate = '<ul id=\"mocha-stats\">'\n\
  + '<li class=\"progress\"><canvas width=\"40\" height=\"40\"></canvas></li>'\n\
  + '<li class=\"passes\"><a href=\"#\">passes:</a> <em>0</em></li>'\n\
  + '<li class=\"failures\"><a href=\"#\">failures:</a> <em>0</em></li>'\n\
  + '<li class=\"duration\">duration: <em>0</em>s</li>'\n\
  + '</ul>';\n\
\n\
/**\n\
 * Initialize a new `HTML` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function HTML(runner, root) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , total = runner.total\n\
    , stat = fragment(statsTemplate)\n\
    , items = stat.getElementsByTagName('li')\n\
    , passes = items[1].getElementsByTagName('em')[0]\n\
    , passesLink = items[1].getElementsByTagName('a')[0]\n\
    , failures = items[2].getElementsByTagName('em')[0]\n\
    , failuresLink = items[2].getElementsByTagName('a')[0]\n\
    , duration = items[3].getElementsByTagName('em')[0]\n\
    , canvas = stat.getElementsByTagName('canvas')[0]\n\
    , report = fragment('<ul id=\"mocha-report\"></ul>')\n\
    , stack = [report]\n\
    , progress\n\
    , ctx\n\
\n\
  root = root || document.getElementById('mocha');\n\
\n\
  if (canvas.getContext) {\n\
    var ratio = window.devicePixelRatio || 1;\n\
    canvas.style.width = canvas.width;\n\
    canvas.style.height = canvas.height;\n\
    canvas.width *= ratio;\n\
    canvas.height *= ratio;\n\
    ctx = canvas.getContext('2d');\n\
    ctx.scale(ratio, ratio);\n\
    progress = new Progress;\n\
  }\n\
\n\
  if (!root) return error('#mocha div missing, add it to your document');\n\
\n\
  // pass toggle\n\
  on(passesLink, 'click', function(){\n\
    unhide();\n\
    var name = /pass/.test(report.className) ? '' : ' pass';\n\
    report.className = report.className.replace(/fail|pass/g, '') + name;\n\
    if (report.className.trim()) hideSuitesWithout('test pass');\n\
  });\n\
\n\
  // failure toggle\n\
  on(failuresLink, 'click', function(){\n\
    unhide();\n\
    var name = /fail/.test(report.className) ? '' : ' fail';\n\
    report.className = report.className.replace(/fail|pass/g, '') + name;\n\
    if (report.className.trim()) hideSuitesWithout('test fail');\n\
  });\n\
\n\
  root.appendChild(stat);\n\
  root.appendChild(report);\n\
\n\
  if (progress) progress.size(40);\n\
\n\
  runner.on('suite', function(suite){\n\
    if (suite.root) return;\n\
\n\
    // suite\n\
    var url = self.suiteURL(suite);\n\
    var el = fragment('<li class=\"suite\"><h1><a href=\"%s\">%s</a></h1></li>', url, escape(suite.title));\n\
\n\
    // container\n\
    stack[0].appendChild(el);\n\
    stack.unshift(document.createElement('ul'));\n\
    el.appendChild(stack[0]);\n\
  });\n\
\n\
  runner.on('suite end', function(suite){\n\
    if (suite.root) return;\n\
    stack.shift();\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    if ('hook' == test.type) runner.emit('test end', test);\n\
  });\n\
\n\
  runner.on('test end', function(test){\n\
    // TODO: add to stats\n\
    var percent = stats.tests / this.total * 100 | 0;\n\
    if (progress) progress.update(percent).draw(ctx);\n\
\n\
    // update stats\n\
    var ms = new Date - stats.start;\n\
    text(passes, stats.passes);\n\
    text(failures, stats.failures);\n\
    text(duration, (ms / 1000).toFixed(2));\n\
\n\
    // test\n\
    if ('passed' == test.state) {\n\
      var url = self.testURL(test);\n\
      var el = fragment('<li class=\"test pass %e\"><h2>%e<span class=\"duration\">%ems</span> <a href=\"%s\" class=\"replay\">‣</a></h2></li>', test.speed, test.title, test.duration, url);\n\
    } else if (test.pending) {\n\
      var el = fragment('<li class=\"test pass pending\"><h2>%e</h2></li>', test.title);\n\
    } else {\n\
      var el = fragment('<li class=\"test fail\"><h2>%e <a href=\"?grep=%e\" class=\"replay\">‣</a></h2></li>', test.title, encodeURIComponent(test.fullTitle()));\n\
      var str = test.err.stack || test.err.toString();\n\
\n\
      // FF / Opera do not add the message\n\
      if (!~str.indexOf(test.err.message)) {\n\
        str = test.err.message + '\\n\
' + str;\n\
      }\n\
\n\
      // <=IE7 stringifies to [Object Error]. Since it can be overloaded, we\n\
      // check for the result of the stringifying.\n\
      if ('[object Error]' == str) str = test.err.message;\n\
\n\
      // Safari doesn't give you a stack. Let's at least provide a source line.\n\
      if (!test.err.stack && test.err.sourceURL && test.err.line !== undefined) {\n\
        str += \"\\n\
(\" + test.err.sourceURL + \":\" + test.err.line + \")\";\n\
      }\n\
\n\
      el.appendChild(fragment('<pre class=\"error\">%e</pre>', str));\n\
    }\n\
\n\
    // toggle code\n\
    // TODO: defer\n\
    if (!test.pending) {\n\
      var h2 = el.getElementsByTagName('h2')[0];\n\
\n\
      on(h2, 'click', function(){\n\
        pre.style.display = 'none' == pre.style.display\n\
          ? 'block'\n\
          : 'none';\n\
      });\n\
\n\
      var pre = fragment('<pre><code>%e</code></pre>', utils.clean(test.fn.toString()));\n\
      el.appendChild(pre);\n\
      pre.style.display = 'none';\n\
    }\n\
\n\
    // Don't call .appendChild if #mocha-report was already .shift()'ed off the stack.\n\
    if (stack[0]) stack[0].appendChild(el);\n\
  });\n\
}\n\
\n\
/**\n\
 * Provide suite URL\n\
 *\n\
 * @param {Object} [suite]\n\
 */\n\
\n\
HTML.prototype.suiteURL = function(suite){\n\
  return '?grep=' + encodeURIComponent(suite.fullTitle());\n\
};\n\
\n\
/**\n\
 * Provide test URL\n\
 *\n\
 * @param {Object} [test]\n\
 */\n\
\n\
HTML.prototype.testURL = function(test){\n\
  return '?grep=' + encodeURIComponent(test.fullTitle());\n\
};\n\
\n\
/**\n\
 * Display error `msg`.\n\
 */\n\
\n\
function error(msg) {\n\
  document.body.appendChild(fragment('<div id=\"mocha-error\">%s</div>', msg));\n\
}\n\
\n\
/**\n\
 * Return a DOM fragment from `html`.\n\
 */\n\
\n\
function fragment(html) {\n\
  var args = arguments\n\
    , div = document.createElement('div')\n\
    , i = 1;\n\
\n\
  div.innerHTML = html.replace(/%([se])/g, function(_, type){\n\
    switch (type) {\n\
      case 's': return String(args[i++]);\n\
      case 'e': return escape(args[i++]);\n\
    }\n\
  });\n\
\n\
  return div.firstChild;\n\
}\n\
\n\
/**\n\
 * Check for suites that do not have elements\n\
 * with `classname`, and hide them.\n\
 */\n\
\n\
function hideSuitesWithout(classname) {\n\
  var suites = document.getElementsByClassName('suite');\n\
  for (var i = 0; i < suites.length; i++) {\n\
    var els = suites[i].getElementsByClassName(classname);\n\
    if (0 == els.length) suites[i].className += ' hidden';\n\
  }\n\
}\n\
\n\
/**\n\
 * Unhide .hidden suites.\n\
 */\n\
\n\
function unhide() {\n\
  var els = document.getElementsByClassName('suite hidden');\n\
  for (var i = 0; i < els.length; ++i) {\n\
    els[i].className = els[i].className.replace('suite hidden', 'suite');\n\
  }\n\
}\n\
\n\
/**\n\
 * Set `el` text to `str`.\n\
 */\n\
\n\
function text(el, str) {\n\
  if (el.textContent) {\n\
    el.textContent = str;\n\
  } else {\n\
    el.innerText = str;\n\
  }\n\
}\n\
\n\
/**\n\
 * Listen on `event` with callback `fn`.\n\
 */\n\
\n\
function on(el, event, fn) {\n\
  if (el.addEventListener) {\n\
    el.addEventListener(event, fn, false);\n\
  } else {\n\
    el.attachEvent('on' + event, fn);\n\
  }\n\
}\n\
\n\
}); // module: reporters/html.js\n\
\n\
require.register(\"reporters/index.js\", function(module, exports, require){\n\
\n\
exports.Base = require('./base');\n\
exports.Dot = require('./dot');\n\
exports.Doc = require('./doc');\n\
exports.TAP = require('./tap');\n\
exports.JSON = require('./json');\n\
exports.HTML = require('./html');\n\
exports.List = require('./list');\n\
exports.Min = require('./min');\n\
exports.Spec = require('./spec');\n\
exports.Nyan = require('./nyan');\n\
exports.XUnit = require('./xunit');\n\
exports.Markdown = require('./markdown');\n\
exports.Progress = require('./progress');\n\
exports.Landing = require('./landing');\n\
exports.JSONCov = require('./json-cov');\n\
exports.HTMLCov = require('./html-cov');\n\
exports.JSONStream = require('./json-stream');\n\
\n\
}); // module: reporters/index.js\n\
\n\
require.register(\"reporters/json-cov.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base');\n\
\n\
/**\n\
 * Expose `JSONCov`.\n\
 */\n\
\n\
exports = module.exports = JSONCov;\n\
\n\
/**\n\
 * Initialize a new `JsCoverage` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @param {Boolean} output\n\
 * @api public\n\
 */\n\
\n\
function JSONCov(runner, output) {\n\
  var self = this\n\
    , output = 1 == arguments.length ? true : output;\n\
\n\
  Base.call(this, runner);\n\
\n\
  var tests = []\n\
    , failures = []\n\
    , passes = [];\n\
\n\
  runner.on('test end', function(test){\n\
    tests.push(test);\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    passes.push(test);\n\
  });\n\
\n\
  runner.on('fail', function(test){\n\
    failures.push(test);\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    var cov = global._$jscoverage || {};\n\
    var result = self.cov = map(cov);\n\
    result.stats = self.stats;\n\
    result.tests = tests.map(clean);\n\
    result.failures = failures.map(clean);\n\
    result.passes = passes.map(clean);\n\
    if (!output) return;\n\
    process.stdout.write(JSON.stringify(result, null, 2 ));\n\
  });\n\
}\n\
\n\
/**\n\
 * Map jscoverage data to a JSON structure\n\
 * suitable for reporting.\n\
 *\n\
 * @param {Object} cov\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function map(cov) {\n\
  var ret = {\n\
      instrumentation: 'node-jscoverage'\n\
    , sloc: 0\n\
    , hits: 0\n\
    , misses: 0\n\
    , coverage: 0\n\
    , files: []\n\
  };\n\
\n\
  for (var filename in cov) {\n\
    var data = coverage(filename, cov[filename]);\n\
    ret.files.push(data);\n\
    ret.hits += data.hits;\n\
    ret.misses += data.misses;\n\
    ret.sloc += data.sloc;\n\
  }\n\
\n\
  ret.files.sort(function(a, b) {\n\
    return a.filename.localeCompare(b.filename);\n\
  });\n\
\n\
  if (ret.sloc > 0) {\n\
    ret.coverage = (ret.hits / ret.sloc) * 100;\n\
  }\n\
\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Map jscoverage data for a single source file\n\
 * to a JSON structure suitable for reporting.\n\
 *\n\
 * @param {String} filename name of the source file\n\
 * @param {Object} data jscoverage coverage data\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function coverage(filename, data) {\n\
  var ret = {\n\
    filename: filename,\n\
    coverage: 0,\n\
    hits: 0,\n\
    misses: 0,\n\
    sloc: 0,\n\
    source: {}\n\
  };\n\
\n\
  data.source.forEach(function(line, num){\n\
    num++;\n\
\n\
    if (data[num] === 0) {\n\
      ret.misses++;\n\
      ret.sloc++;\n\
    } else if (data[num] !== undefined) {\n\
      ret.hits++;\n\
      ret.sloc++;\n\
    }\n\
\n\
    ret.source[num] = {\n\
        source: line\n\
      , coverage: data[num] === undefined\n\
        ? ''\n\
        : data[num]\n\
    };\n\
  });\n\
\n\
  ret.coverage = ret.hits / ret.sloc * 100;\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Return a plain-object representation of `test`\n\
 * free of cyclic properties etc.\n\
 *\n\
 * @param {Object} test\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function clean(test) {\n\
  return {\n\
      title: test.title\n\
    , fullTitle: test.fullTitle()\n\
    , duration: test.duration\n\
  }\n\
}\n\
\n\
}); // module: reporters/json-cov.js\n\
\n\
require.register(\"reporters/json-stream.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `List`.\n\
 */\n\
\n\
exports = module.exports = List;\n\
\n\
/**\n\
 * Initialize a new `List` test reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function List(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , total = runner.total;\n\
\n\
  runner.on('start', function(){\n\
    console.log(JSON.stringify(['start', { total: total }]));\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    console.log(JSON.stringify(['pass', clean(test)]));\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    console.log(JSON.stringify(['fail', clean(test)]));\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    process.stdout.write(JSON.stringify(['end', self.stats]));\n\
  });\n\
}\n\
\n\
/**\n\
 * Return a plain-object representation of `test`\n\
 * free of cyclic properties etc.\n\
 *\n\
 * @param {Object} test\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function clean(test) {\n\
  return {\n\
      title: test.title\n\
    , fullTitle: test.fullTitle()\n\
    , duration: test.duration\n\
  }\n\
}\n\
}); // module: reporters/json-stream.js\n\
\n\
require.register(\"reporters/json.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , cursor = Base.cursor\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `JSON`.\n\
 */\n\
\n\
exports = module.exports = JSONReporter;\n\
\n\
/**\n\
 * Initialize a new `JSON` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function JSONReporter(runner) {\n\
  var self = this;\n\
  Base.call(this, runner);\n\
\n\
  var tests = []\n\
    , failures = []\n\
    , passes = [];\n\
\n\
  runner.on('test end', function(test){\n\
    tests.push(test);\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    passes.push(test);\n\
  });\n\
\n\
  runner.on('fail', function(test){\n\
    failures.push(test);\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    var obj = {\n\
        stats: self.stats\n\
      , tests: tests.map(clean)\n\
      , failures: failures.map(clean)\n\
      , passes: passes.map(clean)\n\
    };\n\
\n\
    process.stdout.write(JSON.stringify(obj, null, 2));\n\
  });\n\
}\n\
\n\
/**\n\
 * Return a plain-object representation of `test`\n\
 * free of cyclic properties etc.\n\
 *\n\
 * @param {Object} test\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function clean(test) {\n\
  return {\n\
      title: test.title\n\
    , fullTitle: test.fullTitle()\n\
    , duration: test.duration\n\
  }\n\
}\n\
}); // module: reporters/json.js\n\
\n\
require.register(\"reporters/landing.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , cursor = Base.cursor\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `Landing`.\n\
 */\n\
\n\
exports = module.exports = Landing;\n\
\n\
/**\n\
 * Airplane color.\n\
 */\n\
\n\
Base.colors.plane = 0;\n\
\n\
/**\n\
 * Airplane crash color.\n\
 */\n\
\n\
Base.colors['plane crash'] = 31;\n\
\n\
/**\n\
 * Runway color.\n\
 */\n\
\n\
Base.colors.runway = 90;\n\
\n\
/**\n\
 * Initialize a new `Landing` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function Landing(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , width = Base.window.width * .75 | 0\n\
    , total = runner.total\n\
    , stream = process.stdout\n\
    , plane = color('plane', '✈')\n\
    , crashed = -1\n\
    , n = 0;\n\
\n\
  function runway() {\n\
    var buf = Array(width).join('-');\n\
    return '  ' + color('runway', buf);\n\
  }\n\
\n\
  runner.on('start', function(){\n\
    stream.write('\\n\
  ');\n\
    cursor.hide();\n\
  });\n\
\n\
  runner.on('test end', function(test){\n\
    // check if the plane crashed\n\
    var col = -1 == crashed\n\
      ? width * ++n / total | 0\n\
      : crashed;\n\
\n\
    // show the crash\n\
    if ('failed' == test.state) {\n\
      plane = color('plane crash', '✈');\n\
      crashed = col;\n\
    }\n\
\n\
    // render landing strip\n\
    stream.write('\\u001b[4F\\n\
\\n\
');\n\
    stream.write(runway());\n\
    stream.write('\\n\
  ');\n\
    stream.write(color('runway', Array(col).join('⋅')));\n\
    stream.write(plane)\n\
    stream.write(color('runway', Array(width - col).join('⋅') + '\\n\
'));\n\
    stream.write(runway());\n\
    stream.write('\\u001b[0m');\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    cursor.show();\n\
    console.log();\n\
    self.epilogue();\n\
  });\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
Landing.prototype = new F;\n\
Landing.prototype.constructor = Landing;\n\
\n\
}); // module: reporters/landing.js\n\
\n\
require.register(\"reporters/list.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , cursor = Base.cursor\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `List`.\n\
 */\n\
\n\
exports = module.exports = List;\n\
\n\
/**\n\
 * Initialize a new `List` test reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function List(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , n = 0;\n\
\n\
  runner.on('start', function(){\n\
    console.log();\n\
  });\n\
\n\
  runner.on('test', function(test){\n\
    process.stdout.write(color('pass', '    ' + test.fullTitle() + ': '));\n\
  });\n\
\n\
  runner.on('pending', function(test){\n\
    var fmt = color('checkmark', '  -')\n\
      + color('pending', ' %s');\n\
    console.log(fmt, test.fullTitle());\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    var fmt = color('checkmark', '  '+Base.symbols.dot)\n\
      + color('pass', ' %s: ')\n\
      + color(test.speed, '%dms');\n\
    cursor.CR();\n\
    console.log(fmt, test.fullTitle(), test.duration);\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    cursor.CR();\n\
    console.log(color('fail', '  %d) %s'), ++n, test.fullTitle());\n\
  });\n\
\n\
  runner.on('end', self.epilogue.bind(self));\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
List.prototype = new F;\n\
List.prototype.constructor = List;\n\
\n\
\n\
}); // module: reporters/list.js\n\
\n\
require.register(\"reporters/markdown.js\", function(module, exports, require){\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , utils = require('../utils');\n\
\n\
/**\n\
 * Expose `Markdown`.\n\
 */\n\
\n\
exports = module.exports = Markdown;\n\
\n\
/**\n\
 * Initialize a new `Markdown` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function Markdown(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , level = 0\n\
    , buf = '';\n\
\n\
  function title(str) {\n\
    return Array(level).join('#') + ' ' + str;\n\
  }\n\
\n\
  function indent() {\n\
    return Array(level).join('  ');\n\
  }\n\
\n\
  function mapTOC(suite, obj) {\n\
    var ret = obj;\n\
    obj = obj[suite.title] = obj[suite.title] || { suite: suite };\n\
    suite.suites.forEach(function(suite){\n\
      mapTOC(suite, obj);\n\
    });\n\
    return ret;\n\
  }\n\
\n\
  function stringifyTOC(obj, level) {\n\
    ++level;\n\
    var buf = '';\n\
    var link;\n\
    for (var key in obj) {\n\
      if ('suite' == key) continue;\n\
      if (key) link = ' - [' + key + '](#' + utils.slug(obj[key].suite.fullTitle()) + ')\\n\
';\n\
      if (key) buf += Array(level).join('  ') + link;\n\
      buf += stringifyTOC(obj[key], level);\n\
    }\n\
    --level;\n\
    return buf;\n\
  }\n\
\n\
  function generateTOC(suite) {\n\
    var obj = mapTOC(suite, {});\n\
    return stringifyTOC(obj, 0);\n\
  }\n\
\n\
  generateTOC(runner.suite);\n\
\n\
  runner.on('suite', function(suite){\n\
    ++level;\n\
    var slug = utils.slug(suite.fullTitle());\n\
    buf += '<a name=\"' + slug + '\"></a>' + '\\n\
';\n\
    buf += title(suite.title) + '\\n\
';\n\
  });\n\
\n\
  runner.on('suite end', function(suite){\n\
    --level;\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    var code = utils.clean(test.fn.toString());\n\
    buf += test.title + '.\\n\
';\n\
    buf += '\\n\
```js\\n\
';\n\
    buf += code + '\\n\
';\n\
    buf += '```\\n\
\\n\
';\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    process.stdout.write('# TOC\\n\
');\n\
    process.stdout.write(generateTOC(runner.suite));\n\
    process.stdout.write(buf);\n\
  });\n\
}\n\
}); // module: reporters/markdown.js\n\
\n\
require.register(\"reporters/min.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base');\n\
\n\
/**\n\
 * Expose `Min`.\n\
 */\n\
\n\
exports = module.exports = Min;\n\
\n\
/**\n\
 * Initialize a new `Min` minimal test reporter (best used with --watch).\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function Min(runner) {\n\
  Base.call(this, runner);\n\
\n\
  runner.on('start', function(){\n\
    // clear screen\n\
    process.stdout.write('\\u001b[2J');\n\
    // set cursor position\n\
    process.stdout.write('\\u001b[1;3H');\n\
  });\n\
\n\
  runner.on('end', this.epilogue.bind(this));\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
Min.prototype = new F;\n\
Min.prototype.constructor = Min;\n\
\n\
\n\
}); // module: reporters/min.js\n\
\n\
require.register(\"reporters/nyan.js\", function(module, exports, require){\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `Dot`.\n\
 */\n\
\n\
exports = module.exports = NyanCat;\n\
\n\
/**\n\
 * Initialize a new `Dot` matrix test reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function NyanCat(runner) {\n\
  Base.call(this, runner);\n\
  var self = this\n\
    , stats = this.stats\n\
    , width = Base.window.width * .75 | 0\n\
    , rainbowColors = this.rainbowColors = self.generateColors()\n\
    , colorIndex = this.colorIndex = 0\n\
    , numerOfLines = this.numberOfLines = 4\n\
    , trajectories = this.trajectories = [[], [], [], []]\n\
    , nyanCatWidth = this.nyanCatWidth = 11\n\
    , trajectoryWidthMax = this.trajectoryWidthMax = (width - nyanCatWidth)\n\
    , scoreboardWidth = this.scoreboardWidth = 5\n\
    , tick = this.tick = 0\n\
    , n = 0;\n\
\n\
  runner.on('start', function(){\n\
    Base.cursor.hide();\n\
    self.draw();\n\
  });\n\
\n\
  runner.on('pending', function(test){\n\
    self.draw();\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    self.draw();\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    self.draw();\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    Base.cursor.show();\n\
    for (var i = 0; i < self.numberOfLines; i++) write('\\n\
');\n\
    self.epilogue();\n\
  });\n\
}\n\
\n\
/**\n\
 * Draw the nyan cat\n\
 *\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.draw = function(){\n\
  this.appendRainbow();\n\
  this.drawScoreboard();\n\
  this.drawRainbow();\n\
  this.drawNyanCat();\n\
  this.tick = !this.tick;\n\
};\n\
\n\
/**\n\
 * Draw the \"scoreboard\" showing the number\n\
 * of passes, failures and pending tests.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.drawScoreboard = function(){\n\
  var stats = this.stats;\n\
  var colors = Base.colors;\n\
\n\
  function draw(color, n) {\n\
    write(' ');\n\
    write('\\u001b[' + color + 'm' + n + '\\u001b[0m');\n\
    write('\\n\
');\n\
  }\n\
\n\
  draw(colors.green, stats.passes);\n\
  draw(colors.fail, stats.failures);\n\
  draw(colors.pending, stats.pending);\n\
  write('\\n\
');\n\
\n\
  this.cursorUp(this.numberOfLines);\n\
};\n\
\n\
/**\n\
 * Append the rainbow.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.appendRainbow = function(){\n\
  var segment = this.tick ? '_' : '-';\n\
  var rainbowified = this.rainbowify(segment);\n\
\n\
  for (var index = 0; index < this.numberOfLines; index++) {\n\
    var trajectory = this.trajectories[index];\n\
    if (trajectory.length >= this.trajectoryWidthMax) trajectory.shift();\n\
    trajectory.push(rainbowified);\n\
  }\n\
};\n\
\n\
/**\n\
 * Draw the rainbow.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.drawRainbow = function(){\n\
  var self = this;\n\
\n\
  this.trajectories.forEach(function(line, index) {\n\
    write('\\u001b[' + self.scoreboardWidth + 'C');\n\
    write(line.join(''));\n\
    write('\\n\
');\n\
  });\n\
\n\
  this.cursorUp(this.numberOfLines);\n\
};\n\
\n\
/**\n\
 * Draw the nyan cat\n\
 *\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.drawNyanCat = function() {\n\
  var self = this;\n\
  var startWidth = this.scoreboardWidth + this.trajectories[0].length;\n\
  var color = '\\u001b[' + startWidth + 'C';\n\
  var padding = '';\n\
\n\
  write(color);\n\
  write('_,------,');\n\
  write('\\n\
');\n\
\n\
  write(color);\n\
  padding = self.tick ? '  ' : '   ';\n\
  write('_|' + padding + '/\\\\_/\\\\ ');\n\
  write('\\n\
');\n\
\n\
  write(color);\n\
  padding = self.tick ? '_' : '__';\n\
  var tail = self.tick ? '~' : '^';\n\
  var face;\n\
  write(tail + '|' + padding + this.face() + ' ');\n\
  write('\\n\
');\n\
\n\
  write(color);\n\
  padding = self.tick ? ' ' : '  ';\n\
  write(padding + '\"\"  \"\" ');\n\
  write('\\n\
');\n\
\n\
  this.cursorUp(this.numberOfLines);\n\
};\n\
\n\
/**\n\
 * Draw nyan cat face.\n\
 *\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.face = function() {\n\
  var stats = this.stats;\n\
  if (stats.failures) {\n\
    return '( x .x)';\n\
  } else if (stats.pending) {\n\
    return '( o .o)';\n\
  } else if(stats.passes) {\n\
    return '( ^ .^)';\n\
  } else {\n\
    return '( - .-)';\n\
  }\n\
}\n\
\n\
/**\n\
 * Move cursor up `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.cursorUp = function(n) {\n\
  write('\\u001b[' + n + 'A');\n\
};\n\
\n\
/**\n\
 * Move cursor down `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.cursorDown = function(n) {\n\
  write('\\u001b[' + n + 'B');\n\
};\n\
\n\
/**\n\
 * Generate rainbow colors.\n\
 *\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.generateColors = function(){\n\
  var colors = [];\n\
\n\
  for (var i = 0; i < (6 * 7); i++) {\n\
    var pi3 = Math.floor(Math.PI / 3);\n\
    var n = (i * (1.0 / 6));\n\
    var r = Math.floor(3 * Math.sin(n) + 3);\n\
    var g = Math.floor(3 * Math.sin(n + 2 * pi3) + 3);\n\
    var b = Math.floor(3 * Math.sin(n + 4 * pi3) + 3);\n\
    colors.push(36 * r + 6 * g + b + 16);\n\
  }\n\
\n\
  return colors;\n\
};\n\
\n\
/**\n\
 * Apply rainbow to the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
NyanCat.prototype.rainbowify = function(str){\n\
  var color = this.rainbowColors[this.colorIndex % this.rainbowColors.length];\n\
  this.colorIndex += 1;\n\
  return '\\u001b[38;5;' + color + 'm' + str + '\\u001b[0m';\n\
};\n\
\n\
/**\n\
 * Stdout helper.\n\
 */\n\
\n\
function write(string) {\n\
  process.stdout.write(string);\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
NyanCat.prototype = new F;\n\
NyanCat.prototype.constructor = NyanCat;\n\
\n\
\n\
}); // module: reporters/nyan.js\n\
\n\
require.register(\"reporters/progress.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , cursor = Base.cursor\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `Progress`.\n\
 */\n\
\n\
exports = module.exports = Progress;\n\
\n\
/**\n\
 * General progress bar color.\n\
 */\n\
\n\
Base.colors.progress = 90;\n\
\n\
/**\n\
 * Initialize a new `Progress` bar test reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @param {Object} options\n\
 * @api public\n\
 */\n\
\n\
function Progress(runner, options) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , options = options || {}\n\
    , stats = this.stats\n\
    , width = Base.window.width * .50 | 0\n\
    , total = runner.total\n\
    , complete = 0\n\
    , max = Math.max;\n\
\n\
  // default chars\n\
  options.open = options.open || '[';\n\
  options.complete = options.complete || '▬';\n\
  options.incomplete = options.incomplete || Base.symbols.dot;\n\
  options.close = options.close || ']';\n\
  options.verbose = false;\n\
\n\
  // tests started\n\
  runner.on('start', function(){\n\
    console.log();\n\
    cursor.hide();\n\
  });\n\
\n\
  // tests complete\n\
  runner.on('test end', function(){\n\
    complete++;\n\
    var incomplete = total - complete\n\
      , percent = complete / total\n\
      , n = width * percent | 0\n\
      , i = width - n;\n\
\n\
    cursor.CR();\n\
    process.stdout.write('\\u001b[J');\n\
    process.stdout.write(color('progress', '  ' + options.open));\n\
    process.stdout.write(Array(n).join(options.complete));\n\
    process.stdout.write(Array(i).join(options.incomplete));\n\
    process.stdout.write(color('progress', options.close));\n\
    if (options.verbose) {\n\
      process.stdout.write(color('progress', ' ' + complete + ' of ' + total));\n\
    }\n\
  });\n\
\n\
  // tests are complete, output some stats\n\
  // and the failures if any\n\
  runner.on('end', function(){\n\
    cursor.show();\n\
    console.log();\n\
    self.epilogue();\n\
  });\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
Progress.prototype = new F;\n\
Progress.prototype.constructor = Progress;\n\
\n\
\n\
}); // module: reporters/progress.js\n\
\n\
require.register(\"reporters/spec.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , cursor = Base.cursor\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `Spec`.\n\
 */\n\
\n\
exports = module.exports = Spec;\n\
\n\
/**\n\
 * Initialize a new `Spec` test reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function Spec(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , indents = 0\n\
    , n = 0;\n\
\n\
  function indent() {\n\
    return Array(indents).join('  ')\n\
  }\n\
\n\
  runner.on('start', function(){\n\
    console.log();\n\
  });\n\
\n\
  runner.on('suite', function(suite){\n\
    ++indents;\n\
    console.log(color('suite', '%s%s'), indent(), suite.title);\n\
  });\n\
\n\
  runner.on('suite end', function(suite){\n\
    --indents;\n\
    if (1 == indents) console.log();\n\
  });\n\
\n\
  runner.on('test', function(test){\n\
    process.stdout.write(indent() + color('pass', '  ◦ ' + test.title + ': '));\n\
  });\n\
\n\
  runner.on('pending', function(test){\n\
    var fmt = indent() + color('pending', '  - %s');\n\
    console.log(fmt, test.title);\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    if ('fast' == test.speed) {\n\
      var fmt = indent()\n\
        + color('checkmark', '  ' + Base.symbols.ok)\n\
        + color('pass', ' %s ');\n\
      cursor.CR();\n\
      console.log(fmt, test.title);\n\
    } else {\n\
      var fmt = indent()\n\
        + color('checkmark', '  ' + Base.symbols.ok)\n\
        + color('pass', ' %s ')\n\
        + color(test.speed, '(%dms)');\n\
      cursor.CR();\n\
      console.log(fmt, test.title, test.duration);\n\
    }\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    cursor.CR();\n\
    console.log(indent() + color('fail', '  %d) %s'), ++n, test.title);\n\
  });\n\
\n\
  runner.on('end', self.epilogue.bind(self));\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
Spec.prototype = new F;\n\
Spec.prototype.constructor = Spec;\n\
\n\
\n\
}); // module: reporters/spec.js\n\
\n\
require.register(\"reporters/tap.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , cursor = Base.cursor\n\
  , color = Base.color;\n\
\n\
/**\n\
 * Expose `TAP`.\n\
 */\n\
\n\
exports = module.exports = TAP;\n\
\n\
/**\n\
 * Initialize a new `TAP` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function TAP(runner) {\n\
  Base.call(this, runner);\n\
\n\
  var self = this\n\
    , stats = this.stats\n\
    , n = 1\n\
    , passes = 0\n\
    , failures = 0;\n\
\n\
  runner.on('start', function(){\n\
    var total = runner.grepTotal(runner.suite);\n\
    console.log('%d..%d', 1, total);\n\
  });\n\
\n\
  runner.on('test end', function(){\n\
    ++n;\n\
  });\n\
\n\
  runner.on('pending', function(test){\n\
    console.log('ok %d %s # SKIP -', n, title(test));\n\
  });\n\
\n\
  runner.on('pass', function(test){\n\
    passes++;\n\
    console.log('ok %d %s', n, title(test));\n\
  });\n\
\n\
  runner.on('fail', function(test, err){\n\
    failures++;\n\
    console.log('not ok %d %s', n, title(test));\n\
    if (err.stack) console.log(err.stack.replace(/^/gm, '  '));\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    console.log('# tests ' + (passes + failures));\n\
    console.log('# pass ' + passes);\n\
    console.log('# fail ' + failures);\n\
  });\n\
}\n\
\n\
/**\n\
 * Return a TAP-safe title of `test`\n\
 *\n\
 * @param {Object} test\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function title(test) {\n\
  return test.fullTitle().replace(/#/g, '');\n\
}\n\
\n\
}); // module: reporters/tap.js\n\
\n\
require.register(\"reporters/xunit.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Base = require('./base')\n\
  , utils = require('../utils')\n\
  , escape = utils.escape;\n\
\n\
/**\n\
 * Save timer references to avoid Sinon interfering (see GH-237).\n\
 */\n\
\n\
var Date = global.Date\n\
  , setTimeout = global.setTimeout\n\
  , setInterval = global.setInterval\n\
  , clearTimeout = global.clearTimeout\n\
  , clearInterval = global.clearInterval;\n\
\n\
/**\n\
 * Expose `XUnit`.\n\
 */\n\
\n\
exports = module.exports = XUnit;\n\
\n\
/**\n\
 * Initialize a new `XUnit` reporter.\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
function XUnit(runner) {\n\
  Base.call(this, runner);\n\
  var stats = this.stats\n\
    , tests = []\n\
    , self = this;\n\
\n\
  runner.on('pass', function(test){\n\
    tests.push(test);\n\
  });\n\
\n\
  runner.on('fail', function(test){\n\
    tests.push(test);\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    console.log(tag('testsuite', {\n\
        name: 'Mocha Tests'\n\
      , tests: stats.tests\n\
      , failures: stats.failures\n\
      , errors: stats.failures\n\
      , skipped: stats.tests - stats.failures - stats.passes\n\
      , timestamp: (new Date).toUTCString()\n\
      , time: (stats.duration / 1000) || 0\n\
    }, false));\n\
\n\
    tests.forEach(test);\n\
    console.log('</testsuite>');\n\
  });\n\
}\n\
\n\
/**\n\
 * Inherit from `Base.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Base.prototype;\n\
XUnit.prototype = new F;\n\
XUnit.prototype.constructor = XUnit;\n\
\n\
\n\
/**\n\
 * Output tag for the given `test.`\n\
 */\n\
\n\
function test(test) {\n\
  var attrs = {\n\
      classname: test.parent.fullTitle()\n\
    , name: test.title\n\
    , time: test.duration / 1000\n\
  };\n\
\n\
  if ('failed' == test.state) {\n\
    var err = test.err;\n\
    attrs.message = escape(err.message);\n\
    console.log(tag('testcase', attrs, false, tag('failure', attrs, false, cdata(err.stack))));\n\
  } else if (test.pending) {\n\
    console.log(tag('testcase', attrs, false, tag('skipped', {}, true)));\n\
  } else {\n\
    console.log(tag('testcase', attrs, true) );\n\
  }\n\
}\n\
\n\
/**\n\
 * HTML tag helper.\n\
 */\n\
\n\
function tag(name, attrs, close, content) {\n\
  var end = close ? '/>' : '>'\n\
    , pairs = []\n\
    , tag;\n\
\n\
  for (var key in attrs) {\n\
    pairs.push(key + '=\"' + escape(attrs[key]) + '\"');\n\
  }\n\
\n\
  tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;\n\
  if (content) tag += content + '</' + name + end;\n\
  return tag;\n\
}\n\
\n\
/**\n\
 * Return cdata escaped CDATA `str`.\n\
 */\n\
\n\
function cdata(str) {\n\
  return '<![CDATA[' + escape(str) + ']]>';\n\
}\n\
\n\
}); // module: reporters/xunit.js\n\
\n\
require.register(\"runnable.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var EventEmitter = require('browser/events').EventEmitter\n\
  , debug = require('browser/debug')('mocha:runnable')\n\
  , milliseconds = require('./ms');\n\
\n\
/**\n\
 * Save timer references to avoid Sinon interfering (see GH-237).\n\
 */\n\
\n\
var Date = global.Date\n\
  , setTimeout = global.setTimeout\n\
  , setInterval = global.setInterval\n\
  , clearTimeout = global.clearTimeout\n\
  , clearInterval = global.clearInterval;\n\
\n\
/**\n\
 * Object#toString().\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Expose `Runnable`.\n\
 */\n\
\n\
module.exports = Runnable;\n\
\n\
/**\n\
 * Initialize a new `Runnable` with the given `title` and callback `fn`.\n\
 *\n\
 * @param {String} title\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function Runnable(title, fn) {\n\
  this.title = title;\n\
  this.fn = fn;\n\
  this.async = fn && fn.length;\n\
  this.sync = ! this.async;\n\
  this._timeout = 2000;\n\
  this._slow = 75;\n\
  this.timedOut = false;\n\
}\n\
\n\
/**\n\
 * Inherit from `EventEmitter.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = EventEmitter.prototype;\n\
Runnable.prototype = new F;\n\
Runnable.prototype.constructor = Runnable;\n\
\n\
\n\
/**\n\
 * Set & get timeout `ms`.\n\
 *\n\
 * @param {Number|String} ms\n\
 * @return {Runnable|Number} ms or self\n\
 * @api private\n\
 */\n\
\n\
Runnable.prototype.timeout = function(ms){\n\
  if (0 == arguments.length) return this._timeout;\n\
  if ('string' == typeof ms) ms = milliseconds(ms);\n\
  debug('timeout %d', ms);\n\
  this._timeout = ms;\n\
  if (this.timer) this.resetTimeout();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set & get slow `ms`.\n\
 *\n\
 * @param {Number|String} ms\n\
 * @return {Runnable|Number} ms or self\n\
 * @api private\n\
 */\n\
\n\
Runnable.prototype.slow = function(ms){\n\
  if (0 === arguments.length) return this._slow;\n\
  if ('string' == typeof ms) ms = milliseconds(ms);\n\
  debug('timeout %d', ms);\n\
  this._slow = ms;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return the full title generated by recursively\n\
 * concatenating the parent's full title.\n\
 *\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
Runnable.prototype.fullTitle = function(){\n\
  return this.parent.fullTitle() + ' ' + this.title;\n\
};\n\
\n\
/**\n\
 * Clear the timeout.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Runnable.prototype.clearTimeout = function(){\n\
  clearTimeout(this.timer);\n\
};\n\
\n\
/**\n\
 * Inspect the runnable void of private properties.\n\
 *\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
Runnable.prototype.inspect = function(){\n\
  return JSON.stringify(this, function(key, val){\n\
    if ('_' == key[0]) return;\n\
    if ('parent' == key) return '#<Suite>';\n\
    if ('ctx' == key) return '#<Context>';\n\
    return val;\n\
  }, 2);\n\
};\n\
\n\
/**\n\
 * Reset the timeout.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Runnable.prototype.resetTimeout = function(){\n\
  var self = this;\n\
  var ms = this.timeout() || 1e9;\n\
\n\
  this.clearTimeout();\n\
  this.timer = setTimeout(function(){\n\
    self.callback(new Error('timeout of ' + ms + 'ms exceeded'));\n\
    self.timedOut = true;\n\
  }, ms);\n\
};\n\
\n\
/**\n\
 * Run the test and invoke `fn(err)`.\n\
 *\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runnable.prototype.run = function(fn){\n\
  var self = this\n\
    , ms = this.timeout()\n\
    , start = new Date\n\
    , ctx = this.ctx\n\
    , finished\n\
    , emitted;\n\
\n\
  if (ctx) ctx.runnable(this);\n\
\n\
  // timeout\n\
  if (this.async) {\n\
    if (ms) {\n\
      this.timer = setTimeout(function(){\n\
        done(new Error('timeout of ' + ms + 'ms exceeded'));\n\
        self.timedOut = true;\n\
      }, ms);\n\
    }\n\
  }\n\
\n\
  // called multiple times\n\
  function multiple(err) {\n\
    if (emitted) return;\n\
    emitted = true;\n\
    self.emit('error', err || new Error('done() called multiple times'));\n\
  }\n\
\n\
  // finished\n\
  function done(err) {\n\
    if (self.timedOut) return;\n\
    if (finished) return multiple(err);\n\
    self.clearTimeout();\n\
    self.duration = new Date - start;\n\
    finished = true;\n\
    fn(err);\n\
  }\n\
\n\
  // for .resetTimeout()\n\
  this.callback = done;\n\
\n\
  // async\n\
  if (this.async) {\n\
    try {\n\
      this.fn.call(ctx, function(err){\n\
        if (err instanceof Error || toString.call(err) === \"[object Error]\") return done(err);\n\
        if (null != err) return done(new Error('done() invoked with non-Error: ' + err));\n\
        done();\n\
      });\n\
    } catch (err) {\n\
      done(err);\n\
    }\n\
    return;\n\
  }\n\
\n\
  if (this.asyncOnly) {\n\
    return done(new Error('--async-only option in use without declaring `done()`'));\n\
  }\n\
\n\
  // sync\n\
  try {\n\
    if (!this.pending) this.fn.call(ctx);\n\
    this.duration = new Date - start;\n\
    fn();\n\
  } catch (err) {\n\
    fn(err);\n\
  }\n\
};\n\
\n\
}); // module: runnable.js\n\
\n\
require.register(\"runner.js\", function(module, exports, require){\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var EventEmitter = require('browser/events').EventEmitter\n\
  , debug = require('browser/debug')('mocha:runner')\n\
  , Test = require('./test')\n\
  , utils = require('./utils')\n\
  , filter = utils.filter\n\
  , keys = utils.keys;\n\
\n\
/**\n\
 * Non-enumerable globals.\n\
 */\n\
\n\
var globals = [\n\
  'setTimeout',\n\
  'clearTimeout',\n\
  'setInterval',\n\
  'clearInterval',\n\
  'XMLHttpRequest',\n\
  'Date'\n\
];\n\
\n\
/**\n\
 * Expose `Runner`.\n\
 */\n\
\n\
module.exports = Runner;\n\
\n\
/**\n\
 * Initialize a `Runner` for the given `suite`.\n\
 *\n\
 * Events:\n\
 *\n\
 *   - `start`  execution started\n\
 *   - `end`  execution complete\n\
 *   - `suite`  (suite) test suite execution started\n\
 *   - `suite end`  (suite) all tests (and sub-suites) have finished\n\
 *   - `test`  (test) test execution started\n\
 *   - `test end`  (test) test completed\n\
 *   - `hook`  (hook) hook execution started\n\
 *   - `hook end`  (hook) hook complete\n\
 *   - `pass`  (test) test passed\n\
 *   - `fail`  (test, err) test failed\n\
 *   - `pending`  (test) test pending\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Runner(suite) {\n\
  var self = this;\n\
  this._globals = [];\n\
  this.suite = suite;\n\
  this.total = suite.total();\n\
  this.failures = 0;\n\
  this.on('test end', function(test){ self.checkGlobals(test); });\n\
  this.on('hook end', function(hook){ self.checkGlobals(hook); });\n\
  this.grep(/.*/);\n\
  this.globals(this.globalProps().concat(['errno']));\n\
}\n\
\n\
/**\n\
 * Wrapper for setImmediate, process.nextTick, or browser polyfill.\n\
 *\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runner.immediately = global.setImmediate || process.nextTick;\n\
\n\
/**\n\
 * Inherit from `EventEmitter.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = EventEmitter.prototype;\n\
Runner.prototype = new F;\n\
Runner.prototype.constructor = Runner;\n\
\n\
\n\
/**\n\
 * Run tests with full titles matching `re`. Updates runner.total\n\
 * with number of tests matched.\n\
 *\n\
 * @param {RegExp} re\n\
 * @param {Boolean} invert\n\
 * @return {Runner} for chaining\n\
 * @api public\n\
 */\n\
\n\
Runner.prototype.grep = function(re, invert){\n\
  debug('grep %s', re);\n\
  this._grep = re;\n\
  this._invert = invert;\n\
  this.total = this.grepTotal(this.suite);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Returns the number of tests matching the grep search for the\n\
 * given suite.\n\
 *\n\
 * @param {Suite} suite\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
Runner.prototype.grepTotal = function(suite) {\n\
  var self = this;\n\
  var total = 0;\n\
\n\
  suite.eachTest(function(test){\n\
    var match = self._grep.test(test.fullTitle());\n\
    if (self._invert) match = !match;\n\
    if (match) total++;\n\
  });\n\
\n\
  return total;\n\
};\n\
\n\
/**\n\
 * Return a list of global properties.\n\
 *\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.globalProps = function() {\n\
  var props = utils.keys(global);\n\
\n\
  // non-enumerables\n\
  for (var i = 0; i < globals.length; ++i) {\n\
    if (~utils.indexOf(props, globals[i])) continue;\n\
    props.push(globals[i]);\n\
  }\n\
\n\
  return props;\n\
};\n\
\n\
/**\n\
 * Allow the given `arr` of globals.\n\
 *\n\
 * @param {Array} arr\n\
 * @return {Runner} for chaining\n\
 * @api public\n\
 */\n\
\n\
Runner.prototype.globals = function(arr){\n\
  if (0 == arguments.length) return this._globals;\n\
  debug('globals %j', arr);\n\
  utils.forEach(arr, function(arr){\n\
    this._globals.push(arr);\n\
  }, this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Check for global variable leaks.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.checkGlobals = function(test){\n\
  if (this.ignoreLeaks) return;\n\
  var ok = this._globals;\n\
  var globals = this.globalProps();\n\
  var isNode = process.kill;\n\
  var leaks;\n\
\n\
  // check length - 2 ('errno' and 'location' globals)\n\
  if (isNode && 1 == ok.length - globals.length) return;\n\
  else if (2 == ok.length - globals.length) return;\n\
\n\
  if(this.prevGlobalsLength == globals.length) return;\n\
  this.prevGlobalsLength = globals.length;\n\
\n\
  leaks = filterLeaks(ok, globals);\n\
  this._globals = this._globals.concat(leaks);\n\
\n\
  if (leaks.length > 1) {\n\
    this.fail(test, new Error('global leaks detected: ' + leaks.join(', ') + ''));\n\
  } else if (leaks.length) {\n\
    this.fail(test, new Error('global leak detected: ' + leaks[0]));\n\
  }\n\
};\n\
\n\
/**\n\
 * Fail the given `test`.\n\
 *\n\
 * @param {Test} test\n\
 * @param {Error} err\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.fail = function(test, err){\n\
  ++this.failures;\n\
  test.state = 'failed';\n\
\n\
  if ('string' == typeof err) {\n\
    err = new Error('the string \"' + err + '\" was thrown, throw an Error :)');\n\
  }\n\
\n\
  this.emit('fail', test, err);\n\
};\n\
\n\
/**\n\
 * Fail the given `hook` with `err`.\n\
 *\n\
 * Hook failures (currently) hard-end due\n\
 * to that fact that a failing hook will\n\
 * surely cause subsequent tests to fail,\n\
 * causing jumbled reporting.\n\
 *\n\
 * @param {Hook} hook\n\
 * @param {Error} err\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.failHook = function(hook, err){\n\
  this.fail(hook, err);\n\
  this.emit('end');\n\
};\n\
\n\
/**\n\
 * Run hook `name` callbacks and then invoke `fn()`.\n\
 *\n\
 * @param {String} name\n\
 * @param {Function} function\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.hook = function(name, fn){\n\
  var suite = this.suite\n\
    , hooks = suite['_' + name]\n\
    , self = this\n\
    , timer;\n\
\n\
  function next(i) {\n\
    var hook = hooks[i];\n\
    if (!hook) return fn();\n\
    if (self.failures && suite.bail()) return fn();\n\
    self.currentRunnable = hook;\n\
\n\
    hook.ctx.currentTest = self.test;\n\
\n\
    self.emit('hook', hook);\n\
\n\
    hook.on('error', function(err){\n\
      self.failHook(hook, err);\n\
    });\n\
\n\
    hook.run(function(err){\n\
      hook.removeAllListeners('error');\n\
      var testError = hook.error();\n\
      if (testError) self.fail(self.test, testError);\n\
      if (err) return self.failHook(hook, err);\n\
      self.emit('hook end', hook);\n\
      delete hook.ctx.currentTest;\n\
      next(++i);\n\
    });\n\
  }\n\
\n\
  Runner.immediately(function(){\n\
    next(0);\n\
  });\n\
};\n\
\n\
/**\n\
 * Run hook `name` for the given array of `suites`\n\
 * in order, and callback `fn(err)`.\n\
 *\n\
 * @param {String} name\n\
 * @param {Array} suites\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.hooks = function(name, suites, fn){\n\
  var self = this\n\
    , orig = this.suite;\n\
\n\
  function next(suite) {\n\
    self.suite = suite;\n\
\n\
    if (!suite) {\n\
      self.suite = orig;\n\
      return fn();\n\
    }\n\
\n\
    self.hook(name, function(err){\n\
      if (err) {\n\
        self.suite = orig;\n\
        return fn(err);\n\
      }\n\
\n\
      next(suites.pop());\n\
    });\n\
  }\n\
\n\
  next(suites.pop());\n\
};\n\
\n\
/**\n\
 * Run hooks from the top level down.\n\
 *\n\
 * @param {String} name\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.hookUp = function(name, fn){\n\
  var suites = [this.suite].concat(this.parents()).reverse();\n\
  this.hooks(name, suites, fn);\n\
};\n\
\n\
/**\n\
 * Run hooks from the bottom up.\n\
 *\n\
 * @param {String} name\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.hookDown = function(name, fn){\n\
  var suites = [this.suite].concat(this.parents());\n\
  this.hooks(name, suites, fn);\n\
};\n\
\n\
/**\n\
 * Return an array of parent Suites from\n\
 * closest to furthest.\n\
 *\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.parents = function(){\n\
  var suite = this.suite\n\
    , suites = [];\n\
  while (suite = suite.parent) suites.push(suite);\n\
  return suites;\n\
};\n\
\n\
/**\n\
 * Run the current test and callback `fn(err)`.\n\
 *\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.runTest = function(fn){\n\
  var test = this.test\n\
    , self = this;\n\
\n\
  if (this.asyncOnly) test.asyncOnly = true;\n\
\n\
  try {\n\
    test.on('error', function(err){\n\
      self.fail(test, err);\n\
    });\n\
    test.run(fn);\n\
  } catch (err) {\n\
    fn(err);\n\
  }\n\
};\n\
\n\
/**\n\
 * Run tests in the given `suite` and invoke\n\
 * the callback `fn()` when complete.\n\
 *\n\
 * @param {Suite} suite\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.runTests = function(suite, fn){\n\
  var self = this\n\
    , tests = suite.tests.slice()\n\
    , test;\n\
\n\
  function next(err) {\n\
    // if we bail after first err\n\
    if (self.failures && suite._bail) return fn();\n\
\n\
    // next test\n\
    test = tests.shift();\n\
\n\
    // all done\n\
    if (!test) return fn();\n\
\n\
    // grep\n\
    var match = self._grep.test(test.fullTitle());\n\
    if (self._invert) match = !match;\n\
    if (!match) return next();\n\
\n\
    // pending\n\
    if (test.pending) {\n\
      self.emit('pending', test);\n\
      self.emit('test end', test);\n\
      return next();\n\
    }\n\
\n\
    // execute test and hook(s)\n\
    self.emit('test', self.test = test);\n\
    self.hookDown('beforeEach', function(){\n\
      self.currentRunnable = self.test;\n\
      self.runTest(function(err){\n\
        test = self.test;\n\
\n\
        if (err) {\n\
          self.fail(test, err);\n\
          self.emit('test end', test);\n\
          return self.hookUp('afterEach', next);\n\
        }\n\
\n\
        test.state = 'passed';\n\
        self.emit('pass', test);\n\
        self.emit('test end', test);\n\
        self.hookUp('afterEach', next);\n\
      });\n\
    });\n\
  }\n\
\n\
  this.next = next;\n\
  next();\n\
};\n\
\n\
/**\n\
 * Run the given `suite` and invoke the\n\
 * callback `fn()` when complete.\n\
 *\n\
 * @param {Suite} suite\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.runSuite = function(suite, fn){\n\
  var total = this.grepTotal(suite)\n\
    , self = this\n\
    , i = 0;\n\
\n\
  debug('run suite %s', suite.fullTitle());\n\
\n\
  if (!total) return fn();\n\
\n\
  this.emit('suite', this.suite = suite);\n\
\n\
  function next() {\n\
    var curr = suite.suites[i++];\n\
    if (!curr) return done();\n\
    self.runSuite(curr, next);\n\
  }\n\
\n\
  function done() {\n\
    self.suite = suite;\n\
    self.hook('afterAll', function(){\n\
      self.emit('suite end', suite);\n\
      fn();\n\
    });\n\
  }\n\
\n\
  this.hook('beforeAll', function(){\n\
    self.runTests(suite, next);\n\
  });\n\
};\n\
\n\
/**\n\
 * Handle uncaught exceptions.\n\
 *\n\
 * @param {Error} err\n\
 * @api private\n\
 */\n\
\n\
Runner.prototype.uncaught = function(err){\n\
  debug('uncaught exception %s', err.message);\n\
  var runnable = this.currentRunnable;\n\
  if (!runnable || 'failed' == runnable.state) return;\n\
  runnable.clearTimeout();\n\
  err.uncaught = true;\n\
  this.fail(runnable, err);\n\
\n\
  // recover from test\n\
  if ('test' == runnable.type) {\n\
    this.emit('test end', runnable);\n\
    this.hookUp('afterEach', this.next);\n\
    return;\n\
  }\n\
\n\
  // bail on hooks\n\
  this.emit('end');\n\
};\n\
\n\
/**\n\
 * Run the root suite and invoke `fn(failures)`\n\
 * on completion.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Runner} for chaining\n\
 * @api public\n\
 */\n\
\n\
Runner.prototype.run = function(fn){\n\
  var self = this\n\
    , fn = fn || function(){};\n\
\n\
  function uncaught(err){\n\
    self.uncaught(err);\n\
  }\n\
\n\
  debug('start');\n\
\n\
  // callback\n\
  this.on('end', function(){\n\
    debug('end');\n\
    process.removeListener('uncaughtException', uncaught);\n\
    fn(self.failures);\n\
  });\n\
\n\
  // run suites\n\
  this.emit('start');\n\
  this.runSuite(this.suite, function(){\n\
    debug('finished running');\n\
    self.emit('end');\n\
  });\n\
\n\
  // uncaught exception\n\
  process.on('uncaughtException', uncaught);\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Filter leaks with the given globals flagged as `ok`.\n\
 *\n\
 * @param {Array} ok\n\
 * @param {Array} globals\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function filterLeaks(ok, globals) {\n\
  return filter(globals, function(key){\n\
    // Firefox and Chrome exposes iframes as index inside the window object\n\
    if (/^d+/.test(key)) return false;\n\
\n\
    // in firefox\n\
    // if runner runs in an iframe, this iframe's window.getInterface method not init at first\n\
    // it is assigned in some seconds\n\
    if (global.navigator && /^getInterface/.test(key)) return false;\n\
\n\
    // an iframe could be approached by window[iframeIndex]\n\
    // in ie6,7,8 and opera, iframeIndex is enumerable, this could cause leak\n\
    if (global.navigator && /^\\d+/.test(key)) return false;\n\
\n\
    // Opera and IE expose global variables for HTML element IDs (issue #243)\n\
    if (/^mocha-/.test(key)) return false;\n\
\n\
    var matched = filter(ok, function(ok){\n\
      if (~ok.indexOf('*')) return 0 == key.indexOf(ok.split('*')[0]);\n\
      return key == ok;\n\
    });\n\
    return matched.length == 0 && (!global.navigator || 'onerror' !== key);\n\
  });\n\
}\n\
\n\
}); // module: runner.js\n\
\n\
require.register(\"suite.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var EventEmitter = require('browser/events').EventEmitter\n\
  , debug = require('browser/debug')('mocha:suite')\n\
  , milliseconds = require('./ms')\n\
  , utils = require('./utils')\n\
  , Hook = require('./hook');\n\
\n\
/**\n\
 * Expose `Suite`.\n\
 */\n\
\n\
exports = module.exports = Suite;\n\
\n\
/**\n\
 * Create a new `Suite` with the given `title`\n\
 * and parent `Suite`. When a suite with the\n\
 * same title is already present, that suite\n\
 * is returned to provide nicer reporter\n\
 * and more flexible meta-testing.\n\
 *\n\
 * @param {Suite} parent\n\
 * @param {String} title\n\
 * @return {Suite}\n\
 * @api public\n\
 */\n\
\n\
exports.create = function(parent, title){\n\
  var suite = new Suite(title, parent.ctx);\n\
  suite.parent = parent;\n\
  if (parent.pending) suite.pending = true;\n\
  title = suite.fullTitle();\n\
  parent.addSuite(suite);\n\
  return suite;\n\
};\n\
\n\
/**\n\
 * Initialize a new `Suite` with the given\n\
 * `title` and `ctx`.\n\
 *\n\
 * @param {String} title\n\
 * @param {Context} ctx\n\
 * @api private\n\
 */\n\
\n\
function Suite(title, ctx) {\n\
  this.title = title;\n\
  this.ctx = ctx;\n\
  this.suites = [];\n\
  this.tests = [];\n\
  this.pending = false;\n\
  this._beforeEach = [];\n\
  this._beforeAll = [];\n\
  this._afterEach = [];\n\
  this._afterAll = [];\n\
  this.root = !title;\n\
  this._timeout = 2000;\n\
  this._slow = 75;\n\
  this._bail = false;\n\
}\n\
\n\
/**\n\
 * Inherit from `EventEmitter.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = EventEmitter.prototype;\n\
Suite.prototype = new F;\n\
Suite.prototype.constructor = Suite;\n\
\n\
\n\
/**\n\
 * Return a clone of this `Suite`.\n\
 *\n\
 * @return {Suite}\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.clone = function(){\n\
  var suite = new Suite(this.title);\n\
  debug('clone');\n\
  suite.ctx = this.ctx;\n\
  suite.timeout(this.timeout());\n\
  suite.slow(this.slow());\n\
  suite.bail(this.bail());\n\
  return suite;\n\
};\n\
\n\
/**\n\
 * Set timeout `ms` or short-hand such as \"2s\".\n\
 *\n\
 * @param {Number|String} ms\n\
 * @return {Suite|Number} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.timeout = function(ms){\n\
  if (0 == arguments.length) return this._timeout;\n\
  if ('string' == typeof ms) ms = milliseconds(ms);\n\
  debug('timeout %d', ms);\n\
  this._timeout = parseInt(ms, 10);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set slow `ms` or short-hand such as \"2s\".\n\
 *\n\
 * @param {Number|String} ms\n\
 * @return {Suite|Number} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.slow = function(ms){\n\
  if (0 === arguments.length) return this._slow;\n\
  if ('string' == typeof ms) ms = milliseconds(ms);\n\
  debug('slow %d', ms);\n\
  this._slow = ms;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Sets whether to bail after first error.\n\
 *\n\
 * @parma {Boolean} bail\n\
 * @return {Suite|Number} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.bail = function(bail){\n\
  if (0 == arguments.length) return this._bail;\n\
  debug('bail %s', bail);\n\
  this._bail = bail;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Run `fn(test[, done])` before running tests.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Suite} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.beforeAll = function(fn){\n\
  if (this.pending) return this;\n\
  var hook = new Hook('\"before all\" hook', fn);\n\
  hook.parent = this;\n\
  hook.timeout(this.timeout());\n\
  hook.slow(this.slow());\n\
  hook.ctx = this.ctx;\n\
  this._beforeAll.push(hook);\n\
  this.emit('beforeAll', hook);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Run `fn(test[, done])` after running tests.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Suite} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.afterAll = function(fn){\n\
  if (this.pending) return this;\n\
  var hook = new Hook('\"after all\" hook', fn);\n\
  hook.parent = this;\n\
  hook.timeout(this.timeout());\n\
  hook.slow(this.slow());\n\
  hook.ctx = this.ctx;\n\
  this._afterAll.push(hook);\n\
  this.emit('afterAll', hook);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Run `fn(test[, done])` before each test case.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Suite} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.beforeEach = function(fn){\n\
  if (this.pending) return this;\n\
  var hook = new Hook('\"before each\" hook', fn);\n\
  hook.parent = this;\n\
  hook.timeout(this.timeout());\n\
  hook.slow(this.slow());\n\
  hook.ctx = this.ctx;\n\
  this._beforeEach.push(hook);\n\
  this.emit('beforeEach', hook);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Run `fn(test[, done])` after each test case.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Suite} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.afterEach = function(fn){\n\
  if (this.pending) return this;\n\
  var hook = new Hook('\"after each\" hook', fn);\n\
  hook.parent = this;\n\
  hook.timeout(this.timeout());\n\
  hook.slow(this.slow());\n\
  hook.ctx = this.ctx;\n\
  this._afterEach.push(hook);\n\
  this.emit('afterEach', hook);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Add a test `suite`.\n\
 *\n\
 * @param {Suite} suite\n\
 * @return {Suite} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.addSuite = function(suite){\n\
  suite.parent = this;\n\
  suite.timeout(this.timeout());\n\
  suite.slow(this.slow());\n\
  suite.bail(this.bail());\n\
  this.suites.push(suite);\n\
  this.emit('suite', suite);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Add a `test` to this suite.\n\
 *\n\
 * @param {Test} test\n\
 * @return {Suite} for chaining\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.addTest = function(test){\n\
  test.parent = this;\n\
  test.timeout(this.timeout());\n\
  test.slow(this.slow());\n\
  test.ctx = this.ctx;\n\
  this.tests.push(test);\n\
  this.emit('test', test);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return the full title generated by recursively\n\
 * concatenating the parent's full title.\n\
 *\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
Suite.prototype.fullTitle = function(){\n\
  if (this.parent) {\n\
    var full = this.parent.fullTitle();\n\
    if (full) return full + ' ' + this.title;\n\
  }\n\
  return this.title;\n\
};\n\
\n\
/**\n\
 * Return the total number of tests.\n\
 *\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
Suite.prototype.total = function(){\n\
  return utils.reduce(this.suites, function(sum, suite){\n\
    return sum + suite.total();\n\
  }, 0) + this.tests.length;\n\
};\n\
\n\
/**\n\
 * Iterates through each suite recursively to find\n\
 * all tests. Applies a function in the format\n\
 * `fn(test)`.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Suite}\n\
 * @api private\n\
 */\n\
\n\
Suite.prototype.eachTest = function(fn){\n\
  utils.forEach(this.tests, fn);\n\
  utils.forEach(this.suites, function(suite){\n\
    suite.eachTest(fn);\n\
  });\n\
  return this;\n\
};\n\
\n\
}); // module: suite.js\n\
\n\
require.register(\"test.js\", function(module, exports, require){\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Runnable = require('./runnable');\n\
\n\
/**\n\
 * Expose `Test`.\n\
 */\n\
\n\
module.exports = Test;\n\
\n\
/**\n\
 * Initialize a new `Test` with the given `title` and callback `fn`.\n\
 *\n\
 * @param {String} title\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function Test(title, fn) {\n\
  Runnable.call(this, title, fn);\n\
  this.pending = !fn;\n\
  this.type = 'test';\n\
}\n\
\n\
/**\n\
 * Inherit from `Runnable.prototype`.\n\
 */\n\
\n\
function F(){};\n\
F.prototype = Runnable.prototype;\n\
Test.prototype = new F;\n\
Test.prototype.constructor = Test;\n\
\n\
\n\
}); // module: test.js\n\
\n\
require.register(\"utils.js\", function(module, exports, require){\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var fs = require('browser/fs')\n\
  , path = require('browser/path')\n\
  , join = path.join\n\
  , debug = require('browser/debug')('mocha:watch');\n\
\n\
/**\n\
 * Ignored directories.\n\
 */\n\
\n\
var ignore = ['node_modules', '.git'];\n\
\n\
/**\n\
 * Escape special characters in the given string of html.\n\
 *\n\
 * @param  {String} html\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
exports.escape = function(html){\n\
  return String(html)\n\
    .replace(/&/g, '&amp;')\n\
    .replace(/\"/g, '&quot;')\n\
    .replace(/</g, '&lt;')\n\
    .replace(/>/g, '&gt;');\n\
};\n\
\n\
/**\n\
 * Array#forEach (<=IE8)\n\
 *\n\
 * @param {Array} array\n\
 * @param {Function} fn\n\
 * @param {Object} scope\n\
 * @api private\n\
 */\n\
\n\
exports.forEach = function(arr, fn, scope){\n\
  for (var i = 0, l = arr.length; i < l; i++)\n\
    fn.call(scope, arr[i], i);\n\
};\n\
\n\
/**\n\
 * Array#indexOf (<=IE8)\n\
 *\n\
 * @parma {Array} arr\n\
 * @param {Object} obj to find index of\n\
 * @param {Number} start\n\
 * @api private\n\
 */\n\
\n\
exports.indexOf = function(arr, obj, start){\n\
  for (var i = start || 0, l = arr.length; i < l; i++) {\n\
    if (arr[i] === obj)\n\
      return i;\n\
  }\n\
  return -1;\n\
};\n\
\n\
/**\n\
 * Array#reduce (<=IE8)\n\
 *\n\
 * @param {Array} array\n\
 * @param {Function} fn\n\
 * @param {Object} initial value\n\
 * @api private\n\
 */\n\
\n\
exports.reduce = function(arr, fn, val){\n\
  var rval = val;\n\
\n\
  for (var i = 0, l = arr.length; i < l; i++) {\n\
    rval = fn(rval, arr[i], i, arr);\n\
  }\n\
\n\
  return rval;\n\
};\n\
\n\
/**\n\
 * Array#filter (<=IE8)\n\
 *\n\
 * @param {Array} array\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
exports.filter = function(arr, fn){\n\
  var ret = [];\n\
\n\
  for (var i = 0, l = arr.length; i < l; i++) {\n\
    var val = arr[i];\n\
    if (fn(val, i, arr)) ret.push(val);\n\
  }\n\
\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Object.keys (<=IE8)\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Array} keys\n\
 * @api private\n\
 */\n\
\n\
exports.keys = Object.keys || function(obj) {\n\
  var keys = []\n\
    , has = Object.prototype.hasOwnProperty // for `window` on <=IE8\n\
\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      keys.push(key);\n\
    }\n\
  }\n\
\n\
  return keys;\n\
};\n\
\n\
/**\n\
 * Watch the given `files` for changes\n\
 * and invoke `fn(file)` on modification.\n\
 *\n\
 * @param {Array} files\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
exports.watch = function(files, fn){\n\
  var options = { interval: 100 };\n\
  files.forEach(function(file){\n\
    debug('file %s', file);\n\
    fs.watchFile(file, options, function(curr, prev){\n\
      if (prev.mtime < curr.mtime) fn(file);\n\
    });\n\
  });\n\
};\n\
\n\
/**\n\
 * Ignored files.\n\
 */\n\
\n\
function ignored(path){\n\
  return !~ignore.indexOf(path);\n\
}\n\
\n\
/**\n\
 * Lookup files in the given `dir`.\n\
 *\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
exports.files = function(dir, ret){\n\
  ret = ret || [];\n\
\n\
  fs.readdirSync(dir)\n\
  .filter(ignored)\n\
  .forEach(function(path){\n\
    path = join(dir, path);\n\
    if (fs.statSync(path).isDirectory()) {\n\
      exports.files(path, ret);\n\
    } else if (path.match(/\\.(js|coffee|litcoffee|coffee.md)$/)) {\n\
      ret.push(path);\n\
    }\n\
  });\n\
\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Compute a slug from the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
exports.slug = function(str){\n\
  return str\n\
    .toLowerCase()\n\
    .replace(/ +/g, '-')\n\
    .replace(/[^-\\w]/g, '');\n\
};\n\
\n\
/**\n\
 * Strip the function definition from `str`,\n\
 * and re-indent for pre whitespace.\n\
 */\n\
\n\
exports.clean = function(str) {\n\
  str = str\n\
    .replace(/^function *\\(.*\\) *{/, '')\n\
    .replace(/\\s+\\}$/, '');\n\
\n\
  var whitespace = str.match(/^\\n\
?(\\s*)/)[1]\n\
    , re = new RegExp('^' + whitespace, 'gm');\n\
\n\
  str = str.replace(re, '');\n\
\n\
  return exports.trim(str);\n\
};\n\
\n\
/**\n\
 * Escape regular expression characters in `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
exports.escapeRegexp = function(str){\n\
  return str.replace(/[-\\\\^$*+?.()|[\\]{}]/g, \"\\\\$&\");\n\
};\n\
\n\
/**\n\
 * Trim the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
exports.trim = function(str){\n\
  return str.replace(/^\\s+|\\s+$/g, '');\n\
};\n\
\n\
/**\n\
 * Parse the given `qs`.\n\
 *\n\
 * @param {String} qs\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
exports.parseQuery = function(qs){\n\
  return exports.reduce(qs.replace('?', '').split('&'), function(obj, pair){\n\
    var i = pair.indexOf('=')\n\
      , key = pair.slice(0, i)\n\
      , val = pair.slice(++i);\n\
\n\
    obj[key] = decodeURIComponent(val);\n\
    return obj;\n\
  }, {});\n\
};\n\
\n\
/**\n\
 * Highlight the given string of `js`.\n\
 *\n\
 * @param {String} js\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function highlight(js) {\n\
  return js\n\
    .replace(/</g, '&lt;')\n\
    .replace(/>/g, '&gt;')\n\
    .replace(/\\/\\/(.*)/gm, '<span class=\"comment\">//$1</span>')\n\
    .replace(/('.*?')/gm, '<span class=\"string\">$1</span>')\n\
    .replace(/(\\d+\\.\\d+)/gm, '<span class=\"number\">$1</span>')\n\
    .replace(/(\\d+)/gm, '<span class=\"number\">$1</span>')\n\
    .replace(/\\bnew *(\\w+)/gm, '<span class=\"keyword\">new</span> <span class=\"init\">$1</span>')\n\
    .replace(/\\b(function|new|throw|return|var|if|else)\\b/gm, '<span class=\"keyword\">$1</span>')\n\
}\n\
\n\
/**\n\
 * Highlight the contents of tag `name`.\n\
 *\n\
 * @param {String} name\n\
 * @api private\n\
 */\n\
\n\
exports.highlightTags = function(name) {\n\
  var code = document.getElementsByTagName(name);\n\
  for (var i = 0, len = code.length; i < len; ++i) {\n\
    code[i].innerHTML = highlight(code[i].innerHTML);\n\
  }\n\
};\n\
\n\
}); // module: utils.js\n\
// The global object is \"self\" in Web Workers.\n\
global = (function() { return this; })();\n\
\n\
/**\n\
 * Save timer references to avoid Sinon interfering (see GH-237).\n\
 */\n\
\n\
var Date = global.Date;\n\
var setTimeout = global.setTimeout;\n\
var setInterval = global.setInterval;\n\
var clearTimeout = global.clearTimeout;\n\
var clearInterval = global.clearInterval;\n\
\n\
/**\n\
 * Node shims.\n\
 *\n\
 * These are meant only to allow\n\
 * mocha.js to run untouched, not\n\
 * to allow running node code in\n\
 * the browser.\n\
 */\n\
\n\
var process = {};\n\
process.exit = function(status){};\n\
process.stdout = {};\n\
\n\
/**\n\
 * Remove uncaughtException listener.\n\
 */\n\
\n\
process.removeListener = function(e){\n\
  if ('uncaughtException' == e) {\n\
    global.onerror = function() {};\n\
  }\n\
};\n\
\n\
/**\n\
 * Implements uncaughtException listener.\n\
 */\n\
\n\
process.on = function(e, fn){\n\
  if ('uncaughtException' == e) {\n\
    global.onerror = function(err, url, line){\n\
      fn(new Error(err + ' (' + url + ':' + line + ')'));\n\
    };\n\
  }\n\
};\n\
\n\
/**\n\
 * Expose mocha.\n\
 */\n\
\n\
var Mocha = global.Mocha = require('mocha'),\n\
    mocha = global.mocha = new Mocha({ reporter: 'html' });\n\
\n\
var immediateQueue = []\n\
  , immediateTimeout;\n\
\n\
function timeslice() {\n\
  var immediateStart = new Date().getTime();\n\
  while (immediateQueue.length && (new Date().getTime() - immediateStart) < 100) {\n\
    immediateQueue.shift()();\n\
  }\n\
  if (immediateQueue.length) {\n\
    immediateTimeout = setTimeout(timeslice, 0);\n\
  } else {\n\
    immediateTimeout = null;\n\
  }\n\
}\n\
\n\
/**\n\
 * High-performance override of Runner.immediately.\n\
 */\n\
\n\
Mocha.Runner.immediately = function(callback) {\n\
  immediateQueue.push(callback);\n\
  if (!immediateTimeout) {\n\
    immediateTimeout = setTimeout(timeslice, 0);\n\
  }\n\
};\n\
\n\
/**\n\
 * Override ui to ensure that the ui functions are initialized.\n\
 * Normally this would happen in Mocha.prototype.loadFiles.\n\
 */\n\
\n\
mocha.ui = function(ui){\n\
  Mocha.prototype.ui.call(this, ui);\n\
  this.suite.emit('pre-require', global, null, this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Setup mocha with the given setting options.\n\
 */\n\
\n\
mocha.setup = function(opts){\n\
  if ('string' == typeof opts) opts = { ui: opts };\n\
  for (var opt in opts) this[opt](opts[opt]);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Run mocha, returning the Runner.\n\
 */\n\
\n\
mocha.run = function(fn){\n\
  var options = mocha.options;\n\
  mocha.globals('location');\n\
\n\
  var query = Mocha.utils.parseQuery(global.location.search || '');\n\
  if (query.grep) mocha.grep(query.grep);\n\
  if (query.invert) mocha.invert();\n\
\n\
  return Mocha.prototype.run.call(mocha, function(){\n\
    // The DOM Document is not available in Web Workers.\n\
    if (global.document) {\n\
      Mocha.utils.highlightTags('code');\n\
    }\n\
    if (fn) fn();\n\
  });\n\
};\n\
\n\
/**\n\
 * Expose the process shim.\n\
 */\n\
\n\
Mocha.process = process;\n\
})();//@ sourceURL=visionmedia-mocha/mocha.js"
));
require.register("visionmedia-mocha-cloud/client.js", Function("exports, require, module",
"\n\
/**\n\
 * Listen to `runner` events to populate a global\n\
 * `.mochaResults` var which may be used by selenium\n\
 * to report on results.\n\
 *\n\
 *    cloud(mocha.run());\n\
 *\n\
 * @param {Runner} runner\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(runner){\n\
  var failed = [];\n\
\n\
  runner.on('fail', function(test, err){\n\
    failed.push({\n\
      title: test.title,\n\
      fullTitle: test.fullTitle(),\n\
      error: {\n\
        message: err.message,\n\
        stack: err.stack\n\
      }\n\
    });\n\
  });\n\
\n\
  runner.on('end', function(){\n\
    runner.stats.failed = failed;\n\
    global.mochaResults = runner.stats;\n\
  });\n\
};//@ sourceURL=visionmedia-mocha-cloud/client.js"
));
require.register("domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * svg elements.\n\
 */\n\
\n\
map.text =\n\
map.circle =\n\
map.ellipse =\n\
map.line =\n\
map.path =\n\
map.polygon =\n\
map.polyline =\n\
map.rect = [1, '<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">','</svg>'];\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // one element\n\
  if (el.firstChild == el.lastChild) {\n\
    return el.removeChild(el.firstChild);\n\
  }\n\
\n\
  // several elements\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.firstChild) {\n\
    fragment.appendChild(el.removeChild(el.firstChild));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=domify/index.js"
));






require.alias("component-assert/index.js", "domify/deps/assert/index.js");
require.alias("component-assert/index.js", "assert/index.js");
require.alias("component-stack/index.js", "component-assert/deps/stack/index.js");

require.alias("visionmedia-mocha/mocha.js", "domify/deps/mocha/mocha.js");
require.alias("visionmedia-mocha/mocha.js", "domify/deps/mocha/index.js");
require.alias("visionmedia-mocha/mocha.js", "mocha/index.js");
require.alias("visionmedia-mocha/mocha.js", "visionmedia-mocha/index.js");
require.alias("visionmedia-mocha-cloud/client.js", "domify/deps/mocha-cloud/client.js");
require.alias("visionmedia-mocha-cloud/client.js", "domify/deps/mocha-cloud/index.js");
require.alias("visionmedia-mocha-cloud/client.js", "mocha-cloud/index.js");
require.alias("visionmedia-mocha-cloud/client.js", "visionmedia-mocha-cloud/index.js");