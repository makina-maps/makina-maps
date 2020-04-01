# Makina Maps

On Request Vector Tiles server based on [OpenMapTiles](https://github.com/openmaptiles/openmaptiles) and [TileServer GL](https://github.com/maptiler/tileserver-gl) with the ability to:

* Build Vector Tiles on Demand from the OpenMapTiles database
* Served Mapbox GL Style, with sprites and fonts
* Render Raster version of Mapbox GL style
* Cache vector and Raster tiles

![screen](screen.jpeg)

## Install

Install as system dependencies: git, make, docker and docker-compose.

### Clone Git reposittory

Get the project:
```
git clone --recurse-submodules https://github.com/makinacorpus/makina-maps.git
cd makina-maps
```

Get GL Json Styles et fonts:
```
mkdir -p tileserver-gl
git clone -b gh-pages https://github.com/openmaptiles/osm-bright-gl-style.git tileserver-gl/styles/osm-bright-gl-style
git clone -b gh-pages https://github.com/openmaptiles/klokantech-basic-gl-style.git tileserver-gl/styles/klokantech-basic-gl-style
git clone -b gh-pages https://github.com/openmaptiles/fonts.git
```

### Setup Docker images

Waiting for next OpenMapTiles Tools release, compile one module to allow usage of imposm config at import-osm step. From any directory:
```
git clone -b imposm-0.8.1 https://github.com/frodrigo/openmaptiles-tools.git
cd openmaptiles-tools/docker/import-osm
docker build -t openmaptiles/import-osm:3.1.0-imposm-0.8.1 .
cd ../../..
```

Fetch or build docker images:
```
docker-compose build
cd openmaptiles
# Ignore failures as we temporary provide an image manualy
docker-compose pull --ignore-pull-failures
```

### Prepare OpenMapTiles

Prepare OpenMapTiles configuration:
```
cd openmaptiles
make
```

## Import OpenStreetMap Data

### OpenMapTiles initial Load

Use the management scripts from `openmaptiles` directory.
```
cd openmaptiles
```

Import generic data, not from OpenStreetMap:
```
../scripts/10-import-generic.sh
```

Prepare import by download OpenStreetMap data and setup configuration for an area. The area names are from [Geofabrik](http://download.geofabrik.de/):
```
../scripts/20-import-prepare.sh europe/andorra
```

Import the OpenStreetMap extract from data directory:
```
../scripts/30-import-extract.sh
```

The scripts `20-import-prepare.sh` or `30-import-extract.sh` can be replayed with the same or other area.

### Update OpenMapTiles data

From the `openmaptiles` directory.

Run the updater. It loops over pending updates, then wait for new update.
```
../scripts/40-update.sh
```
You can stop with CTRL-C, it will quit at the end of the current update.

Imposm marks tiles to expire. Then a script in the nginx container watches and expires tiles in the nginx cache.


## Run the tiles server

From root directory. Start the OpenMapTiles database and the web server.
```
(cd openmaptiles && make db-start)
docker-compose up
```

Access to cached tiles and services at:

* Demo: http://0.0.0.0:8080
* OpenMapTiles TileJson: http://0.0.0.0:8080/openmaptiles/v3/info.json
* Default "Bright" GL JSON Style: http://0.0.0.0:8080/styles/bright/style.json
* Default "Bright" raster:
  * TileJSON: http://0.0.0.0:8080/bright/info.json
  * Raster tiles: http://0.0.0.0:8080/bright/{z}/{x}/{y}.png

## Configuration

Configuration files are Kartotherian configuration files `config.yaml` and `sources.yaml`.

### config.yaml

Specific configuration part.

```yaml
services:
  - name: kartotherian
      variables:
        OPENMAPTILES_V3_TILES_URLS:
        - http://localhost:8080/openmaptiles_v3/{z}/{x}/{y}.pbf
        - http://127.0.0.1:8080/openmaptiles_v3/{z}/{x}/{y}.pbf
        - http://[::1]:8080/openmaptiles_v3/{z}/{x}/{y}.pbf
        OPENMAPTILES_V3_TILES_URLS_INTERNAL:
        - http://nginx:80/openmaptiles_v3_raster/{z}/{x}/{y}.pbf
        BRIGHT_TILES_URLS:
        - http://localhost:8080/bright/{z}/{x}/{y}.png
        - http://127.0.0.1:8080/bright/{z}/{x}/{y}.png
        - http://[::1]:8080/bright/{z}/{x}/{y}.png

      modules:
      - "tilelive-tmstyle"
      - "@kartotherian/tilelive-tmsource"
      - "@mapbox/tilejson"
      - kartotherian_gl # Render raster tiles

      requestHandlers:
      - kartotherian_gl_style_server # Serve Mapbox GL Style
      - kartotherian_sources_list_server # Serve the list of sources

      sources_server:
        prefix_public: http://localhost:8080 # External hostname, should be changed to https://example.com

      styles:
        prefix_public: http://localhost:8080 # External hostname, should be changed to https://example.com
        prefix_internal: http://kartotherian:6533 # Internal, required for render raster
        paths:
          styles: /styles # Path to styles, in the Docker container
          fonts: /fonts # Path to fonts, in the Docker container
        font_fallback: Klokantech Noto Sans Regular # Serve this font when the font is not found
        styles:
          basic: # Name of the style
            style: klokantech-basic-gl-style/style-local.json # Relative path the style JSON
            sources_map: # Map of the style source (`mbtiles://{v3}`) to source name from `sources.yaml`
              v3: openmaptiles_v3
            sources_map_internal: # Internal, required for render raster
              v3: openmaptiles_v3_raster
```

### styles.yaml

Mapbox GL native raster

```yaml
source_name: # Unique source identifier
  public: true
  formats: [png, jpeg, webp]
  uri: kartotherian+gl:///
  params:
    style: bright # Style defined in to `config.yaml`
  overrideInfo:
    tiles: {var: BRIGHT_TILES_URLS} # From `config.yaml`

```


## Benchmark

### Import size and time

Specific only on 8 CPUs (import-osm, import-sql and psql-analyze, without docker pulling time).

| Area | PBF size | Imposm cache | Postgres size | Time 8 CPUs / SSD | Time 4 CPUs / HD | 1 d Update |
|-|-:|-:|-:|-:|-:|-:|
| Andorra | 243 Ko | 3.3 Mo | 3.5 Go | 36 s | 1 min 21 s | |
| Alsace | 100 Mo | 156 Mo | 4.5 Go | 3 min 20 s | 4 min 32 s | |
| Aquitaine | 214 Mo | 374 Mo | 6.4 Go | 6 min 40 s | 8 m 39 s | 1 min |
| Austria | 559 Mo | 781 Mo| 9.4 Go  | 23 min | 26 min 35 s | |
| France | 3.5 Go | | 35 Go | 105 min | 210 min 58 s | |
| Europe | 20 Go | 35 Go | 206 Go | 12 h 22 min | 3 d 23 h | 3 h |

### Database

Size of Imposm cache.
```
docker-compose run import-osm bash -c "du -h /cache/"
```

Size of the current database.
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

Show slow queries
```sql
ALTER DATABASE openmaptiles SET log_min_duration_statement = 100;
```

And grep slowest queries
```
docker logs openmaptiles_postgres_1 |& grep 'LOG:  duration:' | cut -d ':' -f 3- | sed 's/BOX3D([^)]*)//g' | sort -n
```

### Metrics

Server metrics could be available on StatsD / Graphite on http://localhost:8899

The metrics logs are not used by default and could be enabled by adding `docker-compose-benchmark.yml` to docker-compose and uncommenting the `metrics` section from `config.yaml`.


### Queries

Use [Artillery.io](https://artillery.io) to benchmark the tiles server. Use `docker-compose-benchmark.yml`.

Generate one set of tiles coordinates to be requested. Coordinates are tile ranges at zoom level 14 (https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/)
```
# Continantal Europe
docker-compose -f docker-compose.yml -f docker-compose-benchmark.yml run --rm artillery bash -c 'ruby artillery.rb 8445-9451 5356-5891 | egrep "^14," > artillery.csv'
# Aquitaine
docker-compose -f docker-compose.yml -f docker-compose-benchmark.yml run --rm artillery bash -c 'ruby artillery.rb 8000-8200 5800-6000 | egrep "^14," > artillery.csv'
# Bordeaux area
docker-compose -f docker-compose.yml -f docker-compose-benchmark.yml run --rm artillery bash -c 'ruby artillery.rb 8157-8171 5895-5909 | egrep "^14," > artillery.csv'
# Paris area
docker-compose -f docker-compose.yml -f docker-compose-benchmark.yml run --rm artillery bash -c 'ruby artillery.rb 8285-8311 5621-5645 | egrep "^14," > artillery.csv'
```

Clear the tiles cache first. Then request the tiles server.
```
docker-compose run --rm nginx rm -fr /cache/*
docker-compose -f docker-compose.yml -f docker-compose-benchmark.yml run --rm artillery artillery run artillery.yaml
```

Random order tiles request on mixed urban and rural area, without concurrency. Time from server, HTTP included.

| Source | Delay |
|-|-:|
| Zoom 12 mixte Europe | 50 ms |
| Zoom 13, mixte Europe | 49 ms |
| Zoom 14, mixte Europe| 60 ms |
| Zoom 14, urban Paris | 250 ms |
| From cache | 5 ms |
