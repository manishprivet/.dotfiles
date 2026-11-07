-- Keep Omarchy's native services, theme, helpers and workspace integration.
dofile((os.getenv("OMARCHY_PATH") or "/usr/share/omarchy") .. "/default/hypr/bootstrap.lua")
omarchy_default_bindings = false
omarchy_preinstalled_bindings = false
require("default.hypr.omarchy")

-- Only personal settings below; don't copy implementations from /usr/share.
require("hypr.monitors")
require("hypr.input")
require("hypr.bindings")
require("hypr.workspaces").setup()
require("hypr.looknfeel")
require("hypr.autostart")
require("default.hypr.toggles")
