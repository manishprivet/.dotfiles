-- Run from the repo root. No server connection or filesystem mutation.
local model = dofile(".config/rex/extensions/session-persistence/state.lua")
local function equal(actual, expected)
    assert(actual == expected, tostring(actual) .. " ~= " .. tostring(expected))
end
local function copy(value)
    if type(value) ~= "table" then return value end
    local result = {}
    for key, item in pairs(value) do result[key] = copy(item) end
    return result
end
local function leaf(id) return { block_id = id } end
local function block(id)
    return { block_id = id, creator_name = "com.superlogical.terminal", host_id = "host", label = id }
end
local view = {
    label = "work", active_window_id = "w1", windows = {
        { window_id = "w1", label = "1: editor", focused_block_id = "b", zoomed_block_id = "b",
            layers = {
                { kind = "tiled", bounds = { 0, 0, 1, 1 }, blocks = { block("a"), block("b") },
                    layout = { split = { direction = "horizontal", ratio = 0.3,
                        before = leaf("a"), after = leaf("b") } } },
                { kind = "floating", bounds = { 0.1, 0.2, 0.5, 0.5 },
                    blocks = { block("c") }, layout = leaf("c") },
            } },
        { window_id = "w2", label = "2: literal", layers = {
            { kind = "tiled", bounds = { 0, 0, 1, 1 }, blocks = { block("d") }, layout = leaf("d") },
        } },
    },
}
local calls, creates = {}, 0
local api = {
    call = function(method, args)
        if method == "session.list" then return { sessions = { { session_id = "s" } } } end
        equal(method, "session.create")
        creates = creates + 1
        calls.create = args
        return { session_id = "new", initial_windows = {
            { window_id = "new1", block_ids = { "newa", "newb" } },
            { window_id = "new2", block_ids = { "newd" } },
        } }
    end,
    block = { call = function(_, _, query)
        if query.block_id == "d" then return { child = { cwd = "/fallback" } } end
        return { foreground = { cwd = "/project/" .. query.block_id }, child = { cwd = "/wrong" } }
    end },
    session = {
        attach = function() return {} end,
        view = function() return view end,
        new_layer = function(args) calls.layer = args; return { block_ids = { "newc" } } end,
        focus_block = function(args) calls.focus = args; return {} end,
        zoom_block = function(args) calls.zoom = args; return {} end,
        focus_window = function(args) calls.window = args; return {} end,
    },
}
local saved = model.snapshot(api, { host_id = "host" }, {
    s = { w1 = { original = "editor", applied = "1: editor" } },
})
equal(saved.sessions[1].label, "work")
equal(saved.sessions[1].windows[1].label, "editor")
equal(saved.sessions[1].windows[2].label, "2: literal")
equal(saved.sessions[1].windows[1].focused, 2)
equal(saved.sessions[1].windows[1].zoomed, 2)
equal(saved.sessions[1].windows[1].layers[1].layout.split.before.block.options.cwd, "/project/a")
equal(saved.sessions[1].windows[2].layers[1].layout.block.options.cwd, "/fallback")
model.restore(api, copy(saved))
equal(creates, 1)
equal(calls.create.initial_windows[1].layout.split.ratio, 0.3)
equal(calls.layer.bounds[2], 0.2)
equal(calls.focus.block_id, "newb")
equal(calls.zoom.zoom, true)
equal(calls.window.window_id, "new1")

-- Saved command/input keys are never passed through to a terminal.
local injected = copy(saved)
local options = injected.sessions[1].windows[2].layers[1].layout.block.options
options.command, options.initial_input = { "unsafe" }, "unsafe\n"
model.restore(api, injected)
equal(calls.create.initial_windows[2].layout.block.options.command, nil)
equal(calls.create.initial_windows[2].layout.block.options.initial_input, nil)

-- Exact conversation IDs, not latest-session guesses; arbitrary commands stay
-- filtered even for agent panes. Metadata survives validation and resaving.
local agents = copy(saved)
local a = agents.sessions[1].windows[1].layers[1].layout.split.before.block
local b = agents.sessions[1].windows[2].layers[1].layout.block
a.agent = { agent = "claude", session_id = "550e8400-e29b-41d4-a716-446655440000" }
b.agent = { agent = "opencode", session_id = "ses_abc123" }
b.options.command = { "unsafe" }
model.restore(api, agents)
local ca = calls.create.initial_windows[1].layout.split.before.block.options.command
equal(ca[1], "claude")
equal(ca[2], "--resume")
equal(ca[3], a.agent.session_id)
local cb = calls.create.initial_windows[2].layout.block.options.command
equal(cb[1], "opencode")
equal(cb[2], "--session")
equal(cb[3], "ses_abc123")
equal(cb[4], nil)
b.agent.session_id = "ses_bad;echo unsafe"
equal(pcall(model.restore, api, agents), false)
b.agent = { agent = "sh", session_id = "ses_abc" }
equal(pcall(model.restore, api, agents), false)

local captured = model.snapshot(api, { host_id = "host" }, nil, function(_, id)
    if id == "a" then return { agent = "opencode", session_id = "ses_exact", cwd = "/worktree" } end
end)
local pane = captured.sessions[1].windows[1].layers[1].layout.split.before.block
equal(pane.agent.session_id, "ses_exact")
equal(pane.options.cwd, "/worktree")

-- Validate all sessions before creating the first one.
local bad = copy(saved)
bad.sessions[2] = copy(saved.sessions[1])
bad.sessions[2].windows[1].layers[1].layout.split.ratio = 2
local before = creates
equal(pcall(model.restore, api, bad), false)
equal(creates, before)
equal(pcall(model.validate, { version = 9, sessions = {} }), false)
view.windows[1].layers[1].blocks[1].host_id = "remote"
equal(pcall(model.snapshot, api, { host_id = "host" }), false)
view.windows[1].layers[1].blocks[1].host_id = "host"
view.windows[1].layers[1].blocks[1].creator_name = "other"
equal(pcall(model.snapshot, api, { host_id = "host" }), false)

-- An API failure never silently yields an empty/partial snapshot.
api.session.view = function() return nil, "disconnected" end
equal(pcall(model.snapshot, api, { host_id = "host" }), false)

-- Cold boot: the detached launcher must not use the default 10s API timeout.
-- Mock process creation: this check never launches a watcher.
local previous_rex = rex
local launched
rex = {
    exec = { start = function(argv, opts)
        launched = argv[3]
        equal(opts.detach, true)
        equal(opts.env.REX_SESSION, false)
        return {}
    end },
}
local loaded, load_error = pcall(dofile, ".config/rex/extensions/session-persistence/init.lua")
rex = previous_rex
assert(loaded, load_error)
assert(launched:find('--timeout 120s do "$2" --all', 1, true))
assert(launched:find('[ "$attempt" -ge 120 ]', 1, true))
print("session-persistence: all tests passed")
