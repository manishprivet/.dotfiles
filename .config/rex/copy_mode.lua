-- Stand-in for tmux-style copy mode until Rex ships a native one.
-- Opens the focused pane's screen and scrollback read-only in bare Neovim.
-- v / V: select with Vim motions; /: search; any yank: copy and close;
-- q: close without copying.
-- Requires nvim with a clipboard provider and rex on the login shell's PATH.
-- Without rex, only restoring focus to the original pane is unavailable.

rex.action{
    name = "copy_mode",
    title = "Copy Mode",
    description = "Open the focused pane's text in nvim to select and copy it.",
    run = function(ctx)
        if not ctx.block_id then error("copy_mode: no focused pane", 0) end

        local r, err = rex.block.call("com.superlogical.terminal", "format",
            { block_id = ctx.block_id, format = "text", trim = true })
        if not r then error(err, 0) end

        local text = r.content:gsub("%s+$", "") .. "\n"
        local path = os.tmpname()
        local f = assert(io.open(path, "w"))
        f:write(text)
        f:close()

        local vim_cmds = table.concat({
            "set clipboard=unnamedplus nomodifiable readonly",
            "nnoremap <silent> q :qa!<CR>",
            "execute 'normal! Gzb'",
            "autocmd TextYankPost * call timer_start(0, {-> execute('qa!')})",
        }, " | ")

        local layer, err2 = rex.session.new_layer{
            bounds = { 0, 0, 1, 1 },
            focus = true,
            layout = rex.layout.block{
                flavor = "com.superlogical.terminal.shell",
                options = {
                    command = {
                        "/bin/sh", "-c",
                        -- Restore focus before the layer goes away.
                        [[trap 'rm -f "$1"' EXIT; nvim -u NONE -i NONE -n -c "$2" "$1"; ]]
                            .. [[rex focus -s "$4" "$3" >/dev/null 2>&1]],
                        "copy_mode", path, vim_cmds, ctx.block_id, ctx.session_id,
                    },
                },
            },
        }
        if not layer then
            os.remove(path)
            error(err2, 0)
        end
        return layer
    end,
}
