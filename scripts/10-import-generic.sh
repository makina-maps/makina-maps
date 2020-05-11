#!/bin/bash

set -e

make init-dirs

# Import generic data

make destroy-db
make start-db
make import-data
