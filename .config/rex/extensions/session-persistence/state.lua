-- Pure snapshot/restore logic; no config-time calls or command replay.
local M = {}
local terminal = "com.superlogical.terminal"

local function checked(value, err)
    if value == nil then error(err or "Rex call failed", 0) end
    return value
end

function M.snapshot(api, server, originals, agent_for)
    local snapshot = { version = 1, sessions = {} }
    for _, session in ipairs(checked(api.call("session.list", {})).sessions or {}) do
        checked(api.session.attach{ session_id = session.session_id })
        local view = checked(api.session.view{ session_id = session.session_id })
        local saved = { label = view.label, windows = {} }
        snapshot.sessions[#snapshot.sessions + 1] = saved
        for index, window in ipairs(view.windows or {}) do
            local label = window.label
            local owned = ((originals or {})[session.session_id] or {})[window.window_id]
            if owned and owned.applied == label then label = owned.original end
            local tab = { label = label, layers = {} }
            saved.windows[index] = tab
            if window.window_id == view.active_window_id then saved.active = index end
            local position = 0
            for _, layer in ipairs(window.layers or {}) do
                local blocks = {}
                for _, block in ipairs(layer.blocks or {}) do blocks[block.block_id] = block end
                local function layout(node)
                    if not node then return nil end
                    if node.split then
                        local split = node.split
                        return { split = {
                            direction = split.direction, ratio = split.ratio,
                            before = layout(split.before), after = layout(split.after),
                        } }
                    end
                    local block = assert(blocks[node.block_id], "Missing block in layout")
                    assert(block.creator_name == terminal, "Only terminal blocks can be persisted")
                    assert(not block.host_id or block.host_id == server.host_id,
                        "Remote blocks cannot be persisted as local shells")
                    local process = checked(api.block.call(terminal, "process", {
                        session_id = session.session_id, block_id = block.block_id,
                    }))
                    local cwd = (process.foreground or {}).cwd or (process.child or {}).cwd
                    local agent = agent_for and agent_for(session.session_id, block.block_id, process)
                    position = position + 1
                    if node.block_id == window.focused_block_id then tab.focused = position end
                    if node.block_id == window.zoomed_block_id then tab.zoomed = position end
                    return { block = { flavor = terminal .. ".shell", label = block.label, agent = agent,
                        options = { cwd = agent and agent.cwd or cwd or assert(os.getenv("HOME")) } } }
                end
                tab.layers[#tab.layers + 1] = {
                    kind = layer.kind, bounds = layer.bounds, layout = layout(layer.layout),
                }
            end
        end
    end
    return snapshot
end

-- Validate the entire file before creating anything. Never pass arbitrary saved
-- options to Rex: a hand-edited/corrupt snapshot must not replay commands/input.
function M.validate(snapshot)
    assert(type(snapshot) == "table" and snapshot.version == 1
        and type(snapshot.sessions) == "table", "Invalid persistence snapshot")
    local function layout(node, depth)
        assert(type(node) == "table" and depth < 64, "Invalid layout")
        if node.split then
            local s = node.split
            assert(s.direction == "horizontal" or s.direction == "vertical", "Invalid split direction")
            assert(type(s.ratio) == "number" and s.ratio > 0 and s.ratio < 1, "Invalid ratio")
            return { split = { direction = s.direction, ratio = s.ratio,
                before = layout(s.before, depth + 1), after = layout(s.after, depth + 1) } }
        end
        local b = assert(node.block, "Missing block")
        assert(b.flavor == terminal .. ".shell", "Invalid block flavor")
        assert(b.label == nil or type(b.label) == "string", "Invalid block label")
        local cwd = (b.options or {}).cwd
        assert(type(cwd) == "string" and cwd:sub(1, 1) == "/" and not cwd:find("%z"), "Invalid cwd")
        local options = { cwd = cwd }
        local agent = b.agent
        if agent then
            assert(agent.agent == "claude" or agent.agent == "opencode", "Invalid agent")
            assert(type(agent.session_id) == "string" and #agent.session_id <= 128
                and agent.session_id:match("^[%w_-]+$"), "Invalid agent session ID")
            if agent.agent == "claude" then
                assert(#agent.session_id == 36 and agent.session_id:match("^[%x-]+$"), "Invalid Claude ID")
            else
                assert(agent.session_id:match("^ses_"), "Invalid OpenCode ID")
            end
        end
        return { block = { flavor = b.flavor, label = b.label, agent = agent, options = options } }
    end
    for _, session in ipairs(snapshot.sessions) do
        assert(type(session.label) == "string" and type(session.windows) == "table", "Invalid session")
        for _, tab in ipairs(session.windows) do
            assert(type(tab.label) == "string" and type(tab.layers) == "table" and #tab.layers > 0,
                "Invalid window")
            for index, layer in ipairs(tab.layers) do
                assert(layer.kind == (index == 1 and "tiled" or "floating"), "Invalid layer kind")
                assert(type(layer.bounds) == "table" and #layer.bounds == 4, "Invalid bounds")
                for _, value in ipairs(layer.bounds) do assert(type(value) == "number", "Invalid bounds") end
                layer.layout = layout(layer.layout, 0)
            end
        end
    end
    return snapshot
end

function M.restore(api, snapshot)
    M.validate(snapshot)
    -- Build commands only at restore time from typed metadata, never from saved
    -- command/initial_input fields. No prompt or automatic continuation is sent.
    local function launch(node)
        if node.split then
            return { split = { direction = node.split.direction, ratio = node.split.ratio,
                before = launch(node.split.before), after = launch(node.split.after) } }
        end
        local b = node.block
        local options = { cwd = b.options.cwd }
        if b.agent then
            local flag = b.agent.agent == "claude" and "--resume" or "--session"
            options.command = { b.agent.agent, flag, b.agent.session_id }
        end
        return { block = { flavor = b.flavor, label = b.label, options = options } }
    end
    for _, session in ipairs(snapshot.sessions) do
        local initial = {}
        for index, tab in ipairs(session.windows) do
            initial[index] = { window_label = tab.label, layout = launch(tab.layers[1].layout) }
        end
        local created = checked(api.call("session.create", { label = session.label, initial_windows = initial }))
        local id = created.session_id
        checked(api.session.attach{ session_id = id })
        for index, tab in ipairs(session.windows) do
            local window = created.initial_windows[index]
            local ids = window.block_ids
            for layer_index = 2, #tab.layers do
                local layer = tab.layers[layer_index]
                local result = checked(api.session.new_layer{
                    session_id = id, window_id = window.window_id,
                    bounds = layer.bounds, layout = launch(layer.layout), focus = false,
                })
                for _, block_id in ipairs(result.block_ids) do ids[#ids + 1] = block_id end
            end
            if tab.focused and ids[tab.focused] then
                checked(api.session.focus_block{ session_id = id, block_id = ids[tab.focused] })
            end
            if tab.zoomed and ids[tab.zoomed] then
                checked(api.session.zoom_block{ session_id = id, block_id = ids[tab.zoomed], zoom = true })
            end
        end
        if session.active and created.initial_windows[session.active] then
            checked(api.session.focus_window{
                session_id = id, window_id = created.initial_windows[session.active].window_id,
            })
        end
    end
end

return M
