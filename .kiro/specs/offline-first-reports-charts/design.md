# Design Document: Offline-First Reports and Charts

## Overview

This design implements a persistent caching layer for BlinkBudget's reports and financial planning features, enabling instant offline access to previously viewed data. The solution introduces a `PersistentCacheService` that works alongside the existing `CacheService` to provide a two-tier caching strategy: fast in-memory cache for immediate access and localStorage-backed persistent cache for offline availability.

The design prioritizes performance (sub-500ms cached loads), storage efficiency (LRU eviction, compression), and graceful degradation (fallback to in-memory when localStorage unavailable). It integrates seamlessly with existing services (AnalyticsEngine, ChartRenderer, StorageService) while maintaining backward compatibility.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        View Layer                            │
│  (ReportsView, FinancialPlanningView + 7 tabs)              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cache Orchestrator                         │
│  (Manages cache hierarchy and invalidation)                  │
└─────┬──────────────────────────────────┬────────────────────┘
      │                                   │
      ▼                                   ▼
┌──────────────────┐            ┌──────────────────────────┐
│  CacheService    │            │ PersistentCacheService   │
│  (In-Memory)     │            │ (localStorage)           │
│  - Fast access   │            │ - Offline survival       │
│  - TTL support   │            │ - LRU eviction           │
└──────────────────┘            │ - Compression            │
                                │ - Version management     │
                                └──────────────────────────┘
```

### Cache Hierarchy

1. **Level 1: In-Memory Cache (CacheService)** - Fastest, cleared on page reload
2. **Level 2: Persistent Cache (localStorage)** - Survives reloads, limited by quota
3. **Level 3: Fresh Computation** - Fallback when no cache available

## Components and Interfaces

### 1. PersistentCacheService

Core service for managing localStorage-backed caching with compression, versioning, and LRU eviction.

```javascript
class PersistentCacheService {
  constructor(options = {}) {
    this.prefix = options.prefix || 'blinkbudget_cache_';
    this.version = options.version || '1.0.0';
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    this.compressionThreshold = options.compressionThreshold || 10240; // 10KB
  }

  // Core operations
  set(key, value, metadata = {})
  get(key)
  has(key)
  delete(key)
  clear()

  // Utility operations
  getStats()
  evictOldest(count = 1)
  getAllKeys()
  getSize()
}
```

**Key Methods:**

- `set(key, value, metadata)`: Stores data with automatic compression, versioning, and timestamp
- `get(key)`: Retrieves and decompresses data, validates version
- `evictOldest(count)`: Implements LRU eviction when quota exceeded
- `getStats()`: Returns cache metrics (hit rate, size, entry count)

### 2. CacheOrchestrator

Manages the two-tier cache hierarchy and coordinates invalidation across both layers.

```javascript
class CacheOrchestrator {
  constructor(memoryCache, persistentCache) {
    this.memoryCache = memoryCache;
    this.persistentCache = persistentCache;
    this.hitStats = { memory: 0, persistent: 0, miss: 0 };
  }

