/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   Chapter 10: Consistency and Consensus
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the core defining characteristic of linearizability?",
    options: [
      "It guarantees that transactions are executed in some serial order without interleaving.",
      "It behaves as if there is only one copy of the data, and all operations on it are atomic.",
      "It allows reads to return stale data temporarily while guaranteeing eventual convergence.",
      "It requires that all concurrent operations must block until transaction leases are active."
    ],
    correct: 1,
    explanation: "Linearizability is a recency guarantee that makes the system behave as if there is only one copy of the data and all operations on it take effect atomically at some point in time.",
    section: "Linearizability"
  },
  {
    type: "mc",
    q: "In a nonlinearizable sports website, what is the cause of Bryce seeing a stale score after Aaliyah has already seen the final score?",
    options: [
      "A transaction write conflict caused by concurrent database updates executing without locks.",
      "A physical clock skew issue between Bryce's mobile device and Aaliyah's mobile connection.",
      "Bryce's request being served by a replica that is lagging behind the one that served Aaliyah.",
      "A violation of serializability guarantees within the transactional database storage engine."
    ],
    correct: 2,
    explanation: "In a nonlinearizable system, replicas may update asynchronously. Bryce's request was routed to a lagging replica that had not yet processed the write seen by Aaliyah.",
    section: "Linearizability"
  },
  {
    type: "write",
    q: "Your team is building an image upload service. The web server saves an image to a non-linearizable cloud storage bucket, then immediately publishes an 'image_id' message to a fast message queue. The worker node receives the message, attempts to read the image, and crashes with a '404 File Not Found' error. What is this race condition called, and why does it happen?",
    hint: "Consider how the message queue acts as an out-of-band communication channel compared to the storage system's replication lag.",
    modelAnswer: "When a web server writes a file to a non-linearizable storage service and then sends an instruction to a transcoder via a message queue, a cross-channel race condition can occur. The message queue might deliver the message to the transcoder faster than the storage service replicates the new file. When the transcoder tries to read the file, it will see either an old version or no file at all, causing a permanent inconsistency.",
    section: "Linearizability"
  },
  {
    type: "mc",
    q: "How does linearizability differ from serializability?",
    options: [
      "Linearizability acts as a multi-object transactional consistency guarantee, whereas serializability is strictly a single-object rule",
      "Linearizability is a recency guarantee on single objects; serializability is an isolation guarantee on multi-object transactions.",
      "Linearizability allows read operations to return stale data temporarily, whereas serializability strictly forbids any stale reading",
      "Linearizability represents an eventual consistency liveness property, whereas serializability is a strict database safety property"
    ],
    correct: 1,
    explanation: "Linearizability ensures reads observe the most up-to-date state of a single object (recency). Serializability guarantees transactions behave as if executed in some serial order, but does not dictate how recent the reads must be.",
    section: "Linearizability Versus Serializability"
  },
  {
    type: "mc",
    q: "What does the combination of linearizability and serializability provide?",
    options: [
      "Weak eventual consistency guarantees across replicas",
      "Monotonic read isolation within single client sessions",
      "Strict serializability (or strong one-copy serializability)",
      "Two-phase commit coordination protocols across sharded databases"
    ],
    correct: 2,
    explanation: "A database that guarantees both serializability and linearizability is said to provide strict serializability, which is the strongest consistency and isolation model.",
    section: "Linearizability Versus Serializability"
  },
  {
    type: "write",
    q: "A senior architect warns against using a leaderless Dynamo-style database for strict sequential user inventory balances, even if we configure w + r > n (quorum). Why is leaderless replication generally unable to guarantee linearizability?",
    hint: "Think about how network delays during concurrent writes, lack of read repair on some reads, and LWW clock skew can cause a reader to get a stale value.",
    modelAnswer: "Even with quorums, leaderless systems can experience race conditions where a reader gets a stale value if their quorum overlap reads from nodes that have not yet received the concurrent write. Furthermore, conflict resolution using Last-Write-Wins (LWW) relies on time-of-day clocks, which are subject to clock skew and NTP updates, violating linearizable order. True linearizability in quorums requires synchronous read repair and pre-write reads, which degrade performance.",
    section: "Implementing Linearizable Systems"
  },
  {
    type: "mc",
    q: "Under the CAP theorem, how is 'Consistency' defined?",
    options: [
      "ACID database schema consistency.",
      "Eventual consistency across replicas.",
      "Strict single-copy linearizability.",
      "Monotonic read session guarantees."
    ],
    correct: 2,
    explanation: "The CAP theorem defines Consistency strictly as linearizability. Other forms of database consistency, like ACID consistency or eventual consistency, do not satisfy CAP Consistency.",
    section: "The CAP Theorem"
  },
  {
    type: "mc",
    q: "Which of the following replication methods is generally NOT linearizable under any configuration?",
    options: [
      "Single-leader replication where all read operations go to the leader node.",
      "Consensus-based systems running protocols such as Raft, Paxos, or Zab.",
      "Multi-leader replication systems accepting concurrent writes on multiple nodes.",
      "Single-node database engines running on a single dedicated machine."
    ],
    correct: 2,
    explanation: "Multi-leader systems concurrently accept writes on different nodes and replicate them asynchronously, naturally leading to conflicting concurrent writes and making linearizability impossible.",
    section: "Implementing Linearizable Systems"
  },
  {
    type: "write",
    q: "During an interview, a candidate says: 'We chose CP over AP because we needed low-latency transactions.' Explain why the CAP theorem is of little practical value for modern distributed systems design, and how it misrepresents normal operating conditions.",
    hint: "Think about CAP's narrow definition of consistency (strictly linearizability), availability (100% of non-failing nodes must respond), and how it ignores latency or non-partitioned normal operations.",
    modelAnswer: "The CAP theorem has a very narrow scope: it only considers one consistency model (linearizability), one fault type (network partitions), and defines availability as 100% responsiveness from all non-failing nodes. Importantly, the theorem only constrains behavior during an active network partition; outside partitions, latency and partial failures dominate, meaning the 'CP vs AP' choice is irrelevant during normal operation. Furthermore, CAP ignores latency, node crashes, network delays, and weaker consistency levels. In practice, designers must choose from a spectrum of consistency models and fault-tolerance tradeoffs rather than a simple binary choice.",
    section: "The CAP Theorem"
  },
  {
    type: "mc",
    q: "Which ID generation scheme guarantees that IDs are unique and monotonically ordered consistent with physical time without network communication?",
    options: [
      "Sharded database ID assignment schemes.",
      "Preallocated ranges or blocks of unique IDs.",
      "Standard Version 4 randomized UUID values.",
      "None of the options listed above are valid."
    ],
    correct: 3,
    explanation: "None of the above schemes can guarantee strictly physical-time ordered IDs without network communication, as physical clocks drift and no-communication shard IDs are not sequentially interleaved. Approximations like Snowflake or UUID v7 exist, but they are not strictly ordered. This is why most systems treat IDs as opaque identifiers and avoid depending on their time ordering for correctness.",
    section: "Ordering and Consensus"
  },
  {
    type: "mc",
    q: "What does a logical clock count?",
    options: [
      "Elapsed physical seconds using an oscillator.",
      "Accumulated CPU clock cycles since node boot.",
      "The total number of events that have occurred.",
      "The total number of active nodes in a cluster."
    ],
    correct: 2,
    explanation: "Unlike physical clocks which measure time, logical clocks are algorithms that count events (like messages sent or processed) to capture ordering.",
    section: "Logical Clocks"
  },
  {
    type: "write",
    q: "You are designing a distributed event tracker using Lamport clocks. Describe the algorithm a node must run to update its counter when (a) an event occurs locally, and (b) it receives a message from another node.",
    hint: "Recall the mechanism of taking the maximum of local and incoming counters, and how node IDs break ties to ensure total ordering.",
    modelAnswer: "A Lamport clock represents a timestamp as a pair of (counter, node ID). When a node processes a local event, it increments its local counter by 1. When it receives a message containing a timestamp (incoming counter, sender ID), it sets its local counter to the maximum of its current counter and the incoming counter, then increments its counter by 1 before attaching it to the event. Uniqueness is guaranteed by breaking ties using the node ID.",
    section: "Logical Clocks"
  },
  {
    type: "mc",
    q: "Why are Lamport timestamps insufficient for enforcing a database uniqueness constraint (e.g., locking a username)?",
    options: [
      "Because Lamport timestamps do not incorporate unique node identifiers and can result in duplicate values.",
      "Because a node cannot know if its own request has the lowest timestamp without contacting all other nodes.",
      "Because they rely on highly synchronized hardware atomic clocks and GPS receivers to function correctly.",
      "Because they are designed strictly to order sequential transactions and cannot compare concurrent events."
    ],
    correct: 1,
    explanation: "While Lamport timestamps totally order events, a node cannot immediately decide if its request won. It must wait to hear from all other nodes to ensure no lower timestamp was generated. If a node is partitioned or dead, this blocks progress, making it non-fault-tolerant.",
    section: "ID Generators and Logical Clocks"
  },
  {
    type: "mc",
    q: "What is the main advantage of a Hybrid Logical Clock (HLC) over a standard Lamport clock?",
    options: [
      "It leverages random 128-bit UUIDs to guarantee absolute uniqueness.",
      "It maintains event histories to explicitly detect concurrent operations.",
      "It stays close to physical time-of-day while preserving causal ordering.",
      "It completely eliminates the requirement for node identifiers or IDs."
    ],
    correct: 2,
    explanation: "HLCs combine physical clocks and Lamport logical clocks, meaning their timestamps can be used to query by physical time (e.g., date ranges) while maintaining happens-before causality.",
    section: "Logical Clocks"
  },
  {
    type: "write",
    q: "Your colleague proposes using Lamport clocks to detect concurrent edits in a collaborative editor. You suggest vector clocks instead. Explain the fundamental difference between these two logical clocks in their ability to identify concurrent events, and the space trade-off involved.",
    hint: "Ask yourself: if timestamp A is less than timestamp B, does it guarantee A happened before B? How does vector clock size scale with cluster size?",
    modelAnswer: "Lamport clocks provide a total ordering, but you cannot determine if two events were concurrent; you only know that if A causally preceded B, then A's timestamp is less than B's. Vector clocks maintain counters for every node, which allows them to explicitly detect concurrency (if neither timestamp is strictly greater than the other). However, vector clocks have a space penalty because their size grows linearly with the number of nodes in the cluster.",
    section: "Logical Clocks"
  },
  {
    type: "mc",
    q: "What is a 'timestamp oracle' in systems like TiDB or Google's Percolator?",
    options: [
      "A machine learning algorithm that dynamically predicts round-trip network latency.",
      "A single logical leader node that assigns linearizable timestamps to transactions.",
      "A high-precision Network Time Protocol (NTP) server equipped with GPS receivers.",
      "A distributed consensus cluster that votes on all physical system clock adjustments."
    ],
    correct: 1,
    explanation: "A timestamp oracle is a centralized, single-leader service that distributes monotonically increasing timestamps in batches, ensuring a linearizable order for transactions.",
    section: "Implementing a linearizable ID generator"
  },
  {
    type: "mc",
    q: "How does Google's Spanner achieve linearizable transactions across regions without a centralized timestamp oracle?",
    options: [
      "It relies on distributed vector clocks combined with advanced compression to track causal histories.",
      "It uses atomic clocks and GPS receivers to bound clock uncertainty and waits out the uncertainty interval.",
      "It routes all regional database transaction writes to a single master database instance in North America.",
      "It relaxes correctness guarantees, abandoning linearizable execution in favor of eventual consistency."
    ],
    correct: 1,
    explanation: "Spanner's TrueTime API provides a time interval representing clock uncertainty. By waiting out this uncertainty interval before committing, Spanner guarantees that subsequent transactions get a larger timestamp, ensuring linearizability.",
    section: "Implementing a linearizable ID generator"
  },
  {
    type: "write",
    q: "You are writing a formal specification for a new consensus engine. State the four mathematical properties (Uniform Agreement, Integrity, Validity, Termination) that define single-value consensus, and specify which one is a liveness property.",
    hint: "Group the properties into 'nothing bad happens' (safety) and 'something good eventually happens' (liveness).",
    modelAnswer: "The four properties are: 1) Uniform Agreement: No two nodes decide differently. 2) Integrity: No node decides twice (once decided, the decision is locked). 3) Validity: If a node decides value v, then v must have been proposed by some node. 4) Termination: Every node that does not crash eventually decides a value (this is the liveness property ensuring progress).",
    section: "Single-value consensus"
  },
  {
    type: "mc",
    q: "The FLP impossibility result states that:",
    options: [
      "Consensus can never be achieved under any circumstances in a packet network with variable routing delay.",
      "No deterministic consensus algorithm is guaranteed to terminate in an asynchronous system if nodes can crash.",
      "Eventual consistency is mathematically impossible to implement on distributed, shared-nothing storage systems.",
      "Active network partitions will always cause split-brain conditions and state corruption in Raft clusters."
    ],
    correct: 1,
    explanation: "The FLP result proves that in a fully asynchronous system model (no clocks or timeouts), a deterministic algorithm cannot guarantee consensus termination if even a single node can crash.",
    section: "The Impossibility of Consensus"
  },
  {
    type: "write",
    q: "During a high-throughput transaction phase, the coordinator node crashes in a Two-Phase Commit (2PC) setup. The participant databases are now locked up, unable to abort or commit, and client connections are timing out. Why is 2PC considered a blocking protocol, and how does this contrast with Paxos or Raft?",
    hint: "Think about the unanimity requirement in 2PC vs. the majority quorum requirement in Paxos or Raft.",
    modelAnswer: "Two-Phase Commit is blocking because it requires a unanimous 'yes' vote from all participants to commit. If the coordinator crashes after the participants have voted but before sending the commit decision, the participants cannot resolve the transaction on their own and must block indefinitely to avoid inconsistency. In contrast, Paxos and Raft are non-blocking consensus protocols because they only require a majority (quorum) to proceed, allowing the cluster to elect a new leader and continue even if some nodes crash.",
    section: "Atomic commitment as consensus"
  },
  {
    type: "mc",
    q: "What does 'state machine replication' (SMR) entail?",
    options: [
      "Replicating physical database backup snapshots to secondary storage regions using cron job scripts.",
      "Having replicas apply a totally ordered sequence of inputs from a shared log deterministically.",
      "Running a different, heterogeneous operating system kernel on each database replica in the cluster.",
      "Randomly routing incoming write requests to arbitrary nodes across the system to balance execution load."
    ],
    correct: 1,
    explanation: "State machine replication is the principle where all replicas start in the same state and apply the exact same inputs in the same sequence, ensuring they arrive at identical final states.",
    section: "Using shared logs"
  },
  {
    type: "write",
    q: "An engineer argues that Paxos/Raft and 2PC are basically the same because they both coordinate decisions across nodes. Clarify the core difference in their validation/decision rules: what is required for a transaction to succeed in 2PC vs. consensus?",
    hint: "Must every single participant agree in 2PC? Can a consensus leader decide a value even if some nodes crash?",
    modelAnswer: "In consensus, the algorithm can decide on any value that was proposed by a node. In atomic commitment, the rules are stricter: the transaction must abort if even a single participant votes to abort or times out. This means consensus can tolerate nodes crashing, whereas atomic commit requires coordination with all active participants, making it highly sensitive to failures.",
    section: "Atomic commitment as consensus"
  },
  {
    type: "mc",
    q: "How do consensus algorithms like Raft, Paxos, or Zab prevent split-brain where two nodes act as leader?",
    options: [
      "By leveraging GPS-linked clock synchronization to lock out potential secondary leaders.",
      "By defining epoch/term numbers and requiring a quorum to elect a leader and commit logs.",
      "By forcing all nodes to write their state updates directly to a single shared disk page.",
      "By relying on system operators to manually shut down lagging or partitioned replicas."
    ],
    correct: 1,
    explanation: "These protocols use monotonically increasing epoch/term numbers. A node will only vote for a leader with an equal or higher epoch, and any leader must collect votes from a quorum, ensuring only one leader can append logs in any epoch.",
    section: "From single-leader replication to consensus"
  },
  {
    type: "write",
    q: "In a Raft cluster, a network partition heals and a newly elected leader has to synchronize logs. How does Raft guarantee that this new leader will never overwrite or discard any log entries that were already committed by the old leader?",
    hint: "Look at how candidate logs are compared during elections and how a quorum overlap guarantees that at least one voter has the committed data.",
    modelAnswer: "Raft prevents a leader with stale data from overwriting committed logs by enforcing that a node can only be elected leader if its log is at least as up-to-date as the majority of the nodes in the cluster. Because committed entries must exist on a majority of nodes, any successful leader election quorum must contain at least one node that has the committed entry, ensuring the new leader has it.",
    section: "Subtleties of consensus"
  },
  {
    type: "mc",
    q: "Why is 'unclean leader election' in systems like Kafka a tradeoff of consistency for availability?",
    options: [
      "It requires every active node in the cluster to vote on every single read query, degrading performance.",
      "It allows a stale replica to become leader, potentially losing committed writes and corrupting the log.",
      "It completely blocks all new write operations during any occurrence of a routing network partition.",
      "It enforces strict serializability guarantees at the expense of excessive nonvolatile disk space usage."
    ],
    correct: 1,
    explanation: "Unclean leader election allows a node that was out-of-sync to become leader when all in-sync replicas fail. This restores availability quickly but causes data loss (committed writes are overwritten), violating consensus correctness.",
    section: "Consistency Versus Availability in Leader Election"
  },
  {
    type: "write",
    q: "To handle a massive spike in write volume, an operator proposes scaling out a Raft-based coordination cluster from 3 nodes to 15 nodes. Why will this decrease, rather than increase, the maximum write throughput of the consensus cluster?",
    hint: "Consider the size of the majority quorum and the network messages needed to achieve agreement as the cluster grows.",
    modelAnswer: "Adding nodes to a consensus cluster increases the number of nodes required to form a majority quorum (e.g., from 2 out of 3, to 3 out of 5, to 4 out of 7). This increases the network communication overhead and serialization latency for every single write, as the leader must gather votes from a larger number of nodes. Therefore, adding nodes actually makes the consensus protocol slower, though it increases fault tolerance.",
    section: "Pros and cons of consensus"
  },
  {
    type: "mc",
    q: "Which of the following is a primary use case for coordination services like ZooKeeper or etcd?",
    options: [
      "Storing petabytes of unstructured analytical clickstream data.",
      "Processing high-frequency user financial transaction ledgers.",
      "Distributed leader election and system metadata configuration.",
      "Managing object-based storage for large image and video files."
    ],
    correct: 2,
    explanation: "Coordination services are optimized to hold small, slow-changing metadata (like leader registration, shard allocation, and configuration) in memory, replicated via consensus.",
    section: "Coordination Services"
  },
  {
    type: "write",
    q: "A worker node claims a lock from ZooKeeper, starts processing a transaction, but is preempted by a 10-second JVM garbage collection pause. Another worker takes over the lock. How does a 'fencing token' prevent the first worker from corrupting storage when it wakes up?",
    hint: "Recall the role of monotonically increasing numbers attached to lock acquisitions and checked by the storage engine.",
    modelAnswer: "A fencing token is a monotonically increasing number (like etcd's revision or ZooKeeper's zxid) generated whenever a lock is acquired. If a client acquires a lock, goes into a long GC pause, and its lock lease expires, another client can acquire the lock with a higher token. When the paused client wakes up and tries to write, the storage service checks the token. Since the client's token is lower than the current lock holder's token, the write is rejected, preventing split-brain writes.",
    section: "Locks and leases"
  },
  {
    type: "mc",
    q: "In etcd version 3, how are linearizable reads handled?",
    options: [
      "They are served immediately from memory by whichever local follower replica the client happens to contact.",
      "The reading node performs a quorum check with other nodes to confirm it is still the authoritative leader.",
      "They rely on highly synchronized physical clocks using local Network Time Protocol (NTP) daemons.",
      "They are throttled by default, ensuring that read executions are only allowed once per calendar day."
    ],
    correct: 1,
    explanation: "To ensure a read is linearizable and does not return stale data from a deposed leader, etcd forces the reading leader to perform a quorum exchange to verify its status before returning the read value.",
    section: "Subtleties of consensus"
  },
  {
    type: "write",
    q: "A developer suggests storing raw, unvalidated JSON blobs in etcd to make the system schema-flexible, citing the 'sushi principle' (raw data is better). Explain why this principle applies to data lakes but is dangerous for metadata in coordination services.",
    hint: "Contrast the read-side schema flexibility of analytics with the strict, immediate invariants needed for cluster membership and leases.",
    modelAnswer: "The 'sushi principle' (storing raw, unprocessed data) applies to data lakes and batch processing systems (as discussed in Chapters 2–3) where keeping raw logs allows for flexible, retroactively modifiable analytical schemas. However, it does not apply to coordination metadata. Coordination metadata (such as leader leases or work allocation) is highly structured, akin to strict database schemas and invariants, and must represent a single, globally agreed-upon truth. Storing unstructured or unvalidated raw metadata in ZooKeeper or etcd would break system invariants, trigger split-brain, and crash dependent services, which is why metadata must be strictly validated on write.",
    section: "Coordination Services"
  }
];

