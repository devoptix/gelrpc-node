'use strict';

var gelrpc = require('./index.js');

function router(wrapper) {
  if ('function' == typeof wrapper)
    return wrapper;
  return router[wrapper] || router.flat;
}
module.exports = router;
gelrpc.router = router;

function callable(k, obj) {
  return function (args, cb) {
    return obj[k].apply(obj, cb ? args.concat(cb) : args);
  };
}

function getObjPath(obj, path) {
  if (Array.isArray(path)) {
    for (var i in path)
      obj = obj[path[i]];
    return obj;
  }
  return obj[path];
}
/** Routes to a single object's methods. */
router.flat = function(obj) {
  var local = {};
  if (obj) {
    for (var k in obj)
      local[k] = callable(k, obj);
  }
  function route(name, args, cb) {
    local[name].call(obj, args, cb);
  }
  route.add = function addRoute(name, fn) {
    local[name] = fn;
  };
  return route;
}

/** Routes to a tree of objects starting from a single root object. */
router.tree = function (obj) {
  function route(path, args, cb) {
    var parts = ('' + path).split(route.splitOn);
    var obj2 = getObjPath(obj, parts);
    obj2.call(obj2, args, cb);
  }
  route.splitOn = '/';
  route.add = function addRoute(path, fnOrObj) {
    var parts = ('' + path).split(route.splitOn);
    var obj2 = getObjPath(obj, path);
    obj2[name] = fnOrObj;
  };
  return route;
};
