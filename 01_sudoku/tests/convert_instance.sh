#!/bin/bash

SUDOKU_SIZE=$(wc -l < "$1")
IFS='' read -r -d '' string < $1
#string=tr -d ' ' $string
res=""
re='^[1-9]'
for (( i=0; i <$SUDOKU_SIZE; i++ )); do
    for (( j=0; j <$SUDOKU_SIZE; j++ )); do
	let index=i*$SUDOKU_SIZE+j
	if [[ '${string:$index:1}' != 0 ]]; then
	    res="$res, { \"i\" : \"$i\",\"j\" : \"$j\", \"value\" : \"${string:$index:1}\"}"
	else
	    echo ${string:$index:1}
        fi

    done
done

echo $res
