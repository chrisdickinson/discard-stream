'use strict'

module.exports = BacklogStream

var stream = require('stream')
var List = require('./list')
var Readable = stream.Readable

function BacklogStream (opts) {
  if (!(this instanceof BacklogStream)) {
    return new BacklogStream(opts)
  }

  if (typeof opts === 'number') {
    opts = {maxBacklog: opts, highWaterMark: 0, objectMode: true}
  }

  if (!('maxBacklog' in opts)) {
    throw new Error('"maxBacklog" is a required value.')
  }

  // we're keeping our own buffer, do not attempt
  // to fill in advance
  opts.highWaterMark = 0
  Readable.call(this, opts)

  // it is halloween and our readable stream is going
  // out as a duplex stream 👻
  this.writable = true
  this._reading = false
  this._ending = false
  this.maxBacklog = opts.maxBacklog
  this._backlog = new List()
  this.on('pause', function () {
    this._reading = false
  })
}

var cons = BacklogStream
var proto = cons.prototype = Object.create(Readable.prototype, {
  constructor: {
    value: cons,
    enumerable: false
  },
  backlog: {
    get: getBacklog,
    configurable: false,
    enumerable: false
  },
  _admonition: {
    value:
      ' callbacks are not supported by ' + cons.name + '\n' +
      'all writes are synchronous, consider listening on "data" instead.',
    enumerable: false
  }
})

proto.write = function (chunk, enc, ready) {
  if (ready) {
    throw new Error('write' + this._admonition)
  }
  if (this._reading) {
    this._reading = this.push(chunk)
    return true
  }
  this._backlog.push(chunk)
  while (this._backlog.length > this.maxBacklog) {
    this.emit('discard', this._backlog.shift())
  }
  return true
}

proto.end = function (chunk, enc, ready) {
  if (ready) {
    throw new Error('end' + this._admonition)
  }
  if (this._ending) {
    return
  }
  this._ending = true
  this.writable = false
  this.push(null)
  this.emit('finish')
}

proto._read = function (n) {
  this._reading = true
  while (this._reading && this._backlog.length) {
    this._reading = this.push(this._backlog.shift())
  }
}

proto.unpipe = function () {
  var value = Readable.prototype.unpipe.apply(this, arguments)

  // if we're piped to multiple destinations, pipeOnDrain will trigger a _read
  // and all will be well, so let's play it safe and set _reading=false until
  // we get a _read call.
  this._reading = false
  return value
}

function getBacklog () {
  var current = this._backlog._head
  var out = []
  while (current) {
    out.push(current.item)
    current = current.next
  }
  return out
}
