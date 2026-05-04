local config = require("config.zellij_status.bottom.config")
local fmt = require("config.zellij_status.format")
local helpers = require("config.zellij_status.bottom.helpers")
local palette = require("config.zellij_status.palette")

return {
  id = "breadcrumbs",
  render = function(ctx)
    local ok, navic = pcall(require, "nvim-navic")
    if not ok then
      return ""
    end

    local available_ok, is_available = pcall(navic.is_available)
    if not available_ok or not is_available then
      return ""
    end

    local data_ok, data = pcall(navic.get_data)
    if not data_ok or type(data) ~= "table" or #data == 0 then
      return ""
    end

    local text_color = (ctx and ctx.inactive) and palette.inactive.text or palette.text
    local muted_color = (ctx and ctx.inactive) and palette.inactive.muted or palette.muted
    local parts = {}
    for _, item in ipairs(data) do
      local icon = item.icon or ""
      local name = item.name or ""
      local color = (ctx and ctx.inactive) and muted_color or (palette.navic[item.type] or palette.muted)
      local rendered_name = fmt.hl(name, { fg = text_color, bg = palette.bg })
      local part = rendered_name
      if icon ~= "" then
        part = fmt.hl(icon, { fg = color, bg = palette.bg }) .. rendered_name
      end
      table.insert(parts, {
        plain = vim.trim(name),
        rendered = vim.trim(part),
      })
    end

    if #parts == 0 then
      return ""
    end

    local visible = parts
    if #parts > 2 then
      visible = {
        { plain = "...", rendered = fmt.hl("...", { fg = muted_color, bg = palette.bg }) },
        parts[#parts - 1],
        parts[#parts],
      }
    end

    local separator_plain = " > "
    local separator_rendered = fmt.hl(" > ", { fg = muted_color, bg = palette.bg })
    local plain_width = 0
    for index, part in ipairs(visible) do
      plain_width = plain_width + #part.plain
      if index > 1 then
        plain_width = plain_width + #separator_plain
      end
    end

    local max_width = config.max_breadcrumb_width
    if plain_width > max_width then
      for index = 2, #visible - 1 do
        local overflow = plain_width - max_width
        if overflow <= 0 then
          break
        end
        local target = visible[index]
        local next_plain = helpers.truncate_from_left(target.plain, math.max(6, #target.plain - overflow))
        if next_plain ~= target.plain then
          target.plain = next_plain
          target.rendered = fmt.hl(next_plain, { fg = text_color, bg = palette.bg })
          plain_width = 0
          for i, part in ipairs(visible) do
            plain_width = plain_width + #part.plain
            if i > 1 then
              plain_width = plain_width + #separator_plain
            end
          end
        end
      end
    end

    if plain_width > max_width then
      local last = visible[#visible]
      local overflow = plain_width - max_width
      local next_plain = helpers.truncate_from_left(last.plain, math.max(8, #last.plain - overflow))
      last.plain = next_plain
      last.rendered = fmt.hl(next_plain, { fg = text_color, bg = palette.bg })
    end

    local rendered = {}
    for _, part in ipairs(visible) do
      table.insert(rendered, part.rendered)
    end

    return table.concat(rendered, separator_rendered)
  end,
}
