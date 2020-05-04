#!/bin/bash

set -e

# Remove OpenStreetMap diff
docker-compose run --rm openmaptiles-tools bash -c "rm -fr /import/??? /import/last.state.txt"

# Remove expire tiles
docker-compose run --rm openmaptiles-tools bash -c "rm -fr /import/expire_tiles/*"

# Force to clean previously imported OpenStreetMap data.
make start-db
docker-compose exec postgres psql openmaptiles openmaptiles -c "
DROP SCHEMA IF EXISTS backup CASCADE;
DROP SCHEMA IF EXISTS building_polygon CASCADE;
"

# Import OpenStreetMap data
time bash -c "\
make import-osm && \
make import-borders && \
make import-sql && \
make import-wikidata && \
make analyze-db
"

# Then clear the tile cache (re-import data only). From project root directory:
(cd .. && docker-compose run --rm nginx rm -fr /cache/*)
