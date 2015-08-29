'use strict'

var createStream = require('./index.js')
var stream = require('stream')
var test = require('tape')

test('never has >maxBacklog items in it', function (assert) {
  var rs = createStream({maxBacklog: 10, objectMode: true})
  var ws = stream.Writable({objectMode: true})
  ws._write = function (chunk, enc, ready) {
    return ready()
  }
  for (var i = 0; i < 11; ++i) {
    rs.write(i)
  }
  assert.deepEqual(rs.backlog, [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  ])
  rs.pipe(ws)
  setImmediate(function () {
    assert.deepEqual(rs.backlog, [])
    assert.end()
  })
})

test('responds to backpressure', function (assert) {
  var rs = createStream({maxBacklog: 5, objectMode: true})
  var ws = stream.Writable({objectMode: true, highWaterMark: 0})
  ws._write = function (chunk, enc, ready) {
    return ready()
  }
  rs.pipe(ws)
  setImmediate(function () {
    for (var i = 0; i < 11; ++i) {
      rs.write(i)
    }
    assert.deepEqual(rs.backlog, [6, 7, 8, 9, 10])
    assert.end()
  })
})

test('downstream gets events in expected order', function (assert) {
  var rs = createStream({maxBacklog: 1, objectMode: true})
  var ws = stream.Writable({objectMode: true, highWaterMark: 0})
  ws._write = function (chunk, enc, ready) {
    return ready()
  }
  rs.pipe(ws)
  setImmediate(function () {
    for (var i = 0; i < 11; ++i) {
      rs.write(i)
    }
    assert.deepEqual(rs.backlog, [10])
    assert.end()
  })
})

test('it is pipe-able', function (assert) {
  var rs = stream.Readable({objectMode: true, highWaterMark: 0})
  var txf = createStream({objectMode: true, maxBacklog: 5})
  var times = 0
  var items = [0, 0, 0]
  rs._read = function (n) {
    this.push(items[times % 5] = Math.random())
    if (++times >= 10) {
      this.push(null)
    }
  }
  rs.pipe(txf)
    .on('data', collectData)
    .on('finish', ensureFinish)
    .on('end', ensureEnd)

  var received = []
  var evOrder = 0

  function collectData (datum) {
    received.push(datum)
  }

  function ensureFinish () {
    ++evOrder
  }

  function ensureEnd () {
    ++evOrder
    assert.equal(evOrder, 2)
    assert.deepEqual(received, items)
    assert.end()
  }
})

test('should throw an error on write callback', function (assert) {
  var rs = createStream({objectMode: true, maxBacklog: 5})
  assert.throws(function () {
    rs.write('anything', 'utf8', function () {
    })
  })
  assert.end()
})

test('should throw an error on end callback', function (assert) {
  var rs = createStream({objectMode: true, maxBacklog: 5})
  assert.throws(function () {
    rs.end('anything', 'utf8', function () {
    })
  })
  assert.end()
})

test('default numbers', function (assert) {
  var rs = createStream(10)
  assert.equal(rs.maxBacklog, 10)
  assert.end()
})

test('should throw an error if maxBacklog is not given', function (assert) {
  assert.throws(function () {
    createStream()
  })
  assert.throws(function () {
    createStream({})
  })
  assert.end()
})

test('double end nops', function (assert) {
  var rs = createStream(10)
  var count = 0
  rs.on('finish', function () {
    ++count
  })
  rs.end()
  rs.end()
  assert.equal(count, 1)
  assert.end()
})

test('unpipe halts stream if stream was flowing due to pipe', function (assert) {
  var rs = createStream(10)
  var ws = stream.Writable({objectMode: true})
  ws._write = function (chunk, enc, ready) {
    return setImmediate(ready)
  }
  ws.once('unpipe', function () {
    rs.write(1)
    assert.equal(rs.backlog.length, 1)
    assert.equal(rs.backlog[0], 1)
    assert.end()
  })
  rs.pipe(ws)
  rs.unpipe()
})

test('unpipe does not halt stream if stream is still flowing', function (assert) {
  var rs = createStream(10)
  var ws = stream.Writable({objectMode: true})
  var ws2 = stream.Writable({objectMode: true})
  ws.name = 'ws1'
  ws2.name = 'ws2'
  ws2._write = ws._write = function (chunk, enc, ready) {
    console.log(this.name, chunk)
    return setImmediate(ready)
  }
  ws.once('unpipe', function () {
    rs.write(1)
    assert.deepEqual(rs.backlog, [1])
    setImmediate(function () {
      assert.deepEqual(rs.backlog, [])
      assert.end()
    })
  })
  rs.pipe(ws)
  rs.unpipe(ws)
})

test('pause halts stream', function (assert) {
  assert.end()
})
