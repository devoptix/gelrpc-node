var rpc = require('../../lib/stream.js');
var serializer = require('../../lib/serializer.js');
var test = require('tape');

var obj = {
  hello: function (name, cb) {
    cb(null, 'HI, ' + name);
  }
};

test('prefix', function (t) {
  
  var EOL = '\r\n';

  var countUnprefixed = 0;
  var textUnprefixed = 'Please accept this gift of ' +
    'an un-prefixed line of text!';
  var countSendUnprefixed = 3;
  
  function onPrefixMissing(err, line) {
    countUnprefixed += 1;
    //console.log('  ' + line);
  }
  
  var opts = {
    EOL: EOL,
    prefix: '@gelrpc:',
    prefixMissing: onPrefixMissing
  };
  
  var a = rpc(obj, opts);
  b = rpc(null, opts);
  
  //a and b are streams. connect them with pipe.
  b.pipe(a).pipe(b);
  
  var i = 0;
  for (; i < countSendUnprefixed; i++)
    b.write(textUnprefixed + EOL);
  t.equal(countUnprefixed, countSendUnprefixed, 'received all unprefixed lines.');
  
  b.rpc('hello', ['JIM'], function (err, message) {
    t.error(err, 'no error');
    t.equal(message, 'HI, JIM', 'message recieved');
  });
  
  var B = b.wrap('hello');
  B.hello('JIM', function (err, message) {
    t.error(err, 'no error');
    t.equal(message, 'HI, JIM', 'message recieved');
    t.end();
  });

});
