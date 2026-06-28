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

import { TimeSeriesQueryPlugin, replaceVariables } from '@perses-dev/plugin-system';
import { TimeSeries } from '@perses-dev/spec';
import { DEFAULT_DATASOURCE } from '../constants';
import { DynamoDBClient, DynamoDBQueryResponse } from '../../model/dynamodb-client';
import { DynamoDBTimeSeriesQuerySpec, DatasourceQueryResponse } from './dynamodb-query-types';

function buildTimeSeries(response?: DatasourceQueryResponse): TimeSeries[] {
  const data = response?.data as DynamoDBQueryResponse['data'] | undefined;
  if (!response || !data || !data.Items || data.Items.length === 0) {
    return [];
  }

  const values: Array<[number, number]> = data.Items.map((item: Record<string, unknown>) => {
    const ts = item['timestamp'];
    const mv = item['metric_value'];
    const timestamp = typeof ts === 'string' ? new Date(ts as string).getTime() : Number(ts);
    const value = typeof mv === 'string' ? Number(mv) : Number(mv);
    return [timestamp, value];
  });

  return [
    {
      name: 'metric_value',
      values,
    },
  ];
}

export const getTimeSeriesData: TimeSeriesQueryPlugin<DynamoDBTimeSeriesQuerySpec>['getTimeSeriesData'] = async (
  spec,
  context
) => {
  if (spec.query === undefined || spec.query === null || spec.query === '') {
    return { series: [] };
  }

  const query = replaceVariables(spec.query, context.variableState);

  const client = (await context.datasourceStore.getDatasourceClient(
    spec.datasource ?? DEFAULT_DATASOURCE
  )) as DynamoDBClient;

  const { start, end } = context.timeRange;

  const response: DynamoDBQueryResponse = await client.query({
    start: start.getTime().toString(),
    end: end.getTime().toString(),
    query,
  });

  return {
    series: buildTimeSeries(response),
    timeRange: { start, end },
    stepMs: 30 * 1000,
    metadata: {
      executedQueryString: query,
    },
  };
};
