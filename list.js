'use strict'

module.exports = List

function List () {
  /* istanbul ignore next */
  if (!(this instanceof List)) {
    return new List()
  }
  this._head = null
  this._tail = null
  this.length = 0
}

List.prototype.push = function (item) {
  return (this.length ? pushN : pushEmpty)(this, item)
}

/*
List.prototype.pop = function () {
  return (this.length === 1 ? shiftOne : popN)(this)
}
*/

List.prototype.shift = function () {
  return (this.length === 1 ? shiftOne : shiftN)(this)
}

function pushEmpty (list, item) {
  list._head = list._tail = new Node(item, null)
  list.length = 1
}

function pushN (list, item) {
  list._tail = new Node(item, list._tail)
  list._tail.prev.next = list._tail
  ++list.length
}

function shiftOne (list) {
  var node = list._head
  var item = node.item
  node.next =
  list._tail =
  list._head =
  node.item = null
  list.length = 0
  return item
}

function shiftN (list) {
  var node = list._head
  var item = node.item
  list._head = node.next
  node.next = node.next.prev = node.item = null
  --list.length
  return item
}

/*
function popN (list) {
  var node = list._tail
  var item = node.item
  list._tail = node.prev
  node.prev = node.prev.next = node.item = null
  --list.length
  return item
}
*/

function Node (item, prev) {
  this.next = null
  this.prev = prev
  this.item = item
}
