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

// TODO: This should be fixed globally in the test setup

jest.mock('echarts/core');

import { TimeSeriesQueryContext } from '@perses-dev/plugin-system';
import { DatasourceSpec } from '@perses-dev/spec';
import { DynamoDBDatasource, DynamoDBDatasourceSpec } from '../../datasources';
import { DynamoDBQueryResponse } from '../../model/dynamodb-client';
import { DynamoDBTimeSeriesQuery } from './DynamoDBQuery';

const datasource: DynamoDBDatasourceSpec = {
  directUrl: '/test',
  region: 'us-east-1',
};

const dynamodbStubClient = DynamoDBDatasource.createClient(datasource, {});

// Mock query to only return DynamoDB "data"
dynamodbStubClient.query = jest.fn(async () => {
  const stubResponse: DynamoDBQueryResponse = {
    status: 'success',
    data: {
      Items: [
        { timestamp: '2025-09-09T05:18:00Z', metric_value: 277 },
        { timestamp: '2025-09-09T05:19:00Z', metric_value: 156102 },
      ],
    },
  };
  return stubResponse as DynamoDBQueryResponse;
});

const getDatasourceClient: jest.Mock = jest.fn(() => {
  return dynamodbStubClient;
});

const getDatasource: jest.Mock = jest.fn((): DatasourceSpec<DynamoDBDatasourceSpec> => {
  return {
    default: false,
    plugin: {
      kind: 'DynamoDBDatasource',
      spec: datasource,
    },
  };
});

const createStubContext = (): TimeSeriesQueryContext => {
  const stubTimeSeriesContext: Partial<TimeSeriesQueryContext> = {
    datasourceStore: {
      getDatasource: getDatasource,
      getDatasourceClient: getDatasourceClient,
      listDatasourceSelectItems: jest.fn(),
      getLocalDatasources: jest.fn(),
      setLocalDatasources: jest.fn(),
      getSavedDatasources: jest.fn(),
      setSavedDatasources: jest.fn(),
    },
    timeRange: {
      end: new Date('01-01-2025'),
      start: new Date('02-01-2025'),
    },
    variableState: {},
  };
  return stubTimeSeriesContext as TimeSeriesQueryContext;
};

describe('DynamoDBTimeSeriesQuery', () => {
  it('should properly resolve variable dependencies', () => {
    if (!DynamoDBTimeSeriesQuery.dependsOn) throw new Error('dependsOn is not defined');
    const { variables } = DynamoDBTimeSeriesQuery.dependsOn(
      {
        query: 'SELECT * FROM "metrics" WHERE foo="$foo" AND bar="$bar"',
      },
      createStubContext()
    );
    expect(variables).toEqual(['foo', 'bar']);
  });

  it('should create initial options with empty query', () => {
    const initialOptions = DynamoDBTimeSeriesQuery.createInitialOptions();
    expect(initialOptions).toEqual({ query: '' });
  });

  it('should run query and return DynamoDB data only', async () => {
    const client = getDatasourceClient();
    const resp = await client.query('SELECT timestamp, metric_value FROM "metrics"');
    expect(resp.data.Items.length).toBeGreaterThan(0);
    expect(resp.data.Items[0]).toHaveProperty('timestamp');
    expect(resp.data.Items[0]).toHaveProperty('metric_value');
  });

  it('should return empty series for empty query', async () => {
    const result = await DynamoDBTimeSeriesQuery.getTimeSeriesData?.({ query: '' }, createStubContext());
    expect(result?.series).toEqual([]);
  });

  it('should return empty series for undefined query', async () => {
    const result = await DynamoDBTimeSeriesQuery.getTimeSeriesData?.({ query: '' }, createStubContext());
    expect(result?.series).toEqual([]);
  });

  it('should build time series from DynamoDB response', async () => {
    const result = await DynamoDBTimeSeriesQuery.getTimeSeriesData?.(
      { query: 'SELECT timestamp, metric_value FROM "metrics"' },
      createStubContext()
    );
    expect(result?.series).toHaveLength(1);
    const series = result!.series[0]!;
    expect(series.name).toBe('metric_value');
    expect(series.values).toHaveLength(2);
    const firstValue = series.values[0]!;
    expect(firstValue).toHaveLength(2);
    expect(typeof firstValue[0]).toBe('number');
    expect(typeof firstValue[1]).toBe('number');
  });

  it('should return empty series when response has no Items', async () => {
    dynamodbStubClient.query = jest.fn(async () => {
      return { status: 'success', data: {} } as DynamoDBQueryResponse;
    });
    const result = await DynamoDBTimeSeriesQuery.getTimeSeriesData?.(
      { query: 'SELECT timestamp, metric_value FROM "empty_table"' },
      createStubContext()
    );
    expect(result?.series).toEqual([]);
  });
});
