-- SQLite Connection Configuration for Performance
-- Generated on 2025-10-23T06:33:22.428Z

-- Performance-oriented PRAGMA settings
PRAGMA journal_mode = WAL;           -- Write-Ahead Logging for better concurrency
PRAGMA synchronous = NORMAL;         -- Balance between safety and performance
PRAGMA cache_size = -64000;          -- 64MB cache size (negative = KB)
PRAGMA temp_store = MEMORY;          -- Store temporary tables in memory
PRAGMA mmap_size = 268435456;        -- 256MB memory-mapped I/O
PRAGMA page_size = 4096;             -- Optimal page size for most systems

-- Query optimization settings
PRAGMA optimize;                     -- Enable automatic index optimization
PRAGMA analysis_limit = 1000;       -- Limit analysis for large tables
