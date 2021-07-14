#!/bin/bash

SUDOKU_SIZE=$(wc -l < "$1")
IFS='' read -r -d '' string < $1
string=${string//$'\n'/}
res=""
re='^[1-9]'
for (( i=0; i <$SUDOKU_SIZE; i++ )); do
    for (( j=0; j <$SUDOKU_SIZE; j++ )); do
	let index=i*$SUDOKU_SIZE+j
	if [ "${string:$index:1}" != "0" ]; then
	    if [[ -z "$res" ]]; then
		sep=""
	    else
		sep=","
	    fi
	    res="$res$sep { \"i\" : \"$i\",\"j\" : \"$j\", \"value\" : \"${string:$index:1}\"}"
        fi
    done
done

echo $res
