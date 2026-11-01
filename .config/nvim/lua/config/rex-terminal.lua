local M = {}

-- Merged into lazygit's config so editing a file reaches this Neovim instead of a nested one.
local lazygit_overlay = vim.fn.expand("~/.config/lazygit/rex.yml")
local positions = { bottom = "below", top = "above", left = "left", right = "right" }
-- Rex blocks opened per snacks terminal id; a repeat call focuses the block instead of opening another.
local blocks = {}

local function rex_executable()
  local bin_dir = vim.env.REX_BIN_DIR
  return bin_dir and bin_dir ~= "" and (bin_dir .. "/rex") or "rex"
end

local function warn(message)
  vim.schedule(function()
    vim.notify(message, vim.log.levels.WARN, { title = "Rex terminal" })
  end)
end

local function inside_rex()
  return vim.env.REX_SESSION ~= nil and vim.env.REX_SESSION ~= "" and vim.env.REX_BLOCK ~= nil
end

-- The Rex server spawns the block, so it doesn't inherit Neovim's environment.
local function command(cmd, opts)
  if not cmd then
    return nil
  end
  local argv = type(cmd) == "table" and vim.tbl_map(tostring, cmd) or { vim.o.shell, "-c", cmd }
  local env = vim.tbl_extend("force", { NVIM = vim.v.servername }, opts.env or {})
  if argv[1] == "lazygit" then
    local files = vim.split(vim.env.LG_CONFIG_FILE or "", ",", { plain = true, trimempty = true })
    files[#files + 1] = lazygit_overlay
    env.LG_CONFIG_FILE = table.concat(files, ",")
  end
  local prefix = { "env" }
  for key, value in pairs(env) do
    prefix[#prefix + 1] = key .. "=" .. value
  end
  return vim.list_extend(prefix, argv)
end

local function track(rex, session, tid, block_id)
  blocks[tid] = block_id
  vim.system({ rex, "wait", "-s", session, block_id }, {}, function()
    vim.schedule(function()
      if blocks[tid] == block_id then
        blocks[tid] = nil
      end
      -- Reload buffers the program may have changed.
      vim.cmd.checktime()
    end)
  end)
end

local function float(rex, session, tid, block)
  vim.system({ rex, "block", "inspect", "-s", session, vim.env.REX_BLOCK, "--json" }, { text = true }, function(inspect)
    if inspect.code ~= 0 then
      return warn(inspect.stderr)
    end
    local request = vim.json.encode({
      session_id = session,
      window_id = vim.json.decode(inspect.stdout).block.window_id,
      bounds = { 0.05, 0.05, 0.9, 0.9 },
      focus = true,
      layout = { block = block },
    })
    vim.system({ rex, "api", "call", "-s", session, "session.new_layer", "-" }, { text = true, stdin = request }, function(created)
      if created.code ~= 0 then
        return warn(created.stderr)
      end
      track(rex, session, tid, vim.json.decode(created.stdout).block_ids[1])
    end)
  end)
end

local function split(rex, session, tid, direction, block)
  local args = { rex, "split", "-s", session, "-b", vim.env.REX_BLOCK, "--split=" .. direction, "--ratio", "30" }
  vim.list_extend(args, { "-c", block.options.cwd, "--label", block.label, "--json" })
  if block.options.command then
    args[#args + 1] = "--"
    vim.list_extend(args, block.options.command)
  end
  vim.system(args, { text = true }, function(created)
    if created.code ~= 0 then
      return warn(created.stderr)
    end
    track(rex, session, tid, vim.json.decode(created.stdout).block_ids[1])
  end)
end

-- Open a snacks terminal request as a Rex pane: commands float over this tab, shells split beside Neovim.
local function open(cmd, opts)
  local rex, session = rex_executable(), vim.env.REX_SESSION
  local tid = Snacks.terminal.tid(cmd, opts)
  if blocks[tid] then
    vim.system({ rex, "focus", "-s", session, blocks[tid] })
    return
  end
  local position = opts.win and opts.win.position or (cmd and "float" or "bottom")
  local block = {
    flavor = "com.superlogical.terminal.shell",
    label = type(cmd) == "table" and tostring(cmd[1]) or "terminal",
    options = { cwd = opts.cwd or vim.fn.getcwd(0), command = command(cmd, opts) },
  }
  if position == "float" then
    float(rex, session, tid, block)
  else
    split(rex, session, tid, positions[position] or "below", block)
  end
end

function M.setup()
  if not inside_rex() then
    return
  end
  -- snacks' terminal.override hook breaks toggle/focus, so wrap the entry points instead.
  for _, name in ipairs({ "open", "toggle", "focus" }) do
    local original = Snacks.terminal[name]
    Snacks.terminal[name] = function(cmd, opts)
      -- Non-interactive output, such as Snacks.git.blame_line, stays in a snacks window.
      if opts and opts.interactive == false then
        return original(cmd, opts)
      end
      open(cmd, opts or {})
    end
  end
end

return M
