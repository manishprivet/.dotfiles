return {
  "christoomey/vim-tmux-navigator",
  init = function()
    vim.g.tmux_navigator_no_mappings = 1
  end,
  cmd = {
    "TmuxNavigateLeft",
    "TmuxNavigateDown",
    "TmuxNavigateUp",
    "TmuxNavigateRight",
    "TmuxNavigatePrevious",
    "TmuxNavigatorProcessList",
  },
  keys = function()
    local keys = {
      { "<c-\\>", "<cmd>TmuxNavigatePrevious<cr>" },
    }
    local rex_keys = require("config.rex-navigation").keys()
    if rex_keys then
      vim.list_extend(keys, rex_keys)
    else
      vim.list_extend(keys, {
        { "<c-h>", "<cmd>TmuxNavigateLeft<cr>" },
        { "<c-j>", "<cmd>TmuxNavigateDown<cr>" },
        { "<c-k>", "<cmd>TmuxNavigateUp<cr>" },
        { "<c-l>", "<cmd>TmuxNavigateRight<cr>" },
      })
    end
    return keys
  end,
}
