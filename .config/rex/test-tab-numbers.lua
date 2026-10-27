-- Run from the repository root: lua .config/rex/test-tab-numbers.lua
-- In-memory Rex/filesystem mocks: does not connect to or modify live sessions.
local script = ".config/rex/tab-numbers.lua"
local real_io, real_rename, real_remove = io, os.rename, os.remove
local files, views, handlers, writes, locked, fail_rename, unreadable
local current_pid, identities, signals, stuck, guard_busy
local function equal(actual, expected)
    assert(actual == expected, tostring(actual) .. " ~= " .. tostring(expected))
end
local function copy(value)
    if type(value) ~= "table" then return value end
    local result = {}
    for key, item in pairs(value) do result[key] = copy(item) end
    return result
end
local snapshots, serial = {}, 0
local function run(mode)
    current_pid = current_pid + 1
    identities[tostring(current_pid)] = "501 start-time rex do tab-numbers.lua " .. current_pid
    rex.args = { mode = mode }
    handlers = {}
    local ok, err = pcall(assert(loadfile(script)))
    if not ok and err ~= "STOP" then error(err, 0) end
end
local function emit(session_id)
    handlers.session_view_changed({ session_id = session_id })
end
local function reset()
    files, views, handlers, writes, locked, fail_rename, unreadable = {}, {}, {}, 0, false, false, false
    current_pid, identities, signals, stuck, guard_busy = 100, {}, 0, false, false
    views.s1 = { windows = {
        { window_id = "a", label = "editor" },
        { window_id = "b", label = "2: literal" },
    } }
end

io = {
    open = function(path, mode)
        if mode == "r" then
            if unreadable and path:match("%.json$") then return nil, "Permission denied", 1 end
            if not files[path] then return nil, "No such file", 1 end
            return { read = function() return files[path] end, close = function() return true end }
        end
        return {
            write = function(_, text) files[path] = text; return true end,
            close = function() return true end,
        }
    end,
}
os.rename = function(source, destination)
    files[destination], files[source] = files[source], nil
    return true
end
os.remove = function(path) files[path] = nil; return true end
rex = {
    args = {},
    call = function(method)
        if method == "server.status" then return { instance_id = "test-server" } end
        equal(method, "session.list")
        local sessions = {}
        for id in pairs(views) do sessions[#sessions + 1] = { session_id = id } end
        return { sessions = sessions }
    end,
    exec = function(argv)
        if argv[1] == "/bin/ps" then
            return { ok = identities[argv[4]] ~= nil, stdout = identities[argv[4]] or "" }
        end
        if argv[1] == "/bin/kill" then
            signals = signals + 1
            if not stuck then identities[argv[3]] = nil; locked = false end
            return { ok = true }
        end
        if argv[1] == "/bin/sh" and argv[4] == "tab-numbers" then
            return { ok = not unreadable and files[argv[5]] == nil, stdout = "" }
        end
        if argv[1] == "/usr/bin/shlock" then
            if argv[5]:match("%.takeover$") then
                return { ok = not guard_busy, stderr = "" }
            end
            if locked then return { ok = false, stderr = "" } end
            locked = true
            files[argv[5]] = tostring(current_pid) .. "\n"
        end
        return { ok = true, stdout = argv[1] == "/bin/sh" and tostring(current_pid) .. "\n" or "" }
    end,
    json = {
        encode = function(value)
            serial = serial + 1
            local key = tostring(serial)
            snapshots[key] = copy(value)
            return key
        end,
        decode = function(text) return copy(snapshots[text:match("%d+")]) end,
    },
    session = {
        attach = function() return {} end,
        view = function(query) return copy(views[query.session_id]) end,
        set_window_label = function(query)
            if fail_rename then return nil, "rename failed" end
            for _, window in ipairs(views[query.session_id].windows) do
                if window.window_id == query.window_id then window.label = query.label end
            end
            writes = writes + 1
            return {}
        end,
    },
    on = function(event, handler) handlers[event] = handler end,
    log = function() end,
    stop = function() error("STOP", 0) end,
    sleep = function() end,
}
local ok, err = pcall(function()
    reset()
    run()
    equal(views.s1.windows[1].label, "1: editor")
    equal(views.s1.windows[2].label, "2: 2: literal")
    emit("s1")
    equal(writes, 2) -- Own rename events don't recursively add prefixes.

    -- A replacement terminates the verified owner without stacking prefixes.
    run()
    equal(writes, 2)
    equal(signals, 1)
    assert(handlers.session_view_changed)

    -- A dead process's lock is reclaimed by shlock; ownership survives restart.
    locked = false
    run()
    equal(writes, 2)
    views.s1.windows[1].label = "3: manual"
    emit("s1")
    equal(views.s1.windows[1].label, "1: 3: manual")

    local first, second = views.s1.windows[1], views.s1.windows[2]
    views.s1.windows = { second, first }
    emit("s1")
    equal(second.label, "1: 2: literal")
    equal(first.label, "2: 3: manual")
    views.s1.windows = { first }
    emit("s1")
    equal(first.label, "1: 3: manual")

    views.s2 = { windows = { { window_id = "c", label = "logs" } } }
    handlers.session_created({}, { session = { session_id = "s2" } })
    equal(views.s2.windows[1].label, "1: logs")
    views.s2 = nil
    handlers.session_destroyed({}, { session_id = "s2" })

    run("remove")
    equal(first.label, "3: manual")
    equal(next(handlers), nil)

    reset()
    views.s1.windows[1].label = string.rep("é", 128)
    run()
    equal(views.s1.windows[1].label, "1: " .. string.rep("é", 125))
    locked = false
    run("remove")
    equal(views.s1.windows[1].label, string.rep("é", 128))

    reset()
    run()
    views.s1.windows[1].label = "changed"
    fail_rename = true
    equal(pcall(emit, "s1"), false)
    fail_rename = false
    emit("s1")
    equal(views.s1.windows[1].label, "1: changed")

    reset()
    unreadable = true
    local readable, message = pcall(run)
    equal(readable, false)
    assert(tostring(message):find("Permission denied", 1, true))
    equal(writes, 0)

    -- A reused PID must never be signalled.
    reset()
    run()
    identities[tostring(current_pid)] = "unrelated process"
    local replaced, message = pcall(run)
    equal(replaced, false)
    assert(tostring(message):find("cannot verify", 1, true))
    equal(signals, 0)

    -- Pre-takeover versions have no identity record: require a manual stop.
    reset()
    locked = true
    local replaced = pcall(run)
    equal(replaced, false)
    equal(signals, 0)

    reset()
    run()
    stuck = true
    local replaced, message = pcall(run)
    equal(replaced, false)
    assert(tostring(message):find("within 5 seconds", 1, true))
    equal(signals, 1)
    equal(writes, 2)

    reset()
    guard_busy = true
    equal(pcall(run), false)
    equal(signals, 0)
    equal(writes, 0)
end)
io, os.rename, os.remove = real_io, real_rename, real_remove
if not ok then error(err, 0) end
print("tab-numbers: all tests passed")
