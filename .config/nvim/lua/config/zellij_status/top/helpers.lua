local M = {}

function M.should_ignore_buffer(bufnr, buf_name)
  if buf_name == "" then
    return true
  end

  local bo = vim.bo[bufnr]
  if bo.buftype == "help" or bo.filetype == "help" then
    return true
  end

  if bo.filetype == "nvimtree" or bo.filetype == "neo-tree" then
    return true
  end

  return false
end

function M.get_listed_buffers()
  local bufs = {}
  local seen = {}
  local name_counts = {}

  local function add_buf(bufnr, buf_name)
    if seen[bufnr] then
      return
    end

    seen[bufnr] = true
    local file_name = buf_name:match("([^/\\]+)$") or buf_name
    name_counts[file_name] = (name_counts[file_name] or 0) + 1
    table.insert(bufs, { bufnr = bufnr, name = file_name, path = buf_name })
  end

  for _, buf in ipairs(vim.fn.getbufinfo({ buflisted = 1 })) do
    local buf_name = buf.name or ""
    if not M.should_ignore_buffer(buf.bufnr, buf_name) then
      add_buf(buf.bufnr, buf_name)
    end
  end

  for _, win in ipairs(vim.api.nvim_list_wins()) do
    local bufnr = vim.api.nvim_win_get_buf(win)
    local buf_name = vim.api.nvim_buf_get_name(bufnr)
    local is_normal_file = vim.bo[bufnr].buftype == ""
    if is_normal_file and not M.should_ignore_buffer(bufnr, buf_name) then
      add_buf(bufnr, buf_name)
    end
  end

  for _, buf in ipairs(bufs) do
    if name_counts[buf.name] > 1 then
      local parent = vim.fn.fnamemodify(buf.path, ":h:t")
      if parent ~= "" and parent ~= "." then
        buf.display_name = parent .. "/" .. buf.name
      else
        buf.display_name = buf.name
      end
    else
      buf.display_name = buf.name
    end
  end

  return bufs
end

return M
