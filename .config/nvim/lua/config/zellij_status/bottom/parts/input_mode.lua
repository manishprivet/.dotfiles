return {
  id = "input_mode",
  render = function()
    if package.loaded["noice"] then
      local ok, noice = pcall(require, "noice")
      if ok and noice.api.status.mode.has() then
        local value = noice.api.status.mode.get()
        if type(value) == "string" then
          return value
        end
      end
    end
    return ""
  end,
}
