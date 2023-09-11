#!/bin/bash

set -e

/bin/bash  ./.devcontainer/configure_apt.sh

echo "Installing Jekyll dependencies..."

# See https://jekyllrb.com/docs/installation/ubuntu/

sudo apt-get update && sudo apt-get install -y ruby-full='1:3.0~exp1' build-essential='12.9ubuntu3' zlib1g-dev='1:1.2.11.dfsg-2ubuntu9.2'

sudo mkdir /gems -p 2> /dev/null
sudo chmod 7777 /gems

echo "Installing Jekyll..."
GEM_HOME="/gems" gem install jekyll bundler

echo "Jekyll setup completed"