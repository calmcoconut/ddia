## 2026-06-21 - SQLite WASM localStorage export bottleneck
**Learning:** Exporting an entire SQLite WASM database via `_db.export()` and converting it to a Base64 string for localStorage synchronously on the main thread is a massive bottleneck if tied to high-frequency events like input keystrokes.
**Action:** Implement debouncing for persistence logic using `setTimeout` and ensure a synchronous `beforeunload` flush to guarantee data safety.
## 2026-06-21 - [Optimize API calls in loop using ThreadPoolExecutor]
 **Learning:** Making external network calls sequentially within a loop causes unnecessary `O(N)` wait times because Python execution blocks on each network request. In I/O-bound tasks, concurrent execution using `ThreadPoolExecutor` can significantly cut down total request latency by dispatching tasks in parallel.
 **Action:** Next time there's a loop making remote network calls (e.g. hitting Gemini API repeatedly for multiple questions), implement it using `concurrent.futures.ThreadPoolExecutor` out-of-the-box instead of sequential loops.
