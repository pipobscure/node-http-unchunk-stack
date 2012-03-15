var util = require('util');
var StreamStack = require('stream-stack').StreamStack;

var UnchunkedResponse = exports.UnchunkedResponse = function UnchunkedResponse(response) {
  StreamStack.call(this, response);
  Object.defineProperty(this, 'response', { value:response });
  Object.defineProperty(this, 'statusCode', { get:function() { return response.statusCode; }, set:function(statusCode) { return response.statusCode=statusCode; } });
  Object.defineProperty(this, 'statusMessage', { get:function() { return response.statusMessage; }, set:function(statusMessage) { return response.statusMessage=statusMessage; } });
  this.setHeader = response.setHeader.bind(response);
  this.getHeader = response.getHeader.bind(response);
  this.removeHeader = response.removeHeader.bind(response);
};
util.inherits(UnchunkedResponse, StreamStack);

UnchunkedResponse.prototype.writeHead = function writeHead(statusCode, statusMessage, headers) {
  this.response.statusCode = statusCode;
  if (!headers && ('object' == typeof statusMessage)) {
    headers = statusMessage;
    statusMessage = undefined;
  }
  var that = this;
  headers = headers || {};
  Object.keys(headers).forEach(function(name) { that.setHeader(name.toLowerCase(), headers[name]); });
	if (this.getHeader('transfer-encoding') &&  (this.getHeader('transfer-encoding').toLowerCase() == 'chunked')) this.removeHeader('transfer-encoding');
	if (this.getHeader('content-length')) return this.response.writeHead(statusCode, statusMessage);
	
	this.chunked = [];
  this.response.statusMessage = statusMessage;
};
UnchunkedResponse.prototype.write = function write(chunk, encoding) {
	if (!this.chunked && (!this.getHeader('content-length') || (this.getHeader('transfer-encoding') &&  (this.getHeader('transfer-encoding').toLowerCase() == 'chunked')))) {
		this.removeHeader('transfer-encoding');
		this.chunked = [];
	}
  if (!this.chunked) return this.response.write(chunk, encoding);
  if (!Buffer.isBuffer(chunk)) chunk = new Buffer(chunk, encoding);
  return this.chunked.push(chunk);
};
UnchunkedResponse.prototype.end = function end(chunk, encoding) {
  if (!this.chunked) return this.response.end(chunk, encoding);
  if (chunk) this.write(chunk, encoding);
  var length = 0;
  this.chunked.forEach(function(chunk) { length += chunk.length; });
  this.response.setHeader('content-length',String(length));
  this.response.writeHead(this.response.statusCode, this.response.statusMessage);
  this.chunked.forEach(this.response.write.bind(this.response));
  return this.response.end();
};

UnchunkedResponse.prototype.writeContinue = function writeContinue() {};
UnchunkedResponse.prototype.addTrailers = function() {};
