# argus-mcp-catalog

Machine-readable catalog of MCP server configurations consumed by the [Argus MCP documentation site](https://github.com/diaz3618/argus-mcp-docs). Each entry is a YAML file describing how Argus should launch or connect to one MCP server.

---

## Structure

```
catalog.json              ← root index (auto-generated, do not edit manually)
configs/
  filesystem-access/      ← category directories
    filesystem.yaml
    filesystem-container.yaml
  web-research/
    context7.yaml
    ...
scripts/
  generate-index.js       ← regenerates catalog.json from configs/
  lint-catalog.js         ← validates all YAML files and catalog.json
```

`catalog.json` is automatically regenerated on every merge to `main` that changes a file in `configs/`. Do not edit it by hand.

---

## Categories

| Category | What belongs here |
|----------|------------------|
| `filesystem-access` | Local file system and git repository access |
| `web-research` | Web search, fetching, and documentation lookup |
| `databases` | Database connectivity (SQL, NoSQL, cloud-hosted) |
| `ai-memory` | Persistent memory and knowledge graph tools |
| `devops-integrations` | CI/CD, version control, and infrastructure tools |
| `security-tools` | Code scanning, vulnerability detection, security analysis |
| `remote-sse` | Remote servers via SSE or streamable-HTTP (no auth) |
| `remote-http` | Remote servers via HTTP with a static token or Bearer header |
| `remote-auth` | Remote servers requiring OAuth 2.1 PKCE or advanced auth |
| `fully-isolated` | Tools that work with `network: none` — no outbound connections |

---

## Adding a Server

1. Fork this repo, create a branch `add/{server-name}`
2. Create `configs/<category>/<server>.yaml` following the schema below
3. Run `node scripts/lint-catalog.js` — it must exit 0
4. Open a PR — CI will lint automatically and `catalog.json` will regenerate on merge

### Minimum required YAML

```yaml
name: "Human-Readable Server Name"
description: "One-sentence description of what this MCP server does."

<backend-slug>:
  type: stdio          # or: sse | http | streamable-http
  command: npx
  args:
    - "-y"
    - "@org/package-name"
```

The `<backend-slug>` key must match the filename stem (e.g., `filesystem:` in `filesystem.yaml`).

### Remote server (SSE)

```yaml
name: "DeepWiki"
description: "Remote MCP server providing deep wiki knowledge lookup via SSE."

deepwiki:
  type: sse
  url: "https://mcp.deepwiki.com/sse"
```

### Container variant

Add a second file `configs/<category>/<server>-container.yaml`:

```yaml
name: "Filesystem (Container)"
description: "Containerised filesystem access for isolated environments."

filesystem-container:
  type: stdio
  command: docker
  args: [run, "--rm", "-i", "--network=none", "-v", "/home/user/projects:/workspace:ro", "mcp/filesystem"]
  container:
    image: mcp/filesystem
    network: none
    volumes: ["/home/user/projects:/workspace:ro"]
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full field reference and naming rules.

---

## Local Validation

```bash
node scripts/lint-catalog.js
# Expected: Checked 37 files across 10 categories. All checks passed.

node scripts/generate-index.js
# Regenerates catalog.json from configs/ — run after adding files locally
```

---

## Automation

Every push to `main` that changes `configs/**/*.yaml`:

1. **Generate Catalog Index** — runs `generate-index.js`, commits updated `catalog.json` back to main via `GITHUB_TOKEN`
2. **Notify Docs Rebuild** — triggers `deploy.yml` on `argus-mcp-docs` via `DOCS_DISPATCH_TOKEN`

Manual trigger: Actions → "Generate Catalog Index" → Run workflow.
