-- Agent metadata only. Native Rex persistence owns all resource IDs/layouts.
local M = {}
local terminal = "com.superlogical.terminal"
local function checked(value, err)
    if value == nil then error(err or "Rex call failed", 0) end
    return value
end

function M.collect(api, server, previous, record_for, identity_for, resumed_for)
    local agents, live = {}, {}
    for _, session in ipairs(checked(api.call("session.list", {})).sessions or {}) do
        checked(api.session.attach{ session_id = session.session_id })
        local view = checked(api.session.view{ session_id = session.session_id })
        for _, window in ipairs(view.windows or {}) do
            for _, layer in ipairs(window.layers or {}) do
                for _, block in ipairs(layer.blocks or {}) do
                    if block.creator_name == terminal and (not block.host_id or block.host_id == server.host_id) then
                        local id = block.block_id
                        live[id] = true
                        local process = checked(api.block.call(terminal, "process", {
                            session_id = session.session_id, block_id = id,
                        }))
                        local record = record_for(id)
                        local matches = false
                        if record and record.rex_session == session.session_id then
                            local chain = { process.foreground or {}, process.child or {} }
                            for _, item in ipairs(process.ancestors or {}) do chain[#chain + 1] = item end
                            for _, item in ipairs(chain) do
                                if item.pid == record.pid then matches = true end
                            end
                            -- Fish event handlers run children in the shell's own
                            -- foreground group; Rex can report Fish for that group.
                            matches = (matches or (resumed_for and resumed_for(id, record, process)))
                                and identity_for(record.pid) == record.identity
                        end
                        if matches then
                            agents[id] = { agent = record.agent, session_id = record.session_id,
                                cwd = record.cwd, pid = record.pid, identity = record.identity,
                                rex_session = session.session_id, instance_id = server.instance_id }
                        else
                            local old = (previous or {})[id]
                            -- Keep a prior-instance candidate until its restored shell starts.
                            -- Same-instance exits are deliberately not resumable.
                            if old and old.instance_id ~= server.instance_id
                                and old.rex_session == session.session_id then agents[id] = old end
                        end
                    end
                end
            end
        end
    end
    return agents
end
return M
