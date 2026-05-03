---
name: smolvm
description: Use the smolvm CLI to build and run portable, lightweight, self-contained virtual machines. Trigger this skill when users mention smolvm, microVMs, lightweight VMs, running code in isolated VMs, portable VM artifacts, .smolmachine files, running untrusted code safely, libkrun, Krun, Hypervisor.framework, or KVM-based virtualization. Also trigger for smolvm pack, machine create/exec/run, Smolfile, or OCI images as VMs.
---

# smolvm Skill

Use this skill to work with smolvm, a CLI tool for creating portable, lightweight, self-contained virtual machines using libkrun (Krun) hypervisor technology.

## When to use

Use this skill when the user asks to:
- Run code in an isolated VM (sandboxing untrusted code)
- Create portable VM artifacts (.smolmachine files)
- Set up development environments with reproducible VM configs
- Work with OCI images as microVMs
- Configure network access control for VMs
- Forward SSH agent into VMs
- Enable GPU acceleration in VMs (if available in version)
- Create persistent development machines
- Manage machines (create, start, stop, exec, delete, cp)
- Use the HTTP API for programmatic control
- Pack existing VMs into portable artifacts
- Create machines from packed .smolmachine files
- Use bare VM mode without OCI images

## What is smolvm?

smolvm is a CLI tool that provides:
- **Sub-second cold start** VMs using libkrun (Krun) hypervisor
- **Cross-platform** support (macOS Apple Silicon/Intel, Linux x86_64/aarch64)
- **Elastic memory** via virtio balloon (host only commits what guest uses)
- **OCI image support** - any image from Docker Hub, ghcr.io, or other OCI registries can boot as a microVM
- **Portable artifacts** - pack stateful VMs into `.smolmachine` single files
- **File copy** - copy files between host and VM with `machine cp`
- **HTTP API** - programmatic control via `serve start`
- **Workspace directory** - `/workspace` persists across exec and stop/start

## Core workflow

1. **Confirm context**
   - Check CLI availability: `smolvm --version` or `smolvm --help`
   - Verify platform requirements (see Platform Support below)
   - Determine if user needs ephemeral or persistent VMs

2. **Map request to command family**
   - `smolvm machine run` - run ephemeral VMs (cleaned up after exit)
   - `smolvm machine create` - create persistent VMs (optionally from .smolmachine with `--from`)
   - `smolvm machine start/stop` - manage persistent VM lifecycle
   - `smolvm machine exec` - execute commands in running VMs (changes persist)
   - `smolvm machine cp` - copy files between host and VM
   - `smolvm pack create` - create portable .smolmachine artifacts
   - `smolvm pack run/start/exec/stop` - run packed binaries
   - `smolvm serve start` - start HTTP API server
   - `smolvm config` - manage configuration

3. **Select appropriate image**
   - Use OCI format images: `alpine`, `python:3.12-alpine`, `node:20`, etc.
   - Default: 4 vCPUs, 8 GiB RAM (override with `--cpus` and `--mem`)

4. **Configure isolation as needed**
   - Network: `--net` flag (off by default for security)
   - Network allowlist: `--allow-host` for specific domains, `--allow-cidr` for IP ranges
   - SSH agent: `--ssh-agent` for key forwarding
   - Volumes: `-v/--volume` for host directory mounts (`HOST:GUEST[:ro]`)
   - Ports: `-p/--port` for port forwarding (`HOST:GUEST`)
   - Use Smolfile with `-s/--smolfile` for complex configs

## Installation

```bash
# macOS + Linux
curl -sSL https://smolmachines.com/install.sh | bash

# Or download from GitHub Releases
# https://github.com/smol-machines/smolvm/releases
```

## Platform Support

| Host | Guest | Requirements |
|------|-------|-------------|
| macOS Apple Silicon | arm64 Linux | macOS 11+ |
| macOS Intel | x86_64 Linux | macOS 11+ |
| Linux x86_64 | x86_64 Linux | KVM (`/dev/kvm`) |
| Linux aarch64 | aarch64 Linux | KVM (`/dev/kvm`) |

## Key Flags

