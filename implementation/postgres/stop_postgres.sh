#!/bin/bash

# Cd to directory this script resides in
cd "${0%/*}"

# Stop instance of postgresql
docker stop postgresql-docker