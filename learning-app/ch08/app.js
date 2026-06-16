/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   Chapter 8: Transactions
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "Why were transactions originally created in database systems?",
    options: [
      "To allow databases to run on multiple hardware nodes in a cluster",
      "To simplify the programming model for applications by grouping multiple operations into a single safety guarantee",
      "To compress data and reduce disk storage requirements",
      "To automatically encrypt all sensitive customer data at rest"
    ],
    correct: 1,
    explanation: "Transactions are safety guarantees that allow applications to ignore certain error scenarios and concurrency issues, making the application code much simpler.",
    section: "What Exactly Is a Transaction?"
  },
  {
    type: "mc",
    q: "In the acronym ACID, what is the primary role of Atomicity?",
    options: [
      "To prevent other clients from seeing half-finished results of a concurrent transaction",
      "To ensure that data is written to disk using the fsync system call",
      "To allow a transaction to be aborted on error, discarding all its writes so the application can safely retry",
      "To ensure that the database invariants and schema constraints are never violated"
    ],
    correct: 2,
    explanation: "ACID atomicity is about abortability. It guarantees that if a fault occurs during a transaction, all writes are discarded, preventing partial failures.",
    section: "The Meaning of ACID: Atomicity"
  },
  {
    type: "write",
    q: "Explain the difference between how the term 'atomic' is used in multi-threaded programming versus how it is defined in ACID transactions.",
    hint: "Think about what happens when two threads access a shared variable concurrently versus what happens when a database transaction fails halfway through.",
    modelAnswer: "In multi-threaded programming, an atomic operation is one where another thread cannot see a half-finished state — it is about concurrency control. In ACID transactions, atomicity is not about concurrency (which is isolation); rather, it describes abortability. It guarantees that if a transaction fails mid-way, all of its writes are discarded and rolled back, so that the database does not end up in a partially updated state.",
    section: "The Meaning of ACID: Atomicity"
  },
  {
    type: "mc",
    q: "Who is primarily responsible for ensuring Consistency (the 'C' in ACID) in a database system?",
    options: [
      "The hardware storage controller via RAID replication",
      "The operating system's filesystem integrity check",
      "The database engine's query optimizer",
      "The application developer, by correctly defining transactions that preserve business invariants"
    ],
    correct: 3,
    explanation: "Unlike A, I, and D, consistency is mostly a property of the application. The database can enforce simple constraints (like foreign keys), but complex business rules must be managed by application code.",
    section: "The Meaning of ACID: Consistency"
  },
  {
    type: "mc",
    q: "Under the Read Committed isolation level, what does a 'dirty read' refer to?",
    options: [
      "Reading data that has been deleted from the disk but remains in memory",
      "A client reading data that has been written by another transaction but has not yet committed",
      "A client reading data that was corrupted during a network transmission",
      "Reading data that does not match the schema constraints of the table"
    ],
    correct: 1,
    explanation: "A dirty read occurs when a transaction sees uncommitted data from another transaction. Read Committed prevents this by only showing committed changes.",
    section: "Weak Isolation Levels: Read Committed"
  },
  {
    type: "write",
    q: "How do databases implement Read Committed isolation to prevent dirty reads and dirty writes without letting read queries block write queries?",
    hint: "Think about row locks for writes and keeping old values for reads.",
    modelAnswer: "To prevent dirty writes, databases use row-level locks; a transaction must acquire a lock on a row before writing to it. To prevent dirty reads without letting reads block writes, most databases do not use locks for reads. Instead, they remember the old committed value of a row while a write transaction holds a lock. Any concurrent read query is simply served this old committed value until the write transaction commits.",
    section: "Weak Isolation Levels: Read Committed"
  },
  {
    type: "mc",
    q: "What is 'read skew' (non-repeatable read), and which isolation level is typically introduced to solve it?",
    options: [
      "A writer overwriting another writer's uncommitted data; solved by Read Committed",
      "A client seeing different parts of the database at different points in time during a single transaction; solved by Snapshot Isolation",
      "A reader blocking a writer indefinitely; solved by Two-Phase Locking",
      "A transaction failing to abort after a crash; solved by Write-Ahead Logging"
    ],
    correct: 1,
    explanation: "Read skew occurs when a transaction reads two related records but one is updated in between. Snapshot Isolation solves this by giving the transaction a consistent snapshot of the database at a single point in time.",
    section: "Weak Isolation Levels: Snapshot Isolation"
  },
  {
    type: "write",
    q: "Explain the conceptual difference between a 'lost update' and 'write skew'. How does the nature of the data being written differ?",
    hint: "In a lost update, are they writing to the same database row? In write skew, is there a shared constraint over multiple rows?",
    modelAnswer: "A lost update occurs when two concurrent transactions read the same row, modify it, and write it back, causing one of the updates to overwrite the other (occurring on a single row). Write skew is a generalization of the lost update problem where transactions read the same records but update different records, violating a cross-row invariant (such as ensuring at least one doctor remains on call). Write skew involves a race condition where the action of one transaction invalidates the premise of another transaction's write.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "mc",
    q: "Which of the following is NOT a valid method for preventing lost updates in concurrent databases?",
    options: [
      "Using atomic write operations provided by the database (e.g., UPDATE counter = counter + 1)",
      "Explicitly locking rows using SELECT ... FOR UPDATE",
      "Increasing the size of the database connection pool",
      "Using compare-and-set operations where the update succeeds only if the value hasn't changed since it was read"
    ],
    correct: 2,
    explanation: "Increasing connection pool size does not prevent concurrency issues; it actually allows more concurrent transactions, potentially exacerbating race conditions.",
    section: "Weak Isolation Levels: Preventing Lost Updates"
  },
  {
    type: "mc",
    q: "Which of the following scenarios is a classic example of write skew?",
    options: [
      "Two users concurrently booking the exact same seat on a flight, resulting in a double-booking",
      "Two doctors on call simultaneously trying to check out of their shift, leaving zero doctors on call when the rule requires at least one",
      "A user reading their account balance twice and getting different amounts because a transfer committed in between",
      "A billing process scanning a table to calculate monthly revenue while new invoices are being added"
    ],
    correct: 1,
    explanation: "Write skew occurs when two transactions read a condition, make a decision, and write to different rows, invalidating the condition. Both doctors see that two are on call, so both check out, leaving none.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "write",
    q: "In a system running Snapshot Isolation, why does the 'doctor checkout' write skew occur, and how would you resolve it using application-level locks?",
    hint: "Think about SELECT ... FOR UPDATE and how it forces transactions to wait.",
    modelAnswer: "Under Snapshot Isolation, write skew occurs because both transactions run on independent, consistent snapshots. Since they update different rows (Doctor A's status vs Doctor B's status), the database does not detect a write conflict. To resolve this, the developer can use explicit locking by querying the on-call doctors list using 'SELECT ... FOR UPDATE'. This forces the database to lock all returned rows, meaning the second transaction must wait until the first commits, exposing the updated state and preventing double checkout.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "mc",
    q: "What is a 'phantom' in database concurrency?",
    options: [
      "A row that is deleted by a transaction that subsequently aborts",
      "A write that is made to a replica but is lost due to replica lag",
      "A write in one transaction that changes the result of a search query in another concurrent transaction",
      "A transaction coordinator that crashes and is forgotten by the system"
    ],
    correct: 2,
    explanation: "A phantom occurs when a write in one transaction changes the set of rows returned by a search query in another transaction. It is a key cause of write skew.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "mc",
    q: "What is the key difference between Two-Phase Locking (2PL) and Two-Phase Commit (2PC)?",
    options: [
      "2PL is used for database replication, while 2PC is used for query optimization",
      "2PL is a concurrency control mechanism providing serializability; 2PC is an atomic commit protocol for distributed nodes",
      "2PL is only supported by NoSQL databases, while 2PC is exclusive to SQL databases",
      "2PL requires locks to be held for exactly two seconds; 2PC requires two coordinators"
    ],
    correct: 1,
    explanation: "Do not confuse them! Two-Phase Locking (2PL) ensures serializability by blocking writers when readers are active and vice versa. Two-Phase Commit (2PC) ensures atomicity across distributed nodes.",
    section: "Serializability: Two-Phase Locking"
  },
  {
    type: "write",
    q: "Explain under what conditions 'Actual Serial Execution' (running transactions single-threaded on a single CPU core) is a viable and highly performant way to implement serializability.",
    hint: "Think about RAM size, transaction execution speed, and whether interactive network round-trips are allowed within a transaction.",
    modelAnswer: "Actual Serial Execution is viable if all data can fit in memory (RAM) and transactions are written as short, stored procedures without any interactive network I/O. Because memory access is fast and there are no network round-trips mid-transaction, a single-threaded CPU can execute thousands of transactions per second. This completely eliminates locking overhead, deadlocks, and coordination, but is limited by single-core CPU scaling and RAM capacity.",
    section: "Serializability: Actual Serial Execution"
  },
  {
    type: "mc",
    q: "How does Two-Phase Locking (2PL) handle reader-writer concurrency compared to Snapshot Isolation?",
    options: [
      "In 2PL, readers and writers never block each other",
      "In 2PL, writers block readers, and readers block writers, completely preventing concurrency",
      "In 2PL, readers block writers, and writers block readers, providing strict serializability at the cost of performance",
      "In 2PL, locks are only acquired when a transaction commits"
    ],
    correct: 2,
    explanation: "Unlike snapshot isolation where readers never block writers and writers never block readers, 2PL enforces mutual exclusion: readers block writers, and writers block readers.",
    section: "Serializability: Two-Phase Locking"
  },
  {
    type: "mc",
    q: "Serializable Snapshot Isolation (SSI) is described as an optimistic concurrency control mechanism. What does 'optimistic' mean in this context?",
    options: [
      "It assumes that network partitions will never happen",
      "It allows transactions to proceed without locks, and only aborts them at commit time if a serialization conflict is detected",
      "It assumes that the user will retry failed transactions manually",
      "It only writes transactions to disk once a day to optimize performance"
    ],
    correct: 1,
    explanation: "SSI does not block concurrent transactions. Instead, it lets them run. When a transaction tries to commit, the database checks if any race conditions occurred, aborting and retrying it if so.",
    section: "Serializability: Serializable Snapshot Isolation"
  },
  {
    type: "write",
    q: "How does Serializable Snapshot Isolation (SSI) detect that a write skew conflict has occurred without using locks?",
    hint: "Think about tracking read premises: uncommitted writes and writes that happen after reads.",
    modelAnswer: "SSI detects serialization conflicts by tracking when a transaction reads data that is subsequently modified by another transaction, or when a transaction's write is based on an outdated read premise. It does this by monitoring: 1) reads of uncommitted writes (detecting when a transaction reads a row that has a pending write from another transaction) and 2) writes that affect prior reads (detecting when a transaction writes to a row or index range that another active transaction has already read). If a conflict is confirmed at commit time, the transaction is aborted. However, a significant operational trade-off of SSI is that under high write contention, transactions can suffer from high abort rates (starvation), requiring the application layer to implement robust retry logic.",
    section: "Serializability: Serializable Snapshot Isolation"
  },
  {
    type: "mc",
    q: "What is the primary problem that the Two-Phase Commit (2PC) protocol solves in a distributed system?",
    options: [
      "It ensures that database replica nodes are updated in the exact same chronological order",
      "It ensures transaction atomicity across multiple database nodes — either all nodes commit, or all nodes abort",
      "It speeds up write queries by parallelizing disk I/O operations",
      "It automatically detects network partitions and reroutes traffic"
    ],
    correct: 1,
    explanation: "2PC is designed to guarantee distributed atomicity. It ensures that a transaction spanning multiple database shards or heterogeneous databases commits on all nodes or aborts on all nodes.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "mc",
    q: "What happens during Phase 1 (Prepare phase) of a Two-Phase Commit?",
    options: [
      "The coordinator writes the transaction data directly to its own log and commits",
      "The coordinator sends a prepare request to participants, who check for conflicts, write undo/redo logs to disk, and vote 'Yes' or 'No'",
      "Participants commit their local transactions and report the results to the coordinator",
      "The application client validates its connection to the database replicas"
    ],
    correct: 1,
    explanation: "In Phase 1, the coordinator asks participants if they can commit. Each participant must perform safety checks and write data to disk before voting 'Yes' to guarantee they can commit in Phase 2.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "write",
    q: "Explain what when a participant in a 2PC protocol enters the 'in-doubt' or 'uncertain' state, and why this is a major architectural problem.",
    hint: "Think about the participant voting Yes, the coordinator crashing, and whether the participant can unilaterally abort or commit.",
    modelAnswer: "A participant enters the 'in-doubt' state when it has voted 'Yes' in Phase 1 but the coordinator crashes or is disconnected before sending the Phase 2 commit or abort decision. In this state, the participant cannot unilaterally commit (because another participant might have voted No and aborted) and cannot unilaterally abort (because the coordinator might have decided to commit). The participant must block and hold all locks indefinitely until the coordinator recovers, causing resource starvation and blocking other queries.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "mc",
    q: "What is an XA transaction?",
    options: [
      "A transaction that uses XML for data serialization",
      "A high-performance transaction protocol that does not require disk writes",
      "A standard specification for distributed transactions across heterogeneous systems (e.g., a database and a message broker)",
      "An internal transaction mechanism used only by Microsoft SQL Server"
    ],
    correct: 2,
    explanation: "XA (eXtended Architecture) is a standard for 2PC across heterogeneous technologies, allowing databases, message queues, and cache servers to participate in a single atomic transaction.",
    section: "Distributed Transactions: Distributed Transactions Across Different Systems"
  },
  {
    type: "write",
    q: "Compare database-internal distributed transactions with heterogeneous/XA distributed transactions. Which is generally more performant and why?",
    hint: "Think about protocol optimizations, vendor control, and standard serialization APIs.",
    modelAnswer: "Database-internal distributed transactions are managed within a single database system (e.g., Spanner, CockroachDB) and are highly optimized, utilizing custom consensus protocols, shared data formats, and internal optimizations. Furthermore, the failure domain is contained inside a single system rather than spanning multiple independently operated products, which simplifies operations, debugging, and recovery. Heterogeneous/XA transactions span different technologies (e.g., PostgreSQL, ActiveMQ) and must use standard, generic APIs (like JTA). XA transactions are significantly slower because they cannot optimize internal details, suffer from high network coordination overhead, and are prone to blocking due to coordinator crash sensitivity.",
    section: "Distributed Transactions: Database-Internal Distributed Transactions"
  },
  {
    type: "mc",
    q: "How can Two-Phase Commit be used to achieve 'exactly-once' message processing?",
    options: [
      "By deleting the message from the queue before processing it",
      "By committing the message consumption and the database write together in a single atomic transaction",
      "By running the message queue and the database on the same physical machine",
      "By preventing duplicate messages at the client level using cookie IDs"
    ],
    correct: 1,
    explanation: "To achieve exactly-once processing, the step of consuming a message from a queue (e.g., JMS) and the step of writing to the database must succeed or fail together, which can be coordinated via a 2PC transaction.",
    section: "Distributed Transactions: Exactly-Once Message Processing Revisited"
  },
  {
    type: "mc",
    q: "In modern distributed databases, how has the definition of 'durability' evolved?",
    options: [
      "It now means storing data exclusively in-memory on multiple fast nodes",
      "It has shifted from writing to a single local disk to replicating data across a quorum of independent nodes",
      "It means encrypting data so it cannot be read after a breach",
      "It refers to the speed at which a crashed database can be rebooted"
    ],
    correct: 1,
    explanation: "Historically, durability meant writing to tape or a local disk (using fsync). In replicated distributed systems, it refers to copying data to multiple nodes to tolerate single-machine failures.",
    section: "The Meaning of ACID: Durability"
  },
  {
    type: "write",
    q: "Why do many modern software engineers and distributed systems architects avoid Two-Phase Commit (2PC) in high-throughput applications?",
    hint: "Think about locking durations, network round-trips, coordinator crash blocking, and availability.",
    modelAnswer: "Engineers avoid 2PC because it introduces substantial latency overhead due to multiple network round-trips (prepare, vote, commit) and disk fsyncs. More critically, 2PC is a blocking protocol: if the coordinator crashes during Phase 2, participants must hold row locks indefinitely. This reduces availability (violating CAP theorem principles) and can cause cascading failures across the system as locks pile up, bottlenecking overall transaction throughput.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "mc",
    q: "What is a potential pitfall of using 'compare-and-set' (optimistic lock) operations to prevent lost updates?",
    options: [
      "They always require a database-level lock to be held during the entire read-modify-write cycle",
      "If the database serves reads from an outdated replica, the compare condition may check old data, failing to prevent the lost update",
      "Compare-and-set operations can only be used with numeric data types",
      "They are not supported by any relational databases"
    ],
    correct: 1,
    explanation: "If a compare-and-set query reads from a stale read replica or if the database checks the condition against a stale snapshot, it might think the value hasn't changed when it actually has, letting the update succeed incorrectly. As discussed in Chapter 6 (Replication), relying on stale replicas without read-your-writes or monotonic read guarantees will break compare-and-set correctness unless the read is forced to the leader.",
    section: "Weak Isolation Levels: Preventing Lost Updates"
  },
  {
    type: "mc",
    q: "What is the primary difference between Snapshot Isolation and Repeatable Read isolation levels?",
    options: [
      "They are identical in theory, but different vendors use different names (e.g., PostgreSQL calls its snapshot isolation 'repeatable read')",
      "Snapshot isolation allows dirty reads, whereas repeatable read does not",
      "Repeatable read uses pessimistic locks, whereas snapshot isolation is always single-threaded",
      "Snapshot isolation is only used for analytical (OLAP) databases"
    ],
    correct: 0,
    explanation: "The SQL standard for Repeatable Read was defined before snapshot isolation existed. In practice, many databases (like PostgreSQL and MySQL) implement Snapshot Isolation but call it 'Repeatable Read' to satisfy SQL-92 compatibility.",
    section: "Weak Isolation Levels: Snapshot Isolation"
  },
  {
    type: "write",
    q: "Describe a scenario where 'read skew' (non-repeatable read) causes a confusing, temporary bug for a user, even if the database is eventually consistent.",
    hint: "Think about backing up a database or transferring money between two accounts and reading them.",
    modelAnswer: "A classic scenario is transferring $100 from Account A to Account B. Suppose Account A has $500 and Account B has $500. A transaction transfers $100. Concurrently, a user views their account balances. Under Read Committed, if they read Account B ($500), then the transfer commits, then they read Account A ($400), they will see a total of $900 ($500 + $400), making it look like $100 vanished. Although subsequent refreshes will show the correct $1000 total, this temporary inconsistency is a read skew bug.",
    section: "Weak Isolation Levels: Snapshot Isolation"
  },
  {
    type: "write",
    q: "Explain what 'single-object' transaction support means in document databases, and how it differs from the traditional ACID multi-object transactions.",
    hint: "Think about atomicity and isolation guarantees for single documents versus operations across multiple collections or tables.",
    modelAnswer: "Single-object transactions guarantee atomicity and isolation for operations on a single key or document (e.g., updating a nested array in a document). Traditional ACID transactions, however, support multi-object operations, meaning multiple reads and writes across different rows, documents, or tables can be grouped together. If any operation fails, all are discarded. Single-object support is insufficient when changes to multiple independent entities must succeed or fail as a single atomic unit.",
    section: "What Exactly Is a Transaction?"
  },
  {
    type: "write",
    q: "Argue both sides of this statement: 'Distributed transactions via Two-Phase Commit (2PC) are a critical tool that programmers should utilize, rather than writing complex compensation logic in application code.'",
    hint: "For: developer productivity, correctness guarantees, and simplicity. Against: locking, performance bottlenecks, coordinator availability, and scalability.",
    modelAnswer: "On the pro side, utilizing 2PC ensures strong consistency and atomicity out-of-the-box, saving developers from writing, testing, and debugging complex compensation code (like Sagas or outbox patterns) which are highly error-prone. This improves developer velocity and prevents data integrity issues (like the Horizon Post Office scandal). On the con side, 2PC is a performance bottleneck due to blocking locks and network round-trips, and it introduces coordinator availability risks. For high-scale, high-availability microservices, 2PC can lead to cascading outages, making eventual consistency and saga patterns preferable despite the added code complexity.",
    section: "Distributed Transactions: Distributed Transactions Across Different Systems"
  }
];

