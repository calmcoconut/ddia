/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the primary role of a 'leader' (or primary/master) in leader-based replication?",
    options: [
      "It handles all read queries for the system",
      "It accepts all write requests, writes them to local storage, and sends change streams to followers",
      "It monitors the health of followers and triggers failovers",
      "It is the only node allowed to run backup operations"
    ],
    correct: 1,
    explanation: "In leader-based replication, all writes must go through the leader. The leader writes the data locally and replicates the changes to all followers. Reads can go to the leader or any follower.",
    section: "Single-Leader Replication"
  },
  {
    type: "mc",
    q: "In synchronous replication, what is the main benefit and the main drawback?",
    options: [
      "Benefit: Extremely low write latency; Drawback: Risk of serving stale data",
      "Benefit: The follower is guaranteed to have an up-to-date copy; Drawback: If the synchronous follower blocks/fails, the leader cannot process any writes",
      "Benefit: High write throughput; Drawback: Lack of durability",
      "Benefit: Easier schema migrations; Drawback: Network partition sensitivity"
    ],
    correct: 1,
    explanation: "Synchronous replication guarantees that the follower has an identical copy of the leader's data before acknowledging the write. However, if that follower is slow or down, the write is blocked, sacrificing write availability.",
    section: "Synchronous Versus Asynchronous Replication"
  },
  {
    type: "write",
    q: "Explain the difference between synchronous and asynchronous replication in terms of write latency and write availability when a follower node goes offline.",
    hint: "Focus on whether the leader blocks waiting for a follower, how acknowledgment works, and what happens to the system's write capacity.",
    modelAnswer: "In synchronous replication, the leader waits for the follower to confirm the write before acknowledging it to the client. If the follower goes offline, the leader cannot confirm writes, blocking the system and reducing write availability, though it guarantees zero data loss on leader crash. In asynchronous replication, the leader acknowledges the write immediately after committing it locally. If a follower goes offline, the leader continues to process writes with low latency, but any un-replicated writes are lost if the leader crashes.",
    section: "Synchronous Versus Asynchronous Replication"
  },
  {
    type: "mc",
    q: "What is a 'semi-synchronous' replication configuration?",
    options: [
      "The leader replicates synchronously during the day and asynchronously at night",
      "Only one follower is synchronous, while others are asynchronous, ensuring at least two nodes have the data",
      "Writes are written to memory synchronously and to disk asynchronously",
      "The leader waits for half of the followers to acknowledge a write before committing"
    ],
    correct: 1,
    explanation: "In semi-synchronous systems, one follower is synchronous and the rest are asynchronous. If the synchronous follower becomes slow or fails, one of the asynchronous followers is promoted to be synchronous, maintaining durability without blocking writes indefinitely.",
    section: "Synchronous Versus Asynchronous Replication"
  },
  {
    type: "mc",
    q: "What is the purpose of taking a database snapshot when setting up a new follower?",
    options: [
      "To backup the database in case the leader fails",
      "To get a consistent copy of the data at a point in time without locking the database, which can then be copied to the follower",
      "To verify that the leader's disk is not corrupted",
      "To clear out transaction history and reclaim disk space"
    ],
    correct: 1,
    explanation: "Setting up a new follower requires copying the leader's dataset. To avoid locking the active database, we take a consistent snapshot, copy it to the follower, and then use the replication log to catch up on changes since the snapshot.",
    section: "Setting Up New Followers"
  },
  {
    type: "write",
    q: "Describe the steps required to set up a new follower replica in a single-leader system without taking the database offline or locking out writes.",
    hint: "Mention snapshots, copying data, replication logs, and log sequence numbers or binlog coordinates.",
    modelAnswer: "First, take a consistent snapshot of the leader's database without locking the entire database (supported by most storage engines). Copy this snapshot to the new follower node. Next, identify the exact position in the leader's replication log (e.g., log sequence number or binlog position) at which the snapshot was taken. Finally, configure the follower to connect to the leader and stream all log entries starting from that exact position, catching up until it is fully synced.",
    section: "Setting Up New Followers"
  },
  {
    type: "mc",
    q: "What is 'failover' in a single-leader replication system?",
    options: [
      "When a follower shuts down and catch-up recovery is initiated",
      "When the leader crashes and one of the followers is promoted to be the new leader",
      "When the network splits and both leader and followers continue to accept writes",
      "When a transaction is aborted because of a lock conflict"
    ],
    correct: 1,
    explanation: "Failover is the process of detecting a leader's failure, electing one of the followers as the new leader, and reconfiguring the clients and remaining followers to send their operations to the new leader.",
    section: "Leader failure: Failover"
  },
  {
    type: "mc",
    q: "What is a 'split-brain' scenario in single-leader replication?",
    options: [
      "When a database engine splits its compute and storage nodes",
      "When two nodes both believe they are the leader, leading to conflicting writes and potential data loss",
      "When a database uses different algorithms for reads and writes",
      "When the leader's CPU cache gets out of sync with RAM"
    ],
    correct: 1,
    explanation: "If two nodes in a cluster think they are the leader, both accept write operations, and there is no simple way to merge their divergent histories. This typically happens due to network partitions where the old leader is cut off but still active, while followers elect a new leader.",
    section: "Leader failure: Failover"
  },
  {
    type: "write",
    q: "What is the 'split-brain' problem in leader election, how does it occur, and what is a common mechanism used to prevent it?",
    hint: "Discuss network partitions, multiple leaders, and node consensus (fencing tokens/quorums).",
    modelAnswer: "Split-brain occurs when a network partition cuts off the leader from the rest of the cluster, causing the remaining followers to believe the leader is dead and elect a new leader. If the old leader is actually still running, it will continue to accept writes while the new leader does the same, leading to data divergence. To prevent split-brain, systems often use node consensus protocols (like ZooKeeper or Raft) to ensure only one leader can be active at a time, or implement fencing mechanisms that disable the old leader once a new one is elected.",
    section: "Leader failure: Failover"
  },
  {
    type: "mc",
    q: "Why is statement-based replication generally avoided in modern databases?",
    options: [
      "It takes up too much disk space compared to row-based logs",
      "Nondeterministic functions (like NOW() or RAND()) can evaluate to different values on followers, causing data divergence",
      "It does not support transaction rollbacks",
      "It requires clients to write their queries in specialized dialects"
    ],
    correct: 1,
    explanation: "Statement-based replication logs the SQL statements themselves. Any nondeterministic function (like NOW(), RAND(), or auto-increment columns) will produce different results on the follower than on the leader, causing replicas to drift.",
    section: "Statement-based replication"
  },
  {
    type: "mc",
    q: "Which log replication method represents changes as logical rows (e.g., indicating inserted, updated, or deleted values) rather than physical disk blocks?",
    options: [
      "Write-ahead log (WAL) shipping",
      "Logical (row-based) log replication",
      "Statement-based replication",
      "Trigger-based replication"
    ],
    correct: 1,
    explanation: "Logical row-based log replication decouples the replication log from the storage engine's physical byte layout, recording changes in a cleaner, row-oriented format. This makes it easier to support different database versions on the leader and followers.",
    section: "Logical (row-based) log replication"
  },
  {
    type: "write",
    q: "Compare Write-Ahead Log (WAL) shipping with Logical (row-based) log replication. Why does Logical replication make rolling database upgrades easier?",
    hint: "Think about physical vs. logical formats, coupling to the storage engine, and version compatibility.",
    modelAnswer: "Write-Ahead Log (WAL) shipping is a physical replication method where the log contains low-level byte changes on specific disk blocks, tightly coupling the log to the database's storage engine. A physical log is usually version-incompatible across minor/major database releases. Logical replication, however, decodes database changes into logical rows (independent of physical disk layouts). This decoupling allows the leader and followers to run different database versions, enabling rolling upgrades where followers are upgraded first and then promoted to leader.",
    section: "Implementation of Replication Logs"
  },
  {
    type: "mc",
    q: "What is the 'read-after-write consistency' (or read-your-own-writes consistency) guarantee?",
    options: [
      "It ensures that once a user writes a value, they are guaranteed to see that value if they reload the page, even if replication lag is active",
      "It ensures that no user can read another user's uncommitted writes",
      "It guarantees that all users see the exact same data at the exact same physical time",
      "It prevents concurrent writes from overwriting each other"
    ],
    correct: 0,
    explanation: "Read-after-write consistency guarantees that if a user makes an update, they will always see that update when they query the database. It does not promise that other users will see it immediately, but it prevents the confusing experience of a user saving a change and then seeing it disappear on refresh.",
    section: "Reading your own writes"
  },
  {
    type: "mc",
    q: "Under read-after-write consistency, how can an application safely serve a user's own profile updates from an asynchronous follower?",
    options: [
      "It cannot; a user's own profile must always be read from the leader",
      "It can redirect the read to the follower, but only if the user hasn't made a write in the last few minutes (e.g., checking a write timestamp)",
      "It can read from the follower but must lock the row first",
      "It must use a distributed transaction to sync the follower before the read"
    ],
    correct: 1,
    explanation: "If a user has recently updated their profile, you can track the time of the write and route profile reads to the leader for a short duration (e.g., 1 minute). Other reads can go to followers, or you can check if the follower has caught up to the timestamp of the user's last write.",
    section: "Reading your own writes"
  },
  {
    type: "write",
    q: "Describe a user-facing anomaly caused by replication lag, and explain how a system can implement 'read-after-write consistency' to solve it.",
    hint: "Think about a user editing a profile, submitting, refreshing the page, and hitting an asynchronous follower that hasn't caught up.",
    modelAnswer: "When a user updates their profile, the write goes to the leader and is asynchronously replicated to followers. If the user immediately refreshes the page and their read request is routed to a follower that has replication lag, they will see their old profile data, making it look like their update was lost. To solve this, read-after-write consistency can be implemented by routing reads for the user's own data to the leader (e.g., always read a user's own profile from the leader, or route to the leader for 1 minute after a write) or by tracking the update timestamp and only querying followers that are caught up to that timestamp.",
    section: "Reading your own writes"
  },
  {
    type: "mc",
    q: "What does 'monotonic reads' guarantee?",
    options: [
      "Replicas always process writes in the exact same chronological order",
      "If a user makes a sequence of reads, they will never see data go 'backward' in time (i.e., reading from a lagged replica after reading from an updated one)",
      "Reads are executed sequentially, one at a time, to prevent concurrent lock contention",
      "The system returns values that increase monotonically over time"
    ],
    correct: 1,
    explanation: "Monotonic reads ensures that if a user sees a piece of data (e.g., a post), they won't subsequently refresh and see it disappear because their second request landed on a follower with higher replication lag than the first one.",
    section: "Monotonic reads"
  },
  {
    type: "mc",
    q: "What anomaly does 'consistent prefix reads' prevent?",
    options: [
      "A user reading their own writes from a lagged follower",
      "A follower receiving updates out of causal order, such as seeing an answer before the question",
      "A write conflict occurring when two users update the same record concurrently",
      "A database transaction committing only a prefix of its modifications"
    ],
    correct: 1,
    explanation: "Consistent prefix reads guarantees that if a sequence of writes happens in a certain order, anyone reading those writes will see them in the same order. This is a common issue in partitioned (sharded) databases where different partitions replicate independently.",
    section: "Consistent prefix reads"
  },
  {
    type: "write",
    q: "Explain how the 'monotonic reads' guarantee differs from 'read-after-write consistency' using a concrete user scenario.",
    hint: "Think about multiple read requests hitting different followers vs. a user reading their own updates.",
    modelAnswer: "Read-after-write consistency is about a user's relationship with their own updates: if User A submits a post, they are guaranteed to see that post on subsequent reads. Monotonic reads is about a user's relationship with the sequence of reads of any data: if User B reads User A's profile and sees a new post, B is guaranteed not to see that post disappear on a subsequent refresh. In monotonic reads, the user's consecutive reads cannot go backward in time (by hitting a more lagged follower), even if they didn't write the data themselves. In practice, monotonic reads are often implemented via 'sticky reads' by routing all of a user's requests to the same replica (e.g., pinning a session to a specific server based on user ID hash).",
    section: "Problems with Replication Lag"
  },
  {
    type: "mc",
    q: "In which scenario is multi-leader replication highly recommended over single-leader replication?",
    options: [
      "An application with a single datacenter and high write throughput",
      "A multi-datacenter operation where you want to tolerate datacenter outages and keep write latency low by writing to local leaders",
      "A read-heavy application that can scale out with asynchronous followers",
      "A system that requires strict serializable transactions"
    ],
    correct: 1,
    explanation: "In multi-leader replication, a leader is placed in each datacenter. This keeps write latency low because writes are processed locally before being asynchronously replicated to other datacenters, and it allows the system to continue operating even if one datacenter goes offline.",
    section: "Geographically Distributed Operation"
  },
  {
    type: "write",
    q: "Discuss the benefits and drawbacks of multi-leader replication in multi-datacenter systems compared to a single-leader setup.",
    hint: "Focus on write latency, tolerance to datacenter failures, offline operations, and the complexity of conflict resolution.",
    modelAnswer: "Multi-leader replication provides lower write latency in multi-datacenter setups because write operations can be accepted and committed locally in each datacenter, rather than traversing the WAN to a single global leader. It also tolerates datacenter network outages, as each datacenter can continue functioning independently. However, the major drawback is the complexity of conflict resolution: because writes can happen concurrently at different leaders, the system must detect and resolve write conflicts, which is not required in single-leader setups.",
    section: "Multi-Leader Replication"
  },
  {
    type: "mc",
    q: "What is a 'circular topology' in multi-leader replication?",
    options: [
      "Each node sends its writes to all other nodes in a mesh network",
      "Each node receives writes from one node and forwards them to another node, forming a ring",
      "The leader periodically polls followers in a round-robin cycle",
      "A database client rotates its writes among all leaders in a round-robin fashion"
    ],
    correct: 1,
    explanation: "In circular topologies, writes are passed from node to node in a circle. A major drawback is that if a single node fails, it breaks the replication flow for the remaining nodes in the loop.",
    section: "Multi-leader replication topologies"
  },
  {
    type: "write",
    q: "Explain how conflict avoidance works in a multi-leader system and why it might break down (e.g., forcing a system to handle actual conflicts).",
    hint: "Consider user geographic routing, traveling users, or datacenter outages.",
    modelAnswer: "Conflict avoidance works by routing all write operations for a specific user or record to the same database leader. For instance, a user's requests are routed to the closest datacenter, so all edits to their profile occur on that single leader, avoiding concurrent writes on different leaders. However, this breaks down if the user travels to a different region and is routed to a different datacenter, or if a datacenter fails and the system must failover and route writes to a different leader, forcing the system to handle concurrent, conflicting writes.",
    section: "Conflict avoidance"
  },
  {
    type: "mc",
    q: "Why is conflict avoidance considered the most common strategy for dealing with multi-leader write conflicts?",
    options: [
      "It resolves conflicts automatically using sophisticated mathematical consensus",
      "It ensures that all writes for a specific record are routed to the same leader (e.g., based on user location), preventing concurrent writes to different leaders",
      "It locks the entire database during a write operation",
      "It discards all updates except the first one"
    ],
    correct: 1,
    explanation: "Conflict avoidance ensures conflicts never happen by routing all writes for a particular record (like a user's data) to the same datacenter (leader). For example, a user in Europe always writes to the European datacenter, which handles all updates for that user, turning it into a single-leader system for that specific user.",
    section: "Conflict avoidance"
  },
  {
    type: "write",
    q: "Although a quorum system with $w + r > n$ is mathematically expected to return the latest written value, list and explain at least three real-world edge cases where a client might still receive a stale read.",
    hint: "Think about clock drift, partially completed/failed writes, concurrent read/write races, and node availability anomalies discussed in the text.",
    modelAnswer: "Even with a strong quorum ($w + r > n$), stale reads can occur due to several factors: 1) Clock skew in Last-Write-Wins (LWW) conflict resolution can cause a newer write with an earlier local clock to be silently discarded. 2) If a write fails to achieve the required quorum (e.g. succeeding on only 1 out of 3 nodes) and is aborted, subsequent reads may still retrieve the partially written value from the node where it succeeded. 3) If a write and read happen concurrently, the read may only overlap on some nodes, returning the old value. 4) Sloppy quorums and hinted handoffs can write data to fallback nodes, temporarily violating the quorum overlap until the handoff is complete.",
    section: "Using quorums for reading and writing"
  },
  {
    type: "mc",
    q: "How does the Conflict-free Replicated Datatype (CRDT) approach to conflict resolution compare with the Last-Write-Wins (LWW) strategy in leaderless or multi-leader databases?",
    options: [
      "CRDTs are simpler to implement but discard concurrent write data, whereas LWW preserves all historical writes.",
      "LWW is mathematically order-independent, while CRDTs require a strict global time sync to function.",
      "LWW is computationally simple but silently discards concurrent updates (leading to data loss); CRDTs preserve concurrent contributions by merging them deterministically, at the cost of more complex data structures.",
      "There is no difference; CRDT is just the academic name for LWW."
    ],
    correct: 2,
    explanation: "Last-Write-Wins (LWW) is easy to implement but relies on physical clocks that drift, causing it to discard concurrent writes and risk data loss. CRDTs avoid this by using conflict-free data structures (like maps, counters, or sets) that can be merged concurrently and deterministically, though this requires more complex merge logic and application semantics.",
    section: "Conflict-free replicated datatypes and operational transformation"
  },
  {
    type: "write",
    q: "Explain the concept of 'concurrency' in distributed systems and how the 'happens-before' relationship is used to determine if two operations are concurrent.",
    hint: "Discuss physical timestamps vs. causality, dependency, and version tracking.",
    modelAnswer: "In distributed systems, concurrency is defined causally rather than by physical time. Two operations are concurrent if neither has causal knowledge of the other; that is, neither operation was created with awareness of the other's value. The 'happens-before' relationship defines causality: Operation A happens-before Operation B if B was built upon or had access to A's state. If neither Operation A happens-before B, nor B happens-before A, they are defined as concurrent, and their conflict must be resolved.",
    section: "The happens-before relation and concurrency"
  },
  {
    type: "mc",
    q: "In a leaderless replication system (such as Dynamo, Cassandra, or Riak), how are writes propagated to replicas?",
    options: [
      "The client writes directly to a coordinator node, which synchronous-writes to all followers",
      "The client (or a coordinator node) sends the write directly to several replica nodes in parallel",
      "Replicas poll the client periodically for new write statements",
      "The client only writes to a single node, which uses gossip protocols to distribute the data"
    ],
    correct: 1,
    explanation: "In leaderless systems, the client or a proxy node sends writes to all n replicas in parallel. The write is successful if it is acknowledged by a quorum of replicas (w).",
    section: "Writing to the Database When a Node Is Down"
  },
  {
    type: "write",
    q: "Explain how 'version vectors' differ from a single transaction/logical clock in detecting concurrent writes across multiple replicas in leaderless replication.",
    hint: "Think about how nodes track changes independently without a centralized counter.",
    modelAnswer: "A single logical clock or transaction counter requires a centralized coordinator to assign sequential numbers, which is not feasible in multi-leader or leaderless systems where nodes accept writes independently. A version vector consists of a list of version numbers, one for each replica node. When a node accepts a write, it increments its own version number in the vector and sends the updated vector with the write. By comparing vectors from different replicas, the system can determine if one write is a successor of another (causally related) or if they are concurrent. For example, if Node A has version vector [A:1, B:0] and Node B has [A:0, B:1], neither vector dominates the other. This indicates that the writes occurred concurrently and must be merged. Conversely, a vector of [A:2, B:1] dominates [A:1, B:1], indicating that the former is a successor and can overwrite the latter.",
    section: "Version vectors"
  },
  {
    type: "mc",
    q: "What is the difference between 'read repair' and 'anti-entropy' in leaderless replication?",
    options: [
      "Read repair is manual, while anti-entropy is automatic",
      "Read repair fixes stale replicas when a client reads data and detects a version mismatch; anti-entropy is a background process that constantly looks for differences between replicas",
      "Read repair is synchronous, while anti-entropy is asynchronous log shipping",
      "Read repair works on single nodes, while anti-entropy is distributed consensus"
    ],
    correct: 1,
    explanation: "Read repair checks and updates stale nodes on the fly when a read query returns multiple versions of data. Anti-entropy is a background daemon that periodically compares checksums (Merkle trees) between replicas to find and sync missing data.",
    section: "Catching up on missed writes"
  },
  {
    type: "write",
    q: "What is a 'sloppy quorum' and 'hinted handoff'? Explain how they improve write availability at the cost of read consistency.",
    hint: "Think about what happens when home nodes are down, where the data is written, and when it returns.",
    modelAnswer: "A sloppy quorum is a mechanism in leaderless systems where, if the designated home nodes for a key are unreachable during a network partition, the system accepts writes on temporary fallback nodes outside the key's main replica set. When the partition heals, these fallback nodes asynchronously deliver the writes to the home nodes, a process called hinted handoff. This greatly improves write availability because the system can accept writes as long as any w nodes are reachable. However, it compromises read consistency because clients reading from the remaining home nodes will get stale data until the hinted handoff completes.",
    section: "Using quorums for reading and writing"
  }
];

