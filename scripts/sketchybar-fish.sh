#!/opt/homebrew/bin/fish

fish fish_add_path $(python3 -c 'import os,sysconfig;print(sysconfig.get_path("scripts",f"{os.name}_user"))')
