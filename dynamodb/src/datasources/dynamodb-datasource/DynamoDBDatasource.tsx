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

import { DatasourcePlugin } from '@perses-dev/plugin-system';
import { query } from '../../model/dynamodb-client';
import { DynamoDBDatasourceSpec, DynamoDBDatasourceClient } from './dynamodb-datasource-types';
import { DynamoDBDatasourceEditor } from './DynamoDBDatasourceEditor';

const createClient: DatasourcePlugin<DynamoDBDatasourceSpec, DynamoDBDatasourceClient>['createClient'] = (
  spec,
  options
) => {
  const { directUrl, proxy, region } = spec;
  const { proxyUrl } = options;

  const datasourceUrl = directUrl ?? proxyUrl;
  if (datasourceUrl === undefined) {
    throw new Error(
      'No URL specified for DynamoDBDatasource client. You can use directUrl in the spec to configure it.'
    );
  }

  if (!region) {
    throw new Error('No region specified for DynamoDBDatasource client. You must set a region in the spec.');
  }

  const specHeaders = proxy?.spec.headers || {};

  return {
    options: {
      datasourceUrl,
      region,
    },
    query: (params, headers) => query(params, { datasourceUrl, region, headers: headers ?? specHeaders }),
  };
};

export const DynamoDBDatasource: DatasourcePlugin<DynamoDBDatasourceSpec, DynamoDBDatasourceClient> = {
  createClient,
  OptionsEditorComponent: DynamoDBDatasourceEditor,
  createInitialOptions: () => ({ directUrl: '', region: 'us-east-1' }),
};
