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

import { HTTPSettingsEditor } from '@perses-dev/plugin-system';
import { HTTPDatasourceSpec } from '@perses-dev/spec';
import { ReactElement } from 'react';
import { DynamoDBDatasourceSpec } from './dynamodb-datasource-types';

export interface DynamoDBDatasourceEditorProps {
  value: DynamoDBDatasourceSpec;
  onChange: (next: DynamoDBDatasourceSpec) => void;
  isReadonly?: boolean;
}

export function DynamoDBDatasourceEditor(props: DynamoDBDatasourceEditorProps): ReactElement {
  const { value, onChange, isReadonly } = props;

  const initialSpecDirect: DynamoDBDatasourceSpec = {
    directUrl: '',
    region: 'us-east-1',
  };

  const initialSpecProxy: DynamoDBDatasourceSpec = {
    proxy: {
      kind: 'HTTPProxy',
      spec: {
        allowedEndpoints: [
          {
            endpointPattern: '/',
            method: 'POST',
          },
        ],
        url: '',
      },
    },
    region: 'us-east-1',
  };

  return (
    <HTTPSettingsEditor
      value={value}
      onChange={(next: HTTPDatasourceSpec) => onChange(next as DynamoDBDatasourceSpec)}
      isReadonly={isReadonly}
      initialSpecDirect={initialSpecDirect}
      initialSpecProxy={initialSpecProxy}
    />
  );
}
