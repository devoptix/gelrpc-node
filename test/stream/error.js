var rpc = require('../../lib/stream.js');
var test = require('tape');

test('error', function (t) {
  t.plan(4);

  var b = rpc();
  b.pipe(rpc({
    hello: function (useCode, cb) {
      var err;
      if (useCode)
        err = 200;
      else {
        err = new Error('oops');
        err.foo = 'bar';
      }
      cb(err);
    }
  })).pipe(b);

  var hello = b.createRemoteCall('hello');
  
  hello(false, function (err) {
    t.ok(err instanceof Error, 'instanceof');
    t.equal(err.message, 'oops', 'message');
    t.equal(err.foo, 'bar', 'custom properties');
  });

  hello(true, function (err) {
    t.ok(typeof err === 'number', 'typeof');
  });
});
