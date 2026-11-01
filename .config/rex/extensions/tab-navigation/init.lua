-- client.tab.goto follows activity entries in Show Activity mode. Resolve the
-- real session tab order instead, matching the tab-numbers extension's titles.
rex.action{
    name = "goto_session_tab",
    title = "Go to Session Tab",
    args = { index = "integer" },
    run = function(ctx, args)
        local view, err = rex.session.view{ session_id = ctx.session_id }
        if err ~= nil then error(err, 0) end
        local window = (view.windows or {})[args.index]
        if not window then return end
        -- Select an explicit window in the originating client, without changing
        -- the sidebar mode or selecting an activity's pane within that window.
        rex.client.queue("session.select", {
            session_id = ctx.session_id,
            window_id = window.window_id,
        })
    end,
}

for index = 1, 9 do
    rex.bind("ctrl+s>" .. index, "goto_session_tab", { index = index })
end
