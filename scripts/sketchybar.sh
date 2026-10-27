#!/bin/bash

bash "$(dirname "$0")/setup-calendar.sh" || exit 1

./sketchybar-fish.sh
