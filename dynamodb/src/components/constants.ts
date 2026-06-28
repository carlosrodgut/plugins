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

export const queryExample = `-- Time Series Query (PartiQL)
SELECT timestamp, metric_value
FROM "my_metrics_table"
WHERE timestamp BETWEEN ? AND ?
ORDER BY timestamp

-- Aggregated Time Series
SELECT
  timestamp as time,
  avg(metric_value) as avg_metric
FROM "metrics"
WHERE timestamp BETWEEN ? AND ?
GROUP BY timestamp
ORDER BY timestamp`;
