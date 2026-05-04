return {
  id = "recording",
  render = function()
    local register = vim.fn.reg_recording()
    if register == "" then
      return ""
    end
    return " @" .. register
  end,
}
