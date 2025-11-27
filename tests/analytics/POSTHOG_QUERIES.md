# PostHog Analytics Queries & Dashboard Configs

**Status:** Ready to use after implementing event tracking
**Testing:** These queries will work once memory events are flowing
**Updates:** Add as new insights in PostHog dashboard

---

## 1. Memory Tool Usage Metrics

### Query 1.1: Daily Usage Trend by Tool

```sql
SELECT
  formatDateTime(timestamp, '%Y-%m-%d') as date,
  properties.tool_name as tool,
  count() as usage_count,
  countIf(properties.tool_status = 'success') as successful,
  countIf(properties.tool_status = 'failure') as failed
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
GROUP BY date, tool
ORDER BY date DESC, usage_count DESC
```

**Use Case:** Track adoption and usage patterns over time
**Dashboard:** Line chart showing trend for each tool
**Alert:** Set up alert if daily usage drops 50% from 7-day average

---

### Query 1.2: Total Usage by Tool (Cumulative)

```sql
SELECT
  properties.tool_name as tool,
  count() as total_usage,
  countIf(properties.tool_status = 'success') as successful,
  countIf(properties.tool_status = 'failure') as failed,
  round(successful / (successful + failed) * 100, 2) as success_rate_pct
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
GROUP BY tool
ORDER BY total_usage DESC
```

**Use Case:** Overall tool popularity and reliability
**Dashboard:** Bar chart + Table with metrics
**Action:** Focus improvement efforts on tools with low success rates

---

### Query 1.3: Recent Tool Activity (Last 24 Hours)

```sql
SELECT
  properties.tool_name as tool,
  count() as usage_24h,
  round(avg(properties.execution_time_ms), 2) as avg_time_ms,
  arrayStringConcat(
    arrayDistinct(
      groupArrayIf(properties.error_message, properties.tool_status = 'failure')
    ),
    ', '
  ) as recent_errors
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
  AND timestamp > now() - INTERVAL 24 HOUR
GROUP BY tool
ORDER BY usage_24h DESC
```

**Use Case:** Operational health check
**Dashboard:** Table with scroll view
**Update Frequency:** Real-time / Every 15 minutes

---

## 2. Performance Analysis

### Query 2.1: Execution Time Statistics by Tool

```sql
SELECT
  properties.tool_name as tool,
  count() as executions,
  round(min(properties.execution_time_ms), 2) as min_ms,
  round(quantile(0.25)(properties.execution_time_ms), 2) as p25_ms,
  round(quantile(0.5)(properties.execution_time_ms), 2) as p50_ms,
  round(quantile(0.75)(properties.execution_time_ms), 2) as p75_ms,
  round(quantile(0.95)(properties.execution_time_ms), 2) as p95_ms,
  round(quantile(0.99)(properties.execution_time_ms), 2) as p99_ms,
  round(max(properties.execution_time_ms), 2) as max_ms,
  round(avg(properties.execution_time_ms), 2) as avg_ms
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
  AND properties.execution_time_ms IS NOT NULL
GROUP BY tool
ORDER BY p95_ms DESC
```

**Use Case:** Identify slow tools and performance regressions
**Dashboard:** Table with color-coded columns (green <100ms, yellow <500ms, red >500ms)
**Alert:** If p95 > 500ms, trigger investigation

---

### Query 2.2: Performance Trend (Weekly)

```sql
SELECT
  formatDateTime(timestamp, '%Y-W%W') as week,
  properties.tool_name as tool,
  round(avg(properties.execution_time_ms), 2) as avg_ms,
  round(quantile(0.95)(properties.execution_time_ms), 2) as p95_ms
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
  AND properties.execution_time_ms IS NOT NULL
GROUP BY week, tool
ORDER BY week DESC, tool
```

**Use Case:** Track performance changes over time
**Dashboard:** Line chart (separate line per tool)
**Pattern:** Identify if any tool is degrading week-over-week

---

### Query 2.3: Slow Executions (Outliers)

```sql
SELECT
  timestamp,
  properties.tool_name as tool,
  properties.execution_time_ms as time_ms,
  properties.tool_status as status,
  properties.error_message as error
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
  AND properties.execution_time_ms > 1000
ORDER BY timestamp DESC
LIMIT 100
```

