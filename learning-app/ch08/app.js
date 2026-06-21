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
      "To coordinate consensus and replication across multiple independent nodes in a distributed database cluster",
      "To simplify the programming model for applications by grouping multiple operations into a single safety guarantee",
      "To optimize disk storage layouts and improve read performance by automatically clustering related table records",
      "To enforce strict schema constraints and access control policies directly within the database execution engine"
    ],
    correct: 1,
    explanation: "Transactions are safety guarantees that allow applications to ignore certain error scenarios and concurrency issues, making the application code much simpler.",
    section: "What Exactly Is a Transaction?"
  },
  {
    type: "mc",
    q: "In the acronym ACID, what is the primary role of Atomicity?",
    options: [
      "To isolate concurrent transactions and prevent clients from seeing the intermediate, half-finished results of writes",
      "To guarantee that committed data has been safely written to non-volatile storage and can survive system crashes",
      "To allow a transaction to be aborted on error, discarding all its writes so the application can safely retry",
      "To ensure that database invariants, schema constraints, and business rules are never violated by any transaction"
    ],
    correct: 2,
    explanation: "ACID atomicity is about abortability. It guarantees that if a fault occurs during a transaction, all writes are discarded, preventing partial failures.",
    section: "The Meaning of ACID: Atomicity"
  },
  {
    type: "write",
    q: "During a lunch debate with a systems programmer, they claim: 'Atomicity in multi-threaded code is the exact same concept as Atomicity in ACID transactions!' How do you correct them, explaining the difference in how 'atomic' is used in these two contexts?",
    hint: "Contrast what happens when two concurrent threads access a shared variable vs. what happens when a database transaction encounters a crash/error halfway through.",
    modelAnswer: "In multi-threaded programming, an atomic operation is one where another thread cannot see a half-finished state — it is about concurrency control. In ACID transactions, atomicity is not about concurrency (which is isolation); rather, it describes abortability. It guarantees that if a transaction fails mid-way, all of its writes are discarded and rolled back, so that the database does not end up in a partially updated state.",
    section: "The Meaning of ACID: Atomicity"
  },
  {
    type: "mc",
    q: "Who is primarily responsible for ensuring Consistency (the 'C' in ACID) in a database system?",
    options: [
      "The hardware storage controller, by using RAID replication and hardware battery-backed cache systems",
      "The operating system's filesystem layer, by performing integrity checks and crash recovery logging",
      "The database engine's transaction manager, by automatically verifying and optimizing queries at runtime",
      "The application developer, by correctly defining transactions that preserve key business invariants"
    ],
    correct: 3,
    explanation: "Unlike A, I, and D, consistency is mostly a property of the application. The database can enforce simple constraints (like foreign keys), but complex business rules must be managed by application code.",
    section: "The Meaning of ACID: Consistency"
  },
  {
    type: "mc",
    q: "Under the Read Committed isolation level, what does a 'dirty read' refer to?",
    options: [
      "A client reading data that has been logically deleted by another transaction but remains cached in memory",
      "A client reading data that has been written by another transaction but has not yet been committed",
      "A client reading data that was corrupted during a network transmission or due to a hardware disk failure",
      "A client reading data that violates the schema constraints or foreign key references of the target table"
    ],
    correct: 1,
    explanation: "A dirty read occurs when a transaction sees uncommitted data from another transaction. Read Committed prevents this by only showing committed changes.",
    section: "Weak Isolation Levels: Read Committed"
  },
  {
    type: "write",
    q: "Your team is tuning a database running on Read Committed isolation. You want to explain to your colleagues why our read queries are not getting blocked by concurrent insert/update queries. How does the database implement this isolation level behind the scenes to prevent dirty reads and dirty writes?",
    hint: "Explain how the database uses row locks for write operations while remembering the previous committed values to serve read operations without locking them.",
    modelAnswer: "To prevent dirty writes, databases use row-level locks; a transaction must acquire a lock on a row before writing to it. To prevent dirty reads without letting reads block writes, most databases do not use locks for reads. Instead, they remember the old committed value of a row while a write transaction holds a lock. Any concurrent read query is simply served this old committed value until the write transaction commits.",
    section: "Weak Isolation Levels: Read Committed"
  },
  {
    type: "mc",
    q: "What is 'read skew' (non-repeatable read), and which isolation level is typically introduced to solve it?",
    options: [
      "A concurrent transaction overwriting another transaction's uncommitted modifications; typically solved by enforcing Read Committed",
      "A client seeing different parts of the database at different points in time during a single transaction; solved by Snapshot Isolation",
      "A long-running read query blocking concurrent write transactions indefinitely; typically solved by implementing Two-Phase Locking",
      "A transaction failing to roll back successfully after a database crash or server failure; solved by using Write-Ahead Logging"
    ],
    correct: 1,
    explanation: "Read skew occurs when a transaction reads two related records but one is updated in between. Snapshot Isolation solves this by giving the transaction a consistent snapshot of the database at a single point in time.",
    section: "Weak Isolation Levels: Snapshot Isolation"
  },
  {
    type: "write",
    q: "While analyzing a tricky concurrency issue in a code review, a teammate asks: 'Wait, is this bug a \"lost update\" or \"write skew\"? Aren't they basically the same thing?' How do you explain the conceptual difference between the two anomalies and how the nature of the target rows/data differs?",
    hint: "Contrast concurrent transactions updating the exact same database row (lost update) with transactions reading the same rows but updating different rows to violate a shared constraint (write skew).",
    modelAnswer: "A lost update occurs when two concurrent transactions read the same row, modify it, and write it back, causing one of the updates to overwrite the other (occurring on a single row). Write skew is a generalization of the lost update problem where transactions read the same records but update different records, violating a cross-row invariant (such as ensuring at least one doctor remains on call). Write skew involves a race condition where the action of one transaction invalidates the premise of another transaction's write.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "mc",
    q: "Which of the following is NOT a valid method for preventing lost updates in concurrent databases?",
    options: [
      "Using atomic write operations provided directly by the database engine (e.g., UPDATE counters SET value = value + 1)",
      "Explicitly locking selected rows during a read operation using database-specific syntax such as SELECT ... FOR UPDATE",
      "Increasing the maximum size of the database connection pool to allow more concurrent application client connections",
      "Using compare-and-set operations where updates only succeed if the target value has not changed since it was read"
    ],
    correct: 2,
    explanation: "Increasing connection pool size does not prevent concurrency issues; it actually allows more concurrent transactions, potentially exacerbating race conditions.",
    section: "Weak Isolation Levels: Preventing Lost Updates"
  },
  {
    type: "mc",
    q: "Which of the following scenarios is a classic example of write skew?",
    options: [
      "Two users concurrently booking the exact same seat on a flight, where both operations update the same row resulting in a double-booking",
      "Two doctors on call simultaneously trying to check out of their shift, leaving zero doctors on call when the rule requires at least one",
      "A banking client reading their total account balance twice and seeing two different amounts because a transfer committed in between",
      "An analytical billing report scanning a transaction table to sum monthly revenue while concurrent threads add new invoice records"
    ],
    correct: 1,
    explanation: "Write skew occurs when two transactions read a condition, make a decision, and write to different rows, invalidating the condition. Both doctors see that two are on call, so both check out, leaving none.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "write",
    q: "Our medical scheduling app is running on Snapshot Isolation, and we just had an incident where the last two on-call doctors checked out at the exact same time, leaving the hospital empty! Walk through why this write skew occurred under snapshot isolation, and how we can fix it using explicit database locks in our application code.",
    hint: "Explain how the database fails to detect conflicts when transactions write to different rows, and show how a 'SELECT ... FOR UPDATE' query solves this.",
    modelAnswer: "Under Snapshot Isolation, write skew occurs because both transactions run on independent, consistent snapshots. Since they update different rows (Doctor A's status vs Doctor B's status), the database does not detect a write conflict. To resolve this, the developer can use explicit locking by querying the on-call doctors list using 'SELECT ... FOR UPDATE'. This forces the database to lock all returned rows, meaning the second transaction must wait until the first commits, exposing the updated state and preventing double checkout.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "mc",
    q: "What is a 'phantom' in database concurrency?",
    options: [
      "A row updated by an active transaction that subsequently aborts, leaving modified values cached in memory",
      "A write operation that successfully propagates to a follower replica but is lost due to leader election lag",
      "A write in one transaction that changes the result of a search query in another concurrent transaction",
      "A transaction coordinator node that crashes midway through a commit protocol and is forgotten by the cluster"
    ],
    correct: 2,
    explanation: "A phantom occurs when a write in one transaction changes the set of rows returned by a search query in another transaction. It is a key cause of write skew.",
    section: "Weak Isolation Levels: Write Skew and Phantoms"
  },
  {
    type: "mc",
    q: "What is the key difference between Two-Phase Locking (2PL) and Two-Phase Commit (2PC)?",
    options: [
      "2PL is used to synchronize follower replication across database clusters, whereas 2PC is used to optimize complex join queries",
      "2PL is a concurrency control mechanism providing serializability; 2PC is an atomic commit protocol for distributed nodes",
      "2PL is an isolation standard designed for non-relational document stores, whereas 2PC is a protocol exclusive to SQL systems",
      "2PL guarantees that lock acquisition and release occur in separate phases; 2PC replicates the coordinator role across two nodes"
    ],
    correct: 1,
    explanation: "Do not confuse them! Two-Phase Locking (2PL) ensures serializability by blocking writers when readers are active and vice versa. Two-Phase Commit (2PC) ensures atomicity across distributed nodes.",
    section: "Serializability: Two-Phase Locking"
  },
  {
    type: "write",
    q: "Your database architect suggests: 'Let's run our database single-threaded on a single CPU core to achieve absolute serializability!' The team laughs, but you agree it could work. Under what specific architectural conditions is 'Actual Serial Execution' not only viable but extremely fast?",
    hint: "Think about dataset fit in memory (RAM), transaction execution time, avoiding interactive client network hops, and stored procedures.",
    modelAnswer: "Actual Serial Execution is viable if all data can fit in memory (RAM) and transactions are written as short, stored procedures without any interactive network I/O. Because memory access is fast and there are no network round-trips mid-transaction, a single-threaded CPU can execute thousands of transactions per second. This completely eliminates locking overhead, deadlocks, and coordination, but is limited by single-core CPU scaling and RAM capacity.",
    section: "Serializability: Actual Serial Execution"
  },
  {
    type: "mc",
    q: "How does Two-Phase Locking (2PL) handle reader-writer concurrency compared to Snapshot Isolation?",
    options: [
      "In 2PL, readers and writers run on independent snapshots and thus never block or wait for each other's operations",
      "In 2PL, writers acquire exclusive locks that block all other transactions, completely preventing concurrent operations",
      "In 2PL, readers block writers, and writers block readers, providing strict serializability at the cost of performance",
      "In 2PL, locks are deferred during execution and are only acquired and validated when the transaction tries to commit"
    ],
    correct: 2,
    explanation: "Unlike snapshot isolation where readers never block writers and writers never block readers, 2PL enforces mutual exclusion: readers block writers, and writers block readers.",
    section: "Serializability: Two-Phase Locking"
  },
  {
    type: "mc",
    q: "Serializable Snapshot Isolation (SSI) is described as an optimistic concurrency control mechanism. What does 'optimistic' mean in this context?",
    options: [
      "It assumes that network partitions and node crashes will never occur, ensuring that coordinator recovery is never needed",
      "It allows transactions to proceed without locks, and only aborts them at commit time if a serialization conflict is detected",
      "It assumes that conflicting operations are rare, leaving the application layer to manually catch and resolve integrity errors",
      "It defers write propagation by only writing transaction logs to non-volatile disk once a day to maximize raw write throughput"
    ],
    correct: 1,
    explanation: "SSI does not block concurrent transactions. Instead, it lets them run. When a transaction tries to commit, the database checks if any race conditions occurred, aborting and retrying it if so.",
    section: "Serializability: Serializable Snapshot Isolation"
  },
  {
    type: "write",
    q: "We are migrating to a database that implements Serializable Snapshot Isolation (SSI). The team is amazed that it achieves serializability without the performance hit of traditional locks. How does SSI detect a write skew conflict under the hood, and what operational trade-offs must our application handle?",
    hint: "Explain how the database monitors reads of uncommitted writes and writes affecting prior reads, and mention the need for client-side transaction retries under high contention.",
    modelAnswer: "SSI detects serialization conflicts by tracking when a transaction reads data that is subsequently modified by another transaction, or when a transaction's write is based on an outdated read premise. It does this by monitoring: 1) reads of uncommitted writes (detecting when a transaction reads a row that has a pending write from another transaction) and 2) writes that affect prior reads (detecting when a transaction writes to a row or index range that another active transaction has already read). If a conflict is confirmed at commit time, the transaction is aborted. However, a significant operational trade-off of SSI is that under high write contention, transactions can suffer from high abort rates (starvation), requiring the application layer to implement robust retry logic.",
    section: "Serializability: Serializable Snapshot Isolation"
  },
  {
    type: "mc",
    q: "What is the primary problem that the Two-Phase Commit (2PC) protocol solves in a distributed system?",
    options: [
      "It ensures that follower database replica nodes apply write operations in the exact same chronological order",
      "It ensures transaction atomicity across multiple database nodes — either all nodes commit, or all nodes abort",
      "It significantly speeds up write operations by parallelizing disk write and sync operations across all nodes",
      "It automatically detects routing network partitions and dynamically redirects client traffic to healthy nodes"
    ],
    correct: 1,
    explanation: "2PC is designed to guarantee distributed atomicity. It ensures that a transaction spanning multiple database shards or heterogeneous databases commits on all nodes or aborts on all nodes.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "mc",
    q: "What happens during Phase 1 (Prepare phase) of a Two-Phase Commit?",
    options: [
      "The coordinator writes the transaction data directly to its local write-ahead log and immediately commits the changes locally",
      "The coordinator sends a prepare request to participants, who check for conflicts, write undo/redo logs to disk, and vote 'Yes' or 'No'",
      "All participating nodes independently commit their local transaction blocks and asynchronously report outcomes to the coordinator",
      "The database client layer performs checks to validate active network connections to all available follower replicas in the cluster"
    ],
    correct: 1,
    explanation: "In Phase 1, the coordinator asks participants if they can commit. Each participant must perform safety checks and write data to disk before voting 'Yes' to guarantee they can commit in Phase 2.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "write",
    q: "During a network outage, one of our microservices enters an 'in-doubt' or 'uncertain' state during a Two-Phase Commit (2PC) transaction. Why has this node become stuck, why can it not decide to commit or abort on its own, and what is the cascading impact on our systems?",
    hint: "Walk through the scenario where the participant votes 'Yes' in Phase 1 but the coordinator crashes before Phase 2. What happens to the participant's locks?",
    modelAnswer: "A participant enters the 'in-doubt' state when it has voted 'Yes' in Phase 1 but the coordinator crashes or is disconnected before sending the Phase 2 commit or abort decision. In this state, the participant cannot unilaterally commit (because another participant might have voted No and aborted) and cannot unilaterally abort (because the coordinator might have decided to commit). The participant must block and hold all locks indefinitely until the coordinator recovers, causing resource starvation and blocking other queries.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "mc",
    q: "What is an XA transaction?",
    options: [
      "A distributed transaction protocol that uses XML schemas to serialize and validate data payloads transmitted across network nodes",
      "A highly optimized in-memory database transaction protocol that bypasses local disk writes to achieve sub-millisecond latencies",
      "A standard specification for distributed transactions across heterogeneous systems (e.g., a database and a message broker)",
      "An internal, proprietary consensus protocol implemented exclusively by Microsoft SQL Server to manage multi-shard transactions"
    ],
    correct: 2,
    explanation: "XA (eXtended Architecture) is a standard for 2PC across heterogeneous technologies, allowing databases, message queues, and cache servers to participate in a single atomic transaction.",
    section: "Distributed Transactions: Distributed Transactions Across Different Systems"
  },
  {
    type: "write",
    q: "Your team is debating whether to use a built-in distributed SQL database (like CockroachDB) or set up a multi-technology XA transaction across PostgreSQL and RabbitMQ. Compare these two types of distributed transactions and explain which one offers better performance and reliability.",
    hint: "Contrast system-specific consensus and layout optimizations of database-internal systems with the generic, high-overhead coordination APIs required by heterogeneous XA systems.",
    modelAnswer: "Database-internal distributed transactions are managed within a single database system (e.g., Spanner, CockroachDB) and are highly optimized, utilizing custom consensus protocols, shared data formats, and internal optimizations. Furthermore, the failure domain is contained inside a single system rather than spanning multiple independently operated products, which simplifies operations, debugging, and recovery. Heterogeneous/XA transactions span different technologies (e.g., PostgreSQL, ActiveMQ) and must use standard, generic APIs (like JTA). XA transactions are significantly slower because they cannot optimize internal details, suffer from high network coordination overhead, and are prone to blocking due to coordinator crash sensitivity.",
    section: "Distributed Transactions: Database-Internal Distributed Transactions"
  },
  {
    type: "mc",
    q: "How can Two-Phase Commit be used to achieve 'exactly-once' message processing?",
    options: [
      "By immediately deleting the target message from the broker queue prior to starting its processing",
      "By committing the message consumption and the database write together in a single atomic transaction",
      "By hosting the message queue broker and the database storage engine on the same physical server node",
      "By filtering and dropping duplicate messages at the application client layer using tracking cookie IDs"
    ],
    correct: 1,
    explanation: "To achieve exactly-once processing, the step of consuming a message from a queue (e.g., JMS) and the step of writing to the database must succeed or fail together, which can be coordinated via a 2PC transaction.",
    section: "Distributed Transactions: Exactly-Once Message Processing Revisited"
  },
  {
    type: "mc",
    q: "In modern distributed databases, how has the definition of 'durability' evolved?",
    options: [
      "It now guarantees that transaction logs are stored in-memory across multiple highly available cache nodes",
      "It has shifted from writing to a single local disk to replicating data across a quorum of independent nodes",
      "It focuses on encrypting data payloads at rest to prevent unauthorized access in the event of a disk breach",
      "It refers to the operational speed at which a crashed database engine can recover and start accepting writes"
    ],
    correct: 1,
    explanation: "Historically, durability meant writing to tape or a local disk (using fsync). In replicated distributed systems, it refers to copying data to multiple nodes to tolerate single-machine failures.",
    section: "The Meaning of ACID: Durability"
  },
  {
    type: "write",
    q: "You are in a design review where a developer suggests using Two-Phase Commit (2PC) to sync writes across three separate high-scale microservices. Why do experienced distributed systems architects strongly advise against 2PC in high-throughput, cloud-native environments?",
    hint: "Consider the latency costs of network round-trips, physical disk flushes, long lock retention times, coordinator crash vulnerability, and CAP theorem availability trade-offs.",
    modelAnswer: "Engineers avoid 2PC because it introduces substantial latency overhead due to multiple network round-trips (prepare, vote, commit) and disk fsyncs. More critically, 2PC is a blocking protocol: if the coordinator crashes during Phase 2, participants must hold row locks indefinitely. This reduces availability (violating CAP theorem principles) and can cause cascading failures across the system as locks pile up, bottlenecking overall transaction throughput.",
    section: "Distributed Transactions: Two-Phase Commit"
  },
  {
    type: "mc",
    q: "What is a potential pitfall of using 'compare-and-set' (optimistic lock) operations to prevent lost updates?",
    options: [
      "They require the database engine to acquire and hold exclusive write locks throughout the entire read-modify-write cycle",
      "If the database serves reads from an outdated replica, the compare condition may check old data, failing to prevent the lost update",
      "They are highly restricted because they can only be applied to numeric data fields and cannot handle string manipulations",
      "They are specialized concurrency primitives that are not supported by any modern SQL-based relational database engines"
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
      "Snapshot isolation relies on a single shared snapshot to allow dirty reads, whereas repeatable read uses strict row locks to prevent them",
      "Repeatable read relies heavily on pessimistic locks to block writes, whereas snapshot isolation runs single-threaded without any locking",
      "Snapshot isolation is an analytical standard restricted to OLAP systems, whereas repeatable read is designed only for OLTP workloads"
    ],
    correct: 0,
    explanation: "The SQL standard for Repeatable Read was defined before snapshot isolation existed. In practice, many databases (like PostgreSQL and MySQL) implement Snapshot Isolation but call it 'Repeatable Read' to satisfy SQL-92 compatibility.",
    section: "Weak Isolation Levels: Snapshot Isolation"
  },
  {
    type: "write",
    q: "A bank customer calls support in a panic: 'I just transferred $100 from my savings to my checking account, but when I refreshed my dashboard, the money disappeared from savings and hasn't shown up in checking! My total balance is short by $100!' Describe how this read skew bug occurred and why it was only temporary.",
    hint: "Explain how a user transaction reading checking, then a concurrent transfer committing, then the user transaction reading savings results in an inconsistent view of the total balance.",
    modelAnswer: "A classic scenario is transferring $100 from Account A to Account B. Suppose Account A has $500 and Account B has $500. A transaction transfers $100. Concurrently, a user views their account balances. Under Read Committed, if they read Account B ($500), then the transfer commits, then they read Account A ($400), they will see a total of $900 ($500 + $400), making it look like $100 vanished. Although subsequent refreshes will show the correct $1000 total, this temporary inconsistency is a read skew bug.",
    section: "Weak Isolation Levels: Snapshot Isolation"
  },
  {
    type: "write",
    q: "A NoSQL database vendor advertises: 'We support ACID transactions!' in their documentation. However, you notice they only support 'single-object' transactions. How do you explain the difference between single-object transaction support and traditional multi-object ACID transactions to your team?",
    hint: "Contrast atomicity/isolation guarantees for a single document key/value pair with transactions covering multiple collections, tables, or documents.",
    modelAnswer: "Single-object transactions guarantee atomicity and isolation for operations on a single key or document (e.g., updating a nested array in a document). Traditional ACID transactions, however, support multi-object operations, meaning multiple reads and writes across different rows, documents, or tables can be grouped together. If any operation fails, all are discarded. Single-object support is insufficient when changes to multiple independent entities must succeed or fail as a single atomic unit.",
    section: "What Exactly Is a Transaction?"
  },
  {
    type: "write",
    q: "Prepare a mock debate outline for your engineering team, arguing both sides of this statement: 'We should use database-level Two-Phase Commit (2PC) for multi-node writes rather than building custom saga/compensation logic in our microservices.'",
    hint: "Balance developer velocity and correctness guarantees (Pro) against lock durations, performance bottlenecks, coordinator SPOF risks, and microservice independence (Con).",
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