const FLASHCARDS = [
  { front: "What are the three main replication topologies discussed in the chapter?", back: "Single-leader (primary/follower), Multi-leader, and Leaderless (Dynamo-style)." },
  { front: "What is the difference between synchronous and asynchronous replication?", back: "Sync waits for follower confirmation before acknowledging writes (guarantees consistency but blocks on follower failure). Async acknowledges writes immediately (low latency, risk of data loss on leader crash)." },
  { front: "What is a 'semi-synchronous' replication setup?", back: "A configuration with one synchronous follower and the rest asynchronous. If the synchronous follower fails, an async follower is promoted, maintaining durability without blocking writes." },
  { front: "What is a 'split-brain' scenario in leader election?", back: "A failure state where two nodes believe they are both the active leader (usually due to a network partition), leading to conflicting writes and data corruption." },
  { front: "Why is physical Write-Ahead Log (WAL) shipping difficult to use for rolling database upgrades?", back: "The physical WAL is tightly coupled to the storage engine's low-level byte format. Replicating WAL across different major/minor versions can cause incompatibilities." },
  { front: "What is Logical (row-based) log replication?", back: "A replication log containing row-level changes (inserts, deletes, updates) rather than low-level physical disk modifications. It is database-version-agnostic." },
  { front: "Describe the 'Reading Your Own Writes' anomaly.", back: "A user submits a write, but when they refresh, they read from a lagged follower that hasn't received the write yet, making their update appear to have vanished." },
  { front: "What is 'Monotonic Reads' consistency?", back: "A guarantee that if a user makes a sequence of reads, they will not see data go backward in time (e.g., hitting a fresh follower first, then a lagged follower)." },
  { front: "What are 'Consistent Prefix Reads'?", back: "A guarantee that if writes happen in a certain causal order, any reader will see them in that same order (critical for preventing answers from appearing before questions)." },
  { front: "How does 'conflict avoidance' prevent write conflicts in multi-leader replication?", back: "By routing all writes for a specific record (like a user's account) to the same datacenter's leader, turning it into a single-leader system for that record." },
  { front: "What is a CRDT (Conflict-free Replicated Datatype)?", back: "A specialized data structure (like counters or sets) that can be updated concurrently without coordination and automatically merged in a deterministic, order-independent way." },
  { front: "In leaderless replication, what is the difference between 'read repair' and 'anti-entropy'?", back: "Read repair fixes stale replicas on the fly when a client detects a mismatch during a read query. Anti-entropy is a background process that continuously syncs replicas." },
  { front: "What is the quorum equation for strong consistency in leaderless systems?", back: "w + r > n, where w is the write quorum, r is the read quorum, and n is the number of replicas, guaranteeing that read and write sets overlap." },
  { front: "What is a 'sloppy quorum' and 'hinted handoff'?", back: "Sloppy quorum accepts writes on temporary fallback nodes if home nodes are down. Hinted handoff asynchronously transfers these writes back when home nodes recover." },
  { front: "How is 'concurrency' defined in distributed systems?", back: "Causal independence: two operations are concurrent if neither has causal knowledge of the other (neither happened-before the other)." }
];

