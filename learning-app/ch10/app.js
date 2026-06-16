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
      "It allows reads to return stale data temporarily but guarantees eventual updates.",
      "It requires that all transactions abort if any participant votes to abort."
    ],
    correct: 1,
    explanation: "Linearizability is a recency guarantee that makes the system behave as if there is only one copy of the data and all operations on it take effect atomically at some point in time.",
    section: "Linearizability"
  },
  {
    type: "mc",
    q: "In a nonlinearizable sports website, what is the cause of Bryce seeing a stale score after Aaliyah has already seen the final score?",
    options: [
      "A transaction isolation conflict between concurrent writes.",
      "A clock skew issue between Bryce's phone and Aaliyah's phone.",
      "Bryce's request being served by a replica that is lagging behind the one that served Aaliyah.",
      "A violation of serializability on the database cluster."
    ],
    correct: 2,
    explanation: "In a nonlinearizable system, replicas may update asynchronously. Bryce's request was routed to a lagging replica that had not yet processed the write seen by Aaliyah.",
    section: "Linearizability"
  },
  {
    type: "write",
    q: "Explain the 'cross-channel timing dependency' race condition that can occur when a web server writes a file to storage and puts a transcoding message on a queue.",
    hint: "Think about what happens if the queue is faster than the file storage's replication lag.",
    modelAnswer: "When a web server writes a file to a non-linearizable storage service and then sends an instruction to a transcoder via a message queue, a cross-channel race condition can occur. The message queue might deliver the message to the transcoder faster than the storage service replicates the new file. When the transcoder tries to read the file, it will see either an old version or no file at all, causing a permanent inconsistency.",
    section: "Linearizability"
  },
  {
    type: "mc",
    q: "How does linearizability differ from serializability?",
    options: [
      "Linearizability is a multi-object transaction guarantee; serializability is a single-object guarantee.",
      "Linearizability is a recency guarantee on single objects; serializability is an isolation guarantee on multi-object transactions.",
      "Linearizability allows stale reads, whereas serializability forbids them.",
      "Linearizability is a liveness property, whereas serializability is a safety property."
    ],
    correct: 1,
    explanation: "Linearizability ensures reads observe the most up-to-date state of a single object (recency). Serializability guarantees transactions behave as if executed in some serial order, but does not dictate how recent the reads must be.",
    section: "Linearizability Versus Serializability"
  },
  {
    type: "mc",
    q: "What does the combination of linearizability and serializability provide?",
    options: [
      "Eventual consistency",
      "Monotonic read isolation",
      "Strict serializability (or strong one-copy serializability)",
      "Two-phase commit"
    ],
    correct: 2,
    explanation: "A database that guarantees both serializability and linearizability is said to provide strict serializability, which is the strongest consistency and isolation model.",
    section: "Linearizability Versus Serializability"
  },
  {
    type: "write",
    q: "Why is Dynamo-style leaderless replication generally not linearizable, even when using quorum reads and writes (w + r > n)?",
    hint: "Consider network delays, concurrent reads/writes, and Last-Write-Wins clock skew.",
    modelAnswer: "Even with quorums, leaderless systems can experience race conditions where a reader gets a stale value if their quorum overlap reads from nodes that have not yet received the concurrent write. Furthermore, conflict resolution using Last-Write-Wins (LWW) relies on time-of-day clocks, which are subject to clock skew and NTP updates, violating linearizable order. True linearizability in quorums requires synchronous read repair and pre-write reads, which degrade performance.",
    section: "Implementing Linearizable Systems"
  },
  {
    type: "mc",
    q: "Under the CAP theorem, how is 'Consistency' defined?",
    options: [
      "Consistency in ACID (application-level invariants).",
      "Eventual consistency.",
      "Linearizability.",
      "Monotonic reads."
    ],
    correct: 2,
    explanation: "The CAP theorem defines Consistency strictly as linearizability. Other forms of database consistency, like ACID consistency or eventual consistency, do not satisfy CAP Consistency.",
    section: "The CAP Theorem"
  },
  {
    type: "mc",
    q: "Which of the following replication methods is generally NOT linearizable under any configuration?",
    options: [
      "Single-leader replication (with reads routed through the leader).",
      "Consensus algorithms (like Raft or Zab).",
      "Multi-leader replication.",
      "Single-node databases."
    ],
    correct: 2,
    explanation: "Multi-leader systems concurrently accept writes on different nodes and replicate them asynchronously, naturally leading to conflicting concurrent writes and making linearizability impossible.",
    section: "Implementing Linearizable Systems"
  },
  {
    type: "write",
    q: "Discuss why the CAP theorem is often considered of 'little practical value' for modern distributed systems design, according to the author.",
    hint: "What are its narrow definitions of consistency, availability, and faults?",
    modelAnswer: "The CAP theorem has a very narrow scope: it only considers one consistency model (linearizability), one fault type (network partitions), and defines availability as 100% responsiveness from all non-failing nodes. Importantly, the theorem only constrains behavior during an active network partition; outside partitions, latency and partial failures dominate, meaning the 'CP vs AP' choice is irrelevant during normal operation. Furthermore, CAP ignores latency, node crashes, network delays, and weaker consistency levels. In practice, designers must choose from a spectrum of consistency models and fault-tolerance tradeoffs rather than a simple binary choice.",
    section: "The CAP Theorem"
  },
  {
    type: "mc",
    q: "Which ID generation scheme guarantees that IDs are unique and monotonically ordered consistent with physical time without network communication?",
    options: [
      "Sharded ID assignment (even/odd).",
      "Preallocated blocks of IDs.",
      "Version 4 random UUIDs.",
      "None of the above."
    ],
    correct: 3,
    explanation: "None of the above schemes can guarantee strictly physical-time ordered IDs without network communication, as physical clocks drift and no-communication shard IDs are not sequentially interleaved. Approximations like Snowflake or UUID v7 exist, but they are not strictly ordered. This is why most systems treat IDs as opaque identifiers and avoid depending on their time ordering for correctness.",
    section: "Ordering and Consensus"
  },
  {
    type: "mc",
    q: "What does a logical clock count?",
    options: [
      "Physical seconds using an oscillator.",
      "CPU clock cycles since boot.",
      "The number of events that have occurred.",
      "The number of active nodes in a cluster."
    ],
    correct: 2,
    explanation: "Unlike physical clocks which measure time, logical clocks are algorithms that count events (like messages sent or processed) to capture ordering.",
    section: "Logical Clocks"
  },
  {
    type: "write",
    q: "Explain how a Lamport clock updates its counter when a node processes an event and when it receives a message from another node.",
    hint: "How is uniqueness guaranteed?",
    modelAnswer: "A Lamport clock represents a timestamp as a pair of (counter, node ID). When a node processes a local event, it increments its local counter by 1. When it receives a message containing a timestamp (incoming counter, sender ID), it sets its local counter to the maximum of its current counter and the incoming counter, then increments its counter by 1 before attaching it to the event. Uniqueness is guaranteed by breaking ties using the node ID.",
    section: "Logical Clocks"
  },
  {
    type: "mc",
    q: "Why are Lamport timestamps insufficient for enforcing a database uniqueness constraint (e.g., locking a username)?",
    options: [
      "Because Lamport timestamps are not unique.",
      "Because a node cannot know if its own request has the lowest timestamp without contacting all other nodes.",
      "Because they require atomic clocks to operate.",
      "Because they cannot order concurrent events."
    ],
    correct: 1,
    explanation: "While Lamport timestamps totally order events, a node cannot immediately decide if its request won. It must wait to hear from all other nodes to ensure no lower timestamp was generated. If a node is partitioned or dead, this blocks progress, making it non-fault-tolerant.",
    section: "ID Generators and Logical Clocks"
  },
  {
    type: "mc",
    q: "What is the main advantage of a Hybrid Logical Clock (HLC) over a standard Lamport clock?",
    options: [
      "It uses 128-bit UUIDs for complete uniqueness.",
      "It can detect concurrent events like a vector clock.",
      "It stays close to physical time-of-day while preserving causal ordering.",
      "It does not require any node IDs."
    ],
    correct: 2,
    explanation: "HLCs combine physical clocks and Lamport logical clocks, meaning their timestamps can be used to query by physical time (e.g., date ranges) while maintaining happens-before causality.",
    section: "Logical Clocks"
  },
  {
    type: "write",
    q: "Compare and contrast Lamport clocks and Vector clocks regarding their ability to identify concurrent events.",
    hint: "What does it mean if timestamp A is less than timestamp B? What is the size penalty?",
    modelAnswer: "Lamport clocks provide a total ordering, but you cannot determine if two events were concurrent; you only know that if A causally preceded B, then A's timestamp is less than B's. Vector clocks maintain counters for every node, which allows them to explicitly detect concurrency (if neither timestamp is strictly greater than the other). However, vector clocks have a space penalty because their size grows linearly with the number of nodes in the cluster.",
    section: "Logical Clocks"
  },
  {
    type: "mc",
    q: "What is a 'timestamp oracle' in systems like TiDB or Google's Percolator?",
    options: [
      "A machine learning model that predicts network latency.",
      "A single logical leader node that assigns linearizable timestamps to transactions.",
      "An NTP server equipped with GPS.",
      "A consensus cluster that votes on every clock adjustment."
    ],
    correct: 1,
    explanation: "A timestamp oracle is a centralized, single-leader service that distributes monotonically increasing timestamps in batches, ensuring a linearizable order for transactions.",
    section: "Implementing a linearizable ID generator"
  },
  {
    type: "mc",
    q: "How does Google's Spanner achieve linearizable transactions across regions without a centralized timestamp oracle?",
    options: [
      "It relies on vector clocks with high-compression algorithms.",
      "It uses atomic clocks and GPS receivers to bound clock uncertainty and waits out the uncertainty interval.",
      "It routes all transaction writes to a single master database in North America.",
      "It abandons linearizability in favor of eventual consistency."
    ],
    correct: 1,
    explanation: "Spanner's TrueTime API provides a time interval representing clock uncertainty. By waiting out this uncertainty interval before committing, Spanner guarantees that subsequent transactions get a larger timestamp, ensuring linearizability.",
    section: "Implementing a linearizable ID generator"
  },
  {
    type: "write",
    q: "State the four formal safety and liveness properties of single-value consensus.",
    hint: "Uniform Agreement, Integrity, Validity, Termination.",
    modelAnswer: "The four properties are: 1) Uniform Agreement: No two nodes decide differently. 2) Integrity: No node decides twice (once decided, the decision is locked). 3) Validity: If a node decides value v, then v must have been proposed by some node. 4) Termination: Every node that does not crash eventually decides a value (this is the liveness property ensuring progress).",
    section: "Single-value consensus"
  },
  {
    type: "mc",
    q: "The FLP impossibility result states that:",
    options: [
      "Consensus can never be achieved in any network.",
      "No deterministic consensus algorithm is guaranteed to terminate in an asynchronous system if nodes can crash.",
      "Eventual consistency is mathematically impossible on shared storage.",
      "Network partitions will always cause split-brain in Raft."
    ],
    correct: 1,
    explanation: "The FLP result proves that in a fully asynchronous system model (no clocks or timeouts), a deterministic algorithm cannot guarantee consensus termination if even a single node can crash.",
    section: "The Impossibility of Consensus"
  },
  {
    type: "write",
    q: "Explain why Two-Phase Commit (2PC) is considered a 'blocking' protocol, and how this makes it different from Paxos or Raft.",
    hint: "Think about what happens if the coordinator crashes after nodes vote.",
    modelAnswer: "Two-Phase Commit is blocking because it requires a unanimous 'yes' vote from all participants to commit. If the coordinator crashes after the participants have voted but before sending the commit decision, the participants cannot resolve the transaction on their own and must block indefinitely to avoid inconsistency. In contrast, Paxos and Raft are non-blocking consensus protocols because they only require a majority (quorum) to proceed, allowing the cluster to elect a new leader and continue even if some nodes crash.",
    section: "Atomic commitment as consensus"
  },
  {
    type: "mc",
    q: "What does 'state machine replication' (SMR) entail?",
    options: [
      "Replicating database backups using cron jobs.",
      "Having replicas apply a totally ordered sequence of inputs from a shared log deterministically.",
      "Running a different operating system on each database replica.",
      "Randomly choosing nodes to process writes to balance load."
    ],
    correct: 1,
    explanation: "State machine replication is the principle where all replicas start in the same state and apply the exact same inputs in the same sequence, ensuring they arrive at identical final states.",
    section: "Using shared logs"
  },
  {
    type: "write",
    q: "Contrast 'atomic commitment' (like 2PC) with 'consensus' (like Paxos/Raft) regarding their validation rules.",
    hint: "Can consensus choose any proposed value? Must atomic commit respect an abort vote?",
    modelAnswer: "In consensus, the algorithm can decide on any value that was proposed by a node. In atomic commitment, the rules are stricter: the transaction must abort if even a single participant votes to abort or times out. This means consensus can tolerate nodes crashing, whereas atomic commit requires coordination with all active participants, making it highly sensitive to failures.",
    section: "Atomic commitment as consensus"
  },
  {
    type: "mc",
    q: "How do consensus algorithms like Raft, Paxos, or Zab prevent split-brain where two nodes act as leader?",
    options: [
      "By using GPS clock sync to lock out secondary leaders.",
      "By defining epoch/term numbers and requiring a quorum to elect a leader and commit logs.",
      "By forcing all nodes to write to a shared disk page.",
      "By manually shutting down lagging replicas."
    ],
    correct: 1,
    explanation: "These protocols use monotonically increasing epoch/term numbers. A node will only vote for a leader with an equal or higher epoch, and any leader must collect votes from a quorum, ensuring only one leader can append logs in any epoch.",
    section: "From single-leader replication to consensus"
  },
  {
    type: "write",
    q: "In Raft, when a leader fails and a new leader is elected, how does the protocol ensure that the new leader does not overwrite committed log entries from the old leader?",
    hint: "How is a node's log completeness evaluated during elections?",
    modelAnswer: "Raft prevents a leader with stale data from overwriting committed logs by enforcing that a node can only be elected leader if its log is at least as up-to-date as the majority of the nodes in the cluster. Because committed entries must exist on a majority of nodes, any successful leader election quorum must contain at least one node that has the committed entry, ensuring the new leader has it.",
    section: "Subtleties of consensus"
  },
  {
    type: "mc",
    q: "Why is 'unclean leader election' in systems like Kafka a tradeoff of consistency for availability?",
    options: [
      "It requires all nodes to vote on every read, slowing performance.",
      "It allows a stale replica to become leader, potentially losing committed writes and corrupting the log.",
      "It prevents any writes during a network partition.",
      "It enforces strict serializability at the cost of disk space."
    ],
    correct: 1,
    explanation: "Unclean leader election allows a node that was out-of-sync to become leader when all in-sync replicas fail. This restores availability quickly but causes data loss (committed writes are overwritten), violating consensus correctness.",
    section: "Consistency Versus Availability in Leader Election"
  },
  {
    type: "write",
    q: "Explain why consensus throughput cannot be scaled linearly by simply adding more nodes to the cluster.",
    hint: "What happens to communication overhead and quorums?",
    modelAnswer: "Adding nodes to a consensus cluster increases the number of nodes required to form a majority quorum (e.g., from 2 out of 3, to 3 out of 5, to 4 out of 7). This increases the network communication overhead and serialization latency for every single write, as the leader must gather votes from a larger number of nodes. Therefore, adding nodes actually makes the consensus protocol slower, though it increases fault tolerance.",
    section: "Pros and cons of consensus"
  },
  {
    type: "mc",
    q: "Which of the following is a primary use case for coordination services like ZooKeeper or etcd?",
    options: [
      "Storing petabytes of analytical clickstream data.",
      "Enforcing high-frequency user transaction ledgers.",
      "Distributed leader election and system metadata configuration.",
      "Image and video file storage."
    ],
    correct: 2,
    explanation: "Coordination services are optimized to hold small, slow-changing metadata (like leader registration, shard allocation, and configuration) in memory, replicated via consensus.",
    section: "Coordination Services"
  },
  {
    type: "write",
    q: "Explain what a 'fencing token' is and why it is necessary in a distributed lock service when clients undergo garbage collection (GC) pauses.",
    hint: "Think about what happens to client leases during a pause.",
    modelAnswer: "A fencing token is a monotonically increasing number (like etcd's revision or ZooKeeper's zxid) generated whenever a lock is acquired. If a client acquires a lock, goes into a long GC pause, and its lock lease expires, another client can acquire the lock with a higher token. When the paused client wakes up and tries to write, the storage service checks the token. Since the client's token is lower than the current lock holder's token, the write is rejected, preventing split-brain writes.",
    section: "Locks and leases"
  },
  {
    type: "mc",
    q: "In etcd version 3, how are linearizable reads handled?",
    options: [
      "They are served immediately from whichever replica the client contacts.",
      "The reading node performs a quorum check with other nodes to confirm it is still the authoritative leader.",
      "They rely on local NTP clock synchronization.",
      "They are only allowed once a day."
    ],
    correct: 1,
    explanation: "To ensure a read is linearizable and does not return stale data from a deposed leader, etcd forces the reading leader to perform a quorum exchange to verify its status before returning the read value.",
    section: "Subtleties of consensus"
  },
  {
    type: "write",
    q: "Discuss how the 'sushi principle' (storing raw, unprocessed data) applies or does not apply to metadata in coordination services versus transactional databases.",
    hint: "Is coordination metadata structured or unstructured? Why does it need strict rules?",
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
      let prompt = `You are grading a student's responses to Chapter 10 ("Consistency and Consensus") of Designing Data-Intensive Applications.
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
- A custom 1-2 sentence recommendation on which specific sub-sections of Chapter 10 (e.g. Linearizability, Ordering Guarantees, Lamport/HLC clocks, Distributed Transactions and Consensus, Coordination Services) they should review.`;

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
