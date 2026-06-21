/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   Chapter 12: Stream Processing
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the primary difference between a batch processor and a stream processor regarding input data boundedness?",
    options: [
      "Batch processing processes bounded data of a known, finite size; stream processing processes unbounded data that arrives incrementally.",
      "Batch processing handles only static text files on shared disks; stream processing handles only binary stream objects over network sockets.",
      "Batch processing is always executed synchronously in single threads; stream processing is always executed asynchronously in parallel nodes.",
      "Batch processing stores all input datasets in local volatile memory; stream processing stores and indexes them directly on persistent disk."
    ],
    correct: 0,
    explanation: "Batch processes work on bounded datasets (like a file or directory), whereas stream processes work on unbounded datasets that never end and must be processed incrementally as they arrive.",
    section: "Introduction"
  },
  {
    type: "mc",
    q: "Which of the following is a key characteristic of traditional JMS/AMQP style message brokers?",
    options: [
      "They retain all historical messages indefinitely on disk to support future replay and audits by separate consumers.",
      "They track consumer read progress within partitions using log offsets managed and stored by the broker service.",
      "They are optimized for short queues and delete messages as soon as they are successfully acknowledged by consumers.",
      "They require consumers to connect via low-latency UDP multicast protocols to stream events directly between tasks."
    ],
    correct: 2,
    explanation: "Traditional JMS/AMQP style message brokers (like RabbitMQ) are designed to route and deliver messages to consumers, deleting them as soon as they are processed. They assume queues are short.",
    section: "Messaging Systems"
  },
  {
    type: "write",
    q: "During a post-mortem review after your RabbitMQ cluster ran out of memory because consumers couldn't keep up with a spike, a senior engineer suggests replacing it with Apache Kafka. How does the fundamental storage and consumption model of a log-based broker like Kafka prevent this 'short queue' memory pressure while handling multiple consumers at their own pace?",
    hint: "Contrast how JMS/AMQP brokers handle message deletion upon acknowledgment vs how log-based brokers write to append-only logs on disk and use consumer-tracked offsets.",
    modelAnswer: "In a traditional message broker, messages are deleted from the queue once they are acknowledged by consumers, and the queue is expected to remain short. In contrast, a log-based message broker writes all messages to an append-only log on disk, where they are retained for a configured duration. Consumers read the log sequentially and track their own progress using a log offset, which allows multiple independent consumers to read the same stream at their own pace and replay messages if necessary.",
    section: "Partitioned Logs"
  },
  {
    type: "mc",
    q: "In a log-based message broker, what is the role of a consumer offset?",
    options: [
      "It defines the specific partition ID to which a producer must write its next event payload.",
      "It represents the exact byte size of the message currently being processed by the worker node.",
      "It is a sequential number tracking the consumer's read progress within a partition log.",
      "It is the symmetric encryption key used to decode sensitive event payloads in transit."
    ],
    correct: 2,
    explanation: "The offset is a monotonically increasing integer that tracks the next record a consumer group is due to read from a log partition. It allows the consumer to resume reading correctly after a crash.",
    section: "Partitioned Logs"
  },
  {
    type: "write",
    q: "A developer on your high-frequency trading desk wants to strip out the centralized message broker to use direct UDP multicast or HTTP Webhooks for service-to-service communication. You need to write a design doc outlining the trade-offs: what do we gain in performance, and what operational risks do we introduce when subscriber nodes fail or encounter sudden traffic spikes?",
    hint: "Consider the contrast between low latency/low overhead and the lack of message durability, buffer management, or consumer offline support in brokerless architectures.",
    modelAnswer: "Direct, brokerless messaging (such as UDP multicast in finance or HTTP webhooks) achieves low latency and avoids the overhead of a centralized broker server. However, it requires the sender to handle delivery retries and buffers, and it fails when the consumer is offline or crashes. Centralized message brokers add a hop (increasing latency) but handle consumer offline states, absorb spikes with large queues, and offer durability guarantees, simplifying client-side error handling.",
    section: "Messaging Systems"
  },
  {
    type: "mc",
    q: "What is the primary technical risk of 'dual writes' when attempting to keep a database and a search index in sync?",
    options: [
      "The search index will reject incoming updates that do not match its relational schema, causing runtime errors.",
      "Network partitions or client crashes can cause one write to succeed while the other fails, leading to permanent inconsistency.",
      "Writing to two systems simultaneously always doubles the network and storage cost of subsequent database read operations.",
      "Relational databases do not support writing from applications that maintain concurrent connections to secondary indexes."
    ],
    correct: 1,
    explanation: "Without atomic transactions across both systems, dual writes easily go out of sync if one write fails due to network issues, client crashes, or concurrent race conditions where updates arrive in different orders at the database and the index.",
    section: "Keeping Systems in Sync"
  },
  {
    type: "mc",
    q: "In Change Data Capture (CDC), how does the system capture database updates to propagate them to downstream systems?",
    options: [
      "By polling the database with periodic SELECT queries checking updated timestamps.",
      "By reading the database's internal replication log or write-ahead log directly.",
      "By intercepting and replicating database writes in the application-level logic.",
      "By exporting the entire database to CSV file segments at regular hourly gaps."
    ],
    correct: 1,
    explanation: "CDC systems read the database's internal replication log (or transaction log) to extract all inserts, updates, and deletes, converting them into a stream of change events that can be mirrored elsewhere.",
    section: "Change Data Capture"
  },
  {
    type: "write",
    q: "At a system architecture alignment meeting, two teams are debating: one wants to capture updates from a PostgreSQL write-ahead log to populate Elasticsearch (CDC), while the other wants to build a system where the business domain events themselves are written to an append-only log as the primary source of truth (Event Sourcing). Explain the key differences between these two patterns, and identify which system considers the database the system of record.",
    hint: "Focus on whether the application's write path updates a traditional database table first (generating events from a log) or writes to an immutable event log first (deriving read views from it).",
    modelAnswer: "In Change Data Capture (CDC), the application updates the relational database normally (making the database the source of truth), and the database log is mined to produce a stream of events for downstream systems. In Event Sourcing, the application state is modeled as an immutable log of events where the events themselves are the primary source of truth. The database state (read views) is derived by playing the events forward, making state changes explicit and auditable.",
    section: "Event Sourcing"
  },
  {
    type: "mc",
    q: "What does 'log compaction' do in a log-based stream or database?",
    options: [
      "It compresses physical log files using GZIP or Snappy algorithms to reduce disk usage.",
      "It discards old log records, keeping only the most recent update for each unique key.",
      "It merges multiple independent log partitions into a single unified global partition.",
      "It deletes all historical records in the log that exceed a static 24-hour retention window."
    ],
    correct: 1,
    explanation: "Log compaction garbage-collects old updates for a key, keeping only the latest state. This allows a log to be replayed from the beginning to restore state without processing redundant intermediate updates.",
    section: "Change Data Capture"
  },
  {
    type: "write",
    q: "A pager alert wakes you up at 3:00 AM. A dashboard is showing a massive spike in user click rates, but the actual HTTP request rate is completely flat. You discover a popular mobile game app just reconnected to the network after a long subway outage and uploaded hours of buffered events. Why does using processing time instead of event time cause this dashboard anomaly, and what challenges do you face if you switch?",
    hint: "Think about when the event actually occurred on the device vs when it reached the server, and the complexity of late-arriving data in window aggregations.",
    modelAnswer: "When a user device goes offline, it buffers events locally. Upon reconnecting, it uploads these events hours or days later. If the stream processor uses processing time (when the server receives them), these events are aggregated into the current time window, causing artificial spikes in the dashboard. If the stream processor uses event time (when the events occurred), it must handle late-arriving data by either updating past windows or using watermarks to close windows, which introduces trade-offs in correctness and latency.",
    section: "Reasoning About Time"
  },
  {
    type: "mc",
    q: "In stream processing, what is 'event time'?",
    options: [
      "The current system clock timestamp of the machine executing the stream processor.",
      "The time at which the event occurred, typically recorded on the producing device.",
      "The total duration of time required to process the event through the pipeline stages.",
      "The scheduled clock time when a downstream batch job starts consuming the events."
    ],
    correct: 1,
    explanation: "Event time is the time when the event originally happened according to the clock of the device that generated it (e.g., a phone, sensor, or server).",
    section: "Reasoning About Time"
  },
  {
    type: "mc",
    q: "Which window type has a fixed length, and partitions events such that every event belongs to exactly one window?",
    options: [
      "A sliding window, which is defined by events occurring within a target duration",
      "A session window, which dynamically expands and closes after a gap of inactivity",
      "A tumbling window, which divides time into contiguous, non-overlapping segments",
      "A hopping window, which moves forward by a step size that is smaller than its length"
    ],
    correct: 2,
    explanation: "Tumbling windows have a fixed duration (e.g., 5 minutes) and do not overlap. Every event falls into exactly one window based on its timestamp.",
    section: "Reasoning About Time"
  },
  {
    type: "write",
    q: "Your product manager wants to analyze shopping behavior by grouping clicks that occur together and ending the window once a user has been inactive for 30 minutes. A junior developer suggests using a standard 30-minute tumbling window. Explain why a tumbling window is unsuitable here, and how a session window dynamically adapts to user activity patterns.",
    hint: "Think about user activity patterns, inactivity gaps, and why session windows do not have fixed grid boundaries.",
    modelAnswer: "A session window has no fixed duration. It is defined dynamically based on user activity: it groups together all events for the same user that occur closely together in time, and the window closes only when the user is inactive for a specified threshold (e.g., 30 minutes of no events). Unlike tumbling and hopping windows, which have pre-defined, fixed time boundaries, session windows adapt to the actual user session behavior and vary in size.",
    section: "Reasoning About Time"
  },
  {
    type: "mc",
    q: "What is a 'watermark' in stream processing?",
    options: [
      "A cryptographic signature embedded in headers confirming the data integrity of raw streaming events.",
      "A temporal threshold indicating that no more events with timestamps prior to the watermark are expected.",
      "The maximum buffer memory size allocated for storing event states before writing to local database disks.",
      "A metadata marker indicating that a log partition has reached its configured retention size or disk quota."
    ],
    correct: 1,
    explanation: "A watermark is a progress indicator in event time. It tells the stream processor that it can assume it has received all events up to a certain timestamp, allowing it to close windows and output aggregates.",
    section: "Reasoning About Time"
  },
  {
    type: "write",
    q: "You are designing an ad-click enricher that joins a real-time stream of click events with a user profile database. If a user clicks an ad and then immediately updates their location in their profile, but the update event gets slightly delayed, the click might be joined with the wrong location. Explain how this mutable stream-table join introduces non-determinism, and how it could be made deterministic.",
    hint: "Consider how joining a click stream against in-place updates to a database table depends on the timing of processing, and how point-in-time state histories resolve this.",
    modelAnswer: "A stream-table join enriches a stream of events with information from a database table (e.g., joining user click events with their user profile records). If the database table is mutable (updates occur in place), the join is non-deterministic because a late-arriving event or a delayed database update can change the join result depending on whether the click event is processed before or after the profile update. To make it deterministic, the join must align with the historical version of the table matching the event's timestamp.",
    section: "Stream Joins"
  },
  {
    type: "mc",
    q: "Which type of stream join requires buffering events from both input streams in time windows to match related keys?",
    options: [
      "A stream-table join, which enriches incoming stream events with relational database rows",
      "A table-table join, which materializes and maintains a join view between two databases",
      "A stream-stream join, which matches and joins events from two active streams within a window",
      "A compacted log join, which matches new events against only the latest value of each key"
    ],
    correct: 2,
    explanation: "A stream-stream join (such as matching search queries with search clicks) requires buffering events from both streams for a specific window of time because the matching events can arrive out of order and with variable latency.",
    section: "Stream Joins"
  },
  {
    type: "mc",
    q: "What is the primary concern when performing table-table joins in stream processing?",
    options: [
      "Table-table joins are exclusively supported inside relational databases and cannot be run on stream processor clusters.",
      "They require maintaining materialized views of both tables, where updates to either table trigger updates to the join result.",
      "They require converting all table records into binary format structures before any join attributes can be compared.",
      "They only complete successfully if both input tables contain identical partition keys, schemas, and total row counts."
    ],
    correct: 1,
    explanation: "Table-table joins (e.g., joining a users table with a subscriptions table) are equivalent to maintaining a materialized view of the join. Changes to either table require updating the joined state, which requires indexing both inputs.",
    section: "Stream Joins"
  },
  {
    type: "write",
    q: "During a technical design review, a lead engineer demands a network protocol that guarantees a message is transmitted over the Internet and received 'exactly once' at the network transport layer. After explaining why network-level exactly-once delivery is physically impossible, how do you explain to them that stream processors still achieve 'exactly-once' processing semantics in practice?",
    hint: "Explain why network retries are inevitable when ACKs are lost, and how stream processors use idempotent operations or atomic commits to make duplicate processing transparent.",
    modelAnswer: "It is impossible to guarantee that a network message is sent exactly once because if an acknowledgement is lost or delayed, the sender must retransmit, causing the message to be delivered again (at-least-once). Stream processors achieve the illusion of 'exactly-once' semantics by making the processing side-effects idempotent (so processing the same message twice does not change the result) or by using atomic commits (e.g., writing state updates and sending downstream messages in a single transaction). However, if the output sink (like an external database or email service) is non-idempotent or does not participate in the stream processor's transaction protocol, duplicate operations will still be visible externally.",
    section: "Fault Tolerance"
  },
  {
    type: "mc",
    q: "How does the microbatching model (used in Apache Spark Streaming) achieve fault tolerance?",
    options: [
      "By replicating every active stream processor node ten times across independent availability zones in the cloud.",
      "By treating the stream as a series of short, bounded batch jobs and saving checkpoints to a reliable filesystem.",
      "By forcing client applications to cache all emitted events in local memory until final pipeline stages complete.",
      "By dropping any out-of-order events that cannot be processed immediately by active, thread-pooled executors."
    ],
    correct: 1,
    explanation: "Microbatching divides the stream into small chunks (e.g., 1-second batches). Because each microbatch is a small batch job, the engine can use traditional batch fault-tolerance mechanisms, re-running a batch if a worker node crashes.",
    section: "Fault Tolerance"
  },
  {
    type: "mc",
    q: "Which of the following operations is inherently idempotent?",
    options: [
      "Incrementing a metrics counter value by 1.",
      "Appending a log message to a dynamic list.",
      "Setting the status of an order to 'SHIPPED'.",
      "Withdrawing exactly $10 from a bank account."
    ],
    correct: 2,
    explanation: "Setting an order's status to 'SHIPPED' is idempotent because executing it multiple times has the same outcome as executing it once. In contrast, incrementing, appending, and withdrawing are not idempotent.",
    section: "Fault Tolerance"
  },
  {
    type: "write",
    q: "During a database failover, your stream consumer node restarts and re-processes the last 5 minutes of billing events. Because some messages are processed twice, the accounting ledger shows duplicate charges for the same transactions. Explain how designing your state updates to be idempotent would resolve this issue.",
    hint: "Define idempotence in the context of state updates and explain how it renders duplicated processing of duplicate events harmless.",
    modelAnswer: "An idempotent operation is one that can be executed multiple times and produces the same system state as if it were run only once. In stream processing, duplicates are common due to retries after network failures or node crashes. If state updates are designed to be idempotent (e.g., updating a value with a unique timestamp or setting status by ID), the processor can safely replay and reprocess duplicate events without risking incorrect calculations, such as double-counting.",
    section: "Fault Tolerance"
  },
  {
    type: "mc",
    q: "What is a main limitation of log immutability when dealing with modern data regulations?",
    options: [
      "Immutable logs exhibit severe write latency penalties when run on standard enterprise-grade SSD storage arrays.",
      "They make it difficult to satisfy the GDPR 'right to be forgotten' because rewriting history is technically complex.",
      "They cannot be replicated across multiple machines without triggering partition splits and split-brain scenarios.",
      "They require specialized operating system kernels and system call libraries to enforce append-only file writes."
    ],
    correct: 1,
    explanation: "Laws like GDPR require companies to delete a user's data upon request. In an append-only, immutable event log, deleting data requires rewriting the historical log or using workarounds like cryptographic erasure (key shredding) to render the data unreadable.",
    section: "State, Streams, and Immutability"
  },
  {
    type: "mc",
    q: "In log-based message brokers, what happens when multiple consumers read the same log partition?",
    options: [
      "They compete for messages; each message is delivered to only one active consumer node.",
      "They can each read the entire log independently without affecting other consumer groups.",
      "The broker locks the partition for the first active consumer, blocking all other reads.",
      "The message payloads are physically duplicated in disk storage for each consumer queue."
    ],
    correct: 1,
    explanation: "Log-based message brokers act like files on disk. Multiple independent consumers can read the same partition sequentially, each tracking its own offset, without removing data or affecting other readers.",
    section: "Partitioned Logs"
  },
  {
    type: "write",
    q: "Your company receives a GDPR 'right to erasure' request from a former customer. However, your core application state is constructed by reading an immutable, append-only Kafka event log. Explain the technical conflict between log immutability and data privacy laws, and discuss how you can satisfy the deletion request.",
    hint: "Consider the difficulty of modifying append-only historical records, and workarounds like cryptographic erasure (key shredding) or log compaction tombstones.",
    modelAnswer: "Immutability is an excellent default for audit logs and system recovery, but it conflicts with regulatory requirements like GDPR's 'right to erasure.' Deleting a user's data from an immutable log requires either rewriting the entire history to exclude their events, which is extremely expensive, or employing workarounds. These workarounds include using log compaction (which only keeps the latest event key, which could be set to null) or cryptographic erasure, where the user's data is encrypted with a unique key, and deleting that key makes the log data unrecoverable.",
    section: "State, Streams, and Immutability"
  },
  {
    type: "mc",
    q: "How does Flink or Samza maintain state (like join buffers or aggregate values) in a way that is fault-tolerant without relying on a centralized database?",
    options: [
      "By writing and serializing all dynamic pipeline state directly to client-side cookie stores or local application memory buffers.",
      "By maintaining local state (e.g., in RocksDB) and writing a changelog stream of state updates back to a partitioned log broker like Kafka.",
      "By performing continuous peer-to-peer memory swaps and synchronization checkpoints with neighbor worker nodes in the cluster.",
      "By restarting the stream processing task from scratch and replaying all original events from the beginning of time on failure."
    ],
    correct: 1,
    explanation: "Stream processors store their state locally in embedded key-value stores (like RocksDB) for fast local access, and continuously replicate state changes to a replicated log (like Kafka) to recover state if a node crashes.",
    section: "Fault Tolerance"
  },
  {
    type: "mc",
    q: "Why is an event-driven architecture based on an event log helpful for schema evolution and system migration?",
    options: [
      "Event payloads do not contain any structured schemas or object types, which entirely eliminates the need for schema evolution over time.",
      "You can keep the old system running, deploy the new system, and replay the historical event log to populate the new system's state.",
      "Immutable logs automatically parse and map incoming JSON event payloads into structured SQL database tables without developer overhead.",
      "It enforces strict shared-database consistency, which forces all independent microservices to query and write to the same database server."
    ],
    correct: 1,
    explanation: "An event log preserves history. When migrating to a new system or evolving a schema, you can run the new code in parallel, replay the log from the beginning to build the new state, and switch over when ready.",
    section: "State, Streams, and Immutability"
  },
  {
    type: "write",
    q: "You are designing a high-throughput transaction monitoring pipeline to block fraudulent credit card transactions. One engineer proposes using Apache Spark Streaming (microbatching), while another insists on Apache Flink (continuous processing). Contrast the trade-offs of these two processing models for this latency-sensitive domain.",
    hint: "Compare the latency of continuous event-at-a-time processing with the throughput benefits and fault-tolerance checkpoint simplicity of processing data in mini-batches.",
    modelAnswer: "Continuous processing (Flink) processes events individually as they arrive, yielding ultra-low latency (milliseconds), which is critical for immediately blocking fraudulent credit card transactions. However, this model has higher coordination overhead for state checkpoints. Microbatching (Spark) group events into small windows (e.g., 500ms), which increases latency but can achieve higher throughput by processing records in bulk and simplifies fault-tolerance by using batch mechanics. For fraud detection, where latency is critical, continuous processing is generally preferred.",
    section: "Fault Tolerance"
  },
  {
    type: "mc",
    q: "What is a hopping window of length 5 minutes and hop size 1 minute?",
    options: [
      "A window partition that periodically changes its physical host location and network address every 5 minutes.",
      "A 5-minute window that overlaps with subsequent windows, moving forward by 1 minute on every evaluation step.",
      "A static window bucket that filters and processes only those event records that occurred exactly 1 minute apart.",
      "A dynamic session window that automatically closes and flushes its state after 1 minute of user inactivity."
    ],
    correct: 1,
    explanation: "A hopping window has a fixed length (e.g., 5 mins) and advances by a smaller step size or hop (e.g., 1 min), meaning successive windows overlap and events belong to multiple windows.",
    section: "Reasoning About Time"
  },
  {
    type: "mc",
    q: "In a stream join, what is a stream-table join (enrichment join)?",
    options: [
      "Joining two static tables in a relational SQL database using stream-like execution plans in the compiler.",
      "Joining a continuous stream of events with a static or slowly changing database table to add context to the events.",
      "Converting a real-time stream of incoming events into a physical relational table stored in shared memory.",
      "Sending event records back and forth between a Kafka broker partition and a PostgreSQL table in a loop."
    ],
    correct: 1,
    explanation: "A stream-table join enriches a continuous stream of events (like clicks) with database records (like user metadata) in real-time.",
    section: "Stream Joins"
  },
  {
    type: "write",
    q: "A junior engineer is confused because their Flink pipeline is buffering events and not emitting hourly aggregates for several minutes. You explain that because the system uses Event Time, it is waiting for a 'watermark.' Explain what a watermark is, how it is determined, and why it is necessary to handle late or out-of-order data.",
    hint: "Focus on why a stream processor cannot know when all events for a specific hour have actually arrived from client devices, and how watermarks act as progress markers.",
    modelAnswer: "Watermarks are temporal progress markers in a stream processor that signal when a window can be closed and its aggregates calculated. They are necessary because network delays, device offline states, and out-of-order delivery mean the processor cannot know if more late events will arrive for a given time window. A watermark (e.g., event time minus 5 seconds) is calculated heuristically, telling the processor to assume no more events prior to that time will arrive. Events arriving after the watermark are considered late and are either discarded or handled by a separate side-channel. Crucially, watermarks are approximate and offer no hard guarantees; there is always a trade-off between waiting longer for correctness (higher latency) vs producing results sooner (lower latency, but dropping or handling more late events).",
    section: "Reasoning About Time"
  }
];

