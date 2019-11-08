const Promise = require('bluebird');
const Err = require('@kartotherian/err');
const checkType = require('@kartotherian/input-validator');

let core;

function Cache(uri, callback) {
    return Promise.try(() => {
        let params = checkType.normalizeUrl(uri).query;
        if (!params.source) {
            throw new Err("Uri must include 'source' query parameter: %j", uri);
        }
        checkType(params, 'minzoom', 'integer', 0, 0, 22);
        checkType(params, 'maxzoom', 'integer', 14, params.minzoom + 1, 22);
        this.params = params;

        // Why we need to loadSource in a promise ????
        Promise.try(() => {
            return core.loadSource(params.storage);
        }).then((handler) => {
            this.cache = handler
            this.cache.startWriting((err) => {
                if (err) {
                    throw err;
                }
            });
        }).return(this);

        return core.loadSource(params.source);
    }).then((handler) => {
        this.source = handler;
    }).return(this).nodeify(callback);
}

Cache.prototype.getTile = function (z, x, y, callback) {
    if (z < this.params.minzoom || z > this.params.maxzoom) {
        return this.source.getTile(z, x, y, callback);
    } else {
        this.cache.getTile(z, x, y, (err, tile_cached, options) => {
            if (err && err.message != 'Tile does not exist') {
                return callback(err, null, options);
            }

            if (tile_cached) {
                return callback(null, tile_cached, this.params.http_headers);
            } else {
                return this.source.getTile(z, x, y, (err, tile, options) => {
                    if (tile) {
                        Promise.try(() => {
                            this.cache.putTile(z, x, y, tile, (err) => {
                                if (err) {
                                }
                                throw err;
                            });
                        });
                    }
                    return callback(err, tile, options);
                });
            }
        });
    }
};

Cache.prototype.getInfo = function (callback) {
    return this.source.getInfo(callback);
};

Cache.prototype.expireTile = function (z, x, y, callback) {
    this.cache.putTile(z, x, y, null, callback);
};

Cache.initKartotherian = (cor) => {
    core = cor;
    core.tilelive.protocols['cache:'] = Cache;
};

module.exports = Cache;
