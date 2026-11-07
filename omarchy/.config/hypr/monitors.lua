-- Other outputs use their preferred mode and automatic scaling.
hl.monitor({ output = "", mode = "preferred", position = "auto", scale = "auto" })
hl.monitor({ output = "eDP-1", mode = "preferred", position = "auto", scale = 2 })
hl.env("GDK_SCALE", "2")