const FLASHCARDS = [
  { front: "What does 'Atomicity' mean in the context of ACID?", back: "It guarantees abortability: if any part of a transaction fails, the entire transaction is rolled back, leaving the database unchanged." },
  { front: "How does the 'C' (Consistency) in ACID differ from the other letters?", back: "Consistency is an application-specific property (preserving business rules/invariants) rather than a pure database-enforced property." },
  { front: "What is a 'dirty read' and how is it prevented?", back: "A dirty read occurs when a transaction reads uncommitted writes from another transaction. It is prevented by the Read Committed isolation level." },
  { front: "What is a 'dirty write' and how is it prevented?", back: "A dirty write occurs when a transaction overwrites another transaction's uncommitted write. It is prevented by row-level locks on written rows." },
  { front: "What is 'read skew' (non-repeatable read)?", back: "A race condition where a transaction reads different values for the same row at different times because a concurrent transaction committed changes in between." },
  { front: "What is Snapshot Isolation and what mechanism does it rely on?", back: "An isolation level where each transaction reads from a consistent snapshot of the database. It is implemented using Multi-Version Concurrency Control (MVCC)." },
  { front: "What is 'write skew'?", back: "A race condition where two transactions read the same records, make a decision, and update different records, violating a cross-row invariant." },
  { front: "What is a 'phantom read'?", back: "A race condition where a transaction's query returns a set of rows, and a concurrent write by another transaction alters the rows returned by that query." },
  { front: "What is the difference between Two-Phase Locking (2PL) and Two-Phase Commit (2PC)?", back: "2PL is a concurrency control mechanism for serializability. 2PC is an atomic commit protocol for distributed transactions across multiple nodes." },
  { front: "What is a 'predicate lock' in 2PL?", back: "A lock that applies to all objects matching a search condition, rather than a specific row, used to prevent phantoms." },
  { front: "What is Serializable Snapshot Isolation (SSI)?", back: "An optimistic concurrency control mechanism that provides serializability by executing transactions without locks and aborting them at commit if conflicts are detected." },
  { front: "Why is Two-Phase Commit (2PC) a blocking protocol?", back: "If the coordinator crashes after participants vote 'Yes' but before committing, participants enter an 'in-doubt' state, holding locks indefinitely." },
  { front: "What is the purpose of the 'commit point' in Two-Phase Commit?", back: "It is the moment the coordinator writes its commit decision to its disk log. Once this is written, the decision is irrevocable and must be retried until it succeeds." }
];

