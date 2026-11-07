-- Four explicit essentials, plus the Mac's Alt-based window management.
o.bind("SUPER + RETURN", "Terminal", o.launch_terminal())
o.bind("SUPER + SPACE", "Omarchy menu", { menu = "root" })
o.bind("SUPER + W", "Close window", hl.dsp.window.close())
o.bind("SUPER + CTRL + L", "Lock", "omarchy system lock")
require("hypr.aerospace").setup()
