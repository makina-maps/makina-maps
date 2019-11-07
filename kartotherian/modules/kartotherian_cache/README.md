[![Build Status](https://travis-ci.org/frodrigo/tilelive_kartotherian_cache.svg?branch=master)](https://travis-ci.org/frodrigo/tilelive_kartotherian_cache)

# Tilelive Kartotherian Cache
A cache tilelive module for Kartotherian. Adaptator over a Tile Storage Source.

For now cache with Redis included.

On Sources
```yaml
openmaptiles_v3_cache: # Redis Tiles Storage
  uri: redis://
  params:
    host: redis
    namespace: openmaptiles_v3_cache

openmaptiles_v3:
  uri: cache://
  params:
    source: {ref: openmaptiles_v3_overzoom} # Tiles Source
    storage: {ref: openmaptiles_v3_cache} # Cache Tiles Storage
    minzoom: 0 # Min zoom level to be cached
    maxzoom: 14 # Max zoom level to be cached
    http_headers: # Type the contcontent fetch from the cache, with any HTTP headers
      Content-Type: application/x-protobuf
      # Content-Type: image/png
      x-tilelive-contains-data: true
      Content-Encoding: gzip
```

See [Kartotherian](https://github.com/kartotherian/kartotherian)
