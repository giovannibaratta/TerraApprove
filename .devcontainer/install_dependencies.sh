#!/bin/bash

set -e

jekyll_dependencies=(
    ruby-full
    build-essential
    zlib1g-dev
)

parallel_dependencies=(
    parallel=20210822+ds-2
)

lefthook_dependencies=(
    lefthook=1.5.2
)

liquibase_dependencies=(
    liquibase=4.25.1
    openjdk-8-jre
)

rm /tmp/installation-completed 2> /dev/null || true

sudo apt-get update

# Prepare for lefthook installation
curl -1sLf \
  'https://dl.cloudsmith.io/public/evilmartians/lefthook/setup.deb.sh' \
  | sudo -E bash

# Prepare for LiquidBase installation
wget -O- https://repo.liquibase.com/liquibase.asc | gpg --dearmor > liquibase-keyring.gpg && \
cat liquibase-keyring.gpg | sudo tee /usr/share/keyrings/liquibase-keyring.gpg > /dev/null && \
echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/liquibase-keyring.gpg] https://repo.liquibase.com stable main' | sudo tee /etc/apt/sources.list.d/liquibase.list

sudo apt-get update

sudo apt-get install -y \
    "${jekyll_dependencies[@]}" \
    "${parallel_dependencies[@]}" \
    "${lefthook_dependencies[@]}" \
    "${liquibase_dependencies[@]}"

# Notify other scripts that all the dependencies are installed
touch /tmp/installation-completed