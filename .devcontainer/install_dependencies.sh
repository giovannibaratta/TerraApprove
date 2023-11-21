#!/bin/bash

set -e

jekyll_dependencies=(
    ruby-full
    build-essential
    zlib1g-dev
)


lefthook_dependencies=(
    lefthook=1.5.2
)

rm /tmp/installation-completed 2> /dev/null || true

sudo apt-get update

# Prepare for lefthook installation
curl -1sLf \
  'https://dl.cloudsmith.io/public/evilmartians/lefthook/setup.deb.sh' \
  | sudo -E bash

sudo apt-get install -y \
    "${jekyll_dependencies[@]}" \
    "${lefthook_dependencies[@]}"

# Notify other scripts that all the dependencies are installed
touch /tmp/installation-completed