# GelRpc for Node.js

*GelRpc* is a dead simple (~300 loc) rpc system that works over any 
full-duplex text/byte/json stream. It has one dependency - 
[through](https://github.com/dominictarr/through). Matching libraries for 
Python and .NET are planned.

Table of Contents
------------------
- [Usage](#usage)
  - [Over TCP](#over-tcp)
- [Message Protocol](#message-protocol)
  - [Message Types](#message-types)
  - [Message Framing](#message-framing)
- [API Reference](#api-reference)
  - [gelrpc.router](#gelrpcrouter)
  - [gelrpc.serializer](#gelrpcserializer)
  - [gelrpc.stream(route, opts)](#gelrpcstreamroute-opts)
  - [Class: Stream](#class-stream)
    - [stream.wrap(methodNames)](#streamwrapmethodnames)
    - [stream.rpc(name, args, cb)](#streamrpcname-args-cb)
    - [stream.pipe(stream)](#streampipestream)
- [Ports](#ports)
- [Credits](#credits)
- [WTF?](#wtf)

## Usage

*Install*

`npm install gelrpc`

*Example*

```js
var gelrpc = require('gelrpc');

// Create a server, that answers questions.
// Pass in functions that may be called remotely. (Alternatively, 
// you may pass a route function to gelrpc.stream.)
var server = gelrpc.stream({
  hello: function(name, cb) {
    cb(null, 'hello, ' + name);
  }
});

// Create a client, that asks questions.
var client = gelrpc.stream();

// Pipe them together!
client.pipe(server).pipe(client);

// Make a call without further ado.
client.rpc('hello', ['JIM'], function (err, message) {
  if (err)
    console.log('ERROR: ' + err);
  else if (message === 'hello, JIM')
    console.log('Got the message!');
});

// Or create a remote facade to call with.
var remote = client.wrap(['hello']);
remote.hello('JIM', function (err, mess) {
  if (err)
    console.log('ERROR: ' + err);
  else if (message === 'hello, JIM')
    console.log('Got the message!');
})
```

### Over TCP

*Server*

```js
net.createServer(function(con) {
  // Create one server per connection.
  var server = gelrpc.stream(/* ... */);
  server.pipe(con).pipe(server);
}).listen(3000));
```

*Client*

```js
var client = gelrpc.stream();
var con = net.connect(3000);
client.pipe(con).pipe(client);

var remote = client.wrap(['hola']);
remote.hola('steve', function(err, res) {
  console.log(res);
});
```

## Message Protocol

GelRpc is a stateless, light-weight remote procedure call (RPC) protocol. It is
not restricted to one serialization format, but JSON is the default and only 
implementation so far.

### Message Types

There are three basic message types: request, response and notification. 
A request has a method (or path) name, argument data and a request id. 
A response has result data and a request id. 
A notification has a method (or path) name, argument data and a request id 
value of `-1`. 

![Figure 1](/docs/resources/message-types.png)

### Message Framing

Each message frame is a simple array with 2 or 3 elements in it. In a stream
of JSON, each frame is separated by an EOL marker such as a line-feed.

## API Reference

### gelrpc.router

Documentation for `gelrpc.router` will be coming shortly.

### gelrpc.serializer

Documentation for `gelrpc.serializer` will be coming shortly.

### gelrpc.stream(route, opts)

Returns a [`Stream`](#class-stream) that will call methods when written to.

*Parameters*

- **`[route]`** *`Object`* - contains one key per callable function.
- **`[route]`** *`Function`* - accepts `(path, args, callback)` where `path` 
is a string, `args` any type and `callback` a standard Node.js error-first 
callback function.
- **`[opts]`** *`Object`* - contains one or more of the following options.
  - **`[EOL]`** *`String`* - end of line marker to use. Default: `'\n'`.
  - **`[flattenError]`** *`Function`* - accepts `(err)` and returns an object to 
  serialize.
  - **`[prefix]`** *`String`* - a value to use as an include-filter for each 
  `EOL`-separated line in the stream.
  - **`[raw]`** *`Boolean`* - when `true`, the default serializer which uses 
  `JSON.stringify` is disabled and you just get a stream of objects. Use this 
  if you want to do your own parsing and serializing.

### Class: Stream

A class that is derived from [`Stream`](https://nodejs.org/dist/latest-v4.x/docs/api/stream.html).

#### stream.wrap(methodNames)

Returns a wrapped object with the remote's methods.
The client needs to already know the names of the methods.
Accepts a string, and array of strings, or a object.
If it's an object, `wrap` will use the keys as the method names. 

*Example*

```js
// Create rpc stream around the fs module.
var fsrpc = gelrpc.stream(require('fs'));
// pipe, etc
```

Then, in another process...

```js
var fsrpc = gelrpc.stream();
// pipe, etc

// wrap, with the right method names.
var remoteFs = fsrpc.wrap(require('fs'));

remoteFs.mkdir('/tmp/whatever', function (err, dir) {
  // yay!
})

```

Now, the second process can call the `fs` module in the first process!
`wrap` does not use the methods for anything. It just wants the names.

#### stream.rpc(name, args, cb)

Directly send a call to the remote side without any wrapper function.

*Parameters*

- **`name`** *`String`* - name (or `'path/to/name'`) of a remote function.
- **`[args]`** *`Any`* - array of arguments to pass to the remote function.
- **`[cb]`** *`Function`* - a standard Node.js error-first callback that will 
be called when the remote side responds.

*Example*

``` js
var client = gelrpc.stream();
client.rpc('hello', [name], callback);
// Another way of sending the same remote call is by using a 
// wrapper function: 
client.wrap('hello').hello(name, callback);
```

#### stream.pipe(stream)

Read about piping streams 
[here](https://nodejs.org/dist/latest-v4.x/docs/api/stream.html#stream_readable_pipe_destination_options).

## Ports

(Coming Soon!)

*...*

## Credits

This project contains a fork of 
[Dominic Tarr](https://github.com/dominictarr)'s 
excellent 
[rpc-stream](https://github.com/dominictarr/rpc-stream/tree/ce0d7d76182d6e853bebba5666658d32299dc37d) 
and 
[stream-serializer](https://github.com/dominictarr/stream-serializer/tree/898849423f7033e78e5ce04e6e2ad2dc2b27ebbe) 
libraries, which form the core of this library. Thanks for your work!

## WTF?

(Why the Fork?)

I needed a single, tightly-coupled library that I can easily maintain instead 
of multiple loosely-coupled libraries that I don't control. This library will 
also be used in a larger library that it must be compatible with.
