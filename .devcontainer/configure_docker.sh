#!/bin/bash

if ! docker network list | grep host-network ; then
  docker network create host-network
else
  echo "host-network already exists. Skipping creation."
fi

# Forward DNS queries to CoreDNS
original_content=$(cat /etc/resolv.conf)

echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf > /dev/null
echo "$original_content" | sudo tee -a /etc/resolv.conf > /dev/null