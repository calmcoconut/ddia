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
