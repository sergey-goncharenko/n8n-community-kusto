# Contributing to n8n-nodes-kusto

Thank you for your interest in contributing! This project welcomes contributions of all kinds — bug reports, feature requests, documentation improvements, and code changes.

## 🤖 AI-Assisted Development

This project was built using AI-assisted development tools:

- **GitHub Copilot in VS Code** (powered by **Claude Opus 4.6**)
- **GitHub.com Copilot** for code review and iteration
- **Microsoft Copilot** for research and planning

We welcome contributions made with or without AI assistance. If you use AI tools, please review the generated code carefully before submitting.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18.0.0
- [npm](https://www.npmjs.com/) ≥ 9
- [n8n](https://n8n.io/) instance for testing (local or Docker)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/sergey-goncharenko/n8n-community-kusto.git
cd n8n-community-kusto

# Install dependencies
npm install

# Build
npm run build

# Lint
npm run lint
```

### Testing Locally with n8n

```bash
# In the n8n-nodes-kusto directory
npm link

# In your n8n installation directory (or ~/.n8n)
npm link n8n-nodes-kusto

# Restart n8n
n8n start
```

---

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/sergey-goncharenko/n8n-community-kusto/issues) to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include: n8n version, Node.js version, steps to reproduce, expected vs actual behavior

### Suggesting Features

1. Open a new issue using the **Feature Request** template
2. Describe the use case and why it would be valuable

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make your changes** — follow the coding standards below
4. **Build & lint** to verify:
   ```bash
   npm run build
   npm run lint
   ```
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add support for streaming ingestion"
   ```
6. **Push** and open a **Pull Request** against `main`

---

## Coding Standards

- **Language:** TypeScript (strict mode)
- **Style:** Follow existing code patterns; run `npm run lint` before committing
- **Formatting:** Use Prettier (`npm run format`)
- **Naming:** Use camelCase for variables/functions, PascalCase for classes/interfaces
- **Error handling:** Use `NodeApiError` for API errors, `NodeOperationError` for input validation
- **No secrets:** Never commit credentials, tokens, or personal data

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `chore:` | Build process, CI, or tooling changes |

---

## Project Structure

```
n8n-nodes-kusto/
├── credentials/
│   └── KustoApi.credentials.ts    # Azure AD credential definition
├── nodes/
│   └── KustoQuery/
│       ├── KustoQuery.node.ts      # Main node logic (auth + REST API + response mapping)
│       └── kusto.svg               # Node icon
├── dist/                           # Compiled output (git-ignored)
├── package.json                    # npm manifest with n8n node registration
├── tsconfig.json                   # TypeScript config
├── gulpfile.js                     # Icon copy task
└── .github/
    └── workflows/
        └── deploy.yml              # CI/CD: build → lint → publish to npm
```

---

## CI/CD Pipeline

Every push to `main` triggers the GitHub Actions pipeline:

1. **Build & Lint** — compiles TypeScript, runs ESLint
2. **Publish to npm** — publishes a new version only if `package.json` version is not yet on npm

Version bumping is manual — update `version` in `package.json` before pushing.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
