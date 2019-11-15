#!/bin/bash

rm res.csv
scrapy runspider -a regierungsbezirkId="901" -a partyId="1" crawler2018.py -o res.csv -t csv
