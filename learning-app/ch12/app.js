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
      "Batch processing handles only text files; stream processing handles only binary data.",
      "Batch processing is always synchronous; stream processing is always asynchronous.",
      "Batch processing stores input data in memory; stream processing stores it on disk."
    ],
    correct: 0,
    explanation: "Batch processes work on bounded datasets (like a file or directory), whereas stream processes work on unbounded datasets that never end and must be processed incrementally as they arrive.",
    section: "Introduction"
  },
  {
    type: "mc",
    q: "Which of the following is a key characteristic of traditional JMS/AMQP style message brokers?",
    options: [
      "They retain all messages indefinitely on disk for replaying.",
      "They track consumer read progress using log offsets.",
      "They are optimized for short queues and delete messages as soon as they are successfully acknowledged by consumers.",
      "They require consumers to connect via UDP multicast."
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
      "It defines the partition ID to which a producer must write.",
      "It is the byte size of the message currently being processed.",
      "It is a sequential number tracking the consumer's read progress within a partition log.",
      "It is the encryption key used to decode event payloads."
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
      "The search index will reject updates that do not match its relational schema.",
      "Network partitions or client crashes can cause one write to succeed while the other fails, leading to permanent inconsistency.",
      "Writing to two systems simultaneously always doubles the network cost of database reads.",
      "Relational databases do not support writes from applications that also connect to search indexes."
    ],
    correct: 1,
    explanation: "Without atomic transactions across both systems, dual writes easily go out of sync if one write fails due to network issues, client crashes, or concurrent race conditions where updates arrive in different orders at the database and the index.",
    section: "Keeping Systems in Sync"
  },
  {
    type: "mc",
    q: "In Change Data Capture (CDC), how does the system capture database updates to propagate them to downstream systems?",
    options: [
      "By polling the database with SELECT queries every second.",
      "By reading the database's internal replication log or write-ahead log.",
      "By intercepting direct database writes in the web server application code.",
      "By periodically exporting the entire database to CSV files."
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
      "It compresses the log files using GZIP or Snappy to save disk space.",
      "It discards old log records, keeping only the most recent update for each key.",
      "It merges multiple log partitions into a single global log file.",
      "It deletes all entries in the log that are older than 24 hours."
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
      "The time according to the system clock of the machine running the stream processor.",
      "The time at which the event occurred, typically recorded on the producing device.",
      "The duration of time it takes to process the event through the stream pipeline.",
      "The scheduled time when a batch job is triggered to process events."
    ],
    correct: 1,
    explanation: "Event time is the time when the event originally happened according to the clock of the device that generated it (e.g., a phone, sensor, or server).",
    section: "Reasoning About Time"
  },
  {
    type: "mc",
    q: "Which window type has a fixed length, and partitions events such that every event belongs to exactly one window?",
    options: [
      "Sliding window",
      "Session window",
      "Tumbling window",
      "Hopping window"
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
      "A cryptographic signature confirming the integrity of stream events.",
      "A temporal threshold indicating that no more events with timestamps prior to the watermark are expected.",
      "The maximum memory size allocated for stream state buffers.",
      "A marker indicating that a partition has reached its disk quota."
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
      "Stream-table join",
      "Table-table join",
      "Stream-stream join",
      "Compacted log join"
    ],
    correct: 2,
    explanation: "A stream-stream join (such as matching search queries with search clicks) requires buffering events from both streams for a specific window of time because the matching events can arrive out of order and with variable latency.",
    section: "Stream Joins"
  },
  {
    type: "mc",
    q: "What is the primary concern when performing table-table joins in stream processing?",
    options: [
      "Table-table joins are only supported in relational databases and cannot be done in stream processors.",
      "They require maintaining materialized views of both tables, where updates to either table trigger updates to the join result.",
      "They require converting all database records into binary files.",
      "They only work if both tables have identical keys and row counts."
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
      "By replicating every stream processor node 10 times.",
      "By treating the stream as a series of short, bounded batch jobs and saving checkpoints to a reliable filesystem.",
      "By forcing clients to store all events in memory.",
      "By dropping any events that cannot be processed immediately."
    ],
    correct: 1,
    explanation: "Microbatching divides the stream into small chunks (e.g., 1-second batches). Because each microbatch is a small batch job, the engine can use traditional batch fault-tolerance mechanisms, re-running a batch if a worker node crashes.",
    section: "Fault Tolerance"
  },
  {
    type: "mc",
    q: "Which of the following operations is inherently idempotent?",
    options: [
      "Incrementing a counter by 1.",
      "Appending a message to a list.",
      "Setting the status of an order to 'SHIPPED'.",
      "Withdrawing $10 from a bank account."
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
      "Immutable logs are too slow to write on modern SSDs.",
      "They make it difficult to satisfy the GDPR 'right to be forgotten' (erasure) because rewriting history is technically complex.",
      "They cannot be replicated across multiple machines.",
      "They require special operating system kernels to run."
    ],
    correct: 1,
    explanation: "Laws like GDPR require companies to delete a user's data upon request. In an append-only, immutable event log, deleting data requires rewriting the historical log or using workarounds like cryptographic erasure (key shredding) to render the data unreadable.",
    section: "State, Streams, and Immutability"
  },
  {
    type: "mc",
    q: "In log-based message brokers, what happens when multiple consumers read the same log partition?",
    options: [
      "They compete for messages; each message is delivered to only one consumer.",
      "They can each read the entire log independently without affecting other consumers.",
      "The broker locks the partition for the first consumer, blocking all others.",
      "The messages are duplicated in disk storage for each consumer."
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
      "By storing all state on the client device.",
      "By maintaining local state (e.g., in RocksDB) and writing a changelog stream of state updates back to a partitioned log broker like Kafka.",
      "By performing memory swaps with peer machines every millisecond.",
      "By restarting the stream processing job from scratch on every failure."
    ],
    correct: 1,
    explanation: "Stream processors store their state locally in embedded key-value stores (like RocksDB) for fast local access, and continuously replicate state changes to a replicated log (like Kafka) to recover state if a node crashes.",
    section: "Fault Tolerance"
  },
  {
    type: "mc",
    q: "Why is an event-driven architecture based on an event log helpful for schema evolution and system migration?",
    options: [
      "Events do not contain schemas, so they never need to evolve.",
      "You can keep the old system running, deploy the new system, and replay the historical event log to populate the new system's state.",
      "Immutable logs automatically convert JSON to SQL tables.",
      "It forces all microservices to use the same database."
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
      "A window that changes position every 5 minutes.",
      "A 5-minute window that overlaps with the next window, moving forward by 1 minute on every step.",
      "A window that contains only events that are exactly 1 minute apart.",
      "A window that closes after 1 minute of inactivity."
    ],
    correct: 1,
    explanation: "A hopping window has a fixed length (e.g., 5 mins) and advances by a smaller step size or hop (e.g., 1 min), meaning successive windows overlap and events belong to multiple windows.",
    section: "Reasoning About Time"
  },
  {
    type: "mc",
    q: "In a stream join, what is a stream-table join (enrichment join)?",
    options: [
      "Joining two tables in a SQL database using stream APIs.",
      "Joining a continuous stream of events with a static or slowly changing database table to add context to the events.",
      "Converting a stream of events into a relational table.",
      "Sending data back and forth between Kafka and PostgreSQL."
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
      username:   getCurrentUsername()   // returns the active username from db.js
    })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
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
          alert('Grading completed successfully! Check the console or logs.');
          console.log('Grades:', data.grades);
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
  const state = loadState();
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
