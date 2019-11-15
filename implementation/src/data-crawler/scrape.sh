#!/bin/bash

declare -a REGIERUNGS_BEZIRKE=("901" "902" "903" "904" "905" "906" "907")

rm wahl2018*

for rb in "${REGIERUNGS_BEZIRKE[@]}"
do
    scrapy runspider -a regierungsbezirkId=$rb crawler2018.py -o wahl2018_$(echo $rb).csv -t csv &
    pids[${i}]=$!
done

# wait for all pids
for pid in ${pids[*]}; do
    wait $pid
done
