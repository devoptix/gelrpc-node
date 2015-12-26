'use strict';

var through = require('through');
var gelrpc = require('./index.js');
var serialize = require('./serializer.js').json;
var router = require('./router.js').flat;

/** Maximum request id value (9007199254740991) */
var MAX_REQUEST_ID = Number.MAX_SAFE_INTEGER;

module.exports = stream;
gelrpc.stream = stream;

function stream(obj, opts) {
  if (typeof opts === 'boolean')
    opts = { raw: opts };
  opts = opts || {};
  var cbs = {};
  var count = 0;
  
  var route = !obj || typeof obj === 'function' ? obj : 
    router(obj);
    
  var s = through(function (data) {
    data = data.slice();
    var i = data.pop();
    var args = data.pop();
    var name = data.pop();
    var cb;
    var hasCb = (i > 0);

    var fnFlattenError = opts.flattenError || flattenError;
    
    if (typeof name === 'string') {
      // Handle Request
      var called = 0;
      cb = function () {
        if (called++)
          return;
        if (!hasCb)
          return;
        // Respond
        var args = [].slice.call(arguments);
        if (args[0])
          args[0] = fnFlattenError(args[0]);
        s.emit('data', [args, i]);
      };
      try {
        // Route Request
        route(name, args, cb);
      } catch (reqErr) {
        // Unhandled Request Error
        if (hasCb)
          s.emit('data', [[fnFlattenError(reqErr)], i]);
      }
    } else {
      // Handle Response
      try {
        if (args[0])
          args[0] = expandError(args[0]);
        cb = cbs[i];
        if (!cb) {
          // Missing Callback
          throw new Error('Callback not found: ' + i);
        }
      } catch (respErr) {
        //console.error('ERROR: ' + respErr.message, data);
        respErr.data = data;
        s.emit('rpc-error', respErr);
      }
      // Call Back
      delete cbs[i];
      cb.apply(null, args);
    }
  });
  
  var rpc = s.rpc = function (name, args, cb) {
    if (cb)
      cbs[++count] = cb;
    if (typeof name !== 'string')
      throw new Error('Argument `name` must be string.');
    s.emit('data', [name, args, cb ? count : -1]);
    if (cb && count === MAX_REQUEST_ID)
      count = 0;
  };
  
  s.createRemoteCall = function (name) {
    return function () {
      var args = [].slice.call(arguments);
      var cb = (typeof args[args.length - 1] === 'function') ? 
        args.pop() : 
        null;
      rpc(name, args, cb);
    };
  };
  
  s.createLocalCall = function (name, fn) {
    if (!route) {
      obj = {};
      route = router(obj);
    }
    if (typeof route.add === 'function')
      route.add(name, fn);
  };
  
  s.wrap = function (remote, _path) {
    //_path = _path || [];
    var w = {};
    if (!Array.isArray(remote)) {
      if (typeof remote === 'string')
        remote = [remote];
      else
        remote = keys(remote);
    }
    remote.forEach(function (k) {
      w[k] = s.createRemoteCall(k);
    });
    return w;
  };
  if (opts.raw)
    return s;
  
  if (opts.EOL || opts.prefix)
    return serialize(s, {
      EOL: opts.EOL, 
      prefix: opts.prefix,
      prefixMissing: opts.prefixMissing
    });
  else
    return serialize(s);
}

function expandError(err) {
  if (!err || !err.message)
    return err;
  var err2 = new Error(err.message);
  for (var k in err)
    err2[k] = err[k];
  return err2;
}

function flattenError(err) {
  if (!(err instanceof Error))
    return err;
  var err2 = {
    message: err.message
  };
  if (typeof err.stack === 'string' && err.stack.length > 0)
    err2.stack = err.stack;
  for (var k in err)
    err2[k] = err[k];
  return err2;
}

function keys(obj) {
  var values = [];
  for (var k in obj)
    values.push(k);
  return values;
}
