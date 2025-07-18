return {
  "code-biscuits/nvim-biscuits",
  keys = {
    {
      "<leader>bb",
      function()
        require("nvim-biscuits").BufferAttach()
      end,
      mode = "n",
      desc = "Enable Biscuits",
    },
  },
}
