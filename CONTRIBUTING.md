# Contributing to argus-mcp-catalog

This repository contains the machine-readable MCP server catalog consumed by the
[argus-mcp-docs](https://github.com/diaz3618/argus-mcp-docs) documentation site.
Each entry is a YAML file in `configs/<category>/` describing how Argus should
launch or connect to one MCP server backend.

---

## Overview

The catalog has two layers:

| File | Purpose |
|------|---------|
| `catalog.json` | Root index listing every YAML filename grouped by category |
| `configs/<category>/<server>.yaml` | Per-server configuration consumed by Argus at runtime |

The `generate-catalog.mjs` pre-build script in the docs repo reads `catalog.json`
to discover files, then fetches each YAML from GitHub to build the catalog pages.

---

## YAML File Schema

Every YAML file must have **at minimum** three top-level keys:

```yaml
name: "Human-Readable Server Name"
description: "One-sentence description of what this MCP server does."

<backend-slug>:
  type: stdio          # or: sse | http | streamable-http
  command: "npx"       # executable or "docker"
  args:
    - "-y"
    - "@some/mcp-server"
```

### Full example — subprocess server

```yaml
name: "Filesystem"
description: "Provides read/write access to local file system paths."

filesystem:
  type: stdio
  command: npx
  args:
    - "-y"
    - "@modelcontextprotocol/server-filesystem"
    - "/home/user/projects"
```

### Full example — container variant

```yaml
name: "Filesystem (Container)"
description: "Containerised filesystem access for isolated environments."

filesystem-container:
  type: stdio
  command: docker
  args:
    - run
    - "--rm"
    - "-i"
    - "--network=none"
    - "-v"
    - "/home/user/projects:/workspace:ro"
    - "mcp/filesystem"
  container:
    image: mcp/filesystem
    network: none
    volumes:
      - "/home/user/projects:/workspace:ro"
```

### Advanced example — source build (GitHub-only server)

For MCP servers not published to npm or PyPI — built directly from a GitHub repository:

```yaml
name: "My GitHub Server (containerized)"
description: "Server available only on GitHub. Built from source at container build time."

my-github-server-container:
  type: stdio
  command: node
  args: ["dist/index.js"]
  container:
    enabled: true
    network: bridge
    source_url: https://github.com/owner/my-mcp-server.git
    build_steps:
      - "npm install"
      - "npm run build"
    entrypoint:
      - "node"
      - "dist/index.js"
```

**Required:** `container.source_url` requires both `build_steps` and `entrypoint`. Omitting either causes a validation error. `build_steps` entries cannot contain backticks, `$()`, or `()`.

### Advanced example — Go transport

For MCP servers written in Go and published as Go modules:

```yaml
name: "Kubernetes MCP (Go build)"
description: "Manage Kubernetes clusters. Compiled from Go source."

kubernetes-go-container:
  type: stdio
  command: mcp-k8s
  container:
    transport: go
    go_package: github.com/strowk/mcp-k8s-go
    network: bridge
    volumes:
      - "${HOME}/.kube:/home/nonroot/.kube:ro"
```

**Required:** Use `container.transport: go` together with `container.go_package` to specify the Go module path. The binary is compiled via `go install` and invoked directly.

### Advanced example — custom Dockerfile

For servers with complex build requirements beyond what standard fields support. The Dockerfile must be co-located with the YAML file (no `..` path components allowed):

```yaml
name: "Custom Server (containerized)"
description: "Server requiring a custom build environment."

custom-server-container:
  type: stdio
  command: python
  args: ["-m", "my_server"]
  container:
    dockerfile: custom-server-container.dockerfile
    network: none
```

The file `custom-server-container.dockerfile` must exist in the **same directory** as `custom-server-container.yaml` — e.g., `configs/my-category/custom-server-container.dockerfile`.

### Full example — remote SSE server

```yaml
name: "DeepWiki"
description: "Remote MCP server providing deep wiki knowledge lookup via SSE."

deepwiki:
  type: sse
  url: "https://mcp.deepwiki.com/sse"
```

### Full example — remote server with auth header

```yaml
name: "Semgrep"
description: "Remote MCP server for Semgrep static analysis via HTTP."

semgrep:
  type: http
  url: "https://mcp.semgrep.dev/mcp"
  headers:
    Authorization: "Bearer ${SEMGREP_TOKEN}"
```

### Field reference

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | Yes | string | Display name shown in the catalog UI |
| `description` | Yes | string | One-sentence description |
| `<backend-slug>` | Yes | object | Unique key identifying this entry; must be present |
| `<slug>.type` | Yes | string | `stdio`, `sse`, `http`, or `streamable-http` |
| `<slug>.command` | stdio only | string | Executable: `npx`, `uvx`, `docker`, etc. |
| `<slug>.args` | stdio only | string[] | Argument list passed to command |
| `<slug>.url` | remote only | string | Full URL for remote servers |
| `<slug>.headers` | remote only | object | HTTP headers; use `${ENV_VAR}` for secrets |
| `<slug>.env` | optional | object | Environment variables; use `${ENV_VAR}` for secrets |
| `container` | optional | object | Present only on container variants |
| `container.image` | optional | string | Docker image name |
| `container.network` | optional | string | `none` or `bridge` |
| `container.volumes` | optional | string[] | Volume mount specs |
| `container.source_url` | optional | string | Git repository URL for GitHub-only servers. Requires `build_steps` and `entrypoint`. |
| `container.build_steps` | optional | string[] | Build commands run after cloning `source_url`. No shell metacharacters (backticks, `$()`, `()`). |
| `container.entrypoint` | optional | string[] | Container entrypoint for source builds. Required when `source_url` is set. |
| `container.build_env` | optional | object | Environment variables available only during the build stage. |
| `container.source_ref` | optional | string | Git branch, tag, or commit SHA to check out (default: default branch). |
| `container.dockerfile` | optional | string | Path to a co-located Dockerfile (no `..` allowed). Overrides auto-generated template. |
| `container.transport` | optional | string | Transport override: `uvx`, `npx`, or `go`. Use `go` with `go_package` for Go modules. |
| `container.go_package` | optional | string | Go module path for `go install`. Required when `transport: go`. |
| `container.system_deps` | optional | string[] | OS packages installed in the runtime container image. |
| `container.build_system_deps` | optional | string[] | OS packages installed only in the builder stage (not in final image). |
| `container.memory` | optional | string | Memory limit (e.g., `512m`, `1g`). Default: `512m`. |
| `container.cpus` | optional | string | CPU limit (e.g., `0.5`, `2`). Default: `1`. |
| `container.extra_args` | optional | string[] | Additional arguments passed directly to `docker run`. |

**Security:** Never store real tokens or passwords in YAML files. Always use
`${ENV_VAR}` placeholder syntax for any credential values.

---

## File Naming Convention

| Server type | Filename pattern | Example |
|-------------|-----------------|---------|
| Native subprocess | `{server}.yaml` | `filesystem.yaml` |
| Docker container variant | `{server}-container.yaml` | `filesystem-container.yaml` |
| Remote (SSE / HTTP / OAuth) | `{server}.yaml` | `deepwiki.yaml` |
| Custom Dockerfile | `{server}-container.dockerfile` | `filesystem-container.dockerfile` |

Rules:

- Use lowercase kebab-case only.
- Container variants always end in `-container.yaml`.
- Remote servers never have a `-container.yaml` variant (they are not run locally).
- The backend slug key inside the YAML must match the filename stem
  (e.g., `filesystem-container:` in `filesystem-container.yaml`).
- Dockerfiles must be co-located with their paired YAML file in `configs/<category>/`.
- The YAML entry references the Dockerfile by filename only: `container.dockerfile: {server}-container.dockerfile`.
- Never use `..` path components in `container.dockerfile` values — the validator will reject them.

---

## How to Add a New Server

1. **Fork** this repository and create a branch named `add/{server-name}`.

2. **Choose a category** from the list below that best matches the server.

3. **Create the YAML file** at `configs/<category>/<server>.yaml` following the
   schema above. If the server can also run in a Docker container, create a
   second file `configs/<category>/<server>-container.yaml`.

4. **Register in catalog.json:** Add the filename(s) to the appropriate category
   array in `catalog.json`. Maintain alphabetical order within each array and
   update the `updated_at` field to the current ISO 8601 date.

5. **Validate locally:**

   ```bash
   npm install js-yaml
   node scripts/lint-catalog.js
   ```

   The script must exit 0 with "All checks passed." before you open a PR.

6. **Open a pull request** targeting `main`. The CI workflow will run
   `lint-catalog.js` automatically on your PR.

---

## Category Definitions

| Category | What belongs here |
|----------|------------------|
| `filesystem-access` | Local file system and git repository access tools |
| `web-research` | Web search, fetching, and documentation lookup tools requiring internet access |
| `databases` | Database connectivity tools (SQL, NoSQL, cloud-hosted) |
| `ai-memory` | Persistent memory and knowledge graph tools for AI assistants |
| `devops-integrations` | CI/CD, version control platforms, and infrastructure management tools |
| `security-tools` | Code scanning, vulnerability detection, and security analysis tools |
| `remote-sse` | Remote MCP servers using `type: sse` or `type: streamable-http` with no authentication. Despite the directory name, both transports belong here. |
| `remote-http` | Remote MCP servers accessible via HTTP requiring a static API token or Bearer header |
| `remote-auth` | Remote MCP servers requiring OAuth 2.1 PKCE or advanced authentication flows |
| `fully-isolated` | Tools that work correctly with `network: none` — pure computation, no outbound connections |

When in doubt, open a PR and ask in the description — maintainers will help
choose the right category.

---

## Validation

The CI workflow (`lint-catalog.yml`) runs on every PR that touches `configs/`
or `catalog.json`. It performs the following checks (D-16):

1. `catalog.json` is valid JSON with a `categories` object and `updated_at` string.
2. Every filename listed in `catalog.json` exists at `configs/<category>/<filename>`.
3. Every YAML file listed parses without error.
4. Every YAML has a top-level `name:` that is a non-empty string.
5. Every YAML has a top-level `description:` that is a non-empty string.
6. Every YAML has at least one key besides `name` and `description` (the backend slug).

Run validation locally before pushing:

```bash
npm install js-yaml
node scripts/lint-catalog.js
```

Expected output:

```
Checking catalog.json...
Checked 65 files across 10 categories.
All checks passed.
```
