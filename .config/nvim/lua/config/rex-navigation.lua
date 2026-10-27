local M = {}

-- Return mappings only inside Rex; nil lets the caller keep its other mappings.
function M.keys()
  if not vim.env.REX_SESSION or vim.env.REX_SESSION == "" then
    return nil
  end

  local keys = {}
  -- Rex forwards Ctrl chords to Neovim; cross into Rex only at a split edge.
  for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
    local wincmd, rex_direction = key, direction
    keys[#keys + 1] = {
      "<c-" .. key .. ">",
      function()
        local previous = vim.api.nvim_get_current_win()
        vim.cmd("wincmd " .. wincmd)
        if vim.api.nvim_get_current_win() ~= previous then
          return
        end
        local bin_dir = vim.env.REX_BIN_DIR
        local executable = bin_dir and bin_dir ~= "" and (bin_dir .. "/rex") or "rex"
        vim.system({ executable, "focus", "-s", vim.env.REX_SESSION, rex_direction }, {}, function(result)
          if result.code ~= 0 then
            vim.schedule(function()
              vim.notify(result.stderr, vim.log.levels.WARN, { title = "Rex navigation" })
            end)
          end
        end)
      end,
      desc = "Navigate " .. direction .. " (vim/rex)",
    }
  end
  return keys
end

return M
