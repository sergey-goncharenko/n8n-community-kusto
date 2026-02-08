# Copilot Instructions — n8n-nodes-kusto

## Project Overview

This is an **n8n community node** package (`n8n-nodes-kusto`) that provides a
**Kusto Query** node for running KQL queries against Azure Data Explorer clusters.

- **Package name**: `n8n-nodes-kusto`
- **Repo**: `https://github.com/sergey-goncharenko/n8n-community-kusto`
- **Runtime**: n8n (installed as a community node via npm)
- **Language**: TypeScript, compiled to CommonJS

---

## Repository Structure

```
n8n-nodes-kusto/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD: build → publish to npm
├── credentials/
│   └── KustoApi.credentials.ts     # n8n credential type (tenantId, clientId, clientSecret)
├── nodes/
│   └── KustoQuery/
│       ├── KustoQuery.node.ts      # Main node implementation
│       └── kusto.svg               # Node icon
├── dist/                           # Compiled output (git-ignored)
├── package.json                    # npm metadata + n8n node/credential paths
├── tsconfig.json                   # TypeScript compiler config
├── .eslintrc.js                    # Linting rules
├── gulpfile.js                     # Copies SVG icons into dist/
└── index.js                        # Entry point (n8n loads via package.json "n8n" section)
```

---

## How It Works

### Authentication Flow
1. Node reads Azure AD credentials (tenant ID, client ID, client secret) from the `kustoApi` credential store
2. Acquires a Bearer token from `https://login.microsoftonline.com/{tenantId}/oauth2/token` using `client_credentials` grant
3. The `resource` is set to the cluster URL so the token is scoped to the correct cluster

### Query Execution
1. Sends a `POST` to `https://{clusterUrl}/v1/rest/query` (or `/v1/rest/mgmt` for management commands)
2. Request body: `{ db, csl, properties }` (CSL = KQL query text)
3. Response contains `Tables[0].Columns` and `Tables[0].Rows`
4. Each row is mapped to a JSON object using column names as keys
5. Rows are returned as individual n8n items

### Operations
- **Query** — read-only KQL queries (`/v1/rest/query`)
- **Management Command** — control commands like `.show tables` (`/v1/rest/mgmt`)

---

## Development Workflow

### Build
```bash
npm install
npm run build      # tsc + gulp (copies icons)
```

### Lint
```bash
npm run lint       # Check for issues
npm run lintfix    # Auto-fix
```

### Test locally
```bash
npm pack           # Creates n8n-nodes-kusto-0.1.0.tgz
# Then copy into your n8n container and install
```

### Deploy
Push to `main` branch → GitHub Actions automatically:
1. Builds and lints the project
2. Checks if the current version is already on npm
3. If not, publishes to npm with `--access public`
4. In n8n: **Settings → Community Nodes → Install → `n8n-nodes-kusto`**

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/deploy.yml`.

### Required GitHub Secrets

| Secret | Description | How to get it |
|--------|-------------|---------------|
| `NPM_TOKEN` | npm access token for publishing | [npmjs.com → Access Tokens → Generate](https://www.npmjs.com/settings/~/tokens) |

**⚠️ NEVER commit tokens or secrets to the repository.**
All secrets are stored in GitHub → Settings → Secrets and variables → Actions.

### Installing in n8n

Once the package is published to npm, install it from the n8n UI:
1. Open your n8n instance
2. Go to **Settings → Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-kusto` and click **Install**
5. The **Kusto Query** node will appear in the node panel

---

## Coding Conventions

- All source code is in **TypeScript** (strict mode)
- Node classes implement `INodeType` from `n8n-workflow`
- Credential classes implement `ICredentialType` from `n8n-workflow`
- Use `this.helpers.httpRequest()` for all HTTP calls inside nodes
- Wrap errors with `NodeApiError` or `NodeOperationError` for proper n8n UI display
- Support `this.continueOnFail()` in catch blocks
- Each result row becomes a separate n8n item (`INodeExecutionData`)
- Icons are SVG files placed next to the node `.ts` file

### Adding a new operation
1. Add a new option to the `operation` parameter in `KustoQuery.node.ts`
2. Handle it in the `execute()` method switch/if block
3. Rebuild with `npm run build`

### Adding a new node
1. Create `nodes/YourNode/YourNode.node.ts` implementing `INodeType`
2. Add an SVG icon as `nodes/YourNode/yournode.svg`
3. Register the path in `package.json` under `n8n.nodes`
4. Rebuild

### Adding a new credential type
1. Create `credentials/YourCred.credentials.ts` implementing `ICredentialType`
2. Register the path in `package.json` under `n8n.credentials`
3. Reference it in your node's `credentials` array
4. Rebuild

---

## Key Files Reference

| File | What to edit |
|------|-------------|
| `nodes/KustoQuery/KustoQuery.node.ts` | Node logic, parameters, operations |
| `credentials/KustoApi.credentials.ts` | Credential fields |
| `package.json` | Version, dependencies, node/credential paths |
| `.github/workflows/deploy.yml` | CI/CD pipeline |

---

## Version Bumping

Before releasing a new version:
1. Update `version` in `package.json`
2. Update the version badge in `README.md`
3. Commit and push — CI/CD will deploy automatically
