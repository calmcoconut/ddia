/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   Chapter 13: A Philosophy of Streaming Systems
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "Why is it often necessary to integrate multiple specialized storage systems rather than relying on a single 'general-purpose' database?",
    options: [
      "A general-purpose database is architecturally constrained by internal block structures, preventing it from storing more than a few gigabytes of data.",
      "Different access patterns (e.g., keyword search vs transactional lookups) require fundamentally different storage engine designs for optimal performance.",
      "Using a single centralized database server inherently violates modern strict security compliance standards and user data privacy regulations globally.",
      "Standard relational databases are theoretically incapable of performing complex relational join queries across three or more partitioned source tables."
    ],
    correct: 1,
    explanation: "No single storage format or indexing structure is optimal for all access patterns. For example, keyword search requires an inverted index, while transactional lookups are best served by B-trees or LSM-trees.",
    section: "Data Integration"
  },
  {
    type: "mc",
    q: "In a data integration architecture where a search index is maintained by capturing changes from a database, which system acts as the 'system of record'?",
    options: [
      "The user-facing search index, because it handles all query traffic and serves as the primary readout view.",
      "The database, because it holds the authoritative version of the data where new data is first written.",
      "Both systems concurrently and symmetrically, as they must coordinate to decide on the ordering of writes.",
      "The intermediary message broker or log queue that transport and route the changes to downstream consumers."
    ],
    correct: 1,
    explanation: "The system of record holds the authoritative, canonical version of data. Any other representations (like the search index) are derived from the system of record and are therefore derived data systems.",
    section: "Reasoning about dataflows"
  },
  {
    type: "write",
    q: "A developer proposes using Two-Phase Commit (2PC) to keep your primary user database, search index, and caching layer perfectly in sync. You are worried about the architectural blast radius. Compare 2PC to an asynchronous, log-based derived data system in terms of system performance, fault tolerance when a node goes offline, and the speed at which users see updates.",
    hint: "Contrast synchronous coordination/locking and single-point-of-failure vulnerabilities in 2PC with asynchronous eventual consistency in log-based systems.",
    modelAnswer: "Distributed transactions use an atomic commit protocol (like Two-Phase Commit) to apply updates synchronously across multiple systems, ensuring immediate read-after-write consistency (timeliness). However, they have poor fault tolerance because if a single participant fails, the entire transaction must abort, amplifying failures. Log-based derived data systems update systems asynchronously, which increases robustness and scalability because a slow or failed consumer doesn't block the producer, but it sacrifices timeliness by introducing eventual consistency lag.",
    section: "Derived data versus distributed transactions"
  },
  {
    type: "write",
    q: "During a system architecture alignment meeting, the team debates correctness guarantees. On one hand, we have distributed transactions that use 2PC to commit or abort atomically. On the other hand, we have log-based derived data systems. Contrast how these two approaches handle node crashes and recover to a consistent state.",
    hint: "Mention 2PC abort/rollback mechanisms versus log-based retry loops, deterministic processing, and idempotent state updates.",
    modelAnswer: "Distributed transactions achieve correctness through atomic commit protocols like Two-Phase Commit (2PC), which abort the entire operation if any participant fails. In contrast, log-based derived state systems achieve correctness through deterministic processing, at-least-once message delivery, retrying failed processing stages, and ensuring all write operations are idempotent so that duplicate updates do not cause corruption.",
    section: "Derived data versus distributed transactions"
  },
  {
    type: "mc",
    q: "Why does scaling event throughput past a single machine's capacity limit the ability to maintain a total order of events?",
    options: [
      "Total order broadcast becomes mathematically impossible to compute if more than one node participates in state.",
      "Sharding the log across multiple machines means event order between different shards is ambiguous without coordination.",
      "Consensus protocols are theoretically incapable of running or committing transactions on partition-sharded databases.",
      "Network partitions and packet drops are physically guaranteed to occur if global network event throughput rises."
    ],
    correct: 1,
    explanation: "To establish a total order, all events typically must pass through a single leader. If throughput requires sharding the log, there is no inherent sequence ordering between events that are appended to different shards.",
    section: "The limits of total ordering"
  },
  {
    type: "write",
    q: "A user unfriends an ex-partner on your social platform, then immediately posts a private status update. However, because the friendship database and the message database are separate, uncoordinated systems, a notification worker processes the status post event before the friendship update has propagated to the friendship cache. Explain how this out-of-order execution violates user privacy, and why causal dependencies must be captured.",
    hint: "Consider how the race condition causes the notification to be sent to the ex-partner because the unfriend event was delayed relative to the post event in the downstream consumer.",
    modelAnswer: "If friendship status and messages are stored in separate, uncoordinated databases, the relative ordering of updates is not guaranteed. If a user unfriends an ex-partner and then posts a message intended only for remaining friends, a notification service might process the 'post message' event before the 'unfriend' event has propagated to the friendship cache. This out-of-order execution causes a notification to be sent to the ex-partner, violating the user's privacy intentions.",
    section: "Ordering events to capture causality"
  },
  {
    type: "mc",
    q: "In the context of the Kappa architecture, how is application evolution (e.g., changing how a search index is computed) typically handled?",
    options: [
      "By performing a zero-downtime relational schema migration using database triggers to replicate modifications live.",
      "By running an offline batch process on a data warehouse cluster and performing a full recovery restore on the database.",
      "By replaying historical events through a new version of the stream processor and routing reads to the new view when ready.",
      "By halting all incoming client write traffic to the system while administrators migrate historical database files manually."
    ],
    correct: 2,
    explanation: "Kappa architecture unifies batch and stream processing by keeping historical events in a log. To evolve the app, you feed the historical event log into the new version of the stream processor, building a new derived view side-by-side with the old one, and gradually switch user reads.",
    section: "Reprocessing data for application evolution"
  },
  {
    type: "mc",
    q: "When bootstrapping a new change data capture (CDC) consumer or executing CREATE INDEX on a live database, what is the correct chronological sequence of steps required to build a consistent derived view?",
    options: [
      "1) Stop all incoming write transactions to parent tables, 2) build the secondary index from a static database snapshot, 3) resume write traffic and stream updates directly.",
      "1) Take a consistent snapshot of the source table, 2) build the initial index/view from that snapshot, 3) apply accumulated log updates to catch up, 4) start streaming live updates.",
      "1) Listen to the live change stream to collect new database updates, 2) sort the collected updates by key, 3) execute background jobs to overwrite historical table partitions.",
      "1) Write all new transaction logs directly to both the parent database table and the new index, 2) run a background asynchronous garbage collector process to reconcile gaps."
    ],
    correct: 1,
    explanation: "Executing `CREATE INDEX` or initializing CDC requires building the derived view from a consistent snapshot of the source table (the backfill), then consuming the transaction log (change stream) to apply any writes that occurred after the snapshot was taken, and finally transitioning to processing live log events. This avoids having to halt parent writes during index creation.",
    section: "Creating an index"
  },
  {
    type: "write",
    q: "Your CTO wants to build a new architecture using Kafka as a commit log, PostgreSQL for relational queries, Elasticsearch for text searches, and Redis for caching, all synced via CDC. They call this 'unbundling the database' and compare it to the Unix philosophy. Explain this concept and how it mirrors Unix pipes and tools.",
    hint: "Describe how database components like logs, indexes, and caches are separated into specialized tools, and how change streams act as pipes linking them together.",
    modelAnswer: "Unbundling databases means taking the internal components of a single integrated database (such as the transaction log, secondary indexes, caches, and query processor) and separating them into independent tools run on different machines. This mirrors the Unix philosophy of composing small, specialized tools that do one thing well. In an unbundled system, a log-based message broker serves as the central transaction log (write synchronization), while specialized databases, search indexes, and caches act as derived views, kept in sync via change data capture streams (acting like Unix pipes).",
    section: "Unbundled databases"
  },
  {
    type: "write",
    q: "An intern asks whether the company should use a federated query engine (like Presto or Athena) to query across our systems, or build an unbundled database architecture using CDC logs. Explain how federated databases operate, what they optimize for, and how their coordination model differs from the write-synchronization focus of an unbundled database.",
    hint: "Think about the distinction between unifying reads dynamically via a query wrapper and unifying writes asynchronously via log replication.",
    modelAnswer: "Federated databases (or polystores) unify reads by providing a single, consistent query interface (like SQL) across multiple underlying, heterogeneous storage engines. They map queries to individual engines dynamically. They differ from unbundled databases because, while federation can route writes through query rewriters in some polystores, its key distinction is that it doesn't enforce write synchronization across systems or produce change logs. Unbundled databases focus on write synchronization, using log-based change data capture streams to keep derived data systems in sync asynchronously.",
    section: "The meta-database of everything"
  },
  {
    type: "mc",
    q: "What is a major advantage of the dataflow approach over the microservices approach when performing operations that require external data (e.g., currency conversion)?",
    options: [
      "The dataflow approach executes synchronous REST endpoints to fetch dependencies, which avoids partition network splits and makes debugging simpler.",
      "The dataflow approach subscribes to a stream of updates ahead of time, storing them locally, which replaces synchronous network queries with fast local lookups.",
      "The dataflow approach completely eliminates the need for local storage layers or data caching systems, reducing overall database operations to zero.",
      "The dataflow approach implements synchronous lock coordination protocols, guaranteeing that currency exchange rates are always strictly linearizable."
    ],
    correct: 1,
    explanation: "By subscribing to exchange rate updates asynchronously and storing the current state in a local database, the dataflow service can process purchase transactions instantly without making synchronous network requests, increasing speed and fault isolation.",
    section: "Stream processors and services"
  },
  {
    type: "write",
    q: "Your microservice-based checkout system relies on a currency exchange rate service. Under high load, the exchange rate service goes down, causing all checkouts to crash because of failed synchronous REST/RPC calls. Explain how refactoring this to a log-based dataflow architecture (where checkout subscribes to rate updates ahead of time) makes the checkout service resilient to these external network outages.",
    hint: "Contrast what happens during a dependency failure when making synchronous HTTP calls vs when performing lookups against a locally stored copy of a replicated update stream.",
    modelAnswer: "In a REST/RPC microservices architecture, if the currency exchange rate service goes down, the purchase service fails immediately because it cannot make the synchronous network request to fetch the rate. In the dataflow architecture, the purchase service maintains a local cache of the exchange rates updated by a stream. If the exchange service goes down, the purchase service can still process orders using the last known exchange rate stored locally, containing the failure and maintaining service availability.",
    section: "Stream processors and services"
  },
  {
    type: "mc",
    q: "In terms of the 'write path' and 'read path,' how can we conceptualize the role of database indexes and caches?",
    options: [
      "They operate as lazy evaluation mechanisms that run and rebuild indexes only when a database query execution fails.",
      "They shift the boundary between the read path and write path, doing more work at write time to save work at read time.",
      "They function as hardware-specific silicon optimizations that completely eliminate the need for host CPU execution.",
      "They represent the raw, un-derived canonical system of record that persists all incoming client transaction files."
    ],
    correct: 1,
    explanation: "Caches and indexes are precomputed structures. By spending write-time resources to update them eagerly, we drastically reduce the work (e.g., full-table scans) required to serve queries on the read path.",
    section: "Materialized views and caching"
  },
  {
    type: "mc",
    q: "In local-first software and offline-capable clients, how should we conceptualize the state stored on the user's device?",
    options: [
      "It functions as the absolute, single system of record for the entire enterprise customer database.",
      "It is a local replica or cache of the server state, and the UI is a materialized view of that local state.",
      "It is a stateless network buffer that must be completely wiped and deleted whenever connection is lost.",
      "It represents an isolated, un-derivable data source that cannot be synchronized with other device nodes."
    ],
    correct: 1,
    explanation: "Local-first software treats the device's storage as a local replica of the server state. The UI rendering on the screen is effectively a materialized view derived from this local model, and background sync engines propagate changes to and from the server.",
    section: "Stateful, offline-capable clients"
  },
  {
    type: "write",
    q: "You want to build a collaborative document editing tool. Instead of having the client poll the database every second (request/response), you decide to extend the database's write path all the way to the user's browser. Describe the technical components needed to implement this and how it shifts the architecture toward a publish/subscribe model.",
    hint: "Think about how technologies like WebSockets or Server-Sent Events turn the client device into an event log subscriber that materializes views locally.",
    modelAnswer: "Extending the write path to the end user means actively pushing state changes from the server to connected client devices in real-time, rather than having clients poll for updates. Using WebSockets or Server-Sent Events, the server treats each client as an event log subscriber. When a write occurs on the server, it propagates downstream through event logs and stream processors, and the server pushes the update directly to the client device, which updates its local state and UI immediately, moving away from request/response to publish/subscribe dataflow.",
    section: "Pushing state changes to clients"
  },
  {
    type: "mc",
    q: "What is a potential benefit of representing read queries as events and sending them through a stream processor?",
    options: [
      "It guarantees that all incoming read queries are 100% linearizable without requiring any underlying database storage engines.",
      "It enables precise tracking of causal dependencies and data provenance by recording exactly what the user saw before taking an action.",
      "It reduces server CPU usage, memory cache eviction, and disk I/O read overhead to absolute zero across the whole database cluster.",
      "It completely eliminates the need for sharding database records, allowing a single single-leader node to handle petabyte streams."
    ],
    correct: 1,
    explanation: "If read queries are logged as events, they can be joined with write events, allowing the system to record and verify exactly what state of the system a user was looking at (e.g., inventory and shipping dates) when they clicked 'buy'.",
    section: "Reads are events too"
  },
  {
    type: "mc",
    q: "Under what circumstances does treating queries as event streams and executing them through a stream processor become highly useful?",
    options: [
      "When queries are restricted to simple single-row primary key lookups against a local B-tree index.",
      "When performing complex distributed joins that must combine data from differently sharded datasets.",
      "When the underlying database uses standard single-leader replication with asynchronous updates.",
      "When client devices maintain high-bandwidth, 100% reliable network connections to broker nodes."
    ],
    correct: 1,
    explanation: "For complex multishard joins (such as fraud detection combining sharded email, billing, and IP reputation scores), the stream processor's message routing and partitioning infrastructure provides a powerful framework for distributed execution.",
    section: "Multishard data processing"
  },
  {
    type: "write",
    q: "A payment gateway client sends a request to charge a credit card. The server processes the transaction, but a network hiccup kills the connection right before the client receives the confirmation. The client times out, opens a new TCP connection, and retries. Explain why the server's TCP-level deduplication fails to stop the user from being double-charged.",
    hint: "Address why TCP sequence numbers only prevent duplicate packets within a single connection session, and how the retry is seen by the database.",
    modelAnswer: "TCP sequence numbers only suppress duplicate packets within a single TCP connection. If a network interruption occurs after the database commits a transaction but before the client receives the confirmation, the TCP connection times out and is closed. To retry, the client must open a new TCP connection and submit the transaction again. From the database's perspective, this is a brand-new transaction request, which it will execute a second time, potentially causing double execution (e.g., transferring funds twice).",
    section: "Exactly-once execution of an operation"
  },
  {
    type: "mc",
    q: "In Example 13-1 (transferring money by updating balances directly), what makes the transaction dangerous to retry after a client timeout?",
    options: [
      "The SQL statement UPDATE accounts SET balance = balance + 11.00 is non-idempotent.",
      "The database will automatically lock both account rows in exclusive mode forever.",
      "The SQL transaction block is missing a required starting BEGIN TRANSACTION command.",
      "It uses a two-phase commit protocol, which is guaranteed to abort on any timeout."
    ],
    correct: 0,
    explanation: "The balance update is a relative operation (+ 11.00). If the transaction committed but the client retried because of a timeout, the balance would be updated again, transferring a total of $22 instead of $11.",
    section: "Duplicate suppression"
  },
  {
    type: "mc",
    q: "According to the end-to-end argument, what is the correct place to implement duplicate suppression for user requests?",
    options: [
      "Exclusively within the TCP protocol stack of the operating system kernel handling the connection sockets.",
      "Directly within the database engine's write locks and transaction isolation level control structures.",
      "With an application-level request identifier generated by the client and passed all the way to the storage engine.",
      "At the network load balancer level using specialized HTTP header analysis and connection tracking tables."
    ],
    correct: 2,
    explanation: "The end-to-end argument states that a function can only be completely implemented with the help of the endpoints. A client-generated request ID (idempotence key) passed to the database ensures duplicate requests are rejected regardless of connection drops or server restarts.",
    section: "The end-to-end argument"
  },
  {
    type: "write",
    q: "An engineer claims that because we are using TCP (which has checksums) and enterprise SSDs (which have ECC), our application is completely safe from data corruption and doesn't need its own application-level checksums or transaction audits. Cite the 'end-to-end argument' to explain why they are wrong.",
    hint: "Explain why lower-level safety nets cannot protect against data corruption caused by software bugs in memory, processor errors, or database logic.",
    modelAnswer: "The end-to-end argument states that a helper function (like duplicate suppression, encryption, or integrity checking) can only be completely and correctly implemented at the endpoints of the system. While TCP checksums and disk ECC detect corruption in transit or on sectors, they cannot detect data corrupted by software bugs in the application memory, server CPU errors, or bugs in the database code itself. To guarantee complete integrity, the application must perform end-to-end validation, such as signing data at the client and verifying the signature at the storage level.",
    section: "The end-to-end argument"
  },
  {
    type: "mc",
    q: "In a distributed system, why does enforcing a strict uniqueness constraint (such as a unique username) require consensus?",
    options: [
      "Because horizontal database sharding is mathematically impossible if primary key fields contain unique values.",
      "Because the system must decide which of two concurrent conflicting writes is accepted, requiring agreement and coordination.",
      "Because uniqueness constraints can only be validated using the Raft consensus protocol inside transaction managers.",
      "Because unique column attributes must always be stored in a centralized, un-replicated table to prevent corruption."
    ],
    correct: 1,
    explanation: "If two users concurrently claim the same username, the system must coordinate to accept one and reject the other. Without consensus, different nodes could concurrently accept both, violating uniqueness.",
    section: "Uniqueness constraints require consensus"
  },
  {
    type: "mc",
    q: "How can uniqueness constraints be enforced in an unbundled database using sharded logs and stream processors?",
    options: [
      "By executing a full Two-Phase Commit transaction across all independent log shards and database partitions for every single client write.",
      "By routing all requests for a specific value (e.g. username) to a single log shard where a single-threaded stream processor validates them sequentially.",
      "By completely disabling log partition sharding and forcing the system to run on a single, non-replicated global database server instance.",
      "By letting client applications write to any replica and subsequently resolve conflicting username entries using version vector clocks."
    ],
    correct: 1,
    explanation: "By routing all requests for a username to a shard determined by the hash of the username, a stream processor can sequentially and deterministically process requests on a single thread, accepting the first message and rejecting subsequent duplicates.",
    section: "Uniqueness in log-based messaging"
  },
  {
    type: "write",
    q: "You are designing a payment platform that must scale horizontally. You want to execute a transaction that debits a payer's account, credits a payee's account, and pays a platform fee—each stored on a different database shard—without using 2PC. Explain how you can achieve atomicity using sharded message logs and asynchronous processing.",
    hint: "Walk through the sequence: appending a single commit event to the payer's shard, emitting downstream credit events, and using idempotence keys/request IDs for deduplication.",
    modelAnswer: "A multishard transaction can be broken into stages using sharded logs. First, the payment request is appended to the payer's shard. A stream processor validates this request against the payer's local balance. If valid, it reserves the funds and emits outgoing/incoming payment events containing the request ID to the payee and fee shards. The payee and fee processors consume their respective shards asynchronously, applying the credits and ignoring duplicates based on the request ID. Atomicity is achieved because appending the initial event to the payer's log is the single atomic commit point; downstream updates are guaranteed to eventually execute.",
    section: "Multishard request processing"
  },
  {
    type: "mc",
    q: "How does the author define the distinction between 'timeliness' and 'integrity' in database consistency?",
    options: [
      "Timeliness means the database performs transactions quickly with sub-second latency, while integrity means the database has secure role-based access.",
      "Timeliness means ensuring users see up-to-date state (lag is temporary), while integrity means the absence of permanent corruption or contradictory data.",
      "Timeliness requires the query engine to run on relational schemas, while integrity requires document-oriented or key-value NoSQL database engines.",
      "There is no theoretical or physical distinction between the two; they are simply interchangeable synonyms for ACID database consistency constraints."
    ],
    correct: 1,
    explanation: "Timeliness is about lag (e.g., eventually consistent reads), which resolves itself simply by waiting. Integrity is about correctness (e.g., indexes matching tables, valid sums), and violations of integrity result in permanent database corruption.",
    section: "Timeliness and Integrity"
  },
  {
    type: "mc",
    q: "In an event-based dataflow system, how are timeliness and integrity related?",
    options: [
      "They are tightly coupled; the storage engine cannot maintain data integrity without ensuring immediate write timeliness.",
      "They are decoupled; the system can guarantee strict integrity (correct derivations and no lost writes) while allowing timeliness to lag.",
      "The system guarantees microsecond timeliness for client read requests but permits index integrity to be violated during write bursts.",
      "They are both completely obsolete concepts that are replaced by the linearizability guarantees defined in the PACELC and CAP theorems."
    ],
    correct: 1,
    explanation: "Asynchronous stream processors decouple timeliness and integrity. Because they process logs asynchronously, reads can be stale (low timeliness), but deterministic processing and at-least-once delivery ensure that all writes are correctly incorporated without corruption (high integrity).",
    section: "Correctness of dataflow systems"
  },
  {
    type: "write",
    q: "A booking system is grinding to a halt because it uses global database locks to ensure we never overbook a hotel room. To scale, you propose using 'loosely interpreted constraints' instead of blocking locks. Explain this concept to your team, giving a real-world example of how a business manages constraint violations after the fact.",
    hint: "Focus on how optimistic writes can be validated asynchronously and corrected using compensating transactions (apologies, refunds, or upgrades) rather than synchronous locks.",
    modelAnswer: "Loosely interpreted constraints allow temporary violations of rules to avoid the high cost of synchronous coordination. In airline overbooking, instead of using a global lock to strictly prevent double-booking, airlines allow overbooking to maximize occupancy. If too many passengers show up, the business handles the conflict with an apology workflow (providing refunds, travel vouchers, or upgrades). By replacing hard blocking checks with optimistic writes and compensating transactions (apologies), the system achieves massive throughput and availability while bounding business risk.",
    section: "Loosely interpreted constraints"
  },
  {
    type: "mc",
    q: "Why does ACID consistency (in the traditional transaction sense) fail to protect data integrity from application-level software bugs?",
    options: [
      "ACID consistency guarantees are structurally restricted to single-node databases and will fail to run on modern multi-core CPU architectures.",
      "Consistency in ACID assumes that transactions are bug-free; if a transaction writes incorrect data due to a bug, the database will faithfully commit it.",
      "Application-level software bugs and logic exceptions always bypass the database transaction manager driver, writing raw corrupt records directly to disk.",
      "Modern relational and document-oriented databases completely lack support for serializable transaction isolation levels or schema validation rules."
    ],
    correct: 1,
    explanation: "Consistency in ACID means the database goes from one valid state to another, defined by database constraints. However, if the application has a logic bug (e.g., updating the wrong balance or missing checks), the database cannot know the intent and will commit the corrupted data.",
    section: "Maintaining integrity in the face of software bugs"
  },
  {
    type: "mc",
    q: "Why does event sourcing provide better auditability compared to traditional update-in-place databases?",
    options: [
      "Event sourcing automatically encrypts all database rows and audit logs using homomorphic encryption keys, preventing any unauthorized modification.",
      "Event sourcing represents user inputs as immutable events, and derived state is created via deterministic functions that can be rerun to verify correctness.",
      "Event sourcing runs exclusively on decentralized, Byzantine fault-tolerant blockchain networks, which are cryptographically guaranteed to be secure.",
      "Event sourcing does not store any historical event records or transaction logs on disk, keeping all system state strictly in volatile memory arrays."
    ],
    correct: 1,
    explanation: "Because event sourcing records the raw, immutable input events, we can audibly trace exactly why mutations occurred, rerun the derivation pipeline to check for corruption, or debug system behavior by replaying events.",
    section: "Designing for auditability"
  },
  {
    type: "write",
    q: "Your financial platform wants to prove to regulators that transaction logs have not been retroactively tampered with, and that our read-only caches are 100% consistent with historical events. The management suggests building a blockchain. Propose a much faster, lighter-weight cryptographic auditing alternative.",
    hint: "Mention how we can use hash chains or Merkle trees (similar to Certificate Transparency) and background processes that continuously replay logs to verify state.",
    modelAnswer: "Standard systems can implement self-auditing by using lighter-weight cryptographic tools without full Byzantine consensus. For instance, like Certificate Transparency, they can use single-leader append-only event logs combined with Merkle trees (hash trees) to efficiently prove that transactions are unmodified and present in the log. Additionally, because the derived data pipeline is deterministic, auditing processes can run in the background, continuously replaying event logs to verify that the current database, search index, or cache state matches the rederived state, detecting corruption early.",
    section: "Tools for auditable data systems"
  }
];

