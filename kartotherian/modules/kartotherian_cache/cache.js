const Promise = require('bluebird');
const Err = require('@kartotherian/err');
const checkType = require('@kartotherian/input-validator');

let core;

function Cache(uri, callback) {
  return Promise.try(() => {
    const params = checkType.normalizeUrl(uri).query;
    if (!params.source) {
      throw new Err("Uri must include 'source' query parameter: %j", uri);
    }
    checkType(params, 'minzoom', 'integer', 0, 0, 22);
    checkType(params, 'maxzoom', 'integer', 14, params.minzoom + 1, 22);
    this.params = params;

    // Why we need to loadSource in a promise ????
    Promise.try(() => core.loadSource(params.storage)).then((handler) => {
      this.cache = handler;
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
    core.metrics.increment('cache.out_fo_zoom');
    return this.source.getTile(z, x, y, callback);
  }

  return this.cache.getTile(z, x, y, (errCache, tileCache, optionsCache) => {
    if (errCache && errCache.message !== 'Tile does not exist') {
      core.metrics.increment('cache.cache_error');
      return callback(errCache, null, optionsCache);
    }

    if (tileCache) {
      core.metrics.increment('cache.found');
      return callback(null, tileCache, this.params.http_headers);
    }

    return this.source.getTile(z, x, y, (err, tile, options) => {
      core.metrics.increment('cache.miss');
      if (tile) {
        Promise.try(() => {
          this.cache.putTile(z, x, y, tile, (errPut) => {
            if (errPut) {
              throw errPut;
            }
          });
        });
      }
      return callback(err, tile, options);
    });
  });
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