const CONFIDENCE_LABELS = [
  "ACID definition vs. reality",
  "Weak isolation levels & race conditions",
  "Lost updates, write skew & phantoms",
  "Serializability (Serial, 2PL, SSI)",
  "Two-Phase Commit (2PC) mechanics",
  "Distributed & XA transactions"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 8: Transactions", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 13 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Draw the transaction hierarchy table from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach concepts to someone (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! Atomicity in ACID is about abortability — the ability to discard all writes of a failed transaction. Concurrency control is handled by Isolation (I).",
    true: "Not quite! In multi-threaded programming, 'atomic' means concurrency control, but in ACID transactions, it strictly refers to abortability.",
    unsure: "A common mix-up! In databases, Atomicity means that if something fails mid-transaction, everything is discarded and rolled back."
  },
  m2: {
    false: "Correct! Traditional Repeatable Read prevents read skew (non-repeatable reads), but still allows phantom reads (new rows inserted by concurrent queries).",
    true: "Actually, no. In the SQL standard, Repeatable Read is allowed to experience phantoms. Strict serializability is required to prevent them.",
    unsure: "It's tricky because database implementations (like PostgreSQL) sometimes prevent phantoms under Repeatable Read, but standard definition does not."
  },
  m3: {
    false: "Correct! They are completely different. Two-Phase Locking (2PL) is a locking concurrency control mechanism. Two-Phase Commit (2PC) is an atomic distributed commit protocol.",
    true: "Be careful! Although they sound similar, 2PL is for concurrency control within a DB, while 2PC is for committing across multiple distributed databases.",
    unsure: "Very common source of confusion! Pay special attention to the '2PL is not 2PC' section in the chapter."
  },
  m4: {
    false: "Correct! Once a participant votes 'Yes', it promises it will commit. It must write all data to disk first to ensure that no disk/resource issue can block it.",
    true: "Nope! Voting 'Yes' is an irrevocable promise. The participant surrenders its right to abort and must commit if told to do so.",
    unsure: "This is a key part of 2PC's safety. Look for the 'System of Promises' section as you read."
  },
  m5: {
    false: "Correct! Serializability prevents concurrency bugs between transactions, but application logic errors or failing to handle retry-on-abort must still be managed in code.",
    true: "Even with Serializability, application-level logical bugs can still occur, and developers must explicitly handle transactions that abort and require retry.",
    unsure: "Serializability is powerful, but it's not a silver bullet. The application still has work to do, particularly handling retries."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch8_transactions_learning';
let _state = null;

function loadState() {
  if (!_state) {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) _state = JSON.parse(raw);
    } catch (e) {}

    if (!_state) {
      try {
        if (window.parent && window.parent.__ddiaState && window.parent.__ddiaState[STATE_KEY]) {
          _state = window.parent.__ddiaState[STATE_KEY];
        }
      } catch (e) {}
    }

    if (!_state) _state = {};
  }
  // Return a snapshot, not the live object
  return JSON.parse(JSON.stringify(_state));
}

