# node-http-response-stack

Sometimes you need to make sure that the responses that your HTTP-Server emits are never chunked. An example where this is true if you are using node-spdy. Well then you need to sometimes buffer the response and correct it so that it is not chunked. Well normally you would do this in your request-handler, but what if one of them us node-proxy, well then you can't.

**So what you do is use node-http-response-stack!**

    var UnchunkedResponse = require('http-unchunk-stack').UnchunkedResponse;
    var server = require('http').createServer(function(req, res) {
      res = new UnchunkedResponse(res);
      // Do your stuff here
    }).listen(1234);

Yes it is that simple!
