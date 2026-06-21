## 2026-06-21 - SQLite WASM localStorage export bottleneck
**Learning:** Exporting an entire SQLite WASM database via `_db.export()` and converting it to a Base64 string for localStorage synchronously on the main thread is a massive bottleneck if tied to high-frequency events like input keystrokes.
**Action:** Implement debouncing for persistence logic using `setTimeout` and ensure a synchronous `beforeunload` flush to guarantee data safety.