const FLASHCARDS = [
  { front: "What is an event in a stream processing context?", back: "A small, self-contained, immutable object containing details of something that happened at a point in time, including a timestamp." },
  { front: "What is the difference between a producer and a consumer in streaming?", back: "A producer (publisher/sender) generates and writes event messages. A consumer (subscriber/recipient) reads and processes those messages." },
  { front: "JMS/AMQP vs Log-Based brokers: what is the key message deletion difference?", back: "JMS/AMQP brokers delete messages once acknowledged (queues are short). Log-based brokers retain messages on disk for a configured retention period, letting consumers reread them." },
  { front: "How is consumer progress tracked in log-based brokers like Kafka?", back: "By using consumer offsets—a partition-specific sequence number stored in the broker representing the next message to read." },
  { front: "What are the two main patterns of messaging for multiple consumers?", back: "Load balancing (delivering each message to one of several consumers sharing work) and Fan-out (delivering each message to all independent consumers)." },
  { front: "What is Change Data Capture (CDC)?", back: "The process of monitoring a database replication log (transaction log) and streaming database mutations (inserts, updates, deletes) in real-time to other systems." },
  { front: "Event Sourcing vs CDC: what is the source of truth?", back: "Event Sourcing: the event log itself is the primary source of truth. CDC: the database is the primary source of truth, and the log is derived from it." },
  { front: "What is Event Time vs. Processing Time?", back: "Event time is when the event occurred on the generating device. Processing time is when the event is received and processed by the server." },
  { front: "What is a Tumbling Window?", back: "A fixed-length window where every event belongs to exactly one window (no overlap, fixed boundaries)." },
  { front: "What is a Hopping Window?", back: "A fixed-length window with a configured advance step (hop) that is smaller than the window size, causing consecutive windows to overlap." },
  { front: "What is a Sliding Window?", back: "A window containing all events that occur within a certain duration of each other, defined dynamically by event intervals rather than a fixed grid." },
  { front: "What is a Session Window?", back: "A dynamically sized window defined by grouping events for a single user, ending when the user is inactive for a specified time gap." },
  { front: "What is a Stream-Stream Join?", back: "Joining two continuous event streams by buffering events from both sides within a time window to match related keys (e.g. search queries to search clicks)." },
  { front: "What is a Stream-Table Join (enrichment)?", back: "Joining stream events with slow-moving database records to enrich each event with database metadata (e.g., joining order events with customer address details)." },
  { front: "Why is 'exactly-once' processing an illusion over a network, and how is it achieved?", back: "Networks must retry (at-least-once). Exactly-once is achieved on the processing side by making state updates idempotent or by using atomic transactions." }
];

