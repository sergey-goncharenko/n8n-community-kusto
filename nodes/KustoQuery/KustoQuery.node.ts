import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

interface KustoColumn {
	ColumnName: string;
	ColumnType?: string;
	DataType?: string;
}

interface KustoTable {
	TableName: string;
	Columns: KustoColumn[];
	Rows: any[][];
}

interface KustoV1Response {
	Tables: KustoTable[];
}

interface AadTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: string;
	resource: string;
}

export class KustoQuery implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kusto Query',
		name: 'kustoQuery',
		icon: 'file:kusto.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Run KQL queries against Azure Data Explorer (Kusto) clusters via the REST API',
		defaults: {
			name: 'Kusto Query',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kustoOAuth2Api',
				displayName: 'Kusto OAuth2 API',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
			{
				name: 'kustoApi',
				displayName: 'Kusto Service Principal',
				required: true,
				displayOptions: {
					show: {
						authentication: ['servicePrincipal'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'OAuth2 (Recommended)',
						value: 'oAuth2',
						description: 'Sign in via browser — works cross-tenant',
					},
					{
						name: 'Service Principal',
						value: 'servicePrincipal',
						description: 'Client credentials — headless automation',
					},
				],
				default: 'servicePrincipal',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Query',
						value: 'query',
						description: 'Execute a KQL query',
						action: 'Execute a KQL query',
					},
					{
						name: 'Management Command',
						value: 'mgmt',
						description: 'Execute a management (control) command',
						action: 'Execute a management command',
					},
				],
				default: 'query',
			},
			{
				displayName: 'Cluster URL',
				name: 'clusterUrl',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://mycluster.westeurope.kusto.windows.net',
				description: 'The Azure Data Explorer cluster endpoint URL (without trailing slash)',
			},
			{
				displayName: 'Database',
				name: 'database',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. MyDatabase',
				description: 'Name of the Kusto database to query',
			},
			{
				displayName: 'KQL Query',
				name: 'kqlQuery',
				type: 'string',
				typeOptions: {
					rows: 8,
				},
				default: '',
				required: true,
				placeholder: 'StormEvents | take 10',
				description: 'The KQL query or management command to execute',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
			},
			{
				displayName: 'Command',
				name: 'kqlQuery',
				type: 'string',
				typeOptions: {
					rows: 8,
				},
				default: '',
				required: true,
				placeholder: '.show tables',
				description: 'The management command to execute',
				displayOptions: {
					show: {
						operation: ['mgmt'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Server Timeout',
						name: 'serverTimeout',
						type: 'string',
						default: '4m',
						description: 'Server-side query timeout (e.g. "4m", "10m", "1h")',
					},
					{
						displayName: 'No Truncation',
						name: 'noTruncation',
						type: 'boolean',
						default: false,
						description: 'Whether to disable result truncation (returns all rows)',
					},
					{
						displayName: 'Client Request ID',
						name: 'clientRequestId',
						type: 'string',
						default: '',
						description: 'Custom client request ID for tracing purposes',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const authentication = this.getNodeParameter('authentication', 0) as string;

		// ── Resolve access token based on auth method ──────────────────
		let accessTokenValue: string;

		if (authentication === 'oAuth2') {
			// OAuth2: n8n manages the token lifecycle (including refresh) via its
			// authenticated request helpers (e.g. requestWithAuthentication).
			// We only validate that credentials are present here; actual HTTP calls
			// should use this.helpers.requestWithAuthentication('kustoOAuth2Api', …)
			// so that token refresh is handled automatically.
			const oAuth2Credentials = await this.getCredentials('kustoOAuth2Api');
			if (!oAuth2Credentials) {
				throw new NodeOperationError(this.getNode(), 'No OAuth2 credentials provided.');
			}
			// Do not read oauthTokenData.access_token directly here to avoid
			// bypassing n8n’s OAuth2 token refresh mechanism.
		} else {
			// Service Principal: manual client_credentials flow
			const credentials = await this.getCredentials('kustoApi');
			if (!credentials) {
				throw new NodeOperationError(this.getNode(), 'No credentials provided for Kusto API.');
			}

			const tenantId = credentials.tenantId as string;
			const clientId = credentials.clientId as string;
			const clientSecret = credentials.clientSecret as string;

			// We need the cluster URL for the token resource — grab from first item
			const firstClusterUrl = (this.getNodeParameter('clusterUrl', 0) as string).replace(/\/+$/, '');

			const tokenResponse = await this.helpers.httpRequest({
				method: 'POST',
				url: `https://login.microsoftonline.com/${tenantId}/oauth2/token`,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					resource: firstClusterUrl,
					client_id: clientId,
					client_secret: clientSecret,
				}).toString(),
				json: true,
			}) as AadTokenResponse;

			if (!tokenResponse?.access_token) {
				throw new NodeOperationError(
					this.getNode(),
					'Failed to obtain Azure AD access token. Check tenant ID, client ID, and client secret.',
				);
			}
			accessTokenValue = tokenResponse.access_token;
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const clusterUrl = (this.getNodeParameter('clusterUrl', i) as string).replace(/\/+$/, '');
				const database = this.getNodeParameter('database', i) as string;
				const kqlQuery = this.getNodeParameter('kqlQuery', i) as string;
				const options = this.getNodeParameter('options', i, {}) as {
					serverTimeout?: string;
					noTruncation?: boolean;
					clientRequestId?: string;
				};

				if (!clusterUrl) {
					throw new NodeOperationError(this.getNode(), 'Cluster URL is required.', { itemIndex: i });
				}
				if (!database) {
					throw new NodeOperationError(this.getNode(), 'Database name is required.', { itemIndex: i });
				}
				if (!kqlQuery) {
					throw new NodeOperationError(this.getNode(), 'KQL query is required.', { itemIndex: i });
				}

				// ── Build request properties ───────────────────────────────
				const requestProperties: Record<string, any> = {
					Options: {} as Record<string, any>,
				};

				if (options.serverTimeout) {
					requestProperties.Options.servertimeout = options.serverTimeout;
				}
				if (options.noTruncation) {
					requestProperties.Options.notruncation = true;
				}
				if (options.clientRequestId) {
					requestProperties.Options.ClientRequestId = options.clientRequestId;
				}

				// ── Execute the Kusto query ────────────────────────────
				const endpoint = operation === 'mgmt' ? '/v1/rest/mgmt' : '/v1/rest/query';
				const requestId = options.clientRequestId || `n8n-kusto;${Date.now()}`;

				const kustoResponse = await this.helpers.httpRequest({
					method: 'POST',
					url: `${clusterUrl}${endpoint}`,
					headers: {
						'Accept': 'application/json',
						'Authorization': `Bearer ${accessTokenValue}`,
						'Content-Type': 'application/json; charset=utf-8',
						'x-ms-app': 'n8n-nodes-kusto',
						'x-ms-client-request-id': requestId,
					},
					body: {
						db: database,
						csl: kqlQuery,
						properties: JSON.stringify(requestProperties),
					},
					json: true,
				}) as KustoV1Response;

				// ── Parse response into n8n items ──────────────────────
				if (!kustoResponse?.Tables || kustoResponse.Tables.length === 0) {
					// Return an empty item so downstream nodes see the execution completed
					returnData.push({ json: { _info: 'Query returned no tables.' } });
					continue;
				}

				// The primary result is in the first table (PrimaryResult).
				// Management command responses may also use Tables[0].
				const primaryTable = kustoResponse.Tables[0];
				const columns = primaryTable.Columns;
				const rows = primaryTable.Rows;

				if (!rows || rows.length === 0) {
					returnData.push({
						json: {
							_info: 'Query executed successfully but returned no rows.',
							_columns: columns.map((c) => c.ColumnName),
						},
					});
					continue;
				}

				// Map each row array to a keyed JSON object
				for (const row of rows) {
					const jsonItem: Record<string, any> = {};
					for (let colIdx = 0; colIdx < columns.length; colIdx++) {
						jsonItem[columns[colIdx].ColumnName] = row[colIdx];
					}
					returnData.push({ json: jsonItem });
				}
			} catch (error: any) {
				if (this.continueOnFail()) {
					const errorMessage =
						error.message ||
						error.description ||
						'Unknown error executing Kusto query';
					returnData.push({
						json: { error: errorMessage },
						pairedItem: { item: i },
					});
					continue;
				}
				// Wrap non-NodeApiError errors for proper display in n8n UI
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}
				throw new NodeApiError(this.getNode(), error as any, {
					message: `Kusto query failed: ${error.message || 'Unknown error'}`,
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
