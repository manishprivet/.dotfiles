local M = {}

function M.hl(text, opts)
  opts = opts or {}
  local attrs = {}
  if opts.fg then
    table.insert(attrs, "fg=" .. opts.fg)
  end
  if opts.bg then
    table.insert(attrs, "bg=" .. opts.bg)
  end
  if opts.bold then
    table.insert(attrs, "bold")
  end
  if opts.italic then
    table.insert(attrs, "italic")
  end
  if #attrs == 0 then
    return text
  end
  return "#[" .. table.concat(attrs, ",") .. "]" .. text
end

return M
