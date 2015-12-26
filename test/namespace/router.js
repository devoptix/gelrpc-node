var gelrpc = require('../../index.js');
var test = require('tape');

test('router-ns', function (t) {

  var obj = {
    hello: hello,
    child: {
      hello: hello,
      child: { hello: hello }
    }
  };
  var helloCount = 0;
  var helloCountExpected = 3;
  function hello(name, cb) {
    helloCount += 1;
    cb(null, 'HI, ' + name);
  }
  
  var route = gelrpc.router.tree(obj);

  var a = gelrpc.stream(route);
  b = gelrpc.stream();
  
  //a and b are streams. connect them with pipe.
  b.pipe(a).pipe(b);
  
  b.rpc('hello', ['ROOT'], function (err, message) {
    t.error(err, 'no error');
    t.equal(message, 'HI, ROOT', 'message recieved');
  });

  b.rpc('child/hello', ['CHILD'], function (err, message) {
    t.error(err, 'no error');
    t.equal(message, 'HI, CHILD', 'message recieved');
  });

  b.rpc('child/child/hello', ['CHILD/CHILD'], function (err, message) {
    t.error(err, 'no error');
    t.equal(message, 'HI, CHILD/CHILD', 'message recieved');

    t.equal(helloCount, helloCountExpected, 'all messages in tree received.');
    t.end();
  });

});
