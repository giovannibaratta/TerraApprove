#!/bin/bash

set -e

echo "Prepare environment for intalling lefthook..."

/bin/bash  ./.devcontainer/configure_apt.sh

curl -1sLf \
  'https://dl.cloudsmith.io/public/evilmartians/lefthook/setup.deb.sh' \
  | sudo -E bash

sudo apt-get install -y lefthook=1.5.2

echo "Lefthook setup completed"