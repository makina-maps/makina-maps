#!/bin/bash

set -e

# Import generic data

docker-compose up -d postgres && sleep 10 && \
docker-compose run --rm import-water && \
docker-compose run --rm import-osmborder && \
docker-compose run --rm import-natural-earth && \
docker-compose run --rm import-lakelines