  async get(key)
  async set(key, value, options = {})
  invalidate(pattern)
  invalidateAll()
  getHitRate()
}
```

**Cache Flow:**

1. Check memory cache → return if hit
2. Check persistent cache → populate memory cache if hit
3. Return null if miss (caller computes fresh data)

### 3. ChartConfigSerializer

Handles serialization and deserialization of Chart.js configurations for persistent storage.

```javascript
class ChartConfigSerializer {
  static serialize(chartInstance)
  static deserialize(serializedConfig)
  static isSerializable(chartInstance)
}
```

**Serialization Strategy:**

- Extract configuration from Chart.js instance
- Remove non-serializable properties (functions, DOM references)
- Preserve data, options, type, and plugins configuration
- Handle special cases (callbacks, custom plugins)

### 4. OfflineDetector

Monitors online/offline status and triggers appropriate cache behaviors.

```javascript
class OfflineDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
  }

  subscribe(callback)
  unsubscribe(callback)
  checkStatus()
}
```

**Events:**

- `online`: Triggers data refresh if cached data is stale
- `offline`: Switches to cache-only mode

### 5. CacheInvalidationManager

Centralized invalidation logic triggered by data changes.

```javascript
class CacheInvalidationManager {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.setupListeners();
  }

  setupListeners()
  onTransactionChange()
  onTimePeriodChange(newPeriod)
  onFilterChange(newFilters)
}
```

**Invalidation Triggers:**

- Transaction add/update/delete → invalidate all report caches
- Time period change → invalidate only affected period
- Filter change → invalidate filtered caches only

## Data Models

### CacheEntry

```javascript
{
  key: string,              // Unique cache identifier
  value: any,               // Cached data (compressed if large)
  metadata: {
    version: string,        // App version for invalidation
    timestamp: number,      // Creation time (for LRU)
    size: number,           // Uncompressed size in bytes
    compressed: boolean,    // Whether value is compressed
    timePeriod: {           // Optional: for report caches
      startDate: string,
      endDate: string
    },
    filters: object,        // Optional: active filters
    type: string            // 'report' | 'chart' | 'analytics'
  }
}
```

### ChartCacheEntry

```javascript
{
  key: string,              // Format: 'chart_{viewName}_{chartType}_{hash}'
  config: {
    type: string,           // 'pie' | 'bar' | 'line'
    data: {
      labels: string[],
      datasets: Dataset[]
    },
    options: object         // Chart.js options (serialized)
  },
  metadata: {
    version: string,
    timestamp: number,
    chartType: string,      // 'category-breakdown' | 'income-expense' | etc.
    dependencies: string[]  // Cache keys this chart depends on
  }
}
```

### CacheStats

```javascript
{
  totalSize: number,        // Total bytes used
  entryCount: number,       // Number of cached entries
  hitRate: {
    memory: number,         // Memory cache hit rate (0-1)
    persistent: number,     // Persistent cache hit rate (0-1)
    overall: number         // Combined hit rate (0-1)
  },
  oldestEntry: number,      // Timestamp of oldest entry
  newestEntry: number,      // Timestamp of newest entry
  byType: {                 // Breakdown by cache type
    report: { count: number, size: number },
    chart: { count: number, size: number },
    analytics: { count: number, size: number }
  }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Cache Display Properties**: Requirements 1.3 and 6.1 both test immediate display without loading state - these can be combined into a single comprehensive property
2. **Background Loading Indicators**: Requirements 6.5 and 10.3 both test showing indicators during background processing - these are duplicates
3. **Cache Key Determinism**: Multiple requirements touch on cache key generation - these can be unified into one property about deterministic key generation
4. **Dual Cache Updates**: Requirements about updating both caches can be combined into a single coherence property

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Cache Persistence Round-Trip

_For any_ valid report data and cache key, storing the data to persistent cache then retrieving it should produce equivalent data (accounting for serialization).

**Validates: Requirements 1.1, 2.1**

### Property 2: Cache Hierarchy Precedence

_For any_ cache key, when data exists in both memory and persistent cache, the memory cache value should be returned without accessing persistent storage.

**Validates: Requirements 12.1**

### Property 3: Immediate Cached Display

_For any_ valid cached report data, navigating to the reports view should display the cached data immediately without showing a loading state.

**Validates: Requirements 1.3, 6.1**

### Property 4: Cache Key Determinism

_For any_ time period and filter combination, generating a cache key multiple times with the same inputs should produce identical keys.

**Validates: Requirements 1.5, 5.4**

### Property 5: Chart Configuration Serialization Round-Trip

_For any_ valid Chart.js configuration (pie, bar, or line), serializing then deserializing should produce an equivalent configuration that renders identically.

**Validates: Requirements 2.5**

### Property 6: Offline Cache Loading

_For any_ cached report data, when the system is offline (navigator.onLine === false), the cached data should load and display successfully.

**Validates: Requirements 3.1**

### Property 7: Cache Invalidation on Transaction Change

_For any_ cached report data, when a transaction is added, updated, or deleted, all report and chart cache entries should be removed from both memory and persistent storage.

**Validates: Requirements 5.1**

### Property 8: Time Period Cache Isolation

_For any_ two different time periods, cached data for one period should not be returned when requesting data for the other period.

**Validates: Requirements 5.2, 5.4**

### Property 9: Filter Cache Isolation

_For any_ two different filter states, cached data for one filter state should not be returned when requesting data for the other filter state.

**Validates: Requirements 5.3, 5.4**

### Property 10: Background Data Processing

_For any_ cached report data, displaying the cached data should trigger background processing of fresh data without blocking the UI.

**Validates: Requirements 6.2**

### Property 11: Cache Version Validation

_For any_ cached data with a version identifier, if the app version changes, the cached data should be discarded and fresh data generated.

**Validates: Requirements 7.2, 7.4**

### Property 12: LRU Eviction Order

_For any_ sequence of cache entries with different timestamps, when storage quota is exceeded, the entry with the oldest timestamp should be evicted first.

**Validates: Requirements 8.2, 8.3**

### Property 13: QuotaExceededError Graceful Handling

_For any_ cache write operation, when localStorage throws QuotaExceededError, the system should handle it gracefully without crashing and continue operating with in-memory cache.

**Validates: Requirements 8.1, 8.4**

### Property 14: Data Compression for Large Datasets

_For any_ cached data exceeding the compression threshold (10KB), the stored size in localStorage should be smaller than the original uncompressed size.

**Validates: Requirements 8.5**

### Property 15: Cached Load Performance

_For any_ cached report data, the time from navigation to display should be less than 500ms.

**Validates: Requirements 9.1**

### Property 16: Cached Chart Render Performance

_For any_ cached chart configuration, the time to render the chart should be less than 300ms.

**Validates: Requirements 9.2**

### Property 17: Batched localStorage Writes

_For any_ sequence of multiple cache write operations within a short time window, the number of actual localStorage.setItem calls should be less than the number of write requests (due to batching).

**Validates: Requirements 9.4**

### Property 18: Cache Indicator Presence

_For any_ view displaying cached data, the DOM should contain a visual indicator element showing the cache status and last update timestamp.

**Validates: Requirements 1.4, 4.4, 10.1, 10.2**

### Property 19: Visual Indicator Consistency

_For any_ two different views (ReportsView, FinancialPlanningView tabs) displaying cached data, the cache indicator elements should use the same CSS classes and styling.

**Validates: Requirements 10.5**

### Property 20: localStorage Unavailable Fallback

_For any_ system state where localStorage is unavailable or disabled, all cache operations should fall back to in-memory caching without throwing errors.

**Validates: Requirements 11.1**

### Property 21: Cache Read Error Recovery

_For any_ cache read operation that fails (corrupted data, parse error), the system should log the error and proceed with fresh data generation without blocking the user.

**Validates: Requirements 11.2, 11.4**

### Property 22: Cache Write Error Recovery

_For any_ cache write operation that fails, the system should log the error and continue normal operation without affecting the user experience.

**Validates: Requirements 11.3**

### Property 23: Memory Cache Population from Persistent

_For any_ cache key, when data is loaded from persistent cache, the same data should be immediately available in the memory cache without requiring another persistent cache read.

**Validates: Requirements 12.2**

### Property 24: Dual Cache Update Coherence

_For any_ fresh data computation, both the memory cache and persistent cache should contain the same data after the update completes.

**Validates: Requirements 12.3, 12.5**

### Property 25: Integrated Cache Invalidation

_For any_ cache invalidation triggered through AnalyticsEngine methods, the corresponding entries should be removed from both memory and persistent caches.

**Validates: Requirements 12.4**

## Error Handling

### localStorage Errors

**QuotaExceededError:**

- Trigger LRU eviction to free space
- Retry write operation once after eviction
- If still fails, log warning and continue with memory-only cache
- Display subtle notification to user about storage limits

**SecurityError (localStorage disabled):**

- Detect on initialization
- Set flag to skip all persistent cache operations
- Fall back to memory-only caching
- Log warning for debugging

**Data Corruption:**

- Wrap all JSON.parse calls in try-catch
- On parse error, delete corrupted entry
- Log error with cache key for debugging
- Return null to trigger fresh data generation

### Network Errors

**Offline Detection:**

- Listen to `online` and `offline` events
- Check `navigator.onLine` on critical operations
- Display offline indicator in UI
- Disable network-dependent features (investment price updates)

**Background Refresh Failures:**

- Catch errors during background data processing
- Log error but don't disrupt cached data display
- Retry on next navigation or manual refresh
- Show subtle error indicator if refresh fails repeatedly

### Chart Rendering Errors

**Serialization Failures:**

- Validate chart config before serialization
- Skip caching if config contains non-serializable data
- Log warning with chart type
- Continue with normal chart rendering

**Deserialization Failures:**

- Catch errors during config restoration
- Delete invalid cache entry
- Fall back to regenerating chart
- Log error for debugging

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:

- Specific examples of cache operations (store, retrieve, delete)
- Edge cases (empty cache, corrupted data, quota exceeded)
- Integration points (AnalyticsEngine, StorageService, ChartRenderer)
- Error conditions (localStorage unavailable, parse errors)
- UI components (cache indicators, offline messages)

**Property-Based Tests** focus on:

- Universal properties across all inputs (round-trip serialization)
- Cache coherence across memory and persistent layers
- Performance guarantees (load times, render times)
- Invalidation correctness across all scenarios
- LRU eviction ordering with random entry sequences

Together, unit tests catch concrete bugs in specific scenarios while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library:** Use `fast-check` for JavaScript property-based testing

**Test Configuration:**

- Minimum 100 iterations per property test
- Each test tagged with: `Feature: offline-first-reports-charts, Property {N}: {property_text}`
- Tests should generate random:
  - Report data structures
  - Time periods (start/end dates)
  - Filter combinations
  - Chart configurations
  - Cache entry sequences (for LRU testing)

**Example Property Test Structure:**

```javascript
import fc from 'fast-check';

// Feature: offline-first-reports-charts, Property 1: Cache Persistence Round-Trip
test('Property 1: Cache persistence round-trip', () => {
  fc.assert(
    fc.property(
      fc.record({
        transactions: fc.array(transactionArbitrary),
        categoryBreakdown: categoryBreakdownArbitrary,
        insights: insightsArbitrary,
      }),
      fc.string(),
      (reportData, cacheKey) => {
        const cache = new PersistentCacheService();
        cache.set(cacheKey, reportData);
        const retrieved = cache.get(cacheKey);

        // Deep equality check (accounting for serialization)
        expect(retrieved).toEqual(reportData);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus Areas

**PersistentCacheService:**

- Basic CRUD operations (set, get, delete, clear)
- Compression/decompression for large data
- Version validation and mismatch handling
- LRU eviction when quota exceeded
- Stats calculation (size, count, hit rate)

**CacheOrchestrator:**

- Cache hierarchy (memory before persistent)
- Cache warming (persistent → memory)
- Dual updates (memory + persistent)
- Invalidation patterns (single key, wildcard)
- Hit rate tracking

**ChartConfigSerializer:**

- Serialization for each chart type (pie, bar, line)
- Handling non-serializable properties
- Round-trip preservation of visual appearance
- Error handling for invalid configs

**CacheInvalidationManager:**

- Transaction change triggers
- Time period change triggers
- Filter change triggers
- Selective vs. full invalidation

**OfflineDetector:**

- Online/offline event handling
- Status checking
- Listener subscription/unsubscription

**UI Components:**

- Cache indicator rendering
- Timestamp display formatting
- Offline message display
- Background loading indicator

### Integration Testing

**ReportsView Integration:**

- Full flow: navigation → cache check → display
- Background refresh while showing cached data
- Transition from cached to fresh data
- Offline mode with cached data
- Offline mode without cached data

**FinancialPlanningView Integration:**

- Tab switching with cached data
- Tab switching offline
- Cache isolation between tabs
- Consistent indicators across tabs

**Performance Testing:**

- Measure cached load time (target: <500ms)
- Measure chart render time (target: <300ms)
- Measure cache write batching effectiveness
- Monitor localStorage usage over time

## Implementation Details

### Cache Key Generation

Cache keys must be deterministic and include all factors that affect the cached data:

```javascript
function generateCacheKey(type, params) {
  const parts = [type];

  if (params.timePeriod) {
    parts.push(params.timePeriod.startDate);
    parts.push(params.timePeriod.endDate);
  }

  if (params.filters) {
    // Sort filter keys for determinism
    const filterStr = Object.keys(params.filters)
      .sort()
      .map(k => `${k}:${JSON.stringify(params.filters[k])}`)
      .join('|');
    parts.push(filterStr);
  }

  if (params.chartType) {
    parts.push(params.chartType);
  }

  return parts.join('_');
}
```

### Compression Strategy

Use LZ-string library for fast compression with good ratios:

```javascript
import LZString from 'lz-string';

function compressData(data) {
  const json = JSON.stringify(data);
  if (json.length < COMPRESSION_THRESHOLD) {
    return { compressed: false, data: json };
  }
  return {
    compressed: true,
    data: LZString.compress(json),
  };
}

function decompressData(entry) {
  if (!entry.compressed) {
    return JSON.parse(entry.data);
  }
  const json = LZString.decompress(entry.data);
  return JSON.parse(json);
}
```

### Version Management

Store app version separately and check on every cache read:

```javascript
const APP_VERSION = '1.0.0'; // From package.json or build config
const VERSION_KEY = 'blinkbudget_cache_version';

function checkVersion() {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== APP_VERSION) {
    console.warn(`Cache version mismatch: ${stored} → ${APP_VERSION}`);
    clearAllCaches();
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }
}
```

### LRU Eviction Implementation

Track access times and evict oldest entries when quota exceeded:

```javascript
function evictOldest(count = 1) {
  const entries = this.getAllKeys().map(key => {
    const entry = this.get(key);
    return { key, timestamp: entry.metadata.timestamp };
  });

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest entries
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    this.delete(entries[i].key);
    console.log(`[LRU] Evicted cache entry: ${entries[i].key}`);
  }
}