function saveState(data) {
  if (!_state) loadState();
  // Clone incoming data and merge to avoid reference aliasing
  _state = { ..._state, ...JSON.parse(JSON.stringify(data)) };

  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(_state));
  } catch (e) {}

  try {
    window.parent.__ddiaState = window.parent.__ddiaState || {};
    window.parent.__ddiaState[STATE_KEY] = _state;
  } catch (e) {}
}

// ── Navigation ──────────────────────────────────────

function switchPhase(phase) {
  document.querySelectorAll('.phase-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`phase-${phase}`).classList.add('active');
  document.getElementById(`nav-${phase}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPhase(btn.dataset.phase));
});

// ── Pre-Activity: Diagnostic ────────────────────────

document.getElementById('saveDiagnostic').addEventListener('click', () => {
  const values = [];
  for (let i = 1; i <= 6; i++) {
    values.push(parseInt(document.getElementById(`conf-${i}`).value));
  }
  saveState({ diagnosticBaseline: values, diagnosticDate: new Date().toISOString() });
  document.getElementById('diagnosticSaved').classList.remove('hidden');
  renderConfidenceComparison();
});

// ── Pre-Activity: Puzzle ────────────────────────────

document.getElementById('savePuzzle').addEventListener('click', () => {
  const answers = {};
  for (let i = 1; i <= 3; i++) {
    answers[`q${i}`] = document.getElementById(`puzzle-a${i}`).value;
  }
  saveState({ puzzleAnswers: answers });
  document.getElementById('puzzleSaved').classList.remove('hidden');
  renderRevisitPredictions();
});

// ── Pre-Activity: Misconceptions ────────────────────

document.querySelectorAll('.misconception-item').forEach(item => {
  const btns = item.querySelectorAll('.mc-btn');
  const feedbackEl = item.querySelector('.misconception-feedback');
  const correct = item.dataset.correct;
  const id = item.dataset.id;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      const value = btn.dataset.value;
      const explanations = MISCONCEPTION_EXPLANATIONS[id];
      feedbackEl.textContent = explanations[value];
      feedbackEl.className = 'misconception-feedback';
      if (value === correct || value === 'unsure') {
        feedbackEl.classList.add(value === correct ? 'correct' : 'noted');
      } else {
        feedbackEl.classList.add('noted');
      }
      feedbackEl.classList.remove('hidden');
    });
  });
});

// ── Post-Activity: Timer ────────────────────────────

let timerInterval = null;
let timerRunning = false;

document.getElementById('timerBtn').addEventListener('click', function() {
  // Step 1: Immediately disable the button to block double-clicks
  this.disabled = true;

  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    this.textContent = 'Start 5-min Timer';
    this.disabled = false; // Step 2: Re-enable after stopping
    return;
  }

  timerRunning = true;
  this.textContent = 'Pause';
  this.disabled = false; // Step 3: Re-enable once state is set
  let remaining = 300;
  const total = 300;
  const display = document.getElementById('timerDisplay');
  const progress = document.getElementById('timerProgress');

  timerInterval = setInterval(() => {
    remaining--;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    progress.style.width = `${((total - remaining) / total) * 100}%`;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      display.textContent = "0:00";
      document.getElementById('timerBtn').textContent = 'Done!';
      display.style.color = '#f43f5e';
    }
  }, 1000);
});

// ── Post-Activity: Brain Dump ───────────────────────

document.getElementById('saveBrainDump').addEventListener('click', () => {
  saveState({ brainDump: document.getElementById('brainDumpArea').value });
  document.getElementById('brainDumpSaved').classList.remove('hidden');
});

// ── Post-Activity: Quiz ─────────────────────────────

let currentFilter = 'all';

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  container.innerHTML = '';
  
  const state = loadState();
  const selections = state.quizSelections || {};
  const writeIns = state.writeInAnswers || {};
  const graded = state.quizGraded || false;

  let renderedCount = 0;

  QUIZ_QUESTIONS.forEach((q, idx) => {
    // Apply filters
    const isMc = q.type === 'mc';
    const hasSelection = selections[idx] !== undefined;
    const hasWriteIn = writeIns[idx] && writeIns[idx].trim().length > 0;
    const isAnswered = isMc ? hasSelection : hasWriteIn;

    if (currentFilter === 'mc' && !isMc) return;
    if (currentFilter === 'write' && isMc) return;
    if (currentFilter === 'unanswered' && isAnswered) return;

    renderedCount++;

    const div = document.createElement('div');
    div.className = `quiz-question ${isMc ? 'type-mc' : 'type-write'}`;
    div.setAttribute('data-q-index', idx);
    div.dataset.qIndex = idx;

    if (isMc) {
      // Multiple Choice Question
      const selectedOptionIdx = selections[idx];
      const isCorrect = selectedOptionIdx === q.correct;

      div.innerHTML = `
        <div class="quiz-q-text">
          <span class="quiz-q-num">${idx + 1}</span>
          <span>${q.q}</span>
          <span class="badge-tag" style="margin-left:auto; font-size:0.65rem; color:var(--accent-indigo); border:1px solid rgba(99,102,241,0.2); padding:0.1rem 0.3rem; border-radius:3px;">${q.section}</span>
        </div>
        <div class="quiz-options">
          ${q.options.map((opt, oi) => {
            let extraClass = '';
            let markerText = '';
            
            if (graded) {
              if (oi === q.correct) {
                extraClass = 'correct-answer';
                markerText = '✓';
              } else if (oi === selectedOptionIdx && !isCorrect) {
                extraClass = 'wrong-answer';
                markerText = '✗';
              }
            } else {
              if (oi === selectedOptionIdx) {
                extraClass = 'selected';
              }
            }

            return `
              <button class="quiz-option ${extraClass}" data-q="${idx}" data-o="${oi}" ${graded ? 'disabled' : ''}>
                <span class="quiz-option-marker">${markerText}</span>
                <span>${opt}</span>
              </button>
            `;
          }).join('')}
        </div>
      `;

      // If graded, append explanation
      if (graded) {
        div.classList.add(isCorrect ? 'answered-correct' : 'answered-wrong');
        const explDiv = document.createElement('div');
        explDiv.className = 'quiz-explanation';
        explDiv.textContent = q.explanation;
        div.appendChild(explDiv);
      }
    } else {
      // Write-In Question
      const savedText = writeIns[idx] || '';
      div.innerHTML = `
        <div class="quiz-q-text">
          <span class="quiz-q-num">${idx + 1}</span>
          <span>${q.q}</span>
          <span class="badge-tag" style="margin-left:auto; font-size:0.65rem; color:var(--accent-cyan); border:1px solid rgba(6,182,212,0.2); padding:0.1rem 0.3rem; border-radius:3px;">${q.section}</span>
        </div>
        <div class="quiz-writein-container">
          <div class="elab-hint">Hint: ${q.hint}</div>
          <textarea class="quiz-writein-textarea" data-q="${idx}" placeholder="Write your conceptual answer here (saved automatically)..." ${graded ? 'disabled' : ''}>${savedText}</textarea>
          ${graded ? `<div class="quiz-writein-feedback">✓ Response recorded & locked. Ready for LLM grading.</div>` : ''}
        </div>
      `;
    }

    container.appendChild(div);
  });

  if (renderedCount === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-filter-msg';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.padding = '2rem';
    emptyMsg.style.color = 'var(--text-muted)';
    emptyMsg.style.fontSize = '0.9rem';
    emptyMsg.textContent = 'No questions match the current filter.';
    container.appendChild(emptyMsg);
  }

  // Update progress info
  updateQuizProgress();

  // Add click handlers for MC options
  if (!graded) {
    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', function() {
        const qIndex = parseInt(this.dataset.q);
        const oIndex = parseInt(this.dataset.o);
        
        // Remove selection from siblings
        container.querySelectorAll(`.quiz-option[data-q="${qIndex}"]`).forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        // Save selection to state
        const state = loadState();
        const selections = state.quizSelections || {};
        selections[qIndex] = oIndex;
        saveState({ quizSelections: selections });

        updateQuizProgress();
      });
    });

    // Add input handlers for write-in textareas
    container.querySelectorAll('.quiz-writein-textarea').forEach(tx => {
      tx.addEventListener('input', function() {
        const qIndex = parseInt(this.dataset.q);
        const val = this.value;

        // Save write-in to state
        const state = loadState();
        const writeIns = state.writeInAnswers || {};
        writeIns[qIndex] = val;
        saveState({ writeInAnswers: writeIns });

        updateQuizProgress();
      });
    });
  }

  // Show results or submit button
  if (graded) {
    showQuizResultsPanel(loadState());
  } else {
    // Render submit row
    const submitRow = document.createElement('div');
    submitRow.className = 'quiz-submit-row';
    submitRow.innerHTML = `<button class="btn-primary" id="submitQuiz">Check Answers</button>`;
    container.appendChild(submitRow);
    document.getElementById('submitQuiz').addEventListener('click', gradeQuiz);
  }
}

function updateQuizProgress() {
  const state = loadState();
  const selections = state.quizSelections || {};
  const writeIns = state.writeInAnswers || {};

  let answeredCount = 0;
  QUIZ_QUESTIONS.forEach((q, idx) => {
    if (q.type === 'mc') {
      if (selections[idx] !== undefined) answeredCount++;
    } else {
      if (writeIns[idx] && writeIns[idx].trim().length > 0) answeredCount++;
    }
  });

  const total = QUIZ_QUESTIONS.length;
  document.getElementById('quizProgressText').textContent = `${answeredCount} of ${total} answered`;
  document.getElementById('quizProgressFill').style.width = `${(answeredCount / total) * 100}%`;
}

function gradeQuiz() {
  // Save that we have graded
  saveState({ quizGraded: true });

  // Re-render quiz in graded state
  renderQuiz();
}

function showQuizResultsPanel(state) {
  const selections = state.quizSelections || {};
  const writeIns = state.writeInAnswers || {};

  let mcCorrect = 0;
  let mcTotal = 0;
  let writeInAnswered = 0;

  QUIZ_QUESTIONS.forEach((q, idx) => {
    if (q.type === 'mc') {
      mcTotal++;
      if (selections[idx] === q.correct) mcCorrect++;
    } else {
      if (writeIns[idx] && writeIns[idx].trim().length > 0) writeInAnswered++;
    }
  });

  // Update elements
  document.getElementById('scoreNum').textContent = mcCorrect;
  document.getElementById('scoreDenom').textContent = `/ ${mcTotal}`;
  document.getElementById('writeinCount').textContent = writeInAnswered;

  const breakdown = document.getElementById('resultsBreakdown');
  const percent = Math.round((mcCorrect / mcTotal) * 100);

  if (percent >= 85) {
    breakdown.innerHTML = `<p style="color: var(--accent-emerald);">🎯 Excellent retrieval! You scored <strong>${percent}%</strong> (${mcCorrect}/${mcTotal}) on Multiple Choice. Focus your remaining review on write-in grading below.</p>`;
  } else if (percent >= 60) {
    breakdown.innerHTML = `<p style="color: var(--accent-amber);">👍 Good job! You scored <strong>${percent}%</strong> (${mcCorrect}/${mcTotal}) on Multiple Choice. Analyze the feedback on questions you missed, and evaluate your write-in answers.</p>`;
  } else {
    breakdown.innerHTML = `<p style="color: var(--accent-rose);">📖 Retrieval gaps detected: <strong>${percent}%</strong> (${mcCorrect}/${mcTotal}) on Multiple Choice. The struggle of recalling makes re-reading the text highly effective! Use LLM grading below to check your write-in explanations.</p>`;
  }

  document.getElementById('quizResults').classList.remove('hidden');
  
  // Hide submit button just in case
  const submitBtn = document.getElementById('submitQuiz');
  if (submitBtn) submitBtn.style.display = 'none';
}

function setupQuizFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderQuiz();
    });
  });
}

function setupLLMGrading() {
  const modal = document.getElementById('llmModal');
  const gradeBtn = document.getElementById('gradeWriteIns');
  const closeBtn = document.getElementById('closeModal');
  const copyBtn = document.getElementById('copyLlmPrompt');
  const copyFeedback = document.getElementById('copyFeedback');
  const promptArea = document.getElementById('llmPromptArea');

  if (gradeBtn) {
    gradeBtn.addEventListener('click', () => {
      const state = loadState();
      const writeIns = state.writeInAnswers || {};
      
      // Collect answered write-ins
      const answeredList = QUIZ_QUESTIONS.filter((q, idx) => q.type === 'write' && writeIns[idx] && writeIns[idx].trim().length > 0);

      if (answeredList.length === 0) {
        alert('Please answer at least one write-in question before generating the LLM grading prompt!');
        return;
      }

      // Compile prompt
      let prompt = `You are grading a student's responses to Chapter 8 ("Transactions") of Designing Data-Intensive Applications.
For each question, provide:
1. A Score from 1 to 5 (1 = Incorrect/No attempt, 3 = Partially correct/Gaps present, 5 = Excellent/Nuanced understanding).
2. Strengths: What did the student capture accurately?
3. Gaps: What crucial elements, terms, or architectural trade-offs did they miss?
4. Model Comparison: Explain why the model answer is complete and how they can bridge any gaps.

---
`;

      QUIZ_QUESTIONS.forEach((q, idx) => {
        if (q.type === 'write') {
          const studentAns = writeIns[idx] || '';
          if (studentAns.trim().length > 0) {
            prompt += `
QUESTION #${idx + 1}: ${q.q}
RUBRIC/MODEL ANSWER: ${q.modelAnswer}
STUDENT'S RESPONSE: "${studentAns}"
--------------------------------------------------
`;
          }
        }
      });

      prompt += `
After grading all questions, provide:
- Overall conceptual score (e.g., "82% - Solid Conceptual Foundation")
- Top 2 strengths across their responses
- Top 2 areas for conceptual improvement
- A custom 1-2 sentence recommendation on which specific sub-sections of Chapter 8 (e.g. Read Committed, Snapshot Isolation, Preventing Lost Updates, Write Skew & Phantoms, Two-Phase Commit (2PC), or Serializability) they should review.`;

      promptArea.value = prompt;
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Close modal on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      promptArea.select();
      navigator.clipboard.writeText(promptArea.value)
        .then(() => {
          copyFeedback.classList.remove('hidden');
          setTimeout(() => {
            copyFeedback.classList.add('hidden');
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          alert('Could not auto-copy. Please select all text and copy manually.');
        });
    });
  }
}

document.getElementById('retakeQuiz')?.addEventListener('click', () => {
  saveState({ quizGraded: false, quizSelections: {}, writeInAnswers: {} });
  document.getElementById('quizResults').classList.add('hidden');
  renderQuiz();
});

// ── Post-Activity: Revisit ──────────────────────────

function renderRevisitPredictions() {
  const state = loadState();
  if (state.puzzleAnswers && state.puzzleAnswers.q1) {
    document.getElementById('revisit-puzzle-1').textContent = state.puzzleAnswers.q1 || '(No answer recorded)';
  }
}

function renderConfidenceComparison() {
  const state = loadState();
  const container = document.getElementById('confidenceComparison');
  if (!container) return;
  container.innerHTML = '';

  const baseline = state.diagnosticBaseline || [3, 3, 3, 3, 3, 3];
  const levelLabels = ['—', 'No clue', 'Vaguely', 'Somewhat', 'Well', 'Could teach'];

  CONFIDENCE_LABELS.forEach((label, i) => {
    const div = document.createElement('div');
    div.className = 'conf-compare-item';
    div.innerHTML = `
      <span class="conf-compare-label">${label}</span>
      <span class="conf-compare-before">Before: ${levelLabels[baseline[i]]}</span>
      <div class="conf-compare-after">
        <span>Now:</span>
        <select data-conf-idx="${i}">
          <option value="1">No clue</option>
          <option value="2">Vaguely</option>
          <option value="3" selected>Somewhat</option>
          <option value="4">Well</option>
          <option value="5">Could teach</option>
        </select>
      </div>
    `;
    container.appendChild(div);
  });
}

document.getElementById('saveRevisit').addEventListener('click', () => {
  saveState({
    revisitAnswer: document.getElementById('revisit-a1').value,
    revisitDate: new Date().toISOString()
  });
  document.getElementById('revisitSaved').classList.remove('hidden');
});

// ── Sustained: Schedule ─────────────────────────────

function renderSchedule() {
  const container = document.getElementById('scheduleGrid');
  const state = loadState();
  const completed = state.scheduleCompleted || {};

  container.innerHTML = '';

  SCHEDULE_ITEMS.forEach((item, idx) => {
    const isCompleted = completed[idx];
    const isToday = item.type === 'due';
    const div = document.createElement('div');
    div.className = `schedule-item ${isCompleted ? 'completed' : ''} ${isToday && !isCompleted ? 'today' : ''} ${!isToday && !isCompleted ? 'future' : ''}`;
    div.innerHTML = `
      <span class="schedule-day">${item.day}</span>
      <span class="schedule-task">${item.task}</span>
      <span class="schedule-status ${isCompleted ? 'done' : isToday ? 'due' : 'upcoming'}">
        ${isCompleted ? '✓ Completed' : isToday ? '● Due now' : '○ Upcoming'}
      </span>
      ${!isCompleted ? `<span class="schedule-check" data-idx="${idx}">✓ Mark Complete</span>` : ''}
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.schedule-check').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = btn.dataset.idx;
      const state = loadState();
      const completed = state.scheduleCompleted || {};
      completed[idx] = true;
      saveState({ scheduleCompleted: completed });
      renderSchedule();
    });
  });
}

