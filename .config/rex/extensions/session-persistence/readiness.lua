-- Startup-only, at-most-once wakeups. All external effects are injected.
local M = {}
function M.new(agents, instance, now, io)
    local pending, deadline = {}, now + 120
    for id, agent in pairs(agents) do
        if type(agent.instance_id) == "string" and agent.instance_id ~= instance then
            pending[id] = agent
        end
    end
    return function(time)
        if time > deadline then pending = {}; return end
        for id, agent in pairs(pending) do
            local ok, err = pcall(function()
                assert(id:match("^[%w:-]+$"), "Invalid pending block ID")
                local ready = io.read(id, "ready")
                if not ready or ready.instance_id ~= instance or ready.rex_session ~= agent.rex_session
                    or type(ready.shell_pid) ~= "number" or ready.shell_pid < 2
                    or ready.shell_pid % 1 ~= 0 or type(ready.shell_identity) ~= "string"
                    or type(ready.expires) ~= "number" or ready.expires < time
                    or ready.expires > time + 120 then return end
                local request = io.read(id, "request")
                if request and request.instance_id == instance then
                    pending[id] = nil
                    return
                end
                if not io.idle(id, agent, ready) then return end
                io.request(id, ready) -- Persist intent before any terminal input.
                pending[id] = nil -- An uncertain write must never be retried.
                io.wake(id, agent)
            end)
            if not ok then io.warn(err) end
        end
    end
end
return M
