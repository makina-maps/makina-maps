#!/bin/bash

set -e

make init-dirs

# Remove expire tiles
docker-compose run --rm openmaptiles-tools bash -c "rm -fr /import/expire_tiles"
mkdir -p data/expire_tiles

# Force to clean previously imported OpenStreetMap data.
make start-db
docker-compose exec postgres psql openmaptiles openmaptiles -c "
DROP SCHEMA IF EXISTS backup CASCADE;
DROP SCHEMA IF EXISTS building_polygon CASCADE;
"

# Empty the imposm cache
rm -fr cache
mkdir cache

# Force clean / rebuild SQL
rm -fr build/*
make

# Import OpenStreetMap data
time bash -c "\
docker-compose run --rm openmaptiles-tools bash -c 'chmod a+w /cache/' && \
make import-osm && \
make import-sql && \
make import-wikidata && \
make analyze-db
"

# Then clear the tile cache (re-import data only). From project root directory:
(cd .. && docker-compose run --rm nginx rm -fr /cache/*)