// ── Sustained: Flashcards ───────────────────────────

let fcIndex = 0;
let fcRatings = [];
let fcDeck = [...FLASHCARDS];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderFlashcard() {
  const card = fcDeck[fcIndex];
  document.getElementById('fcFront').textContent = card.front;
  document.getElementById('fcBack').textContent = card.back;
  document.getElementById('fcProgress').textContent = `Card ${fcIndex + 1} of ${fcDeck.length}`;
  document.getElementById('fcProgressFill').style.width = `${((fcIndex + 1) / fcDeck.length) * 100}%`;

  // Reset flip
  document.getElementById('flashcardInner').classList.remove('flipped');
  document.getElementById('fcRating').classList.add('hidden');
  document.getElementById('fcFlip').classList.remove('hidden');

  // Show deck, hide completion
  document.getElementById('flashcardDeck').classList.remove('hidden');
  document.getElementById('fcComplete').classList.add('hidden');
}

document.getElementById('fcFlip').addEventListener('click', () => {
  document.getElementById('flashcardInner').classList.toggle('flipped');
  if (document.getElementById('flashcardInner').classList.contains('flipped')) {
    document.getElementById('fcRating').classList.remove('hidden');
    document.getElementById('fcFlip').classList.add('hidden');
  }
});

document.getElementById('flashcard').addEventListener('click', () => {
  if (!document.getElementById('flashcardInner').classList.contains('flipped')) {
    document.getElementById('flashcardInner').classList.add('flipped');
    document.getElementById('fcRating').classList.remove('hidden');
    document.getElementById('fcFlip').classList.add('hidden');
  }
});

