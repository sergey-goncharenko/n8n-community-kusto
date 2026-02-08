import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KustoApi implements ICredentialType {
	name = 'kustoApi';
	displayName = 'Kusto API';
	documentationUrl = 'https://learn.microsoft.com/en-us/azure/data-explorer/kusto/api/rest/';

	properties: INodeProperties[] = [
		{
			displayName: 'Tenant ID',
			name: 'tenantId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			description: 'Azure AD (Entra ID) tenant ID for authentication',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			description: 'Azure AD application (client) ID',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Azure AD application client secret',
		},
	];
}
