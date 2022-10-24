#!/bin/bash
for i in {1..10000}
do
    echo "----------withdraw $i start---------"
    timestamp=$(date +%s)
    sleep 1s
    ./bin/cli.js s-withdraw hsa10 ETH 0xEc67A59e54A393b702c7EcCe1faca731E4f0e601 0.0000000001 $timestamp
    echo "----------withdraw $i end-----------"
done

