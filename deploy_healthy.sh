#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

HIPSTER_HEALTH="true" skaffold run