const CONFIDENCE_LABELS = [
  "AMQP/JMS vs log-based brokers",
  "CDC vs Event Sourcing",
  "Event time vs processing time",
  "Tumbling, hopping, sliding, & session windows",
  "Stream-stream, stream-table, & table-table joins",
  "Exactly-once and idempotent processing"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 12", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 15 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Re-attempt exactly-once & idempotence questions from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Explain event-time windowing to a peer (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! Log-based message brokers write messages to an append-only log on disk and retain them for a configured duration. Consumers manage their own read offsets independently, meaning multiple consumers can read and replay historical events.",
    true: "Incorrect. Log-based message brokers do not delete messages when acknowledged. Instead, they retain messages on disk for a configured retention period, allowing replayability.",
    unsure: "In a log-based broker, messages are stored differently from traditional message queues. Look for the 'Partitioned Logs' section."
  },
  m2: {
    false: "Correct! Event time is when the event occurred (on the device), while processing time is when it reaches the server. Network delays, queuing, and offline periods can cause hours or days of drift between the two.",
    true: "Incorrect. Using processing time for late-arriving events (e.g., from offline devices) leads to incorrect aggregates and dashboard spikes. Look for the 'Reasoning About Time' section.",
    unsure: "This is a key issue in stream processing. Clocks on devices can vary, and networks introduce latency. Check out the 'Reasoning About Time' section."
  },
  m3: {
    false: "Correct! It is impossible to guarantee that a network packet is sent exactly once due to network packet drops and retry loops. Exactly-once means the effect of processing (e.g., state updates) is equivalent to it happening exactly once.",
    true: "Incorrect. Over the network, messages are often redelivered. exactly-once is achieved on the processing/state side through idempotence or transactions, not by perfect network transport.",
    unsure: "This is a common source of confusion! Check the 'Fault Tolerance' section to see how exactly-once is implemented."
  },
  m4: {
    false: "Correct! If the table is mutable (updated in-place), the join is non-deterministic because the result depends on whether the event is processed before or after a table update.",
    true: "Incorrect. If the table changes over time, out-of-order events will join against different states of the table, causing non-deterministic results.",
    unsure: "This is a subtle timing issue. Read the 'Stream Joins' section to see why table updates can cause non-determinism."
  },
  m5: {
    true: "Correct! If the output sink (like an external database or email service) is not idempotent or does not participate in atomic transactions with the stream processor, duplicate deliveries will still cause visible duplicate side-effects.",
    false: "Incorrect. Even if the stream processor is perfect internally, if the output sink cannot handle duplicate writes or participate in transactions, you will have duplicate side-effects.",
    unsure: "Think about the final step: sending output to an external system. Look for the 'Exactly-once semantics' and 'Idempotence' sections."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch12_learning';
