#!/bin/bash

set -e

# Enable yarn 3 (see https://yarnpkg.com/getting-started/install)

"$NVM_BIN/corepack" enable
"$NVM_BIN/corepack" prepare yarn@stable --activate

echo "Yarn setup completed"