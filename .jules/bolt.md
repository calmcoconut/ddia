## 2026-06-21 - SQLite WASM localStorage export bottleneck
**Learning:** Exporting an entire SQLite WASM database via `_db.export()` and converting it to a Base64 string for localStorage synchronously on the main thread is a massive bottleneck if tied to high-frequency events like input keystrokes.
**Action:** Implement debouncing for persistence logic using `setTimeout` and ensure a synchronous `beforeunload` flush to guarantee data safety.
## 2026-06-21 - [Optimize API calls in loop using ThreadPoolExecutor]
 **Learning:** Making external network calls sequentially within a loop causes unnecessary `O(N)` wait times because Python execution blocks on each network request. In I/O-bound tasks, concurrent execution using `ThreadPoolExecutor` can significantly cut down total request latency by dispatching tasks in parallel.
 **Action:** Next time there's a loop making remote network calls (e.g. hitting Gemini API repeatedly for multiple questions), implement it using `concurrent.futures.ThreadPoolExecutor` out-of-the-box instead of sequential loops.
## 2023-10-27 - [Caching Subprocess Output]
 **Learning:** Spawning a subprocess (like Node.js) on every HTTP request creates a massive latency bottleneck (e.g. going from ~1ms to ~80ms per call). When the underlying data fetched by the subprocess rarely changes, caching the result in memory drastically reduces the overhead.
 **Action:** Identify expensive operations like subprocess calls or heavy file parsing inside hot paths. Use `functools.lru_cache` to cache their results, especially if the set of inputs is small and finite.
