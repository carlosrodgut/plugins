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

import { RequestHeaders } from '@perses-dev/client';
import { DatasourceClient } from '@perses-dev/plugin-system';
import { HTTPProxy } from '@perses-dev/spec';

export interface DynamoDBDatasourceSpec {
  directUrl?: string;
  proxy?: HTTPProxy;
  region: string;
}

interface QueryRequestParameters extends Record<string, string> {
  query: string;
  start: string;
  end: string;
}

interface DynamoDBDatasourceClientOptions {
  datasourceUrl: string;
  region: string;
  headers?: RequestHeaders;
}

export interface DynamoDBDatasourceResponse {
  status: string;
  warnings?: string[];
  data: unknown;
}

export interface DynamoDBDatasourceClient extends DatasourceClient {
  options: DynamoDBDatasourceClientOptions;
  query(params: QueryRequestParameters, headers?: RequestHeaders): Promise<DynamoDBDatasourceResponse>;
}
