[![Build Status](https://travis-ci.org/frodrigo/tilelive_kartotherian_cache.svg?branch=master)](https://travis-ci.org/frodrigo/tilelive_kartotherian_cache)

# Tilelive Kartotherian Cache
A cache tilelive module for Kartotherian. For now cached with Redis.

See [Kartotherian](https://github.com/kartotherian/kartotherian)

## Configuration

Available configuration options: https://github.com/NodeRedis/node_redis#options-object-properties

Configuration into Kartotherian `config.yaml`
```yaml
services:
  - name: kartotherian
    conf:
      cache:
        redis:
          host: localhost
```
