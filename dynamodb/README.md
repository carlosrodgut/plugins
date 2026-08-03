# DynamoDB Plugin

A [Perses](https://perses.dev) datasource plugin for Amazon DynamoDB.

## Overview

This plugin enables querying Amazon DynamoDB from Perses dashboards using
[PartiQL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.html)
(AWS's SQL-compatible query language). It provides two plugin kinds:

- **DynamoDBDatasource** — Configures the connection to a DynamoDB endpoint
  (direct URL or via Perses HTTP proxy).
- **DynamoDBTimeSeriesQuery** — Executes a PartiQL `SELECT` statement and
  maps the results into time-series data. Requires the result set to contain
  a timestamp/datetime column and a numeric value column.

## Usage

### Datasource Configuration

| Field | Description |
|---|---|
| `directUrl` | Direct DynamoDB endpoint URL (e.g. `https://dynamodb.us-east-1.amazonaws.com`). Use when the browser can reach DynamoDB directly. |
| `proxy` | Perses HTTP proxy configuration. Recommended for production — the Perses backend handles AWS SigV4 signing server-side. |
| `region` | AWS region (e.g. `us-east-1`). |

### Time Series Query

Write a PartiQL `SELECT` statement. The result must include:

- A datetime column (mapped to the X-axis / timestamp)
- A numeric value column (mapped to the Y-axis / value)

```sql
SELECT timestamp, metric_value
FROM "my_table"
WHERE timestamp BETWEEN ? AND ?
```