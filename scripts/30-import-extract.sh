#!/bin/bash

set -e

# Ensure postgres is up
docker-compose up -d postgres && sleep 10

# Remove OpenStreetMap diff
docker-compose run --rm import-osm bash -c "rm -fr /import/??? /import/last.state.txt"

# Remove expire tiles
docker-compose run --rm import-osm bash -c "rm -fr /import/expire_tiles/*"

# Force to clean previously imported OpenStreetMap data.
docker-compose exec postgres psql openmaptiles openmaptiles -c "
DROP SCHEMA IF EXISTS backup CASCADE;
DROP SCHEMA IF EXISTS building_polygon CASCADE;
"

# Import OpenStreetMap data
time bash -c "\
docker-compose run -e CONFIG_JSON=/import/imposm-config.json --rm import-osm && \
docker-compose run --rm import-wikidata && \
docker-compose run --rm import-sql && \
make psql-analyze
"

# Then clear the tile cache (re-import data only). From project root directory:
(cd .. && docker-compose run --rm nginx rm -fr /cache/*)
