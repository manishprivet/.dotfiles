local config = require("config.zellij_status.bottom.config")
local fmt = require("config.zellij_status.format")
local helpers = require("config.zellij_status.bottom.helpers")
local palette = require("config.zellij_status.palette")

return {
  id = "file",
  render = function()
    local info = helpers.current_file_info()
    if info.full_name == "" then
      return "[No Name]"
    end

    local relative_path = info.relative_path
    local ok, devicons = pcall(require, "nvim-web-devicons")
    if not ok then
      return relative_path
    end

    local icon = devicons.get_icon(info.full_name, nil, { default = true })
    if not icon or icon == "" then
      return relative_path
    end

    local icon_color
    if devicons.get_icon_color then
      local _, color = devicons.get_icon_color(info.full_name, nil, { default = true })
      icon_color = color
    end

    local dir = vim.fn.fnamemodify(relative_path, ":h")
    local file = vim.fn.fnamemodify(relative_path, ":t")
    local normalized_dir = dir:gsub(vim.pesc(info.sep), "/")
    local path_prefix = ""
    if dir ~= "." then
      path_prefix = fmt.hl(normalized_dir .. "/", { fg = palette.muted, bg = palette.bg })
    end

    local max_length = config.max_path_width
    local plain_path = (dir ~= "." and (normalized_dir .. "/") or "") .. file
    if #plain_path > max_length then
      local keep = max_length - #file - 4
      if keep > 0 and dir ~= "." then
        local truncated_dir = helpers.truncate_from_left(normalized_dir, keep)
        path_prefix = fmt.hl("…/", { fg = palette.truncate, bg = palette.bg })
          .. fmt.hl(truncated_dir .. "/", { fg = palette.muted, bg = palette.bg })
      else
        file = helpers.truncate_from_left(file, max_length)
        path_prefix = ""
      end
    end

    if not icon_color or icon_color == "" then
      return path_prefix .. icon .. " " .. file
    end

    return path_prefix
      .. fmt.hl(icon, { fg = icon_color, bg = palette.bg })
      .. fmt.hl(" ", { fg = palette.text, bg = palette.bg })
      .. file
  end,
}
