const Promise = require('bluebird');
const Err = require('@kartotherian/err');
const checkType = require('@kartotherian/input-validator');

const redis = require('redis');

let core;

Cache.prototype._redisClient = function (cacheClient) {
    var cache = cacheClient || redis.createClient({ return_buffers: true });
    return {
        get: (k, cb) => {
            if (cache.command_queue.length >= cache.command_queue_high_water) {
                return cb(new Error('Redis command queue at high water mark'));
            }
            cache.get(k, cb);
        },
        set: (k, t, v, cb) => {
            cache.setex(k, t, v, cb);
        },
        error: (err) => {
            console.error(err); // eslint-disable-line no-console
        },
        redis: cache
    };
};

function Cache(uri, callback) {
    return Promise.try(() => {
        let params = checkType.normalizeUrl(uri).query;
        if (!params.source) {
            throw new Err("Uri must include 'source' query parameter: %j", uri);
        }
        checkType(params, 'ttl', 'integer', 60 * 60 * 60 * 24);
        this.params = params;
        return core.loadSource(params.source);
    }).then((handler) => {
        this.source = handler;

        let cacheClient;
        if (core.getConfiguration().cache.redis) {
            core.getConfiguration().cache.redis.return_buffers = true;
            cacheClient = redis.createClient(core.getConfiguration().cache.redis);
        }
        this.cache = Cache.prototype._redisClient(cacheClient);

        this.source.getInfo((_, info) => {
            this.sourceName = info.name;
        });
    }).return(this).nodeify(callback);
}

Cache.prototype.getTile = function (z, x, y, callback) {
    const key = `${this.sourceName}/${z}/${x}/${y}`;
    this.cache.get(key, (err, tile_cached) => {
        if (tile_cached !== null) {
            return callback(undefined, tile_cached, {
                "Content-Type": "application/x-protobuf",
                "x-tilelive-contains-data": true,
                "Content-Encoding": "gzip"
            });
        } else {
            return this.source.getTile(z, x, y, (err, tile, options) => {
                if (tile !== undefined) {
                    this.cache.set(key, this.params.ttl, tile);
                }
                return callback(err, tile, options);
            });
        }
    });
};

Cache.prototype.getInfo = function (callback) {
    return this.source.getInfo(callback);
};

Cache.initKartotherian = (cor) => {
    core = cor;
    core.tilelive.protocols['cache:'] = Cache;
};

module.exports = Cache;
