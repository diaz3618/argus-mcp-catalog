## YAML Config Checklist

Before merging, confirm your YAML file satisfies all three lint requirements
(run `node scripts/lint-catalog.js` locally to validate before pushing):

- [ ] `name:` is present and non-empty — e.g., `name: My Tool`
- [ ] `description:` is present and non-empty — e.g., `description: Fetches web pages and returns content`
- [ ] At least one backend-slug key is present (any key other than `name` and `description`) — e.g., `stdio: ...` or `docker: ...`
- [ ] File is placed in the correct category directory — e.g., `configs/filesystem-access/my-tool.yaml`

**Available categories:** `filesystem-access`, `web-research`, `databases`, `ai-memory`,
`devops-integrations`, `security-tools`, `remote-sse`, `remote-http`, `remote-auth`, `fully-isolated`
