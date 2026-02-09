import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class KustoOAuth2Api implements ICredentialType {
	name = 'kustoOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Kusto OAuth2 API';

	icon: Icon = 'file:icons/kusto.svg';

	documentationUrl = 'https://github.com/sergey-goncharenko/n8n-community-kusto#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'options',
			options: [
				{
					name: 'Authorization Code',
					value: 'authorizationCode',
					description: 'Sign in interactively — best for cross-tenant scenarios',
				},
				{
					name: 'Client Credentials',
					value: 'clientCredentials',
					description: 'Service principal — best for headless automation',
				},
			],
			default: 'authorizationCode',
		},
		{
			displayName: 'Tenant ID',
			name: 'tenantId',
			type: 'string',
			required: true,
			default: 'common',
			description:
				'Azure AD tenant ID where the Kusto cluster lives. Use "common" for multi-tenant apps or a specific tenant GUID.',
			placeholder: 'e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or common',
		},
		{
			displayName: 'Cluster URL',
			name: 'clusterUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://mycluster.westeurope.kusto.windows.net',
			description: 'The Azure Data Explorer cluster endpoint URL (used to scope the OAuth2 token)',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default:
				'=https://login.microsoftonline.com/{{$self["tenantId"]}}/oauth2/v2.0/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default:
				'=https://login.microsoftonline.com/{{$self["tenantId"]}}/oauth2/v2.0/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default:
				'={{$self["clusterUrl"]}}/.default offline_access',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
