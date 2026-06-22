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

// Persist SQLite DB array buffer to localStorage synchronously
function _persistDbNow() {
    if (!_db) return;
    try {
        const exported = _db.export();
        const base64 = arrayBufferToBase64(exported);
        localStorage.setItem("ddia_sqlite_db", base64);
    } catch (e) {
        console.error("Failed to persist SQLite DB to localStorage", e);
    }
}

// Debounced wrapper to prevent massive I/O spikes on every keystroke
let _persistTimeout = null;
function persistDb() {
    if (_persistTimeout) clearTimeout(_persistTimeout);
    _persistTimeout = setTimeout(_persistDbNow, 1000);
}

// Ensure pending saves are flushed if the user closes the tab
window.addEventListener('beforeunload', () => {
    if (_persistTimeout) {
        clearTimeout(_persistTimeout);
        _persistDbNow();
    }
});

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
    if (!_db) {
        console.warn("[SQLite DB] loadState returned empty object because _db is null");
        return {};
    }
    const username = sessionStorage.getItem("ddia_active_user") || localStorage.getItem("ddia_active_user") || "anonymous";
    try {
        const res = _db.exec("SELECT state_data FROM progress WHERE username = ? AND state_key = ?", [username, stateKey]);
        if (res && res[0] && res[0].values && res[0].values[0]) {
            const parsed = JSON.parse(res[0].values[0][0]);
            const finalState = (parsed && typeof parsed === 'object') ? parsed : {};
            return finalState;
        }
    } catch (e) {
        console.error("[SQLite DB] Failed to load state", e);
    }
    return {};
}

// Save state JSON merging updates into progress table
function saveState(data, stateKey) {
    if (!_db) {
        console.warn("[SQLite DB] saveState aborted because _db is null");
        return;
    }
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
        console.error("[SQLite DB] Failed to save state", e);
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
window.dbLoadState = loadState;
window.dbSaveState = saveState;

// Format and download flashcards as Anki tab-separated text import file
function exportToAnki(flashcards, title) {
    if (!flashcards || flashcards.length === 0) {
        alert("No flashcards found to export.");
        return;
    }
    
    let tsvContent = "";
    flashcards.forEach(card => {
        // Replace inner newlines with HTML <br> tags as expected by Anki
        const front = card.front.replace(/\r?\n/g, "<br>").replace(/\t/g, " ");
        const back = card.back.replace(/\r?\n/g, "<br>").replace(/\t/g, " ");
        tsvContent += `${front}\t${back}\n`;
    });
    
    const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = url;
    
    // Create safe alphanumeric filename from the page title
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAnchor.download = `${safeTitle}_anki_deck.txt`;
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
}
window.exportToAnki = exportToAnki;

// Centralized logout and account switching logic
function logoutUser(redirectUrl, dryRun = false) {
    sessionStorage.removeItem('ddia_active_user');
    localStorage.removeItem('ddia_active_user');
    if (dryRun) return;
    
    if (redirectUrl) {
        window.location.href = redirectUrl;
    } else {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            const display = document.getElementById('activeUserDisplay');
            const btn = document.getElementById('switchAccountBtn');
            const input = document.getElementById('usernameInput');
            if (display) display.style.display = 'none';
            if (btn) btn.style.display = 'none';
            if (input) input.value = '';
        } else {
            window.location.href = 'index.html';
        }
    }
}
window.logoutUser = logoutUser;

// Hamburger Menu Injection
const chaptersInfo = [
  { num: 1, dir: "ch01", title: "Trade-Offs in Data Systems Architecture" },
  { num: 2, dir: "ch02", title: "Defining Nonfunctional Requirements" },
  { num: 3, dir: "ch03", title: "Data Models and Query Languages" },
  { num: 4, dir: "ch04", title: "Storage and Retrieval" },
  { num: 5, dir: "ch05", title: "Encoding and Evolution" },
  { num: 6, dir: "ch06", title: "Replication" },
  { num: 7, dir: "ch07", title: "Sharding" },
  { num: 8, dir: "ch08", title: "Transactions" },
  { num: 9, dir: "ch09", title: "The Trouble with Distributed Systems" },
  { num: 10, dir: "ch10", title: "Consistency and Consensus" },
  { num: 11, dir: "ch11", title: "Batch Processing" },
  { num: 12, dir: "ch12", title: "Stream Processing" },
  { num: 13, dir: "ch13", title: "A Philosophy of Streaming Systems" },
  { num: 14, dir: "ch14", title: "Doing the Right Thing" }
];

