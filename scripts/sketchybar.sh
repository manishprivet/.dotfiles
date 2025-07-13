#!/bin/bash

CPPFLAGS="-I/opt/homebrew/include -L/opt/homebrew/lib" python3 -m pip install --user dfindexeddb --break-system-packages
CPPFLAGS="-I/opt/homebrew/include -L/opt/homebrew/lib" python3 -m pip install --user 'dfindexeddb[plugins]' --break-system-packages

./sketchybar-fish.sh
