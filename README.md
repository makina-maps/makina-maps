# Makina Maps

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
docker-compose -p openmaptiles -f docker-compose-yml up -d postgres
docker-compose -p openmaptiles -f docker-compose.yml exec postgres psql openmaptiles openmaptiles -c "
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

The direct acces the proxified tiles server are at http://0.0.0.0:6534/openmaptiles/info.json and http://0.0.0.0:6534/?s=basic
Unproxified is also available on port 6533.

## Benchmark

### Import size and time

Specific only on 8CPU (import-osm, import-sql and psql-analyze).

| Area | PBF size | Postgres size | Import time |
|-|-:|-:|-:|
| Andorra | 243 Ko | 3.5 Go | 36 s |
| Alsace | 100 Mo | 4.5 Go | 3 min 20 s |
| Aquitiane | 559 Mo | | 6 min 40 s |
| Austria | 559 Mo | 9.4 Go | 23 min |
| France | 3.5 Go | 35 Go | 105 min |
| Europe | 20 Go | | | |

### Database

Data size of the current data.
```
docker-compose -p openmaptiles -f docker-compose.yml exec postgres psql openmaptiles openmaptiles -c "
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

## TODO

* Test perf to replace tilelive-tmsource (based on mapnik) by postile.
* Use GPU in docker to render.
