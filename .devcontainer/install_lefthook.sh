#!/bin/bash

# exit when any command fails
set -e

curl -1sLf \
  'https://dl.cloudsmith.io/public/evilmartians/lefthook/setup.deb.sh' \
  | sudo -E bash

sudo apt-get install lefthook=1.4.6