const FLASHCARDS = [
  { front: "What is the core idea of unbundling a database?", back: "Separating a database's internal functions (like logs, indexes, and caches) into independent components composed via event logs." },
  { front: "How do timeliness and integrity differ in consistency?", back: "Timeliness is about lag (temporary stale reads). Integrity is about correctness (no permanent corruption or contradictory data)." },
  { front: "Why do distributed transactions (2PC/XA) amplify failures?", back: "Because they require all participant nodes to be healthy to commit; if a single node fails, the entire transaction aborts." },
  { front: "According to the end-to-end argument, why can't TCP/database deduplication alone prevent double payments?", back: "If a connection drops during commit, the client must reconnect and retry. The database sees this as a new request; only an end-to-end request ID generated by the client can deduplicate it." },
  { front: "What is a compensating transaction?", back: "A business workflow or transaction that corrects a previously committed action that violated a loose constraint (e.g., refunding a double charge)." },
  { front: "What is the primary trade-off of using a data lake (schema-on-read) over a data warehouse (schema-on-write)?", back: "Data lakes offer maximum flexibility for loading raw data, but slower query speeds. Data warehouses offer fast query performance but rigid schema changes." },
  { front: "How does the Kappa architecture handle batch processing?", back: "By replaying historical events stored in a log broker through the same stream processing engine used for real-time events." },
  { front: "What is the 'sushi principle' in data systems?", back: "The idea that 'raw data is better'—retaining unprocessed source data allows downstream applications maximum flexibility to interpret it in different ways." },
  { front: "What is a federated database (polystore)?", back: "A query interface that provides a unified read path across multiple separate, specialized underlying databases." },
  { front: "What is a coordination-avoiding data system?", back: "A distributed system that operates without synchronous lock coordination, accepting writes optimistically and resolving conflicts or constraint violations after the fact." },
  { front: "How do systems like S3 and HDFS detect silent data corruption?", back: "By running background auditing processes that continuously read files, compute checksums, and compare them across replicas (trust, but verify)." },
  { front: "What lighter-weight cryptographic auditing tool can we borrow from blockchains?", back: "Merkle trees (hash trees) to efficiently prove that a record is present in a log and has not been tampered with." }
];

