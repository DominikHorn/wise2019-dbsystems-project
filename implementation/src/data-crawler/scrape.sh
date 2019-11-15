#!/bin/bash

declare -a REGIERUNGS_BEZIRKE=("901" "902" "903" "904" "905" "906" "907")
declare -a PARTEIEN=("1" "2" "3" "4" "5" "6" "7" "8" "9" "10" "11" "12" "13" "14" "15" "16" "17" "18")

for rb in "${REGIERUNGS_BEZIRKE[@]}"
do
    for p in "${REGIERUNGS_BEZIRKE[@]}"
    do
        scrapy runspider -a regierungsbezirkId=$rb -a partyId=$p crawler2018.py -o wahl2018_$(echo $rb)_$(echo $p).csv -t csv &
    done
done
