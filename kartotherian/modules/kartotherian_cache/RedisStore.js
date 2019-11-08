/*
 RedisStore is a Redis tile storage source for Kartotherian
 */

const Promise = require('bluebird');
const checkType = require('@kartotherian/input-validator');
const Err = require('@kartotherian/err');
const redis = require('redis');

let core;

function RedisStore(uri, callback) {
  return Promise.try(() => {
    const params = checkType.normalizeUrl(uri).query;
    if (!params.namespace) {
      throw new Err("Uri must include 'namespace' query parameter: %j", uri);
    }
    checkType(params, 'namespace', 'string');
    checkType(params, 'ttl', 'integer', 60 * 60 * 60 * 24);
    this.params = params;

    this.params.return_buffers = true;
    return redis.createClient(this.params);
  }).then((cacheClient) => {
    this.redis = RedisStore.prototype._redisClient(cacheClient);
  }).return(this).nodeify(callback);
}

RedisStore.prototype._redisClient = function (cacheClient) {
  const cache = cacheClient || redis.createClient({ return_buffers: true });
  return {
    get: (k, cb) => {
      if (cache.command_queue.length >= cache.command_queue_high_water) {
        cb(new Error('Redis command queue at high water mark'));
      }
      cache.get(k, cb);
    },
    set: (k, t, v, cb) => {
      cache.setex(k, t, v, cb);
    },
    del: (k, cb) => {
      cache.del(k, cb);
    },
    error: (err) => {
      console.error(err); // eslint-disable-line no-console
    },
    redis: cache,
  };
};

RedisStore.prototype.putTile = function (z, x, y, tile, callback) {
  return Promise.try(() => {
    const key = `${this.params.namespace}/${z}/${x}/${y}`;
    if (tile === null) {
      this.redis.del(key, (err) => {
        if (err) {
          throw err;
        }
      });
    } else {
      this.redis.set(key, this.params.ttl, tile, (err, res) => {
        if (err) {
          throw err;
        }
      });
    }
  });
};

RedisStore.prototype.getTile = function (z, x, y, callback) {
  const key = `${this.params.namespace}/${z}/${x}/${y}`;
  this.redis.get(key, (err, tileCached) => {
    if (tileCached !== null) {
      return callback(undefined, tileCached, {
        'Content-Type': 'application/x-protobuf',
        'x-tilelive-contains-data': true,
        'Content-Encoding': 'gzip',
      });
    }

    return callback({ message: 'Tile does not exist' }, null, {});
  });
};

RedisStore.prototype.getInfo = function (callback) {
  return Promise.try(() => ({
    tilejson: '2.1.0',
    name: 'RedisStore',
    bounds: '-180,-85.0511,180,85.0511',
  })).nodeify(callback);
};

RedisStore.prototype.startWriting = function (callback) {
  return callback(null);
};

RedisStore.prototype.stopWriting = function (callback) {
  return callback(null);
};


RedisStore.initKartotherian = function initKartotherian(cor) {
  core = cor;
  core.tilelive.protocols['redis:'] = RedisStore;
};

Promise.promisifyAll(RedisStore.prototype);
module.exports = RedisStore;