document.querySelectorAll('.fc-rate-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const rating = parseInt(btn.dataset.rating);
    fcRatings.push({ card: fcIndex, rating });

    fcIndex++;
    if (fcIndex >= fcDeck.length) {
      showFcComplete();
    } else {
      renderFlashcard();
    }
  });
});

function showFcComplete() {
  document.getElementById('flashcardDeck').classList.add('hidden');
  document.getElementById('fcComplete').classList.remove('hidden');

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  fcRatings.forEach(r => counts[r.rating]++);

  document.getElementById('fcStats').innerHTML = `
    <div>😤 Didn't know: <strong>${counts[1]}</strong></div>
    <div>😓 Hard: <strong>${counts[2]}</strong></div>
    <div>🙂 Good: <strong>${counts[3]}</strong></div>
    <div>😎 Easy: <strong>${counts[4]}</strong></div>
    <div style="margin-top:0.75rem; color: var(--text-muted); font-size: 0.82rem;">
      Cards rated "Didn't know" or "Hard" should be reviewed again tomorrow.
      Cards rated "Easy" can be pushed to next week.
    </div>
  `;

  saveState({
    fcSession: {
      date: new Date().toISOString(),
      ratings: fcRatings,
      counts
    }
  });

  // Step 1: Reset ratings immediately after saving to prevent double-counting on next session
  fcRatings = [];
}