const CONFIDENCE_LABELS = [
  "Synchronous vs. Asynchronous Replication trade-offs",
  "Replication Lag anomalies (Read-your-writes, Monotonic reads, Consistent prefix reads)",
  "Multi-Leader Replication topologies and Conflict resolution",
  "Leaderless Replication, Read Repair, and Quorum calculations (w + r > n)",
  "Detecting Concurrency and using Version Vectors"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 6", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 15 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Sketch Single vs Multi-leader vs Leaderless pros/cons table from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach version vectors and quorums to a colleague (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! Replication actually replicates all writes to all nodes, meaning it doesn't increase write capacity (in fact, it often adds coordination overhead). To scale write capacity, we need sharding/partitioning.",
    true: "Actually, replication is not for write scaling! Every node must execute every write. It scales read capacity and provides fault tolerance.",
    unsure: "Think about what happens when you write to a replicated database: all nodes must copy that write. Thus, adding nodes doesn't decrease the write workload of any individual node."
  },
  m2: {
    false: "Correct! Even with w + r > n, there are many edge cases in quorums (LWW clock skew, failed writes that succeed on some nodes, concurrent reads/writes) that can return stale data.",
    true: "Actually, this is a common misconception. Quorum overlap guarantees meeting a node that saw the write, but anomalies like failed writes, clock skew, or read/write races can still return stale data.",
    unsure: "It seems like w + r > n should guarantee strong consistency, but the chapter outlines several subtle edge cases where it fails. Keep reading to see them."
  },
  m3: {
    false: "Correct! LWW achieves conflict resolution by discarding other concurrent writes. Since physical clocks drift, this can result in silent data loss, where a later write is discarded in favor of an earlier write with a drifted clock.",
    true: "LWW is actually quite dangerous! It forces an order on concurrent writes using physical clocks (which can drift) and silently discards the 'losing' writes.",
    unsure: "LWW resolves conflicts by declaring one write the winner and deleting the other. This makes it simple but introduces serious risk of data loss."
  },
  m4: {
    true: "Correct! Read repair is passive: it only triggers when a client query accesses the data. Background anti-entropy is required to sync keys that are rarely read.",
    false: "Actually, read repair is lazy and client-driven. If a key is never read, it will never be repaired by read repair.",
    unsure: "Read repair depends on read requests. If there are no reads, how would a node know it is stale?"
  },
  m5: {
    false: "Correct! Concurrency in distributed systems is defined by the absence of a causal relationship (neither operation knows about the other), not physical time. Two events can happen hours apart, but if neither was aware of the other, they are concurrent.",
    true: "Actually, concurrency in distributed systems is causal, not temporal. If two operations happen without knowledge of each other, they are concurrent, even if one physically occurred before the other.",
    unsure: "Distributed clocks make physical time unreliable. Concurrency is defined by causality: did one operation happen-before the other?"
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch6_learning';
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
  for (let i = 1; i <= 5; i++) {
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
      let prompt = `You are grading a student's responses to Chapter 6 ("Replication") of Designing Data-Intensive Applications.
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
- A custom 1-2 sentence recommendation on which specific sub-sections of Chapter 6 (e.g. Single-Leader Replication, Replication Lag, Multi-Leader Topologies, Leaderless Quorums, Concurrency Detection) they should review.`;

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

  const baseline = state.diagnosticBaseline || [3,3,3,3,3];
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
