return {
  "olimorris/codecompanion.nvim",
  version = "^18.0.0",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-treesitter/nvim-treesitter",
  },
  opts = {
    strategies = {
      chat = {
        adapter = "opencode",
      },
      inline = {
        adapter = "openai_responses",
      },
    },
    adapters = {
      opencode = function()
        return require("codecompanion.adapters").extend("opencode", {
          commands = {
            default = {
              "opencode",
              "acp",
            },
          },
        })
      end,
      openai_responses = function()
        return require("codecompanion.adapters").extend("openai_responses", {
          env = {
            api_key = "OPENAI_API_KEY",
          },
        })
      end,
    },
  },
}