**Use Case:** Debug slow outlier executions
**Dashboard:** Table with sorting capability
**Investigation:** Click through to session replay for context

---

## 3. Error Analysis

### Query 3.1: Error Rate by Tool

```sql
SELECT
  properties.tool_name as tool,
  countIf(properties.tool_status = 'failure') as failed,
  count() as total,
  round(failed / total * 100, 2) as error_rate_pct
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
GROUP BY tool
ORDER BY error_rate_pct DESC
```

**Use Case:** Monitor reliability and stability
**Dashboard:** Gauge chart (target: <5% error rate)
**Alert:** If any tool >10% error rate, escalate

---

### Query 3.2: Error Message Frequency

```sql
SELECT
  properties.tool_name as tool,
  properties.error_message as error,
  count() as occurrences,
  round(count() / (SELECT count() FROM events WHERE event = 'agent_tool_called' AND properties.tool_name = tool) * 100, 2) as pct_of_tool_errors
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
  AND properties.tool_status = 'failure'
GROUP BY tool, error
ORDER BY tool, occurrences DESC
```

**Use Case:** Identify most common failure modes
**Dashboard:** Table grouped by tool
**Action:** Debug most frequent errors first

---

### Query 3.3: Error Trend Over Time

```sql
SELECT
  formatDateTime(timestamp, '%Y-%m-%d') as date,
  properties.tool_name as tool,
  countIf(properties.tool_status = 'failure') as failures,
  count() as total,
  round(failures / total * 100, 2) as error_rate_pct
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
GROUP BY date, tool
ORDER BY date DESC, tool
```

**Use Case:** Spot error spikes and correlate with deployments
**Dashboard:** Area chart or line chart
**Annotation:** Add deployment timestamps

---

## 4. Feature-Specific Queries

### Query 4.1: Memory Category Distribution (remember_fact)

```sql
SELECT
  properties.memory_category as category,
  count() as count,
  countIf(properties.duplicate_detected = false) as new_memories,
  countIf(properties.duplicate_detected = true) as duplicates
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name = 'remember_fact'
  AND properties.tool_status = 'success'
GROUP BY category
ORDER BY count DESC
```

**Use Case:** Understand which memory categories are most used
**Dashboard:** Pie chart or bar chart
**Insight:** If one category dominates, might need custom optimizations

---

### Query 4.2: Duplicate Detection Rate

```sql
SELECT
  'Overall' as metric,
  count() as total_stores,
  countIf(properties.duplicate_detected = true) as duplicates_found,
  round(duplicates_found / total_stores * 100, 2) as duplicate_rate_pct
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name = 'remember_fact'
  AND properties.tool_status = 'success'
```

**Use Case:** Monitor deduplication effectiveness
**Dashboard:** Number card showing percentage
**Target:** 5-10% duplicate rate indicates good deduplication

---

### Query 4.3: Search Query Patterns

```sql
SELECT
  'Top Search Queries' as metric,
  count() as total_searches,
  round(avg(properties.results_count), 2) as avg_results_per_query,
  round(quantile(0.95)(properties.query_length), 0) as p95_query_length,
  countIf(properties.results_count = 0) as empty_result_searches,
  round(empty_result_searches / total_searches * 100, 2) as no_result_rate_pct
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name = 'search_memory'
  AND properties.tool_status = 'success'
```

**Use Case:** Understand search effectiveness
**Dashboard:** Stat cards showing key metrics
**Analysis:** High no_result_rate might indicate search quality issues

---

## 5. Confirmation Dialog Tracking

### Query 5.1: Confirmation Rate (Approvals vs Denials)

```sql
SELECT
  properties.tool_name as tool,
  countIf(event = 'tool_confirmation_approved') as approved,
  countIf(event = 'tool_confirmation_denied') as denied,
  approved + denied as total_confirmations,
  round(approved / total_confirmations * 100, 2) as approval_rate_pct
FROM events
WHERE event IN ['tool_confirmation_approved', 'tool_confirmation_denied']
  AND properties.tool_name IN ['update_memory', 'forget_memory']
GROUP BY tool
ORDER BY approval_rate_pct DESC
```

