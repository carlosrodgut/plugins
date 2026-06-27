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

import { test, expect } from '@playwright/test';

const PERSES_URL = 'http://localhost:8080';
const DYNAMODB_LOCAL_URL = 'http://localhost:8000';
const PROJECT = 'e2eproject';

test.describe('DynamoDB Plugin', () => {
  test('plugin registration and provisioning', async ({ request }) => {
    // ── Step 1: Verify DynamoDB plugins are registered ──
    const pluginsRes = await request.get(`${PERSES_URL}/api/v1/plugins`);
    expect(pluginsRes.ok()).toBeTruthy();
    const plugins: Array<{ spec: { plugins: Array<{ spec: { name: string } }> } }> = await pluginsRes.json();
    const pluginNames = plugins.flatMap((p) => p.spec.plugins?.map((plg) => plg.spec.name) ?? []);
    expect(pluginNames).toContain('DynamoDBDatasource');
    expect(pluginNames).toContain('DynamoDBTimeSeriesQuery');

    // ── Step 2: Verify the DynamoDB datasource was provisioned ──
    const dsRes = await request.get(`${PERSES_URL}/api/v1/projects/${PROJECT}/datasources`);
    expect(dsRes.ok()).toBeTruthy();
    const datasources: Array<{ metadata: { name: string } }> = await dsRes.json();
    const dsNames = datasources.map((ds) => ds.metadata.name);
    expect(dsNames).toContain('dynamodbdemo');

    const dynamoDBDS = datasources.find((ds) => ds.metadata.name === 'dynamodbdemo');
    expect(dynamoDBDS).toBeDefined();

    // ── Step 3: Verify the dashboard was provisioned ──
    const dashRes = await request.get(`${PERSES_URL}/api/v1/projects/${PROJECT}/dashboards`);
    expect(dashRes.ok()).toBeTruthy();
    const dashboards: Array<{ metadata: { name: string } }> = await dashRes.json();
    const dashNames = dashboards.map((d) => d.metadata.name);
    expect(dashNames).toContain('dynamodboverview');

    // ── Step 4: Fetch the dashboard and verify it contains DynamoDB query ──
    const dashDetailRes = await request.get(`${PERSES_URL}/api/v1/projects/${PROJECT}/dashboards/dynamodboverview`);
    expect(dashDetailRes.ok()).toBeTruthy();
    const dashboard = await dashDetailRes.json();
    const panels = dashboard.spec.panels;
    const panelIds = Object.keys(panels);
    expect(panelIds.length).toBeGreaterThan(0);

    // Verify the first panel uses a DynamoDBTimeSeriesQuery
    const firstPanelId = panelIds[0];
    const firstPanel = panels[firstPanelId];
    const queries = firstPanel.spec.queries;
    expect(queries.length).toBeGreaterThan(0);

    const queryPlugin = queries[0].spec.plugin;
    expect(queryPlugin.kind).toBe('DynamoDBTimeSeriesQuery');
    expect(queryPlugin.spec.query).toEqual(expect.stringMatching(/SELECT/i));
    expect(queryPlugin.spec.datasource.kind).toBe('DynamoDBDatasource');
    expect(queryPlugin.spec.datasource.name).toBe('DynamoDBDemo');

    // Verify the panel plugin is TimeSeriesChart
    expect(firstPanel.spec.plugin.kind).toBe('TimeSeriesChart');
  });

  test('dashboard page loads in the browser', async ({ page }) => {
    await page.goto(`${PERSES_URL}/projects/${PROJECT}/dashboards/dynamodboverview`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(/dynamodboverview/);

    // Wait for the dashboard toolbar to confirm the UI rendered
    await expect(page.getByTestId('dashboard-toolbar')).toBeVisible({ timeout: 10000 });

    // Verify the dashboard panel group container is rendered (panels may fail
    // to render due to upstream bug: TimeSeriesChart imports extractExportableData
    // from @perses-dev/plugin-system which was removed in v0.54.0-beta.9)
    await expect(page.locator('[data-testid="panel-group"]')).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/dynamodb-dashboard.png', fullPage: true });
  });

  test('data query through DynamoDB Local returns items', async () => {
    const { DynamoDBClient, CreateTableCommand, PutItemCommand, ExecuteStatementCommand, DeleteTableCommand } = await import('@aws-sdk/client-dynamodb');

    const client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: DYNAMODB_LOCAL_URL,
      credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' },
    });

    const tableName = `e2e_test_${Date.now()}`;

    // ── Step 1: Create table ──
    await client.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'timestamp', KeyType: 'HASH' },
        { AttributeName: 'metric_name', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'timestamp', AttributeType: 'S' },
        { AttributeName: 'metric_name', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }));

    // ── Step 2: Insert test data ──
    await client.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        timestamp: { S: '2024-01-01T00:00:00Z' },
        metric_name: { S: 'cpu_usage' },
        metric_value: { N: '42.5' },
      },
    }));

    // ── Step 3: Query with PartiQL ──
    const { Items } = await client.send(new ExecuteStatementCommand({
      Statement: `SELECT * FROM "${tableName}" WHERE "timestamp" = '2024-01-01T00:00:00Z'`,
    }));

    expect(Items).toBeDefined();
    expect(Items!.length).toBe(1);
    expect(Items![0].timestamp.S).toBe('2024-01-01T00:00:00Z');
    expect(Items![0].metric_name.S).toBe('cpu_usage');
    expect(Items![0].metric_value.N).toBe('42.5');

    // ── Step 4: Cleanup ──
    await client.send(new DeleteTableCommand({ TableName: tableName })).catch(() => {});
    client.destroy();
  });
});
