#!/bin/bash

set -e

echo "Waiting for installation to complete..."

# Wait for the install_dependencies.sh script to bootstrap the environment
sleep 5

# Wait until the installation is completed or exit when timeout is reached
while [ ! -f /tmp/installation-completed ]; do
    sleep 1
    if [ $SECONDS -gt 300 ]; then
        echo "Installation timed out"
        exit 1
    fi
done

echo "Configuring Jekyll dependencies..."

# See https://jekyllrb.com/docs/installation/ubuntu/

sudo mkdir /gems -p 2> /dev/null
sudo chmod 7777 /gems

GEM_HOME="/gems" gem install jekyll bundler

echo "Jekyll setup completed"