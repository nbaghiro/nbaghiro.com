title: Sharing datasets between backtests
date: 2026-11-09
about: Engineering
cover: /img/posts/sharing-datasets-between-backtests-wide.webp
card: /img/posts/sharing-datasets-between-backtests-card.webp
summary: How LlamaTrade identifies reusable market-data snapshots, coordinates preparation through Redis, and publishes Parquet files, with the limits of leases, local storage, and historical data revisions.

Two backtests can use different allocation rules while needing the same historical prices. Fetching and preparing those prices for each run repeats work before either simulation starts.

In [LlamaTrade](https://llamatrade.ai), a dataset preparation step sits between compiling a strategy and running it. It gathers the required bars, fills certain gaps, and can save the result for reuse. The simulator receives the prepared data rather than fetching prices during each step.

Making that useful involves several separate decisions: what makes two requests equivalent, where the result is stored, how concurrent requests wait for it, and what happens when preparation fails. Those decisions matter when moving from one process to several workers.

## Identify the data the simulation actually needs

A cache key containing only the symbols and the backtest's start date would miss important inputs.

An indicator may need prices from before the visible simulation period. A benchmark adds another symbol. Daily adjusted prices differ from raw prices. Recent historical bars may be revised after they were first downloaded.

The service builds a `DatasetSpec` containing six fields:

```text
symbols       sorted, uppercase, without duplicates
timeframe     the requested bar interval
fetch_start   start including indicator warm-up
end           last requested date allowed by the service
adjustment    split-adjusted or raw
data_version  a date tag for recent data, otherwise empty
```

The symbol normalization means `['spy', 'QQQ', 'SPY']` and `['QQQ', 'spy']` produce the same symbol tuple. The remaining values must also match. The implementation serializes the fields as compact JSON with sorted keys, hashes the bytes with SHA-256, and keeps the first 32 hexadecimal characters.

A snapshot path then looks like `1D/<hash>.parquet`. The timeframe partition helps organize the files; the hash identifies the complete specification.

![Different symbol order normalizes to the same dataset specification. A changed warm-up window, adjustment, or version produces a different key.](figure:dataset-identity)

This is a hash of the request specification, not a checksum of the downloaded prices. Matching keys tell the application that two requests should use the same dataset. They do not prove the provider returned identical bytes, or that the underlying historical data never changed.

The cache also operates on an entire specification. A request for SPY and QQQ cannot reuse the SPY portion of a different cached request for SPY and TLT. A partitioned store could support that, but it would need rules for composing independently versioned pieces. The whole-dataset approach keeps the first implementation smaller at the cost of repeated storage and preparation across partially overlapping requests.

## Include warm-up and revision policy in the key

Before preparing data, the service combines explicitly requested symbols with symbols required by the compiled strategy. It adds the benchmark when needed, then extends the start backward using the strategy's warm-up requirement.

That extended date belongs in the key. Two strategies with the same visible start date can need different amounts of history. Reusing the shorter dataset could leave the second strategy without enough observations to initialize an indicator.

The end is capped at the previous UTC calendar day. That avoids including today's forming bar in the snapshot. The helper's name refers to a closed session, but its actual rule is a calendar cutoff, not an exchange calendar. Holidays and session boundaries would need more precise treatment if the product required the latest fully closed market session across venues.

The service also labels daily data as split-adjusted and other configured intervals as raw, matching the market-data service's convention. Those labels participate in identity; they do not independently transform the data inside the cache.

For data ending within a configurable recent window, ten days by default, `data_version` is the current UTC date. A request made tomorrow therefore gets a different key. Older ranges keep an empty version and a stable key.

This is a practical freshness policy, not a full record of historical revisions. An older correction can outlive the window, and two downloads within the same date tag can still see different upstream values. For reproducible research, I would retain an immutable snapshot identifier or content digest with each run, plus a preparation-format version. That would make the exact input to a result retrievable even after the cache's freshness policy changes.

## Check the snapshot before coordinating work

Preparation first asks the store whether the snapshot exists. If it can read it, the function returns those bars without contacting the market-data service.

On a miss, it tries to acquire a Redis key for the specification:

```text
SET backtest:dataset:lock:<hash> 1 NX EX 300
```

`NX` makes the write conditional on the key being absent. `EX 300` gives it a five-minute expiry. These options are applied in one command. [Redis SET documentation](https://redis.io/docs/latest/commands/set/)

The worker that acquires the key fetches the bars, prepares them, and writes the snapshot. A worker that does not acquire it polls the store every half-second. Once the file becomes available, that worker reads the result and can start its own simulation.

![One worker prepares and publishes a dataset while another waits for the shared snapshot. Both simulations then read the prepared bars.](figure:dataset-preparation)

The shared resource here is the prepared input. Each simulation still has its own strategy, portfolio state, and results. Reusing the prices should not imply reusing mutable simulation state.

There is a small additional race in the current flow: the successful lock holder does not recheck the cache after acquiring the lock. A different worker could have published between the initial cache miss and this acquisition. Checking again would avoid that unnecessary preparation without changing the identity model.

## Treat the lease as a way to reduce duplicate work

The function deliberately keeps running when coordination fails. With no Redis client, or if acquiring the key raises an error, it prepares the dataset directly. A waiting worker also prepares its own copy after the waiting budget is exhausted.

That keeps a backtest from waiting forever for another worker. It means duplicate preparation is an accepted outcome. The lease is an optimization around reusable data, not an exactly-once execution guarantee.

Its release behavior needs particular care. The current code stores the literal value `1` and deletes the key when the producer finishes. It does not check ownership before deleting.

Suppose worker A runs for longer than five minutes. Its key expires. Worker B acquires a new key for the same dataset. A then finishes and deletes that key, even though B is now working under it. A third worker can acquire the key and begin another preparation.

A stronger implementation would use a unique token for each acquisition and atomically compare that token before deletion. Lease renewal could reduce overlap for slow preparation. Redis documents the ownership-token pattern and why an unconditional delete can release another client's lock. [Redis lock guidance](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)

Those changes still would not make data fetched from a changing provider identical. If competing producers can observe different revisions, publication also needs a defined policy. Immutable result objects and a versioned manifest are one possible design. The current local store simply replaces the destination with a complete file.

## Publish the file only after the write finishes

The local store writes one Parquet table with symbol, timestamp, open, high, low, close, and volume columns. Prices use floating-point columns, volume uses an integer column, and timestamps carry UTC metadata. The file uses Zstandard compression.

Writing directly to the final filename would expose an incomplete file to workers polling for its existence. Instead, the store creates a temporary file in the destination directory, writes Parquet there, and calls `os.replace` after the writer finishes. On a supported filesystem, the rename gives readers an atomic change at that pathname. Python documents that a successful replacement is atomic and that crossing filesystems can fail. [Python os.replace](https://docs.python.org/3/library/os.html#os.replace)

Keeping the temporary file in the same directory avoids that cross-filesystem problem. If writing fails, the temporary file is removed and the final snapshot is not published.

This addresses partial visibility. The code does not explicitly synchronize the file and directory to durable storage, so I would not describe it as a power-loss durability guarantee. A network filesystem would also need its own operational validation. The store interface alone cannot establish the guarantees of every storage system behind it.

## Redis and storage must describe the same group of workers

The most important deployment detail is where the snapshot lives.

`BACKTEST_DATASET_DIR` selects the local Parquet store. Every worker expected to share a result must see that same storage location. Two containers can have identical directory names while using separate disks. Sharing Redis does not make the file written in one container visible in the other.

Without that environment variable, the factory creates a fresh in-memory store. Reuse then lasts only as long as that store instance is retained or explicitly shared. Creating another service instance with another store does not inherit its cache, even within the same process.

The repository provides the local and in-memory implementations. The store protocol leaves room for an object-store implementation, but that is additional work. The checked-in deployment configuration does not establish a shared dataset volume, so cross-worker reuse should be treated as something to configure and verify rather than an automatic property of enabling Redis.

For several machines, I would choose storage all of them can read, define how a complete object becomes visible, and test those semantics together with the coordinator. A worker should never spend five minutes waiting for a file on another worker's private disk.

## Recover from bad snapshots without hiding bad inputs

The Parquet reader catches decoding and filesystem errors, removes the unreadable file, and reports a cache miss so preparation can rebuild it. The tests cover both corrupt and truncated files.

That recovery is intentionally narrower than accepting every malformed dataset. When creating a table, missing price fields raise an error. Missing volume is converted to zero. Those are different data policies: treating a missing close as zero would change the simulated returns, while the code explicitly allows sparse volume.

The preparation step also looks for large interior gaps and refetches those ranges. Daily data uses a six-calendar-day threshold; weekly and monthly intervals have larger thresholds. The merge preserves existing observations on timestamp conflicts and sorts the result.

This is a heuristic gap repair. It can miss a shorter outage, and it does not prove that every expected exchange session has a valid bar. A stricter completeness check would compare observations with a market calendar and record which symbols and dates remain missing.

The cleanup job removes snapshots according to file modification time. Reads do not refresh that time, so this is age-based expiry rather than least-recently-used eviction. A popular old snapshot can still be removed and rebuilt. That policy is simple, but it should be considered when interpreting cache-hit rates.

## Test the failure cases as well as reuse

The dataset tests cover stable keys, changed adjustment and version fields, Parquet round trips, missing values, corrupt snapshots, failed writes, gap repair, and a waiting worker reading a published result. Another test confirms that a waiter eventually fetches for itself when no result appears.

The coordination tests use a fake Redis implementation without real expiry. They exercise the control flow but cannot establish behavior when the lease expires during a slow fetch. I would add that case, delayed-producer release, Redis interruption, and workers with genuinely shared storage before relying on the coordination at larger scale.

Useful operational measures would include cache hits, preparation time, time spent waiting, fallback preparations, and corrupt-file rebuilds. A high wait time with few shared reads could indicate a storage configuration problem. Frequent fallbacks could mean preparation regularly exceeds the lease.

The implementation already separates dataset identity, preparation, storage, and simulation. That makes the next changes reasonably focused. Better coordination can reduce repeated work; stronger snapshot versioning can improve reproducibility; shared storage can extend reuse across workers. Each improvement solves a different requirement and needs a test that matches it.
