#!/bin/bash

set -e

make init-dirs

# Import generic data

make start-db && \
make import-data
