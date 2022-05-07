#!/bin/bash

set -xe

FILENAME=build_versions.txt

cat > ${FILENAME}<< EOF
Linux version: $(lsb_release -s -d || echo "Not built in Linux")
Node version: $(node --version)
npm version: $(npm --version)
EOF
