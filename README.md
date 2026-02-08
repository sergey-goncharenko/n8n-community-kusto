# n8n-nodes-kusto

![n8n community node](https://img.shields.io/badge/n8n-community%20node-orange)
![license](https://img.shields.io/badge/license-MIT-blue)
![version](https://img.shields.io/badge/version-0.1.0-green)

This is an [n8n](https://n8n.io/) community node that lets you execute **KQL queries** against [Azure Data Explorer (Kusto)](https://learn.microsoft.com/en-us/azure/data-explorer/) clusters directly from your n8n workflows.

It authenticates via **Azure AD client credentials** (service principal) and calls the [Kusto REST API](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/api/rest/) to run queries and management commands, returning rows as JSON items.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

---

## Table of Contents

- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Credentials](#credentials)
- [Node Reference](#node-reference)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [Compatibility](#compatibility)
- [License](#license)

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Via n8n UI

1. Go to **Settings → Community Nodes**
2. Enter `n8n-nodes-kusto`
3. Click **Install**

### Via npm (self-hosted)

```bash
cd ~/.n8n
npm install n8n-nodes-kusto
```

Then restart your n8n instance.

---

## Prerequisites

1. An **Azure Data Explorer cluster** (e.g. `https://mycluster.westeurope.kusto.windows.net`)
2. An **Azure AD (Entra ID) App Registration** with:
   - A client secret
   - Permissions granted on the Kusto cluster (viewer / admin role)
3. The **tenant ID**, **client ID**, and **client secret** from the app registration

### Setting up Azure AD credentials

1. Go to [Azure Portal → App registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application (or use an existing one)
3. Under **Certificates & secrets**, create a new client secret — save it
4. In your Kusto cluster, grant the app permissions:
   ```kql
   .add database MyDatabase viewers ('aadapp=<client-id>;<tenant-id>')
   ```
5. Note your **Tenant ID** (from Azure AD overview), **Client ID** (from app overview), and the **Client Secret** value

---

## Credentials

When adding credentials in n8n, select **Kusto API** and provide:

| Field           | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| **Tenant ID**   | Azure AD (Entra ID) tenant ID (GUID)                        |
| **Client ID**   | Azure AD application (client) ID (GUID)                     |
| **Client Secret** | Azure AD application client secret (stored securely)       |

---

## Node Reference

### Kusto Query

**Operations:**

| Operation            | Description                                          |
| -------------------- | ---------------------------------------------------- |
| **Query**            | Execute a read-only KQL query                        |
| **Management Command** | Execute a control command (e.g. `.show tables`)    |

**Parameters:**

| Parameter        | Type     | Required | Description                                          |
| ---------------- | -------- | -------- | ---------------------------------------------------- |
| Cluster URL      | string   | ✅       | Azure Data Explorer cluster endpoint URL             |
| Database         | string   | ✅       | Target database name                                 |
| KQL Query        | string   | ✅       | The KQL query or management command to execute       |

**Options:**

| Option              | Type    | Default | Description                                        |
| ------------------- | ------- | ------- | -------------------------------------------------- |
| Server Timeout      | string  | `4m`    | Server-side query timeout (e.g. `10m`, `1h`)       |
| No Truncation       | boolean | false   | Disable result truncation (return all rows)         |
| Client Request ID   | string  |         | Custom request ID for tracing                       |

---

## Usage Examples

### Example 1: Simple query

1. Add a **Manual Trigger** node
2. Connect a **Kusto Query** node
3. Configure:
   - **Cluster URL:** `https://mycluster.westeurope.kusto.windows.net`
   - **Database:** `MyDatabase`
   - **KQL Query:** `StormEvents | take 10`
4. Execute the workflow

Each row from the result set is returned as a separate n8n item with all columns as JSON properties.

### Example 2: Aggregation query

```kql
StormEvents
| summarize EventCount = count() by State
| top 5 by EventCount desc
```

Returns items like:
```json
[
  { "State": "TEXAS", "EventCount": 4701 },
  { "State": "KANSAS", "EventCount": 3166 },
  ...
]
```

### Example 3: Management command

Set **Operation** to **Management Command** and use:

```kql
.show tables
```

Returns one item per table with columns like `TableName`, `DatabaseName`, `Folder`, etc.

### Example 4: Using expressions

You can use n8n expressions in the KQL Query field:

```
{{ $json.tableName }} | where Timestamp > ago({{ $json.hours }}h) | count
```

---

## Development

### Build

```bash
git clone https://github.com/sergey-goncharenko/n8n-community-kusto.git
cd n8n-community-kusto
npm install
npm run build
```

### Test locally with n8n

```bash
# In the n8n-nodes-kusto directory:
npm link

# In the n8n directory (or ~/.n8n):
npm link n8n-nodes-kusto

# Restart n8n
n8n start
```

### Lint

```bash
npm run lint
npm run lintfix
```

---

## Compatibility

| n8n Version | Compatible |
| ----------- | ---------- |
| ≥ 1.0.0     | ✅          |

- **Node.js:** ≥ 18.0.0
- **Azure Data Explorer REST API:** v1

---

## License

[MIT](LICENSE)
