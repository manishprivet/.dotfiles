return {
  id = "command",
  render = function()
    if package.loaded["noice"] then
      local ok, noice = pcall(require, "noice")
      if ok and noice.api.status.command.has() then
        local value = noice.api.status.command.get()
        if type(value) == "string" then
          return value
        end
      end
    end
    return ""
  end,
}