const FLASHCARDS = [
  { front: "What is linearizability?", back: "A recency guarantee requiring that once a write succeeds, all subsequent reads see that value or a newer one, emulating a single copy of data." },
  { front: "Linearizability vs. Serializability", back: "Linearizability is a single-object recency guarantee. Serializability is a multi-object transaction isolation level (with no recency guarantee)." },
  { front: "What are the 4 formal properties of consensus?", back: "Uniform Agreement (no two nodes decide differently), Integrity (no node decides twice), Validity (decided value must be proposed), and Termination (nodes eventually decide)." },
  { front: "What is the FLP impossibility result?", back: "A proof that in an asynchronous system model, no deterministic consensus algorithm can be guaranteed to always terminate if nodes can crash." },
  { front: "How do we solve consensus in practice despite the FLP result?", back: "By using timeouts to suspect node crashes, or by using randomized algorithms." },
  { front: "What is a hybrid logical clock (HLC)?", back: "A clock combining physical time-of-day clocks with Lamport logical clocks to order events causally while staying close to physical time." },
  { front: "Lamport timestamps vs. Vector clocks", back: "Lamport timestamps provide a total causal ordering but cannot detect concurrency. Vector clocks can detect concurrent events but take more space." },
  { front: "Why are Dynamo-style quorum systems often not linearizable?", back: "Because race conditions, clock skew (in Last-Write-Wins), and lack of synchronous read repair can cause readers to see stale data." },
  { front: "What is Two-Phase Commit (2PC) and why is it blocking?", back: "A protocol for atomic transaction commit. It is blocking because if the coordinator crashes after nodes vote, participants must wait indefinitely." },
  { front: "What is Total Order Broadcast?", back: "A protocol equivalent to consensus that guarantees all nodes receive the same messages in the exact same order." },
  { front: "What is state machine replication (SMR)?", back: "A technique where replicas apply a totally ordered sequence of deterministic inputs (from a shared log) to remain in identical states." },
  { front: "How does etcd differ from ZooKeeper regarding reads?", back: "By default, ZooKeeper reads can be stale (non-linearizable) unless a sync is forced, while etcd version 3 reads are linearizable by default." },
  { front: "What is a fencing token?", back: "A monotonically increasing ID (like zxid or revision) attached to locks to block stale/paused clients from writing to storage." },
  { front: "What is an epoch/term/view number in consensus?", back: "A monotonically increasing counter representing the current leader's reign. Higher epoch leaders override older ones." },
  { front: "What is the minimum number of nodes needed to tolerate F failures in consensus?", back: "2F + 1 nodes, since a strict majority (F + 1) must be active to reach a quorum." }
];

