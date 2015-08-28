# discard-stream

A transform stream that passes through writes by default, but only buffers up
to a certain number of pending writes when backpressure is applied. New writes
will push old writes out of the buffer, so no more than N writes can be pending
at a time.

This is especially useful for logging or metrics situations, where:

1. the data generated is of less value than keeping the process healthy,
2. and it is difficult or meaningless to apply backpressure to the generation of the data.

```javascript
var discardStream = require('discard-stream')

var myLogs = discardStream({
  maxBacklog: 100,
  objectMode: true
})
myLogs.pipe(fs.createWriteStream('some/slow/logs'))

myHighPerformanceWebserver.on('request', function (req, res) {
  myLogs.write(metrics)
})
```

```
// or use it as a transform:
someVeryFastMetricsStream()
  .pipe(discardStream(10))
  .pipe(someSlowTCPConnection())
```

## API

#### `discardStream(options) → DiscardStream`

Create a discard stream using the provided [stream options][stream-opts].
An additional options key, `maxBacklog`, is required. `maxBacklog` determines
the maximum number of written values to be retained during backpressure — any
writes _over_ `maxBacklog` will result in an old buffered value being discarded.

`options.highWaterMark` will be ignored — it is always set to 0.

**`DiscardStream`'s will never apply backpressure upstream.** They act as
infinite sinks for data.

#### `discardStream(number) → DiscardStream`

A shorthand for creating a discard stream with the following options:

```
discardStream({
  maxBacklog: number,
  highWaterMark: 0,
  objectMode: true
})
```

#### `DiscardStream#backlog`

Get the backlog of queued writes as an array.

## Events

#### `"discard"` (data)

Emitted when an old write is discarded in favor of a more recent write.
This is the last chance the user has to do something with `data`.

## License

ISC

[stream-opts]: https://iojs.org/api/stream.html#stream_new_stream_readable_options
