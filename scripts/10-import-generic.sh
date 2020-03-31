#!/bin/bash

set -e

make init-dirs

# Import generic data

make db-start && \
make forced-clean-sql && \
make import-water && \
make import-natural-earth && \
make import-lakelines