function handleQuotaExceeded() {
  console.warn('[Cache] Storage quota exceeded, evicting oldest entries');
  this.evictOldest(3); // Evict 3 entries at a time
  return true; // Indicate eviction occurred
}
```

### Background Data Processing

Use requestIdleCallback for non-blocking cache operations:

```javascript
function scheduleBackgroundRefresh(cacheKey, computeFn) {
  const callback = async () => {
    try {
      const freshData = await computeFn();
      await this.orchestrator.set(cacheKey, freshData);
      this.notifyDataUpdated(freshData);
    } catch (error) {
      console.error('[Cache] Background refresh failed:', error);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 100);
  }
}
```

### Batched Writes

Collect writes and flush periodically to reduce I/O:

```javascript
class BatchedWriter {
  constructor(flushInterval = 1000) {
    this.pending = new Map();
    this.flushInterval = flushInterval;
    this.flushTimer = null;
  }

  write(key, value) {
    this.pending.set(key, value);
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
  }

  flush() {
    for (const [key, value] of this.pending) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(`[Cache] Write failed for ${key}:`, error);
      }
    }
    this.pending.clear();
    this.flushTimer = null;
  }
}
```

### UI Components

**Cache Indicator Component:**

```javascript
function createCacheIndicator(metadata) {
  const indicator = document.createElement('div');
  indicator.className = 'cache-indicator';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-live', 'polite');

  const icon = document.createElement('span');
  icon.className = 'cache-indicator-icon';
  icon.textContent = navigator.onLine ? '💾' : '📴';

  const text = document.createElement('span');
  text.className = 'cache-indicator-text';
  const timestamp = new Date(metadata.timestamp);
  text.textContent = `Cached data from ${formatTimestamp(timestamp)}`;

  indicator.appendChild(icon);
  indicator.appendChild(text);

  return indicator;
}
```

**Background Loading Indicator:**

```javascript
function createBackgroundLoadingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'background-loading-indicator';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-label', 'Updating data in background');

  const spinner = document.createElement('div');
  spinner.className = 'spinner-small';

  const text = document.createElement('span');
  text.textContent = 'Updating...';

  indicator.appendChild(spinner);
  indicator.appendChild(text);

  return indicator;
}
```

**Offline Empty State:**

```javascript
function createOfflineEmptyState() {
  const container = document.createElement('div');
  container.className = 'empty-state offline-empty-state';

  const icon = document.createElement('div');
  icon.className = 'empty-state-icon';
  icon.textContent = '📴';

  const title = document.createElement('h3');
  title.textContent = "You're Offline";

  const message = document.createElement('p');
  message.textContent =
    'No cached data available. Connect to the internet to view your reports.';

  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(message);

  return container;
}
```

### Integration with Existing Services

**AnalyticsEngine Integration:**

```javascript
// Modify AnalyticsEngine to use CacheOrchestrator
class AnalyticsEngine {
  constructor() {
    this.cache = CacheService; // Existing in-memory cache
    this.persistentCache = new PersistentCacheService();
    this.orchestrator = new CacheOrchestrator(this.cache, this.persistentCache);
  }

