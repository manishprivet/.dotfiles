-- Run from the repo root: nvim --clean --headless -l scripts/test_navigation.lua
-- Mock the navigation commands so this test never moves a real tmux pane.
package.preload["config.rex-navigation"] = function()
  return { keys = function() return nil end }
end
vim.env.HERDR_PANE_ID = nil

local spec = dofile(".config/nvim/lua/plugins/vim-tmux-navigator.lua")
local called = {}
for _, direction in ipairs({ "Left", "Down", "Up", "Right", "Previous" }) do
  local name = "TmuxNavigate" .. direction
  vim.api.nvim_create_user_command(name, function()
    called[#called + 1] = name
  end, {})
end

local mappings = spec.keys()
assert(#mappings == 5, "Expected five navigation mappings")
for _, mapping in ipairs(mappings) do
  vim.keymap.set("n", mapping[1], mapping[2])
  local expected = mapping[2]:match("^<cmd>(TmuxNavigate%a+)<cr>$")
  assert(expected, "Invalid navigation command: " .. mapping[2])
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes(mapping[1], true, false, true), "xt", false)
  assert(called[#called] == expected, "Mapping did not invoke " .. expected)
end
assert(#called == 5, "Every navigation command must run exactly once")
print("All five Vim/tmux navigation mappings passed")