| Flag | Short | Used on | Description |
|------|-------|---------|-------------|
| `--image` | `-I` | run, create, pack create | OCI image |
| `--name` | `-n` | start, stop, status, exec, resize | Machine name (default: "default") |
| `--net` | | run, create | Enable outbound networking (off by default) |
| `--volume` | `-v` | run, create | Mount host dir: `HOST:GUEST[:ro]` |
| `--port` | `-p` | run, create | Port mapping: `HOST:GUEST` |
| `--smolfile` | `-s` | run, create, pack create | Load config from Smolfile |
| `--interactive` | `-i` | run, exec | Keep stdin open |
| `--tty` | `-t` | run, exec | Allocate pseudo-TTY |
| `--allow-cidr` | | run, create | CIDR egress filter (implies --net) |
| `--allow-host` | | run, create | Hostname egress filter (implies --net) |
| `--ssh-agent` | | run, create | Forward host SSH agent |
| `--from` | | machine create | Create from .smolmachine file |
| `--from-vm` | | pack create | Pack from existing VM snapshot |
| `--stream` | | machine exec | Stream output in real-time |

## Command playbook

### Quick start - run ephemeral VM

```bash
# Run a command in an ephemeral VM
smolvm machine run --net --image alpine -- sh -c "echo 'Hello world' && uname -a"

# Interactive shell
smolvm machine run --net -it --image alpine -- /bin/sh
```

### Persistent machines

```bash
# Create a persistent VM
smolvm machine create --net myvm

# Start the VM
smolvm machine start --name myvm

# Execute commands inside
smolvm machine exec --name myvm -- apk add sl
smolvm machine exec --name myvm -it -- /bin/sh

# Stop the VM
smolvm machine stop --name myvm

# List machines
smolvm machine ls
smolvm machine ls --json

# Delete a machine
smolvm machine delete --name myvm
```

### File copy and workspace

```bash
# Copy file to VM
smolvm machine cp ./script.py myvm:/workspace/script.py

# Copy file from VM
smolvm machine cp myvm:/workspace/results.json ./results.json

# /workspace directory persists across exec and stop/start
# Good for: scripts, data, results
smolvm machine cp analysis.R myvm:/workspace/analysis.R
smolvm machine exec --name myvm -- Rscript /workspace/analysis.R
smolvm machine cp myvm:/workspace/results.csv ./results.csv
```

- Files up to 1 MiB transfer as single message
- Larger files stream automatically (1 MiB chunks upload, 16 MiB download)
- Maximum per-transfer: 4 GiB
- Use `--volume` for directories or files >4 GiB

### Smolfile - reproducible environments

Create a `Smolfile` in your project:

```toml
image = "python:3.12-alpine"
net = true

[network]
allow_hosts = ["api.stripe.com", "db.example.com"]

[dev]
init = ["pip install -r requirements.txt"]
volumes = ["./src:/app"]

[auth]
ssh_agent = true
```

```bash
# Create VM from Smolfile
smolvm machine create myvm -s Smolfile
smolvm machine start --name myvm
```

### Network security

```bash
# Network is OFF by default - untrusted code can't phone home
smolvm machine run --image alpine -- nslookup example.com
# Fails - no network access

# Enable network
smolvm machine run --net --image alpine -- ping -c 1 google.com
# Works

# Allow specific hosts only (DNS filtering enabled)
smolvm machine run --net --image alpine --allow-host registry.npmjs.org -- wget -q -O /dev/null https://registry.npmjs.org
# Works

smolvm machine run --net --image alpine --allow-host registry.npmjs.org -- wget -q -O /dev/null https://google.com
# Fails - not in allow list

# Allow CIDR ranges
smolvm machine run --net --allow-cidr 10.0.0.0/8 --image alpine -- ping -c 1 10.0.0.1

# Restrict to localhost only
smolvm machine run --net --outbound-localhost-only --image alpine

# Port forwarding
smolvm machine run --net -p 8080:8080 --image python:3.12-alpine -- python3 -m http.server 8080
```

### SSH agent forwarding

```bash
# Forward SSH agent (requires ssh-agent running on host: check with ssh-add -l)
smolvm machine run --ssh-agent --net --image alpine -- sh -c "apk add -q openssh-client && ssh-add -l"

# Use in persistent VM
smolvm machine create myvm --ssh-agent --net
smolvm machine exec --name myvm -- git clone git@github.com:org/private-repo.git

# Smolfile
# [auth]
# ssh_agent = true
```

Inside the VM, `SSH_AUTH_SOCK` is set automatically. Keys cannot be extracted from the VM - this is enforced by the hypervisor isolation.

### GPU acceleration

```bash
# Enable GPU (virtio-gpu / Venus)
smolvm machine run --gpu --image alpine -- vulkaninfo --summary

# With Smolfile
# gpu = true
# gpu_vram = 2048   # MiB, default 4096
```

