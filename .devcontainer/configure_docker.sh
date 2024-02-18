#!/bin/bash

docker network create host-network

# Forward DNS queries to CoreDNS
original_content=$(cat /etc/resolv.conf)

echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf > /dev/null
echo "$original_content" | sudo tee -a /etc/resolv.conf > /dev/null