document.getElementById('fcRestart').addEventListener('click', () => {
  fcIndex = 0;
  fcRatings = [];
  fcDeck = shuffleArray(FLASHCARDS);
  renderFlashcard();
});

// ── Sustained: Scenarios ────────────────────────────

let currentScenario = 0;
const totalScenarios = 4;

function renderScenarioDots() {
  const dots = document.getElementById('scenarioDots');
  dots.innerHTML = '';
  for (let i = 0; i < totalScenarios; i++) {
    const dot = document.createElement('span');
    dot.className = `scenario-dot ${i === currentScenario ? 'active' : ''}`;
    dot.addEventListener('click', () => goToScenario(i));
    dots.appendChild(dot);
  }
}

function goToScenario(idx) {
  const card = document.querySelector(`.scenario-card[data-scenario="${idx}"]`);
  if (!card) return;

  currentScenario = idx;
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  document.getElementById('scenarioPrev').disabled = idx === 0;
  document.getElementById('scenarioNext').disabled = idx === (totalScenarios - 1);
  renderScenarioDots();
}

document.getElementById('scenarioNext').addEventListener('click', () => {
  if (currentScenario < totalScenarios - 1) goToScenario(currentScenario + 1);
});
document.getElementById('scenarioPrev').addEventListener('click', () => {
  if (currentScenario > 0) goToScenario(currentScenario - 1);
});

