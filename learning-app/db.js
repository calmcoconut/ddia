// db.js
// Handles active username context, page login overlay, and SQLite WASM storage.

let _db = null;

// Convert Uint8Array to Base64 safely and quickly
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunk = 8192;
    for (let i = 0; i < len; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

// Convert Base64 back to Uint8Array
function base64ToArrayBuffer(base64) {
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

// Persist SQLite DB array buffer to localStorage
function persistDb() {
    if (!_db) return;
    try {
        const exported = _db.export();
        const base64 = arrayBufferToBase64(exported);
        localStorage.setItem("ddia_sqlite_db", base64);
    } catch (e) {
        console.error("Failed to persist SQLite DB to localStorage", e);
    }
}

// Initialize SQLite Database
async function initDb() {
    if (_db) return _db;
    
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });

        const savedDb = localStorage.getItem("ddia_sqlite_db");
        if (savedDb) {
            const arrayBuf = base64ToArrayBuffer(savedDb);
            _db = new SQL.Database(new Uint8Array(arrayBuf));
        } else {
            _db = new SQL.Database();
        }

        // Ensure tables exist
        _db.run(`
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY
            )
        `);
        _db.run(`
            CREATE TABLE IF NOT EXISTS progress (
                username TEXT,
                state_key TEXT,
                state_data TEXT,
                PRIMARY KEY (username, state_key)
            )
        `);
        
        window._db = _db; // expose globally
    } catch (e) {
        console.error("Failed to initialize SQLite Database", e);
        // Fallback to in-memory only database if anything goes wrong
        if (typeof initSqlJs !== 'undefined') {
            try {
                const SQL = await initSqlJs({
                    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
                });
                _db = new SQL.Database();
                window._db = _db;
            } catch (e2) {
                console.error("Critical: SQLite fallback failed", e2);
            }
        }
    }
    return _db;
}

// Retrieve all usernames
function listUsers() {
    if (!_db) return [];
    try {
        const res = _db.exec("SELECT username FROM users ORDER BY username ASC");
        if (res && res[0] && res[0].values) {
            return res[0].values;
        }
    } catch (e) {
        console.error("Failed to list users", e);
    }
    return [];
}

// Create new username context
function getOrCreateUser(username) {
    if (!username) return;
    username = username.trim().toLowerCase();
    if (!_db) return;
    try {
        _db.run("INSERT OR IGNORE INTO users (username) VALUES (?)", [username]);
        persistDb();
        sessionStorage.setItem("ddia_active_user", username);
        localStorage.setItem("ddia_active_user", username);
    } catch (e) {
        console.error("Failed to get/create user", e);
    }
}

// Load state JSON from progress table
function loadState(stateKey) {
    if (!_db) return {};
    const username = sessionStorage.getItem("ddia_active_user") || localStorage.getItem("ddia_active_user") || "anonymous";
    try {
        const res = _db.exec("SELECT state_data FROM progress WHERE username = ? AND state_key = ?", [username, stateKey]);
        if (res && res[0] && res[0].values && res[0].values[0]) {
            return JSON.parse(res[0].values[0][0]);
        }
    } catch (e) {
        console.error("Failed to load state", e);
    }
    return {};
}

// Save state JSON merging updates into progress table
function saveState(data, stateKey) {
    if (!_db) return;
    const username = sessionStorage.getItem("ddia_active_user") || localStorage.getItem("ddia_active_user") || "anonymous";
    try {
        const existingState = loadState(stateKey);
        const mergedState = { ...existingState, ...data };
        const stateStr = JSON.stringify(mergedState);
        
        _db.run(
            "INSERT OR REPLACE INTO progress (username, state_key, state_data) VALUES (?, ?, ?)",
            [username, stateKey, stateStr]
        );
        persistDb();
    } catch (e) {
        console.error("Failed to save state", e);
    }
}

// Get active username
function getCurrentUsername() {
    try {
        return sessionStorage.getItem("ddia_active_user") || localStorage.getItem("ddia_active_user") || "anonymous";
    } catch (e) {
        return "anonymous";
    }
}

// Expose functions globally
window.initDb = initDb;
window.listUsers = listUsers;
window.getOrCreateUser = getOrCreateUser;
window.loadState = loadState;
window.saveState = saveState;
