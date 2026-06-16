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
      "A general-purpose database cannot store more than a few gigabytes of data.",
      "Different access patterns (e.g., keyword search vs transactional lookups) require fundamentally different storage engine designs for optimal performance.",
      "Using a single database violates modern security and data privacy laws.",
      "Relational databases are incapable of performing joins across multiple tables."
    ],
    correct: 1,
    explanation: "No single storage format or indexing structure is optimal for all access patterns. For example, keyword search requires an inverted index, while transactional lookups are best served by B-trees or LSM-trees.",
    section: "Data Integration"
  },
  {
    type: "mc",
    q: "In a data integration architecture where a search index is maintained by capturing changes from a database, which system acts as the 'system of record'?",
    options: [
      "The search index, because it handles the user-facing search queries.",
      "The database, because it holds the authoritative version of the data where new data is first written.",
      "Both systems concurrently, as they must decide on the ordering of writes.",
      "The message broker or log that transports the changes."
    ],
    correct: 1,
    explanation: "The system of record holds the authoritative, canonical version of data. Any other representations (like the search index) are derived from the system of record and are therefore derived data systems.",
    section: "Reasoning about dataflows"
  },
  {
    type: "write",
    q: "Compare distributed transactions (like 2PC) with log-based derived data systems regarding performance, fault tolerance, and timeliness.",
    hint: "Consider how each approach handles a participant node going offline, and the speed at which updates are visible to reads.",
    modelAnswer: "Distributed transactions use an atomic commit protocol (like Two-Phase Commit) to apply updates synchronously across multiple systems, ensuring immediate read-after-write consistency (timeliness). However, they have poor fault tolerance because if a single participant fails, the entire transaction must abort, amplifying failures. Log-based derived data systems update systems asynchronously, which increases robustness and scalability because a slow or failed consumer doesn't block the producer, but it sacrifices timeliness by introducing eventual consistency lag.",
    section: "Derived data versus distributed transactions"
  },
  {
    type: "write",
    q: "Contrast the mechanism of atomic commit in distributed transactions with the recovery mechanism of log-based derived data systems.",
    hint: "Mention 2PC, retry, and idempotence.",
    modelAnswer: "Distributed transactions achieve correctness through atomic commit protocols like Two-Phase Commit (2PC), which abort the entire operation if any participant fails. In contrast, log-based derived state systems achieve correctness through deterministic processing, at-least-once message delivery, retrying failed processing stages, and ensuring all write operations are idempotent so that duplicate updates do not cause corruption.",
    section: "Derived data versus distributed transactions"
  },
  {
    type: "mc",
    q: "Why does scaling event throughput past a single machine's capacity limit the ability to maintain a total order of events?",
    options: [
      "Total order broadcast becomes mathematically impossible with more than one machine.",
      "Sharding the log across multiple machines means the order of events in two different shards is ambiguous without coordination.",
      "Consensus protocols cannot run on sharded databases.",
      "Network partitions are guaranteed to occur if event throughput exceeds 10,000 events per second."
    ],
    correct: 1,
    explanation: "To establish a total order, all events typically must pass through a single leader. If throughput requires sharding the log, there is no inherent sequence ordering between events that are appended to different shards.",
    section: "The limits of total ordering"
  },
  {
    type: "write",
    q: "Explain why a social media 'unfriend' event followed immediately by a 'post message' event can lead to a privacy violation if causal dependencies are not captured across separate databases.",
    hint: "Consider what happens if the friendship database and message database are updated independently and read by a notification system.",
    modelAnswer: "If friendship status and messages are stored in separate, uncoordinated databases, the relative ordering of updates is not guaranteed. If a user unfriends an ex-partner and then posts a message intended only for remaining friends, a notification service might process the 'post message' event before the 'unfriend' event has propagated to the friendship cache. This out-of-order execution causes a notification to be sent to the ex-partner, violating the user's privacy intentions.",
    section: "Ordering events to capture causality"
  },
  {
    type: "mc",
    q: "In the context of the Kappa architecture, how is application evolution (e.g., changing how a search index is computed) typically handled?",
    options: [
      "By performing a zero-downtime database schema migration using SQL triggers.",
      "By running a batch process on an offline data warehouse and performing a database restore.",
      "By replaying historical events through a new version of the stream processor and routing reads to the new view when ready.",
      "By halting all writes to the system while migrating historical files manually."
    ],
    correct: 2,
    explanation: "Kappa architecture unifies batch and stream processing by keeping historical events in a log. To evolve the app, you feed the historical event log into the new version of the stream processor, building a new derived view side-by-side with the old one, and gradually switch user reads.",
    section: "Reprocessing data for application evolution"
  },
  {
    type: "mc",
    q: "When bootstrapping a new change data capture (CDC) consumer or executing CREATE INDEX on a live database, what is the correct chronological sequence of steps required to build a consistent derived view?",
    options: [
      "1) Stop all writes to parent tables, 2) build the index from a snapshot, 3) resume writes and stream updates directly to users.",
      "1) Take a consistent snapshot of the source table, 2) build the initial index/view from that snapshot, 3) apply accumulated log updates to catch up, 4) start streaming live updates.",
      "1) Listen to the live change stream to collect new writes, 2) sort the collected writes, 3) overwrite historical table partitions.",
      "1) Write all new transactions directly to both the parent table and the index, 2) run a background garbage collector to reconcile differences."
    ],
    correct: 1,
    explanation: "Executing `CREATE INDEX` or initializing CDC requires building the derived view from a consistent snapshot of the source table (the backfill), then consuming the transaction log (change stream) to apply any writes that occurred after the snapshot was taken, and finally transitioning to processing live log events. This avoids having to halt parent writes during index creation.",
    section: "Creating an index"
  },
  {
    type: "write",
    q: "Explain the concept of 'unbundling databases' as described by the author, and compare it with the Unix philosophy.",
    hint: "Discuss how write synchronization, transaction logs, indexes, and caching are separated, and how they communicate.",
    modelAnswer: "Unbundling databases means taking the internal components of a single integrated database (such as the transaction log, secondary indexes, caches, and query processor) and separating them into independent tools run on different machines. This mirrors the Unix philosophy of composing small, specialized tools that do one thing well. In an unbundled system, a log-based message broker serves as the central transaction log (write synchronization), while specialized databases, search indexes, and caches act as derived views, kept in sync via change data capture streams (acting like Unix pipes).",
    section: "Unbundled databases"
  },
  {
    type: "write",
    q: "Explain the role and mechanism of federated databases (polystores) in data integration, and how they differ from unbundled databases.",
    hint: "Think about unifying reads vs unifying writes.",
    modelAnswer: "Federated databases (or polystores) unify reads by providing a single, consistent query interface (like SQL) across multiple underlying, heterogeneous storage engines. They map queries to individual engines dynamically. They differ from unbundled databases because, while federation can route writes through query rewriters in some polystores, its key distinction is that it doesn't enforce write synchronization across systems or produce change logs. Unbundled databases focus on write synchronization, using log-based change data capture streams to keep derived data systems in sync asynchronously.",
    section: "The meta-database of everything"
  },
  {
    type: "mc",
    q: "What is a major advantage of the dataflow approach over the microservices approach when performing operations that require external data (e.g., currency conversion)?",
    options: [
      "The dataflow approach uses synchronous REST calls, which are easier to debug.",
      "The dataflow approach subscribes to a stream of updates ahead of time, storing them locally, which replaces synchronous network queries with fast local lookups.",
      "The dataflow approach eliminates the need for any local storage.",
      "The dataflow approach guarantees that the currency exchange rates are always linearizable."
    ],
    correct: 1,
    explanation: "By subscribing to exchange rate updates asynchronously and storing the current state in a local database, the dataflow service can process purchase transactions instantly without making synchronous network requests, increasing speed and fault isolation.",
    section: "Stream processors and services"
  },
  {
    type: "write",
    q: "Explain why the dataflow approach of subscribing to state updates ahead of time makes services more resilient to network failures compared to RPC/REST microservices.",
    hint: "What happens when the currency exchange rate service goes down in both architectures?",
    modelAnswer: "In a REST/RPC microservices architecture, if the currency exchange rate service goes down, the purchase service fails immediately because it cannot make the synchronous network request to fetch the rate. In the dataflow architecture, the purchase service maintains a local cache of the exchange rates updated by a stream. If the exchange service goes down, the purchase service can still process orders using the last known exchange rate stored locally, containing the failure and maintaining service availability.",
    section: "Stream processors and services"
  },
  {
    type: "mc",
    q: "In terms of the 'write path' and 'read path,' how can we conceptualize the role of database indexes and caches?",
    options: [
      "They are lazy evaluation mechanisms that run only when a query fails.",
      "They shift the boundary between the read path and write path, doing more work at write time to save work at read time.",
      "They are hardware-specific features that eliminate the need for CPU processing.",
      "They represent the raw, un-derived system of record."
    ],
    correct: 1,
    explanation: "Caches and indexes are precomputed structures. By spending write-time resources to update them eagerly, we drastically reduce the work (e.g., full-table scans) required to serve queries on the read path.",
    section: "Materialized views and caching"
  },
  {
    type: "mc",
    q: "In local-first software and offline-capable clients, how should we conceptualize the state stored on the user's device?",
    options: [
      "It is the absolute system of record for the entire company.",
      "It is a local replica or cache of the server state, and the UI is a materialized view of that local state.",
      "It is a stateless buffer that must be wiped whenever connection is lost.",
      "It is an un-derivable data source that cannot be synchronized with other devices."
    ],
    correct: 1,
    explanation: "Local-first software treats the device's storage as a local replica of the server state. The UI rendering on the screen is effectively a materialized view derived from this local model, and background sync engines propagate changes to and from the server.",
    section: "Stateful, offline-capable clients"
  },
  {
    type: "write",
    q: "Describe how the write path can be extended all the way to the end user, and how this relates to request/response vs publish/subscribe models.",
    hint: "Think about EventSource/WebSockets and how client devices act like log subscribers.",
    modelAnswer: "Extending the write path to the end user means actively pushing state changes from the server to connected client devices in real-time, rather than having clients poll for updates. Using WebSockets or Server-Sent Events, the server treats each client as an event log subscriber. When a write occurs on the server, it propagates downstream through event logs and stream processors, and the server pushes the update directly to the client device, which updates its local state and UI immediately, moving away from request/response to publish/subscribe dataflow.",
    section: "Pushing state changes to clients"
  },
  {
    type: "mc",
    q: "What is a potential benefit of representing read queries as events and sending them through a stream processor?",
    options: [
      "It makes read queries 100% linearizable without any database storage.",
      "It enables precise tracking of causal dependencies and data provenance by recording exactly what the user saw before taking an action.",
      "It reduces CPU and disk I/O overhead to zero.",
      "It eliminates the need for sharding database records."
    ],
    correct: 1,
    explanation: "If read queries are logged as events, they can be joined with write events, allowing the system to record and verify exactly what state of the system a user was looking at (e.g., inventory and shipping dates) when they clicked 'buy'.",
    section: "Reads are events too"
  },
  {
    type: "mc",
    q: "Under what circumstances does treating queries as event streams and executing them through a stream processor become highly useful?",
    options: [
      "When queries are simple single-row primary key lookups.",
      "When performing complex distributed joins that must combine data from differently sharded datasets.",
      "When the database uses single-leader replication.",
      "When client devices have high-bandwidth, 100% reliable network connections."
    ],
    correct: 1,
    explanation: "For complex multishard joins (such as fraud detection combining sharded email, billing, and IP reputation scores), the stream processor's message routing and partitioning infrastructure provides a powerful framework for distributed execution.",
    section: "Multishard data processing"
  },
  {
    type: "write",
    q: "Explain why TCP connection-level deduplication is insufficient to guarantee 'exactly-once' execution when a client times out while committing a transaction.",
    hint: "What happens on the client side when the network drops before they get a response, and how does the retry appear to the database?",
    modelAnswer: "TCP sequence numbers only suppress duplicate packets within a single TCP connection. If a network interruption occurs after the database commits a transaction but before the client receives the confirmation, the TCP connection times out and is closed. To retry, the client must open a new TCP connection and submit the transaction again. From the database's perspective, this is a brand-new transaction request, which it will execute a second time, potentially causing double execution (e.g., transferring funds twice).",
    section: "Exactly-once execution of an operation"
  },
  {
    type: "mc",
    q: "In Example 13-1 (transferring money by updating balances directly), what makes the transaction dangerous to retry after a client timeout?",
    options: [
      "The SQL statement UPDATE accounts SET balance = balance + 11.00 is non-idempotent.",
      "The database will automatically lock the accounts forever.",
      "The transaction is missing a BEGIN TRANSACTION statement.",
      "It uses 2PC, which always fails on network timeouts."
    ],
    correct: 0,
    explanation: "The balance update is a relative operation (+ 11.00). If the transaction committed but the client retried because of a timeout, the balance would be updated again, transferring a total of $22 instead of $11.",
    section: "Duplicate suppression"
  },
  {
    type: "mc",
    q: "According to the end-to-end argument, what is the correct place to implement duplicate suppression for user requests?",
    options: [
      "Only in the TCP protocol stack of the operating system.",
      "In the database engine's write locks.",
      "With an application-level request identifier generated by the client and passed all the way to the storage engine.",
      "On the load balancer using HTTP header analysis."
    ],
    correct: 2,
    explanation: "The end-to-end argument states that a function can only be completely implemented with the help of the endpoints. A client-generated request ID (idempotence key) passed to the database ensures duplicate requests are rejected regardless of connection drops or server restarts.",
    section: "The end-to-end argument"
  },
  {
    type: "write",
    q: "State the 'end-to-end argument' and explain how it applies to ensuring data integrity in networks and storage drives.",
    hint: "Why aren't TCP checksums and hard drive error correction codes (ECC) enough on their own?",
    modelAnswer: "The end-to-end argument states that a helper function (like duplicate suppression, encryption, or integrity checking) can only be completely and correctly implemented at the endpoints of the system. While TCP checksums and disk ECC detect corruption in transit or on sectors, they cannot detect data corrupted by software bugs in the application memory, server CPU errors, or bugs in the database code itself. To guarantee complete integrity, the application must perform end-to-end validation, such as signing data at the client and verifying the signature at the storage level.",
    section: "The end-to-end argument"
  },
  {
    type: "mc",
    q: "In a distributed system, why does enforcing a strict uniqueness constraint (such as a unique username) require consensus?",
    options: [
      "Because sharding is impossible if data is unique.",
      "Because the system must decide which of two concurrent conflicting writes is accepted, which requires agreement and coordination.",
      "Because unique constraints can only be validated using the Raft protocol.",
      "Because unique columns are always stored in a centralized, un-replicated table."
    ],
    correct: 1,
    explanation: "If two users concurrently claim the same username, the system must coordinate to accept one and reject the other. Without consensus, different nodes could concurrently accept both, violating uniqueness.",
    section: "Uniqueness constraints require consensus"
  },
  {
    type: "mc",
    q: "How can uniqueness constraints be enforced in an unbundled database using sharded logs and stream processors?",
    options: [
      "By running a 2PC transaction across all log shards for every write.",
      "By routing all requests for a specific value (e.g. username) to a single log shard where a single-threaded stream processor validates them sequentially.",
      "By disabling sharding and using a single global database server.",
      "By letting clients resolve conflicts using vector clocks after writing."
    ],
    correct: 1,
    explanation: "By routing all requests for a username to a shard determined by the hash of the username, a stream processor can sequentially and deterministically process requests on a single thread, accepting the first message and rejecting subsequent duplicates.",
    section: "Uniqueness in log-based messaging"
  },
  {
    type: "write",
    q: "Explain how a multishard payment transaction (e.g., debiting a payer, crediting a payee, and crediting a fee account) can be processed atomically without using distributed transactions or 2PC.",
    hint: "Describe the sequence of stages using sharded logs, local state, and unique request IDs.",
    modelAnswer: "A multishard transaction can be broken into stages using sharded logs. First, the payment request is appended to the payer's shard. A stream processor validates this request against the payer's local balance. If valid, it reserves the funds and emits outgoing/incoming payment events containing the request ID to the payee and fee shards. The payee and fee processors consume their respective shards asynchronously, applying the credits and ignoring duplicates based on the request ID. Atomicity is achieved because appending the initial event to the payer's log is the single atomic commit point; downstream updates are guaranteed to eventually execute.",
    section: "Multishard request processing"
  },
  {
    type: "mc",
    q: "How does the author define the distinction between 'timeliness' and 'integrity' in database consistency?",
    options: [
      "Timeliness means the database is fast, while integrity means it is secure.",
      "Timeliness means ensuring users see up-to-date state (lag is temporary), while integrity means the absence of permanent corruption or contradictory data.",
      "Timeliness requires relational databases, while integrity requires NoSQL databases.",
      "There is no distinction; they are two terms for the same concept."
    ],
    correct: 1,
    explanation: "Timeliness is about lag (e.g., eventually consistent reads), which resolves itself simply by waiting. Integrity is about correctness (e.g., indexes matching tables, valid sums), and violations of integrity result in permanent database corruption.",
    section: "Timeliness and Integrity"
  },
  {
    type: "mc",
    q: "In an event-based dataflow system, how are timeliness and integrity related?",
    options: [
      "They are tightly coupled; you cannot have integrity without timeliness.",
      "They are decoupled; the system can guarantee strict integrity (correct derivations and no lost writes) while allowing timeliness to lag.",
      "The system guarantees timeliness but allows integrity to be violated.",
      "They are both replaced by the CAP theorem."
    ],
    correct: 1,
    explanation: "Asynchronous stream processors decouple timeliness and integrity. Because they process logs asynchronously, reads can be stale (low timeliness), but deterministic processing and at-least-once delivery ensure that all writes are correctly incorporated without corruption (high integrity).",
    section: "Correctness of dataflow systems"
  },
  {
    type: "write",
    q: "Explain the concept of 'loosely interpreted constraints' (or apology workflows) and how they allow systems to avoid expensive synchronous coordination.",
    hint: "Use a real-world example like airline overbooking, hotel reservations, or bank overdraft fees.",
    modelAnswer: "Loosely interpreted constraints allow temporary violations of rules to avoid the high cost of synchronous coordination. In airline overbooking, instead of using a global lock to strictly prevent double-booking, airlines allow overbooking to maximize occupancy. If too many passengers show up, the business handles the conflict with an apology workflow (providing refunds, travel vouchers, or upgrades). By replacing hard blocking checks with optimistic writes and compensating transactions (apologies), the system achieves massive throughput and availability while bounding business risk.",
    section: "Loosely interpreted constraints"
  },
  {
    type: "mc",
    q: "Why does ACID consistency (in the traditional transaction sense) fail to protect data integrity from application-level software bugs?",
    options: [
      "ACID consistency only works on single-core CPUs.",
      "Consistency in ACID assumes that transactions are bug-free; if a transaction writes incorrect data due to a bug, the database will faithfully commit it.",
      "Application-level bugs always bypass the database entirely.",
      "Modern databases do not support transaction isolation."
    ],
    correct: 1,
    explanation: "Consistency in ACID means the database goes from one valid state to another, defined by database constraints. However, if the application has a logic bug (e.g., updating the wrong balance or missing checks), the database cannot know the intent and will commit the corrupted data.",
    section: "Maintaining integrity in the face of software bugs"
  },
  {
    type: "mc",
    q: "Why does event sourcing provide better auditability compared to traditional update-in-place databases?",
    options: [
      "Event sourcing automatically encrypts all database fields.",
      "Event sourcing represents user inputs as immutable events, and derived state is created via deterministic functions that can be rerun to verify correctness.",
      "Event sourcing runs on blockchains, which are inherently secure.",
      "Event sourcing does not store any historical data on disk."
    ],
    correct: 1,
    explanation: "Because event sourcing records the raw, immutable input events, we can audibly trace exactly why mutations occurred, rerun the derivation pipeline to check for corruption, or debug system behavior by replaying events.",
    section: "Designing for auditability"
  },
  {
    type: "write",
    q: "Explain how standard data systems can implement self-auditing or self-validation without paying the high performance penalty of Byzantine fault-tolerant blockchains.",
    hint: "Mention Certificate Transparency, Merkle trees, and event replay.",
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
      let prompt = `You are grading a student's responses to Chapter 13 ("A Philosophy of Streaming Systems") of Designing Data-Intensive Applications.
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
- A custom 1-2 sentence recommendation on which specific sub-sections of Chapter 13 (e.g. Data Integration, Unbundling Databases, Timeliness and Integrity, Correctness) they should review.`;

      promptArea.value = prompt;
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

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
document.addEventListener('DOMContentLoaded', init);
