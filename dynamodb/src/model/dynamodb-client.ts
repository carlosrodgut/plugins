// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export interface DynamoDBQueryParams {
  query: string;
  parameters?: unknown[];
}

export interface DynamoDBQueryOptions {
  datasourceUrl: string;
  region: string;
  headers?: Record<string, string>;
}

export interface DynamoDBQueryResponse {
  status: 'success' | 'error';
  data: {
    Items?: Array<Record<string, unknown>>;
    Count?: number;
    ScannedCount?: number;
    NextToken?: string;
  };
}

export interface DynamoDBClient {
  query: (params: { start: string; end: string; query: string }) => Promise<DynamoDBQueryResponse>;
}

export async function query(
  params: DynamoDBQueryParams,
  queryOptions: DynamoDBQueryOptions
): Promise<DynamoDBQueryResponse> {
  const { datasourceUrl, region, headers } = queryOptions;

  if (!params.query) {
    throw new Error('No query provided in params');
  }

  const url = urlBuilder(datasourceUrl);

  const body = JSON.stringify({
    Statement: params.query,
    Parameters: params.parameters ?? [],
  });

  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.0',
      'X-Amz-Target': 'DynamoDB_20120810.ExecuteStatement',
      'X-Amz-Region': region,
      ...headers,
    },
    body,
  };

  try {
    const response = await fetch(url.toString(), init);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DynamoDB error response:', errorText);
      return {
        status: 'error',
        data: {},
      };
    }

    const body_json = await response.json();

    return {
      status: 'success',
      data: body_json,
    };
  } catch (e) {
    throw new Error(`DynamoDB query failed: ${e}`);
  }
}

function urlBuilder(datasourceUrl: string): URL {
  if (datasourceUrl.startsWith('http://') || datasourceUrl.startsWith('https://')) {
    return new URL(datasourceUrl);
  }
  // if relative path (e.g. proxy url), resolve against window.location.origin
  return new URL(datasourceUrl, window.location.origin);
}