For headless browsers with GPU, see [`examples/headless-browser/`](https://github.com/smol-machines/smolvm/tree/main/examples/headless-browser/).

### Pack into portable artifacts

```bash
# Create portable .smolmachine from OCI image
smolvm pack create --image python:3.12-alpine -o ./python312

# Create from an existing VM snapshot
smolvm pack create --from-vm myvm -o ./my-vm-backup

# Run the portable artifact (ephemeral)
./python312 run -- python3 --version

# Or run in daemon mode
./python312 start
./python312 exec -- pip install requests
./python312 stop

# Create a persistent machine from a .smolmachine (fast boot, no image pull)
smolvm machine create my-vm --from ./python312.smolmachine
smolvm machine start --name my-vm
```

**Packed binary structure:**
- `my-app` — stub binary with embedded VM runtime (platform-specific)
- `my-app.smolmachine` — VM payload: rootfs, OCI layers, storage (cross-platform)

### Resource configuration

```bash
# Override CPU/RAM defaults (4 vCPUs, 8 GiB)
smolvm machine run --cpus 2 --mem 4g --image alpine -- free -h

# With Smolfile
# cpus = 2
# memory = 4096  # MiB
```

**Defaults:** 4 vCPUs, 8192 MiB RAM, 20 GiB storage, 2 GiB overlay. Memory and CPU are elastic via virtio balloon.

### HTTP API

```bash
# Start the HTTP API server
smolvm serve start --listen 127.0.0.1:8080
# Or use Unix socket
smolvm serve start --listen $XDG_RUNTIME_DIR/smolvm.sock

# Key endpoints:
# POST   /api/v1/machines              Create machine
# GET    /api/v1/machines              List machines
# GET    /api/v1/machines/:name        Get machine
# POST   /api/v1/machines/:name/start  Start machine
# POST   /api/v1/machines/:name/stop   Stop machine
# DELETE /api/v1/machines/:name        Delete machine
# POST   /api/v1/machines/:name/exec   Execute command
# POST   /api/v1/machines/:name/exec/stream  Streaming exec (SSE)
# PUT    /api/v1/machines/:name/files/*path  Upload file
# GET    /api/v1/machines/:name/files/*path  Download file

# Get OpenAPI spec
smolvm serve openapi
```

### Configuration

```bash
# Manage registry authentication
smolvm config registries edit
```

### Known limitations to mention

- Network: TCP/UDP only, no ICMP
- Volume mounts: directories only (no single files)
- macOS: binary must be signed with Hypervisor.framework entitlements
- `--ssh-agent` requires SSH_AUTH_SOCK to be set on host
- File copy: per-transfer cap is 4 GiB
- Bare VM mode: runs Alpine rootfs without OCI image

## Troubleshooting checklist

1. **Installation issues**
   - Verify with `smolvm --version` or `smolvm --help`
   - On macOS: ensure binary has Hypervisor.framework entitlements
   - On Linux: verify KVM access with `ls -l /dev/kvm`

2. **VM won't start**
   - Check image exists: `smolvm machine run --image alpine -- echo test`
   - Verify resources: `smolvm machine ls` for persistent VMs
   - Check status: `smolvm machine status --name <vm>`

3. **Network issues**
   - Remember: network is OFF by default, use `--net`
   - Check allowlist: `--allow-host` only allows specific domains
   - Use `--allow-cidr` for IP/CIDR-based filtering

4. **SSH agent issues**
   - Verify host has SSH agent: `ssh-add -l`
   - Check SSH_AUTH_SOCK is set: `echo $SSH_AUTH_SOCK`
   - Note: keys cannot be extracted from inside the VM

5. **File copy issues**
   - Maximum file size is 4 GiB per transfer
   - Use `--volume` for larger files or directories
   - Use `/workspace` for persistent file storage across exec/stop/start

6. **Persistence issues**
   - `machine run` is always ephemeral - use `machine create` + `machine exec` for persistence
   - For packed binaries, use `machine create --from` for full persistence

## Output format

For substantial requests, respond with:

1. **Intent**
   - What was done and why

2. **Commands**
   - Exact smolvm command(s) run or recommended

3. **Result**
   - Key output: VM output, machine status, etc.

4. **Next Command** (optional)
   - One useful follow-up command

## Guardrails

- Network is OFF by default for security - explain this to users
- SSH agent forwarding is secure - keys cannot leave the VM
- Remind about platform requirements (macOS 11+, KVM on Linux)
- Note that .smolmachine artifacts are architecture-specific
- For untrusted code, recommend keeping network off