**Use Case:** Understand user confidence in dangerous operations
**Dashboard:** Bar chart showing approval rate by tool
**Insight:** If approval <50%, users may not understand operation

---

### Query 5.2: Confirmation Dialog Shown Count

```sql
SELECT
  formatDateTime(timestamp, '%Y-%m-%d') as date,
  properties.tool_name as tool,
  countIf(event = 'tool_confirmation_shown') as shown,
  countIf(event = 'tool_confirmation_approved') as approved,
  countIf(event = 'tool_confirmation_denied') as denied
FROM events
WHERE event IN ['tool_confirmation_shown', 'tool_confirmation_approved', 'tool_confirmation_denied']
  AND properties.tool_name IN ['update_memory', 'forget_memory']
GROUP BY date, tool
ORDER BY date DESC
```

**Use Case:** Track confirmation dialog funnel
**Dashboard:** Multi-series line chart
**Analysis:** Identify if users frequently deny confirmations

---

## 6. User Segmentation

### Query 6.1: Active Memory Tool Users (Last 7 Days)

```sql
SELECT
  COUNT(DISTINCT person_id) as active_users,
  COUNT(DISTINCT person_id) FILTER (WHERE arrayStringConcat(arrayDistinct(groupArray(properties.tool_name)), ',') LIKE '%search_memory%') as search_users,
  COUNT(DISTINCT person_id) FILTER (WHERE arrayStringConcat(arrayDistinct(groupArray(properties.tool_name)), ',') LIKE '%remember_fact%') as remember_users,
  COUNT(DISTINCT person_id) FILTER (WHERE arrayStringConcat(arrayDistinct(groupArray(properties.tool_name)), ',') LIKE '%update_memory%') as update_users,
  COUNT(DISTINCT person_id) FILTER (WHERE arrayStringConcat(arrayDistinct(groupArray(properties.tool_name)), ',') LIKE '%forget_memory%') as forget_users
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
  AND timestamp > now() - INTERVAL 7 DAY
```

**Use Case:** Understand adoption and engagement
**Dashboard:** Stat cards showing user counts
**Action:** Target inactive users with feature education

---

### Query 6.2: User Tool Usage Segmentation

```sql
SELECT
  arrayStringConcat(
    arrayDistinct(
      groupArray(properties.tool_name)
    ),
    ', '
  ) as tools_used,
  COUNT(DISTINCT person_id) as user_count
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name IN ['search_memory', 'remember_fact', 'update_memory', 'forget_memory']
  AND timestamp > now() - INTERVAL 30 DAY
GROUP BY tools_used
ORDER BY user_count DESC
LIMIT 20
```

**Use Case:** Identify user behavior patterns
**Dashboard:** Table with tool combinations and user counts
**Insight:** Mono-tool vs multi-tool users

---

## 7. Funnel Analysis

### Query 7.1: Memory Management Funnel (Manual Conversion)

```sql
-- Memory Management Funnel: Search -> Remember -> Update -> Forget
-- Shows what % of users who search also create/update/delete memories

SELECT
  'Funnel Stage' as stage,
  'Search Memory' as step,
  COUNT(DISTINCT person_id) as users
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name = 'search_memory'
  AND timestamp > now() - INTERVAL 30 DAY

UNION ALL

SELECT
  'Funnel Stage' as stage,
  'Remember Fact' as step,
  COUNT(DISTINCT person_id) as users
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name = 'remember_fact'
  AND timestamp > now() - INTERVAL 30 DAY

UNION ALL

SELECT
  'Funnel Stage' as stage,
  'Update Memory' as step,
  COUNT(DISTINCT person_id) as users
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name = 'update_memory'
  AND timestamp > now() - INTERVAL 30 DAY

UNION ALL

SELECT
  'Funnel Stage' as stage,
  'Forget Memory' as step,
  COUNT(DISTINCT person_id) as users
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_name = 'forget_memory'
  AND timestamp > now() - INTERVAL 30 DAY
```

**Use Case:** Understand memory tool adoption stages
**Dashboard:** Table showing conversion at each stage
**Insight:** Large drop from search to remember might indicate friction

---

## 8. Recommended Dashboards

### Dashboard 1: "Memory Tools Overview"
**Cards:**
1. Total Memory Tool Usage (last 7 days)
2. Success Rate (percentage)
3. Average Execution Time (ms)
4. Active Users