const CONFIDENCE_LABELS = [
  "Linearizability vs other consistency models",
  "CAP theorem trade-offs and limits",
  "Logical clocks (Lamport, HLC, Vector)",
  "Formal consensus safety and liveness properties",
  "Two-Phase Commit vs Paxos/Raft",
  "Locking & membership in Coordination Services"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 10", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 15 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Explain the difference between 2PC and Raft/Paxos from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach the CAP theorem trade-offs to a colleague (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! Linearizability is a single-object recency guarantee. Serializability is a multi-object transaction isolation level. They can be combined as strict serializability, but they are conceptually distinct.",
    true: "Not quite! Look for the 'Linearizability Versus Serializability' sidebar. The database could execute transactions in a serial order but still serve stale data (serializable but not linearizable).",
    unsure: "It's a very common confusion in distributed databases. Compare single-object recency with multi-object grouping."
  },
  m2: {
    false: "Correct! Dynamo-style quorum reads/writes can return stale data under network race conditions and NTP clock skew, unless synchronous read repair and pre-write reads are enforced.",
    true: "Actually, no. Quorums alone do not guarantee linearizability. Race conditions and time-of-day clock issues (in LWW) can still serve stale data to client B after client A reads the new data.",
    unsure: "Quorums provide overlapping nodes, but look for the race condition diagram (Figure 10-6) where quorums still fail to be linearizable."
  },
  m3: {
    false: "Correct! The CAP theorem only defines one consistency (linearizability) and one fault (network partitions). You cannot 'choose' to avoid partitions; you choose consistency (CP) or availability (AP) *in the event of* a partition.",
    true: "This is a widespread misconception! The theorem only applies during a network partition, where partition tolerance is a physical reality, not a choice. Also, CAP consistency is strictly linearizability.",
    unsure: "The CAP theorem is highly misunderstood. Read the section on 'The CAP Theorem' to see what the true choices are."
  },
  m4: {
    true: "Correct! A node cannot know if its Lamport timestamp is the absolute lowest without communicating with all other nodes. If one node is unreachable, the system must halt to prevent conflicts, violating fault tolerance.",
    false: "Actually, Lamport timestamps alone cannot enforce constraints like username uniqueness in a fault-tolerant way. The node would have to wait to hear from every other node, which fails if a node is down.",
    unsure: "Consider what happens if one node in the system crashes. Can another node be certain its local Lamport timestamp is the global minimum?"
  },
  m5: {
    false: "Correct! 2PC is a blocking atomic commitment protocol where the coordinator is a single point of failure and *all* nodes must vote yes. Paxos/Raft are non-blocking consensus protocols requiring only a *majority*.",
    true: "No, they are different! 2PC requires unanimous agreement and is blocking if the coordinator fails. Paxos/Raft require only a majority and can elect a new leader automatically.",
    unsure: "Look for the comparison under 'Atomic commitment as consensus' — pay attention to the difference between unanimous agreement and majority quorums."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch10_learning';
