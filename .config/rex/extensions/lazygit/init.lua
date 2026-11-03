-- A fresh centered LazyGit pane in the focused pane's directory; closes on exit.
rex.action{
    name = "open_lazygit",
    title = "Open Floating LazyGit Pane",
    run = function(ctx)
        local view, err = rex.session.view{ session_id = ctx.session_id }
        if not view then error(err, 0) end
        local window
        for _, candidate in ipairs(view.windows or {}) do
            if candidate.window_id == view.active_window_id then
                window = candidate
                break
            end
        end
        if not window then error("lazygit: no active tab", 0) end

        local options = { command = { "lazygit" } }
        local source = ctx.block_id or window.focused_block_id
        if source then
            local process = rex.block.call("com.superlogical.terminal", "process", {
                block_id = source,
            })
            if process then
                options.cwd = (process.foreground or {}).cwd
                    or (process.child or {}).cwd
            end
        end

        local layer, layer_err = rex.session.new_layer{
            session_id = ctx.session_id,
            window_id = window.window_id,
            bounds = { 0.1, 0.1, 0.8, 0.8 },
            focus = true,
            layout = rex.layout.block{
                flavor = "com.superlogical.terminal.shell",
                label = "LazyGit",
                options = options,
            },
        }
        if not layer then error(layer_err, 0) end
        return layer
    end,
}

rex.bind("ctrl+s>g", "open_lazygit")