function injectHamburgerMenu() {
    // Determine path prefix
    const isSubPage = window.location.pathname.includes('/ch0') || 
                      window.location.pathname.includes('/ch1') || 
                      window.location.pathname.includes('/exams/');
    const prefix = isSubPage ? '../' : './';
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'hamburgerMenuBtn';
    toggleBtn.className = 'hamburger-menu-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = '<span></span><span></span><span></span>';
    
    // Create drawer
    const drawer = document.createElement('div');
    drawer.id = 'navDrawer';
    drawer.className = 'nav-drawer';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'navDrawerOverlay';
    overlay.className = 'nav-drawer-overlay';
    
    // Determine active states
    const currentPath = window.location.pathname;
    const isHome = !isSubPage;
    
    // Build drawer HTML
    let chaptersHtml = '';
    chaptersInfo.forEach(ch => {
        const isActive = currentPath.includes(`/${ch.dir}/`);
        chaptersHtml += `
            <a href="${prefix}${ch.dir}/index.html" class="nav-drawer-link ${isActive ? 'active' : ''}">
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-indigo); margin-right: 0.5rem; min-width: 1.5rem;">CH${ch.num}</span>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ch.title}</span>
            </a>
        `;
    });
    
    // Check if we are on midterm or final
    const isMidterm = window.location.search.includes('type=midterm') || currentPath.includes('midterm');
    const isFinal = window.location.search.includes('type=final') || currentPath.includes('final');

    drawer.innerHTML = `
        <div class="nav-drawer-header">
            <h3>DDIA Study Hub</h3>
        </div>
        <div class="nav-drawer-content">
            <a href="${prefix}index.html" class="nav-drawer-link ${isHome ? 'active' : ''}">
                <span style="margin-right: 0.5rem;">🏠</span> Homepage Dashboard
            </a>
            <div class="nav-drawer-divider">Chapters</div>
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                ${chaptersHtml}
            </div>
            <div class="nav-drawer-divider">Assessments</div>
            <a href="${prefix}exams/index.html?type=midterm" class="nav-drawer-link ${isMidterm ? 'active' : ''}">
                <span style="margin-right: 0.5rem;">⏱️</span> Midterm Exam
            </a>
            <a href="${prefix}exams/index.html?type=final" class="nav-drawer-link ${isFinal ? 'active' : ''}">
                <span style="margin-right: 0.5rem;">🏆</span> Final Exam
            </a>
            <div class="nav-drawer-divider" style="margin-top: 1.5rem;">Session</div>
            <button id="hamburgerSwitchAccountBtn" class="nav-drawer-link" style="background: none; border: none; width: 100%; text-align: left; cursor: pointer; color: var(--text-primary); outline: none;">
                <span style="margin-right: 0.5rem;">👤</span> Switch Account (${getCurrentUsername()})
            </button>
        </div>
    `;
    
    // Append elements to body
    document.body.appendChild(toggleBtn);
    document.body.appendChild(drawer);
    document.body.appendChild(overlay);
    
    // Toggle action
    const toggle = () => {
        const isOpen = toggleBtn.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', isOpen);
        drawer.classList.toggle('open');
        overlay.classList.toggle('open');
    };
    
    toggleBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);

    // Wire up hamburger Switch Account
    const burgerSwitchBtn = document.getElementById('hamburgerSwitchAccountBtn');
    if (burgerSwitchBtn) {
        burgerSwitchBtn.addEventListener('click', () => {
            logoutUser(prefix + 'index.html');
        });
    }

    // Make logo-area clickable to homepage
    const logoArea = document.querySelector('.logo-area');
    if (logoArea) {
        logoArea.style.cursor = 'pointer';
        logoArea.style.transition = 'opacity 0.2s ease';
        logoArea.setAttribute('role', 'link');
        logoArea.setAttribute('tabindex', '0');
        logoArea.setAttribute('aria-label', 'Go to Homepage');
        logoArea.addEventListener('mouseenter', () => logoArea.style.opacity = '0.85');
        logoArea.addEventListener('mouseleave', () => logoArea.style.opacity = '1');
        logoArea.addEventListener('click', () => {
            window.location.href = prefix + 'index.html';
        });
        logoArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = prefix + 'index.html';
            }
        });
    }
}

// Run injection when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHamburgerMenu);
} else {
    injectHamburgerMenu();
}
