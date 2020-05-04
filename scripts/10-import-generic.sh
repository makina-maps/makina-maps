#!/bin/bash

set -e

make init-dirs

# Import generic data

make db-start && \
make import-data