  async getCategoryBreakdown(transactions, timePeriod) {
    const cacheKey = generateCacheKey('category_breakdown', { timePeriod });

    // Check cache hierarchy
    const cached = await this.orchestrator.get(cacheKey);
    if (cached) return cached;

    // Compute fresh data
    const breakdown = this.computeCategoryBreakdown(transactions, timePeriod);

    // Store in both caches
    await this.orchestrator.set(cacheKey, breakdown);

    return breakdown;
  }

  invalidateCache(pattern) {
    // Invalidate both memory and persistent caches
    this.orchestrator.invalidate(pattern);
  }
}
```

**ReportsView Integration:**

```javascript
async function loadReportData(skipHeaderRecreation = false) {
  const cacheKey = generateCacheKey('report_data', {
    timePeriod: currentTimePeriod,
    filters: currentAdvancedFilters,
  });

  // Try cache first
  const cached = await cacheOrchestrator.get(cacheKey);

  if (cached) {
    // Display cached data immediately
    currentData = cached;
    renderReports();
    showCacheIndicator(cached.metadata);

    // Start background refresh
    scheduleBackgroundRefresh(cacheKey, () =>
      computeFreshReportData(currentTimePeriod, currentAdvancedFilters)
    );

    return;
  }

  // No cache, show loading and compute fresh
  showLoadingState();
  const freshData = await computeFreshReportData(
    currentTimePeriod,
    currentAdvancedFilters
  );
  await cacheOrchestrator.set(cacheKey, freshData);
  currentData = freshData;
  renderReports();
}
```
