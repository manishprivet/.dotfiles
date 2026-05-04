local M = {}

function M.should_ignore_buffer(buf_name)
  if buf_name == "" then
    return true
  end

  local ignore_list = { "nvimtree", "help", "neo-tree" }
  for _, pattern in ipairs(ignore_list) do
    if string.find(buf_name:lower(), pattern, 1, true) then
      return true
    end
  end

  return false
end

function M.get_listed_buffers()
  local bufs = {}
  local seen = {}
  for _, buf in ipairs(vim.fn.getbufinfo({ buflisted = 1 })) do
    local buf_name = buf.name or ""
    if not M.should_ignore_buffer(buf_name) then
      local file_name = buf_name:match("([^/\\]+)$") or buf_name
      if not seen[file_name] then
        seen[file_name] = true
        table.insert(bufs, { bufnr = buf.bufnr, name = file_name })
      end
    end
  end
  return bufs
end

return M