document.getElementById('saveScenarios').addEventListener('click', () => {
  const answers = {};
  for (let s = 1; s <= 4; s++) {
    for (let q = 1; q <= 3; q++) {
      const el = document.getElementById(`sc-${s}-${q}`);
      if (el) answers[`s${s}q${q}`] = el.value;
    }
  }
  saveState({ scenarioAnswers: answers });
  document.getElementById('scenariosSaved').classList.remove('hidden');
});

// ── Sustained: Forgetting Curve ─────────────────────

function drawForgettingCurve() {
  const canvas = document.getElementById('forgettingCurve');
  if (!canvas) return;

  // Step 1: Read logical size from CSS/layout, not from canvas attributes
  const W = canvas.offsetWidth || 600;
  const H = canvas.offsetHeight || 300;

  const dpr = window.devicePixelRatio || 1;
  // Step 2: Set physical pixel size once, without re-reading canvas.width
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;

  ctx.clearRect(0, 0, W, H);

  // Axes
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, H - padding.bottom);
  ctx.lineTo(W - padding.right, H - padding.bottom);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Time →', W / 2, H - 8);
  ctx.save();
  ctx.translate(14, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Memory Retention', 0, 0);
  ctx.restore();

  // Y-axis labels
  ctx.textAlign = 'right';
  ctx.fillText('100%', padding.left - 8, padding.top + 5);
  ctx.fillText('50%', padding.left - 8, padding.top + plotH / 2 + 5);
  ctx.fillText('0%', padding.left - 8, H - padding.bottom + 5);

  // X-axis labels
  ctx.textAlign = 'center';
  const days = ['0', '1d', '3d', '1w', '2w', '1m'];
  days.forEach((label, i) => {
    const x = padding.left + (plotW / (days.length - 1)) * i;
    ctx.fillText(label, x, H - padding.bottom + 18);
  });

  function toX(t) { return padding.left + (t / 30) * plotW; }
  function toY(v) { return padding.top + (1 - v) * plotH; }

  // Without review curve (exponential decay)
  ctx.beginPath();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  for (let t = 0; t <= 30; t += 0.5) {
    const v = Math.exp(-t * 0.12);
    const x = toX(t); const y = toY(v);
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // With spaced review curve
  const reviewPoints = [0, 1, 3, 7, 14];
  ctx.beginPath();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2.5;

  let retention = 1;
  let lastReview = 0;
  const points = [];

  for (let t = 0; t <= 30; t += 0.25) {
    if (reviewPoints.includes(t) && t > 0) {
      retention = Math.min(1, retention + 0.35);
      lastReview = t;
      points.push({ x: toX(t), y: toY(retention) });
    }
    const decay = Math.exp(-(t - lastReview) * 0.06);
    const v = retention * decay;
    const x = toX(t); const y = toY(v);
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Review point dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = '#6366f1';
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a0a0f';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// ── Initialization ──────────────────────────────────

function init() {
  // Bug 10: Save total questions count to state for dashboard accuracy
  saveState({ totalQuestions: QUIZ_QUESTIONS.length });

  // Restore saved data
  const state = loadState();

  // Restore diagnostic sliders
  if (state.diagnosticBaseline) {
    state.diagnosticBaseline.forEach((v, i) => {
      const el = document.getElementById(`conf-${i + 1}`);
      if (el) el.value = v;
    });
    document.getElementById('diagnosticSaved').classList.remove('hidden');
  }

  // Restore puzzle answers
  if (state.puzzleAnswers) {
    Object.keys(state.puzzleAnswers).forEach(key => {
      const idx = key.replace('q', '');
      const el = document.getElementById(`puzzle-a${idx}`);
      if (el) el.value = state.puzzleAnswers[key];
    });
    document.getElementById('puzzleSaved').classList.remove('hidden');
  }

  // Restore brain dump
  if (state.brainDump) {
    document.getElementById('brainDumpArea').value = state.brainDump;
  }

  // Restore scenario answers
  if (state.scenarioAnswers) {
    Object.keys(state.scenarioAnswers).forEach(key => {
      const match = key.match(/s(\d)q(\d)/);
      if (match) {
        const el = document.getElementById(`sc-${match[1]}-${match[2]}`);
        if (el) el.value = state.scenarioAnswers[key];
      }
    });
  }

  // Render components
  setupQuizFilters();
  setupLLMGrading();
  renderQuiz();
  renderSchedule();
  renderScenarioDots();
  renderConfidenceComparison();
  renderRevisitPredictions();

  // Flashcards
  fcDeck = shuffleArray(FLASHCARDS);
  renderFlashcard();

  // Draw forgetting curve
  drawForgettingCurve();
  window.addEventListener('resize', drawForgettingCurve);
}

// Start
document.addEventListener('DOMContentLoaded', init);
