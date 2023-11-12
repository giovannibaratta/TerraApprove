#!/bin/bash

set -e

SCRIPT_DIR=$(readlink -f $(dirname "$0"))

docker build --tag bats-e2e-custom-image "${SCRIPT_DIR}"
docker run -it -v "${SCRIPT_DIR}/suites:/code/suites:ro" -v "${SCRIPT_DIR}/terraapprove:/code/terraapprove:ro" bats-e2e-custom-image -r suites