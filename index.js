var util = require('util');
var StreamStack = require('stream-stack').StreamStack;

exports.UnchunkedResponse = function UnchunkedResponse(response) {
  StreamStack.call(this, response);
  Object.setProperty(this, 'response', { value:response });
	Object.setProperty(this, 'statusCode', { get:function() { return response.statusCode; }, set:function(statusCode) { return response.statusCode=statusCode; } });
	Object.setProperty(this, 'statusMessage', { get:function() { return response.statusMessage; }, set:function(statusMessage) { return response.statusMessage=statusMessage; } });
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
  Object.keys(headers).forEach(function(name) {
    if ((name.toLowerCase() != 'transfer-encoding') || (headers[name].toLowerCase() != 'chunked')) return that.setHeader(name.toLowerCase(), headers[name]);
		that.chunked = true;
		that.setHeader('transfer-encoding','identity');
  });
	this.chunked = this.chunked && this.response.getHeader('content-length');
	if (!this.chunked) return this.writeHead(statusCode, statusMessage);
	this.chunked = [];
	this.response.statusMessage = statusMessage;
};
UnchunkedResponse.prototype.write = function write(chunk, encoding) {
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
