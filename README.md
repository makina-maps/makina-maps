# Makina Maps

Vector Tiles server based on [OpenMapTiles](https://github.com/openmaptiles/openmaptiles) and [Kartotherian](Kartotherian) with the ability to:

* Build Vector Tiles on Demand from the OpenMapTiles database
* Served Mapbox GL Style, with sprites and fonts
* Render Raster version of Mapbox GL style
* Cache vector and Raster tiles

## Install

```
git clone
git submodule update --init --recursive
ln -s Klokantech\ Noto\ Sans\ Bold fonts/Noto\ Sans\ Bold
ln -s Klokantech\ Noto\ Sans\ Regular fonts/Noto\ Sans\ Regular
```

### OpenStreetMap load

Import generic data
```
cd openmaptiles
docker-compose up -d postgres && \
docker-compose run --rm import-water && \
docker-compose run --rm import-osmborder && \
docker-compose run --rm import-natural-earth && \
docker-compose run --rm import-lakelines
```

Download OpenStreetMap extract:
```
wget http://download.geofabrik.de/europe/andorra-latest.osm.pbf -P openmaptiles/data/
```

Import OpenStreetMap data

Force to clean previously imported OpenStreetMap data.
```
docker-compose up -d postgres
docker-compose exec postgres psql openmaptiles openmaptiles -c "
DROP SCHEMA backup CASCADE
"
```

Time the import of a pbf from data directory
```
cd openmaptiles && \
time bash -c "\
docker-compose run --rm import-osm && \
docker-compose run --rm import-wikidata && \
docker-compose run --rm import-sql && \
make psql-analyze
"
```

### Run the tiles server

```
docker-compose -p openmaptiles -f docker-compose.yml up
```

The direct acces to cached tiles and services at:

* OpenMapTiles TileJson: http://0.0.0.0:6534/v3/info.json
* Default "Basic" GL JSON Style: http://0.0.0.0:6534/styles/basic/style.json
* Default "Basic" raster:
  * TileJSON: http://0.0.0.0:6533/basic/info.json
  * Raster tiles: http://0.0.0.0:6533/basic/{z}/{x}/{y}.png
  * Demo: http://0.0.0.0:6533/?s=basic

### Configuration

Configuration files are Kartotherian configuration files `config.yaml` and `sources.yaml`.

#### config.yaml

Specific configuration part.

```yaml
services:
  - name: kartotherian
      modules:
      - "tilelive-tmstyle"
      - "@kartotherian/overzoom"
      - "@kartotherian/substantial"
      - "@kartotherian/tilelive-tmsource"
      - "@mapbox/tilejson"
      - kartotherian_cache # Local cache
      - "kartotherian_cache/RedisStore" # Redis cache Storage
      - kartotherian_gl # Render raster tiles

      requestHandlers:
      - kartotherian_gl_style_server # Serve Mapbox GL Style

      styles:
        prefix_public: http://localhost:6533 # External hostname, should be changed to https://example.com
        prefix_internal: http://kartotherian:6533 # Internal, required for render raster
        paths:
          styles: /styles # Path to styles, in the Docker container
          fonts: /fonts # Path to fonts, in the Docker container
        styles:
          basic: # Name of the style
            style: klokantech-basic-gl-style/style-local.json # Relative path the style JSON
            sources_map: # Map of the style source (`mbtiles://{v3}`) to source name from `sources.yaml`
              v3: openmaptiles_v3
            sources_map_internal: # Internal, required for render raster
              v3: openmaptiles_v3_raster
```

#### styles.yaml

Cache setup

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
```

Mapbox GL native raster

```yaml
source_name:
  uri: kartotherian+gl:///
  params:
    style: basic # Style defined in to `config.yaml`
```

## Benchmark

### Import size and time

Specific only on 8CPU (import-osm, import-sql and psql-analyze).

| Area | PBF size | Postgres size | Import time |
|-|-:|-:|-:|
| Andorra | 243 Ko | 3.5 Go | 36 s |
| Alsace | 100 Mo | 4.5 Go | 3 min 20 s |
| Aquitiane | 214 Mo | 6.4 Go | 6 min 40 s |
| Austria | 559 Mo | 9.4 Go | 23 min |
| France | 3.5 Go | 35 Go | 105 min |
| Europe | 20 Go | | | |

### Database

Data size of the current data.
```
docker-compose exec postgres psql openmaptiles openmaptiles -c "
SELECT
  pg_size_pretty(sum(pg_relation_size(pg_catalog.pg_class.oid))::bigint) as table_size
FROM
  pg_catalog.pg_class
  JOIN pg_catalog.pg_namespace ON
    relnamespace = pg_catalog.pg_namespace.oid
WHERE
  pg_catalog.pg_namespace.nspname = 'public';
"
```

Show log query
```sql
ALTER DATABASE openmaptiles SET log_min_duration_statement = 100;
```
