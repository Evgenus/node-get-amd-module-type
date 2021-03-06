var Walker = require('node-source-walk');
var types = require('ast-module-types');
var fs = require('fs');

/**
 * Asynchronously identifies the AMD module type of the given file
 *
 * @param {Object|String} file - filename
 * @param {Function} cb - Executed with (err, type)
 *
 * @example
 * define('name', [deps], func)    'named'
 * define([deps], func)            'deps'
 * define(func(require))           'factory'
 * define({})                      'nodeps'
 *
 * @returns {String|null} the supported type of module syntax used, or null
 */
module.exports = function(file, cb) {
  if (! file) {
    throw new Error('filename missing');
  }

  if (! cb) {
    throw new Error('callback missing');
  }

  fs.readFile(file, { encoding: 'utf8' }, function (err, data) {
    if (err) {
      return cb(err);
    }

    var type;

    try {
      type = fromSource(data);
    } catch(error) {
      return cb(error);
    }

    if (cb) cb(null, type);
  });
};

/**
 * Determine the module type from an AST node
 *
 * @param  {Object} node
 * @return {String | null}
 */
function fromAST(node) {
  if (types.isNamedForm(node))        return 'named';
  if (types.isDependencyForm(node))   return 'deps';
  if (types.isREMForm(node))          return 'rem';
  if (types.isFactoryForm(node))      return 'factory';
  if (types.isNoDependencyForm(node)) return 'nodeps';
  if (types.isAMDDriverScriptRequire(node)) return 'driver';

  return null;
}

/**
 * Determine the module type by walking the supplied source code's AST
 *
 * @param  {String} source
 * @return {String|null}
 */
function fromSource(source) {
  if (typeof source === 'undefined') throw new Error('source missing');

  var type;
  var walker = new Walker();

  walker.walk(source, function(node) {
    type = fromAST(node);

    if (type) {
      walker.stopWalking();
    }
  });

  return type;
}

/**
 * Synchronously determine the module type of the given filepath.
 *
 * @param  {String} filepath
 * @return {String|null}
 */
function sync(filepath) {
  if (! filepath) throw new Error('filename missing');

  var source = fs.readFileSync(filepath);

  return fromSource(source);
}

module.exports.fromAST = fromAST;
module.exports.fromSource = fromSource;
module.exports.sync = sync;
