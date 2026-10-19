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
      { "<c-\\>", "<cmd><C-U>TmuxNavigatePrevious<cr>" },
    }
    -- Herdr's editor script owns the directional mappings inside its panes.
    if not vim.env.HERDR_PANE_ID or vim.env.HERDR_PANE_ID == "" then
      vim.list_extend(keys, {
        { "<c-h>", "<cmd><C-U>TmuxNavigateLeft<cr>" },
        { "<c-j>", "<cmd><C-U>TmuxNavigateDown<cr>" },
        { "<c-k>", "<cmd><C-U>TmuxNavigateUp<cr>" },
        { "<c-l>", "<cmd><C-U>TmuxNavigateRight<cr>" },
      })
    end
    return keys
  end,
}
