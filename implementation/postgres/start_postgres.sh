#!/bin/bash

# Make sure docker image is up to date
docker pull postgres

# Cd to directory this script resides in
cd "${0%/*}"

# Start containerized instance of postgresql
# --rm cleanup after exit
# --name give container a name
# -e expose POSTGRES_PASSWORD environment variable
# -d detached mode -> launch container in background
# -p bind docker port to host port
# -v mount data directory
docker run \
    --rm \
    --name postgresql-docker \
    -e POSTGRES_PASSWORD=artseti \
    -d \
    -p 5432:5432 \
    -v /Users/dominik/no_icloud/db-project-postgres-data:/var/lib/postgresql/data \
    postgres
