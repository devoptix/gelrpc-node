'use strict';

var tape = require('tape');
var through = require('through');
var serialize = require('../../lib/serializer.js');

tape('error', function (t) {
  var emitted = false;

  var ss = serialize()(through(function (data) {
    emitted = true;
  }));

  ss.on('error', function (err) {
    t.equal(err.line, "ERROR");
    t.notOk(emitted);
    t.end();
  });
  ss.write('ERROR\n');
});
