# Kartotherian Source List requestHandlers

The Source List handling components of the Kartotherian maps tile service

Returns the list of the public source tiles as Tile JSON URLs.

See [Kartotherian](https://github.com/kartotherian/kartotherian)

## Configuration

```yaml
services:
  - name: kartotherian
    conf:

      sources_server:
        prefix_public: http://localhost:6533 # External hostname, should be changed to https://example.com
```