const CONFIDENCE_LABELS = [
  "Unbundled database composition",
  "Timeliness vs. integrity",
  "End-to-end idempotence",
  "Coordination avoidance & apologies",
  "Log-based data integration & CDC",
  "Self-auditing & data validation"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 13", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 12 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Re-attempt Timeliness vs Integrity table from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach concepts to someone (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! Distributed transactions suffer from poor fault tolerance and performance because they require all participants to be online; if one node fails, the entire transaction aborts. An asynchronous, log-based derived data system (using CDC or event sourcing) is far more scalable and resilient.",
    true: "Actually, the chapter argues that distributed transactions are a major scalability bottleneck and failure amplifier. Asynchronous log-based integration is much more robust.",
    unsure: "Think about the impact of a single offline node on a two-phase commit protocol versus a log broker. The log broker buffers writes asynchronously, providing loose coupling."
  },
  m2: {
    false: "Correct! Eventual consistency is a violation of timeliness (readers might see stale data temporarily), not integrity. Integrity means the absence of corruption (no data loss or contradictory states). Stale reads resolve themselves by waiting, whereas database corruption is permanent.",
    true: "Not quite! The chapter draws a sharp line between timeliness and integrity. Eventual consistency means lag (timeliness), which is temporary and doesn't corrupt data (integrity).",
    unsure: "Think of your bank statement showing yesterday's balance vs your bank statement adding up numbers incorrectly. One is temporary lag, the other is permanent corruption."
  },
  m3: {
    false: "Correct! TCP duplicate suppression only works within a single TCP connection. If a connection drops (e.g. client timeout) after the client sends COMMIT but before receiving the response, the client must reconnect and retry, creating a new TCP connection and a duplicate transaction. This requires an end-to-end application-level request ID.",
    true: "Actually, if the network drops and the client reconnects, the database treats the retry as a brand new request, bypassing TCP deduplication. This is a classic violation of the end-to-end argument.",
    unsure: "Consider what happens if the network cable is unplugged after a write reaches the server but before the client gets the ACK. How does the client know what happened?"
  },
  m4: {
    true: "Correct! To guarantee that a negative balance is never written under concurrent operations, synchronous coordination (consensus) is unavoidable. However, many systems opt for 'coordination-avoidance' by letting writes go through and handling overdrafts after the fact via fees (apology workflow).",
    false: "Think about concurrent withdrawals. Without synchronous coordination, two nodes could concurrently approve a withdrawal that exceeds the balance. Thus, strict real-time constraint enforcement does require coordination.",
    unsure: "Consensus is equivalent to enforcing strict uniqueness or boundary constraints under concurrent writes. Look for the section on 'Uniqueness constraints require consensus.'"
  },
  m5: {
    false: "Correct! Blockchains have massive overhead due to Byzantine fault-tolerant consensus. However, their lighter-weight cryptographic components—like Merkle trees and signed logs (as used in Certificate Transparency)—can be applied to standard data systems to build highly scalable, self-auditing architectures.",
    true: "The chapter explains that blockchains have far too much overhead for most applications. Instead, we can extract lighter-weight auditing tools like Merkle trees without using Byzantine consensus.",
    unsure: "Blockchains solve the problem of trust among completely untrusted parties (Byzantine faults), which is rarely needed inside a single organization's data systems."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch13_learning';


function loadState() {
  return window.loadState ? window.loadState(STATE_KEY) : {};
}

function saveState(data) {
  if (window.saveState) {
    window.saveState(data, STATE_KEY);
  }
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
    const cachedState = loadState();
    if (cachedState.aiGrades) {
      renderAiGrades(cachedState.aiGrades);
    }
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
  saveState({ quizGraded: true });
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

async function gradeWriteIns() {
  const state = loadState();
  const writeIns = state.writeInAnswers || {};
  const answered = {};
  
  QUIZ_QUESTIONS.forEach((q, idx) => {
    if (q.type === 'write' && writeIns[idx] && writeIns[idx].trim().length > 0) {
      answered[idx] = writeIns[idx];
    }
  });

  if (Object.keys(answered).length === 0) {
    alert('Please answer at least one write-in question before grading.');
    return;
  }

  const response = await fetch('/grade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chapterKey: STATE_KEY,
      writeIns:   answered,
      username:   getCurrentUsername()
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  const currentState = loadState();
  currentState.aiGrades = data.grades;
  saveState(currentState);
  renderAiGrades(data.grades);
  return data;
}

function renderAiGrades(grades) {
  if (!grades) return;
  Object.keys(grades).forEach(idxStr => {
    const idx = parseInt(idxStr);
    const grade = grades[idxStr];
    const questionDiv = document.querySelector(`.quiz-question[data-q-index="${idx}"]`);
    if (!questionDiv) return;
    
    const existing = questionDiv.querySelector('.ai-grade-feedback');
    if (existing) existing.remove();
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'ai-grade-feedback';
    feedbackDiv.style.marginTop = '1rem';
    
    const scoreStars = "★".repeat(grade.score) + "☆".repeat(5 - grade.score);
    feedbackDiv.innerHTML = `
      <div class="grade-header">
        <span class="grade-title">🤖 AI Grading Feedback</span>
        <span class="grade-score">${scoreStars} (${grade.score}/5)</span>
      </div>
      <div class="grade-body">
        <div style="margin-bottom: 0.4rem;"><strong>Strengths:</strong> <span class="grade-strengths"></span></div>
        <div style="margin-bottom: 0.4rem;"><strong>Weaknesses/Gaps:</strong> <span class="grade-weaknesses"></span></div>
        <div><strong>Tutor Feedback:</strong> <span class="grade-feedback-text"></span></div>
      </div>
    `;
    feedbackDiv.querySelector('.grade-strengths').textContent = grade.strengths || 'None';
    feedbackDiv.querySelector('.grade-weaknesses').textContent = grade.weaknesses || 'None';
    feedbackDiv.querySelector('.grade-feedback-text').textContent = grade.feedback || 'None';
    
    questionDiv.appendChild(feedbackDiv);
  });
}

function setupLLMGrading() {
  const gradeBtn = document.getElementById('gradeWriteIns');
  if (gradeBtn) {
    gradeBtn.addEventListener('click', async () => {
      const originalText = gradeBtn.textContent;
      gradeBtn.textContent = 'Grading...';
      gradeBtn.disabled = true;
      try {
        const data = await gradeWriteIns();
        if (data && data.grades) {
          alert('Grading completed successfully!');
        }
      } catch (err) {
        console.error('Error during grading:', err);
        alert('Grading failed: ' + err.message);
      } finally {
        gradeBtn.textContent = originalText;
        gradeBtn.disabled = false;
      }
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

  const baseline = state.diagnosticBaseline || [3,3,3,3,3,3];
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
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initDb !== 'undefined') {
    await initDb();
  }
  const cachedUser = sessionStorage.getItem('ddia_active_user');
  if (cachedUser) {
    if (typeof getOrCreateUser !== 'undefined') {
      getOrCreateUser(cachedUser);
    }
    init();
  } else {
    window.location.href = '../index.html';
  }
});