**Charts:**
1. Daily Usage Trend (line chart, by tool)
2. Usage Distribution (pie chart)
3. Error Rate Trend (line chart)
4. Recent Errors (table)

---

### Dashboard 2: "Performance Monitor"
**Cards:**
1. P95 Latency by Tool (gauges)
2. Error Count (last 24h)
3. Slowest Tool

**Charts:**
1. Latency Percentiles (bar chart)
2. Performance Trend (line chart)
3. Error Rate by Tool (bar chart)
4. Execution Time Distribution (histogram)

---

### Dashboard 3: "Confirmation Workflow"
**Cards:**
1. Total Confirmations (last 7 days)
2. Overall Approval Rate
3. Most Denied Tool

**Charts:**
1. Approval Rate by Tool (bar chart)
2. Confirmation Funnel (shown → approved → denied)
3. Denial Trend (line chart)
4. Confirmations by Date (area chart)

---

### Dashboard 4: "User Engagement"
**Cards:**
1. Active Users (last 7 days)
2. New Memory Count (daily avg)
3. Search Query Count (daily avg)

**Charts:**
1. Tool Usage Heatmap (tool x day matrix)
2. User Tool Combinations (table)
3. Per-User Tool Distribution (histogram)
4. Engagement Trend (line chart)

---

## 9. Alerts & Monitoring

### Critical Alerts (Escalate Immediately)

```
Alert 1: Error Rate > 20%
  Query: Error rate by tool
  Threshold: > 20% for any tool
  Action: Page oncall engineer

Alert 2: P95 Latency > 2000ms
  Query: P95 latency percentiles
  Threshold: > 2000ms
  Action: Start performance investigation

Alert 3: 0 Usage in 24 Hours
  Query: Daily usage trend
  Threshold: < 1 usage per tool per day
  Action: Check if feature is broken
```

### Warning Alerts (Review Daily)

```
Alert 4: Approval Rate < 30%
  Query: Confirmation approval rate
  Threshold: < 30%
  Action: Review UX clarity

Alert 5: Duplicate Rate > 30%
  Query: Duplicate detection rate
  Threshold: > 30%
  Action: Review deduplication threshold

Alert 6: Search Empty Results > 50%
  Query: Search result success
  Threshold: > 50% empty results
  Action: Review search effectiveness
```

---

## 10. Testing Query Validity

Before using these queries in production dashboards, test them:

```sql
-- Test query availability
SELECT count() FROM events LIMIT 1;

-- Check if agent_tool_called event exists
SELECT DISTINCT event FROM events WHERE event LIKE '%agent%' LIMIT 10;

-- Check event properties
SELECT properties FROM events WHERE event = 'agent_tool_called' LIMIT 1;

-- Verify time range
SELECT min(timestamp) as earliest, max(timestamp) as latest FROM events;
```

---

## Notes for PostHog Configuration

1. **Event Naming:** Follow `agent_tool_called` for generic events
2. **Property Keys:** Use snake_case (tool_name, tool_status, execution_time_ms)
3. **Timestamp:** PostHog auto-captures, don't send manually
4. **User ID:** PostHog auto-identifies from session
5. **Batching:** Events batch automatically every 10-60 seconds
6. **Retention:** Default 30 days, adjust in project settings

---

## Troubleshooting Queries

If queries don't return expected results:

1. **No events found?**
   - Check event name spelling in query matches actual capture calls
   - Verify event filtering dates overlap with when events were sent
   - Confirm PostHog project key is correct

2. **Properties empty?**
   - Verify properties are passed in capture call as 2nd parameter
   - Check property names match exactly (case-sensitive)
   - Ensure properties are JSON-serializable

3. **Aggregation errors?**
   - Use COUNT(DISTINCT person_id) for user-level metrics
   - Use COUNT() for event-level metrics
   - Ensure GROUP BY includes all non-aggregated columns

---

## Query Performance Tips

- Add time range filters (last 7/30/90 days) for faster queries
- Use LIMIT when doing exploratory analysis
- Avoid SELECT * - specify exact columns needed
- GROUP BY before ORDER BY for efficiency
- Use UNION instead of OR in WHERE clause

