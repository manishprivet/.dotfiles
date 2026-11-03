-- One persistent scratch terminal per tab. Detaching hides it without stopping
-- its shell; its label lets us find it again even after a config reload.
local bounds = { 0.6, 0, 0.4, 1 }

local function checked(result, err)
    if not result then error(err, 0) end
    return result
end

rex.action{
    name = "toggle_floating_pane",
    title = "Toggle Floating Side Pane",
    run = function(ctx)
        local view = checked(rex.session.view{ session_id = ctx.session_id })
        local window
        for _, candidate in ipairs(view.windows or {}) do
            if candidate.window_id == view.active_window_id then
                window = candidate
                break
            end
        end
        if not window then error("floating pane: no active tab", 0) end

        local label = "scratch:" .. window.window_id
        local blocks = checked(rex.session.list_blocks{ session_id = ctx.session_id })
        local scratch
        for _, block in ipairs(blocks.blocks or {}) do
            if block.label == label then
                scratch = block
                break
            end
        end

        if scratch and scratch.placement == "placed" then
            return checked(rex.session.detach_block{
                session_id = ctx.session_id,
                block_id = scratch.block_id,
            })
        end

        if scratch then
            -- Rex cannot float a detached block directly. Place it beside a
            -- tiled block first, then immediately move it into a floating layer.
            local anchor
            for _, layer in ipairs(window.layers or {}) do
                if layer.kind == "tiled" then
                    anchor = (layer.blocks or {})[1]
                    break
                end
            end
            if not anchor then
                error("floating pane: a tiled pane is needed to restore the terminal", 0)
            end
            checked(rex.session.move_block{
                session_id = ctx.session_id,
                block_id = scratch.block_id,
                anchor_block_id = anchor.block_id,
            })
            local layer, err = rex.session.float_block{
                session_id = ctx.session_id,
                block_id = scratch.block_id,
                bounds = bounds,
            }
            if not layer then
                rex.session.detach_block{
                    session_id = ctx.session_id,
                    block_id = scratch.block_id,
                }
                error(err, 0)
            end
            checked(rex.session.focus_block{
                session_id = ctx.session_id,
                block_id = scratch.block_id,
            })
            return layer
        end

        -- Inherit the current terminal's actual directory, not Rex's own cwd.
        -- Restoring an existing drawer keeps its shell and directory unchanged.
        local options = {}
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

        return checked(rex.session.new_layer{
            session_id = ctx.session_id,
            window_id = window.window_id,
            bounds = bounds,
            focus = true,
            layout = rex.layout.block{
                flavor = "com.superlogical.terminal.shell",
                label = label,
                options = options,
            },
        })
    end,
}

rex.bind("ctrl+s>f", "toggle_floating_pane")
