local M = {}

function M.current_root_info()
  local cwd = vim.fn.getcwd()
  local root = cwd

  if _G.LazyVim and LazyVim.root and type(LazyVim.root.get) == "function" then
    local ok, detected = pcall(LazyVim.root.get, { normalize = true })
    if ok and type(detected) == "string" and detected ~= "" then
      root = detected
    end
  end

  return root, cwd
end

function M.current_file_info()
  local full_name = vim.fn.expand("%:t")
  local full_path = vim.fn.expand("%:p")
  local root, cwd = M.current_root_info()
  local relative_path = full_path
  local sep = package.config:sub(1, 1)

  if root ~= "" and relative_path:find(root, 1, true) == 1 then
    relative_path = relative_path:sub(#root + 2)
  elseif cwd ~= "" and relative_path:find(cwd, 1, true) == 1 then
    relative_path = relative_path:sub(#cwd + 2)
  end

  return {
    full_name = full_name,
    full_path = full_path,
    root = root,
    cwd = cwd,
    relative_path = relative_path,
    sep = sep,
  }
end

function M.truncate_from_left(text, max_length)
  if #text <= max_length then
    return text
  end
  if max_length <= 3 then
    return text:sub(1, max_length)
  end
  return "..." .. text:sub(-(max_length - 3))
end

return M
