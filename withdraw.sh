#!/bin/bash
for i in {1..1000000}
do
    echo "----------withdraw $i start---------"
    timestamp=$(date +%s)$RANDOM
    sleep 1s
    ./bin/cli.js s-withdraw hsa10 ETH 0xEc67A59e54A393b702c7EcCe1faca731E4f0e601 0.0000001$RANDOM $timestamp
    sleep 1s
    timestamp=$(date +%s)$RANDOM
    ./bin/cli.js s-withdraw hsa10 BTC mxFz9t3FShhrQa7nif3iZLhQW8hxbfZ3N2 0.0000001$RANDOM $timestamp
    echo "----------withdraw $i end-----------"
done
