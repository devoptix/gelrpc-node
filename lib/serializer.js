'use strict';

var EventEmitter = require('events').EventEmitter;
var gelrpc = require('./index.js');

function serializer(wrapper) {
  if ('function' == typeof wrapper)
    return wrapper;
  return serializer[wrapper] || serializer.json;
}
module.exports = serializer;
gelrpc.serializer = serializer;

function emptyCallback(err, result) { };

serializer.json = function (stream, opts) {
  opts = opts || {};
  
  var end = stream.end;
  var write = stream.write;
  var lastLine = '';
  
  var EOL = opts.EOL || '\n';
  var _JSON = opts.JSON || JSON;

  var prefix = opts.prefix || '';
  var usePrefix = (typeof prefix === 'string' && prefix.length > 0);
  var cbNoPrefix = opts.prefixMissing || emptyCallback;
  
  function onData(data) {
    var lines = (lastLine + data).split(EOL);
    lastLine = lines.pop();
    while (lines.length) {
      parseAndWrite(lines.shift());
    }
  }
  stream.write = onData;
  
  function onEmit(event, data) {
    if (event == 'data') {
      // Stringify Data, Possibly Add Prefix
      data = (usePrefix ? prefix : '') +
        _JSON.stringify(data) + 
        EOL;
    }
    EventEmitter.prototype.emit.call(stream, event, data);
  }
  stream.emit = onEmit;
  
  function onEnd(data) {
    if (data)
      stream.write(data);
    if (lastLine) {
      parseAndWrite(lastLine);
    }
    return end.call(stream);
  }
  stream.end = onEnd;

  function parseAndWrite(line) {
    var js;
    if (usePrefix) {
      // Check Prefix, Possibly Redirect
      if (!line.startsWith(prefix)) {
        cbNoPrefix(null, line);
        return;
      }
      // Remove Prefix
      line = line.substr(prefix.length);
  }
    try {
      js = _JSON.parse(line);
    } catch (err) {
      err.line = line;
      return stream.emit('error', err);
    }
    if (js !== undefined)
      write.call(stream, js);
  }
  
  return stream;
};

serializer.raw = function (stream) {
  return stream;
};
