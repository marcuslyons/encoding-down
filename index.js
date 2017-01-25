'use strict'

var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
var AbstractChainedBatch = require('abstract-leveldown').AbstractChainedBatch
var AbstractIterator = require('abstract-leveldown').AbstractIterator
var inherits = require('util').inherits
var Codec = require('level-codec')

module.exports = DB

function DB (db, opts) {
  if (!(this instanceof DB)) return new DB(db, opts)
  AbstractLevelDOWN.call(this, '')
  this.db = db
  this.codec = Codec(opts)
}

inherits(DB, AbstractLevelDOWN)

DB.prototype._open = function (opts, cb) {
  this.db.open(opts, cb)
}

DB.prototype._close = function (cb) {
  this.db.close(opts, cb)
}

DB.prototype._put = function (key, value, opts, cb) {
  key = this.codec.encodeKey(key, opts)
  value = this.codec.encodeValue(value, opts)
  this.db.put(key, value, opts, cb)
}

DB.prototype._get = function (key, opts, cb) {
  var self = this
  key = this.codec.encodeKey(key, opts)
  this.db.get(key, opts, function (err, value) {
    if (err) return cb(err)
    value = self.codec.decodeValue(value, opts)
    cb(null, value)
  })
}

DB.prototype._del = function (key, opts, cb) {
  key = this.codec.encodeKey(key, opts)
  this.db.del(key, opts, cb)
}

DB.prototype._chainedBatch = function () {
  return new Batch(this)
}

DB.prototype._batch = function (ops, opts, cb) {
  ops = this.codec.encodeBatch(ops, opts)
  this.db.batch(ops, opts, cb)
}

DB.prototype._iterator = function (opts) {
  return new Iterator(this, opts)
}

function Iterator (db, opts) {
  AbstractIterator.call(this, db)
  this.codec = db.codec
  this.it = db.iterator(opts)
  this.opts = opts
}

inherits(Iterator, AbstractIterator)

Iterator.prototype._next = function (cb) {
  var self = this
  this.it.next(function (err, key, value) {
    if (err) return cb(err)
    key = self.codec.decodeKey(key, self.opts)
    value = self.codec.decodeValue(value, self.opts)
    cb(null, key, value)
  })
}

Iterator.prototype._end = function (cb) {
  this.it.end(cb)
}

Iterator.prototype.seek = function (target) {
  target = this.codec.encodeKey(target, this.opts)
  this.it.seek(target)
}

function Batch (db, codec) {
  AbstractChainedBatch.call(this, db)
  this.codec = db.codec
  this.batch = db.batch()
}

inherits(batch, AbstractChainedBatch)

Batch.prototype._put = function (key, value) {
  key = this.codec.encodeKey(key)
  value = this.codec.encodeValue(value)
  this.batch.put(key, value)
}

Batch.prototype._del = function (key) {
  key = this.codec.encodeKey(key)
  this.batch.del(key)
}

Batch.prototype._clear = function () {
  this.batch.clear()
}

Batch.prototype._write = function (opts, cb) {
  this.batch.write(opts, cb)
}
