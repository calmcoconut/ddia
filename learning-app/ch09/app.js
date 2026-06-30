/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   Chapter 9: The Trouble with Distributed Systems
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the defining characteristic of a 'partial failure' in a distributed system?",
    options: [
      "The entire cluster crashes simultaneously and requires a manual hardware reboot",
      "Some parts of the system are broken in an unpredictable way, while others work fine",
      "A database table loses several partition columns but remains partially queryable",
      "A single processing thread terminates abruptly with an out-of-memory exception"
    ],
    correct: 1,
    explanation: "A partial failure is nondeterministic: some components fail while others continue working, which is the primary source of complexity in distributed systems.",
    section: "Faults and Partial Failures"
  },
  {
    type: "mc",
    q: "If a TCP connection is aborted with an error, what can the sending application conclude about the data it wrote to the socket?",
    options: [
      "The transmitted data was definitely not received or processed by the remote operating system",
      "The data was successfully received, parsed, and processed by the destination application layer",
      "It is impossible to know how much of the data was received or processed by the remote node",
      "The destination hardware server node has suffered a fatal crash and will never be recovered"
    ],
    correct: 2,
    explanation: "TCP acknowledgments only confirm receipt by the remote OS kernel, not by the application itself. If the connection drops, you cannot distinguish between lost requests, remote node crashes, or lost responses.",
    section: "The Limitations of TCP"
  },
  {
    type: "write",
    q: "During a post-mortem review of a major outage, the ops team argues about the heartbeat timeout. One engineer wants to drop it from 30 seconds to 2 seconds to fail over faster; another warns this will cause a stampede of false alarms during JVM garbage collection pauses. Why is finding the sweet spot for heartbeat timeouts in an asynchronous network so notoriously difficult?",
    hint: "Put yourself in the shoes of the cluster manager: balance the risk of declaring a healthy but slow node dead (false positives) against leaving a dead node in the rotation (false negatives).",
    modelAnswer: "If a timeout is configured too short, the system risks false positives: declaring a node dead when it is actually alive but temporarily delayed (e.g., due to a GC pause or network congestion). This triggers unnecessary failovers and resource consumption. Conversely, if the timeout is too long, the system suffers from slow fault detection, meaning clients will experience long delays or timeouts before a dead node is taken out of rotation.",
    section: "Fault Detection"
  },
  {
    type: "mc",
    q: "What is the main reason why internet and datacenter networks experience unbounded delays?",
    options: [
      "The speed of light in fiber varies significantly based on current network traffic load",
      "Routers queue packets when outbound links are congested, potentially dropping them",
      "Operating systems throttle outbound throughput per-process to prevent a single application from monopolizing the NIC bandwidth",
      "TCP checksum validation overhead scales non-linearly with payload size"
    ],
    correct: 1,
    explanation: "Queueing in network switches and routers is the primary cause of variable packet delay. Under load, packets wait in queue until capacity is available; if the queue fills up, packets are dropped.",
    section: "Timeouts and Unbounded Delays"
  },
  {
    type: "mc",
    q: "Why don't standard packet networks (like Ethernet) offer the same timing guarantees as a telephone network (circuit-switching)?",
    options: [
      "Telephone networks transmit analog voice signals which physically travel through copper wires much faster than digitized packetized data payloads",
      "Ethernet is designed for variable, bursty traffic and shares bandwidth dynamically, while telephone networks reserve fixed bandwidth for each call",
      "Circuit-switched networks require a pre-established end-to-end path before any data is transmitted, adding connection setup overhead that makes short bursty requests slower overall",
      "Ethernet standard implementations completely lack TCP-like congestion control algorithms, which telephone networks implement directly in hardware"
    ],
    correct: 1,
    explanation: "Telephone networks use circuit switching to reserve a fixed band (time slot) for each call, guaranteeing bounded delay. Ethernet dynamically shares bandwidth using packet switching, optimizing for bursty data at the expense of variable delays.",
    section: "Synchronous Versus Asynchronous Networks"
  },
  {
    type: "write",
    q: "You're debugging a profiling tool that occasionally reports negative execution times (e.g., a function taking -15 milliseconds to run). You realize the tool uses physical system wall-clock time. Why does this happen, and how does switching to a monotonic clock solve this timing paradox?",
    hint: "Think about how NTP synchronization interacts with wall-clock time jumps versus how monotonic counters measure elapsed intervals.",
    modelAnswer: "A monotonic clock is guaranteed to always move forward in time, and its absolute value is arbitrary (e.g., nanoseconds since boot), making it ideal for calculating intervals by taking the difference between two readings. In contrast, a time-of-day clock measures wall-clock time and is synchronized via NTP. NTP can forcibly reset the clock, causing it to jump backward or forward in time, which would corrupt duration calculations (e.g., showing a negative interval).",
    section: "Monotonic Versus Time-of-Day Clocks"
  },
  {
    type: "mc",
    q: "Which of the following functions or APIs returns a value from a monotonic clock?",
    options: [
      "The System.currentTimeMillis() method in Java",
      "The clock_gettime(CLOCK_REALTIME) call in Linux",
      "The System.nanoTime() method call in Java",
      "The new Date().getTime() method in JavaScript"
    ],
    correct: 2,
    explanation: "System.nanoTime() in Java returns a monotonic clock value. In contrast, System.currentTimeMillis() in Java, clock_gettime(CLOCK_REALTIME) in Linux (its monotonic counterpart is CLOCK_MONOTONIC), and JavaScript's new Date().getTime() all return time-of-day (wall-clock) time, which is subject to NTP adjustments.",
    section: "Monotonic Versus Time-of-Day Clocks"
  },
  {
    type: "mc",
    q: "How does clock drift typically manifest in standard computer systems?",
    options: [
      "The system clock automatically jumps backward or forward by exactly one hour twice a year due to daylight saving time",
      "The quartz crystal oscillator runs slightly faster or slower depending on temperature, accumulating drift over time",
      "A bug in the NTP synchronization daemon causes accumulated offset errors across successive sync cycles",
      "Congested network routers strip time synchronization flags and timestamp headers from standard TCP/IP packet headers"
    ],
    correct: 1,
    explanation: "Hardware clocks rely on quartz crystal oscillators, which drift due to temperature fluctuations. A typical server can drift by milliseconds per day, limiting time synchronization accuracy.",
    section: "Clock Synchronization and Accuracy"
  },
  {
    type: "write",
    q: "Two users concurrently edit the same document. Node A has a fast system clock, and Node B has a slow system clock. If the cluster uses a Last-Write-Wins (LWW) resolution policy, explain how a chronologically later update on Node B can get silently discarded.",
    hint: "Trace the timestamps assigned by Node A (fast/future clock) and Node B (slow/lagging clock), and see which one LWW chooses during replication.",
    modelAnswer: "LWW resolves write conflicts by keeping the write with the highest physical timestamp and discarding older ones. If Node 1's clock is ahead (fast) and Node 3's clock is behind (slow), a write on Node 1 will receive a future timestamp. A causally later write on Node 3 will receive a lower timestamp because of its lagging clock. When replicated, the system will compare timestamps, conclude the earlier write on Node 1 is 'newer', and silently drop Client B's update. This is especially problematic in multi-leader or leaderless replication where different leaders assign timestamps independently without a single authority.",
    section: "Relying on Synchronized Clocks"
  },
  {
    type: "mc",
    q: "What is a 'logical clock' and how does it differ from a 'physical clock'?",
    options: [
      "A logical clock measures elapsed execution time in CPU cycles and hardware instruction execution rates rather than seconds",
      "A logical clock assigns unique timestamps to events using a distributed consensus round, ensuring no two events share the same timestamp across nodes",
      "A logical clock uses incrementing counters to track the relative order of events, rather than measuring elapsed physical time",
      "A logical clock runs within virtualized environments to prevent process preemption and garbage collection-related pauses"
    ],
    correct: 2,
    explanation: "Logical clocks (e.g. Lamport timestamps) rely on incrementing counters to establish a relative causal ordering of events. They do not measure physical seconds or time-of-day, unlike physical clocks.",
    section: "Relying on Synchronized Clocks"
  },
  {
    type: "mc",
    q: "How does Google Spanner's TrueTime API represent the current time?",
    options: [
      "A single 64-bit integer representing nanoseconds since the Unix epoch",
      "A high-precision floating-point value with a guaranteed drift of zero",
      "An interval [earliest, latest] that bounds the actual current time",
      "A cryptographic hash value generated by a distributed atomic clock quorum"
    ],
    correct: 2,
    explanation: "TrueTime explicitly returns a time interval [earliest, latest]. The width of this interval represents the clock synchronization uncertainty, allowing Spanner to make safe causal ordering decisions.",
    section: "Clock readings with a confidence interval"
  },
  {
    type: "write",
    q: "Your application thread occasionally pauses for several seconds, causing client request timeouts. During a engineering team brainstorming session, you need to list four distinct software, runtime, or hardware virtualization mechanisms that can suddenly halt user code execution.",
    hint: "Consider GC pauses, OS scheduler decisions, page faults, and VM hypervisor level operations.",
    modelAnswer: "Unexpected process pauses can be caused by: 1) JVM 'stop-the-world' garbage collection pauses where all application threads are halted; 2) Virtual memory page faults causing the thread to block while pages are swapped from disk; 3) OS thread scheduling preemption or hypervisor context switches (steal time) under high resource load; and 4) Hypervisor live migration where a VM is suspended and its memory is copied to another host.",
    section: "Process Pauses"
  },
  {
    type: "mc",
    q: "If a database node uses a time-of-day lease to maintain its leader status, why is a long JVM GC pause dangerous?",
    options: [
      "The long execution pause triggers the underlying host operating system kernel to issue a SIGKILL signal, immediately terminating the node process",
      "The node may check that the lease is valid, pause, have the lease expire during the pause, and then perform unsafe writes when it resumes",
      "The memory reclaiming process of the garbage collector directly corrupts the active database transaction log records stored in the RAM buffers",
      "Local NTP synchronization daemons will time out and fail because all networking ports including port 123 are completely closed during JVM pauses"
    ],
    correct: 1,
    explanation: "If a node checks lease validity, then pauses for longer than the remaining lease time, another node will take over as leader. When the paused node resumes, it continues executing its write path, unaware that its leadership has expired, leading to split-brain corruption.",
    section: "Process Pauses"
  },
  {
    type: "mc",
    q: "Under what circumstances is Byzantine Fault Tolerance (BFT) typically considered necessary?",
    options: [
      "When corporate datacenters are connected over public, unencrypted fiber links across regions",
      "In systems where nodes are untrusted and may send false, contradictory, or malicious messages",
      "When the database application code is written in a garbage-collected programming language like Java",
      "To completely eliminate single points of failure within standard multi-leader database setups"
    ],
    correct: 1,
    explanation: "BFT is designed for environments where participants do not trust each other (e.g., public blockchains or aerospace systems exposed to radiation). It protects against nodes that actively lie or violate protocols.",
    section: "Byzantine Faults"
  },
  {
    type: "write",
    q: "A node acquires a lease-based distributed lock, starts a write operation to shared storage, but is hit by a massive garbage collection pause. While it is paused, the lease expires and another node acquires the lock. Explain what happens when the first node wakes up, and why it's referred to as a 'zombie node' causing data corruption.",
    hint: "Visualize the delayed storage write packet arriving after a new lock holder has already started writing, and think about the lack of lease awareness in the paused node.",
    modelAnswer: "A zombie node is a node that previously held a lock or lease but has lost it (either because the lease timed out during a process pause or because of a network disconnection) yet remains unaware of this status. It is dangerous because the zombie node will continue to execute write operations as if it were still the legitimate lock holder, conflicting with the new lock holder and corrupting shared storage. Typical mitigations against this pattern include using fencing tokens checked at the storage layer, implementing very short leases, or avoiding time-of-day-based leases in favor of quorum-based or monotonic lease mechanisms.",
    section: "Distributed Locks and Leases"
  },
  {
    type: "mc",
    q: "How do fencing tokens prevent data corruption caused by zombie nodes?",
    options: [
      "They notify the hypervisor layer to immediately shut down and power off the virtual machine of any node whose lock lease has expired",
      "They dynamically encrypt all database transaction log files to ensure that only the current designated leader can decrypt and read them",
      "They are incrementing numbers sent with writes; the storage service rejects writes with a token lower than the highest it has processed",
      "They act as specialized high-resolution timestamps that synchronize physical server clocks to under one microsecond of uncertainty"
    ],
    correct: 2,
    explanation: "A fencing token is a monotonically increasing number. The storage server keeps track of the largest token it has accepted. If a zombie node sends a write with an older (smaller) token, the storage server rejects it.",
    section: "Distributed Locks and Leases"
  },
  {
    type: "mc",
    q: "Why are Byzantine fault-tolerant protocols generally not used in standard corporate datacenters?",
    options: [
      "Standard datacenter network switches and routers do not support the low-overhead packet headers required by the Byzantine protocol",
      "Datacenter nodes are controlled by a single organization and can be trusted, making the extreme performance cost of BFT unjustifiable",
      "The BFT mathematical formulation is only compatible with transactional SQL databases, whereas corporate networks run NoSQL document stores",
      "BFT requires each node to run independent implementations of the same protocol in different languages to detect software-level faults, making deployment impractical at scale"
    ],
    correct: 1,
    explanation: "BFT protocols are complex and have high CPU/network overhead. Since datacenter nodes are owned by a single organization and run in a trusted network, traditional security (access control, encryption) is used instead.",
    section: "Byzantine Faults"
  },
  {
    type: "write",
    q: "Your system architect asks you to analyze a network protocol under two theoretical models: one where message delivery and CPU execution times have strict, guaranteed upper bounds, and another where they are completely unbounded. Contrast these 'Synchronous' and 'Asynchronous' timing models.",
    hint: "Focus on the predictability of timeouts, network delays, process execution speeds, and physical clock drift in both models.",
    modelAnswer: "The Synchronous model assumes that network delays, process execution pauses, and clock drift are all bounded and will never exceed a known, fixed limit, making timeouts reliable for fault detection. The Asynchronous model makes no timing assumptions whatsoever, meaning network delays and process pauses are unbounded, and the system lacks a physical clock or timeout capabilities. Real systems are best modeled as partially synchronous: behaving synchronously most of the time, but occasionally suffering unbounded delays.",
    section: "System Model and Reality"
  },
  {
    type: "mc",
    q: "Which node failure model assumes that a node can fail by crashing, but once it crashes, it never recovers or comes back?",
    options: [
      "The crash-recovery model",
      "The crash-stop model",
      "The Byzantine fail-arbitrary model",
      "The fail-slow (performance fault) model"
    ],
    correct: 1,
    explanation: "The crash-stop (or fail-stop) model assumes that a node that halts is gone forever. It is mathematically simpler to reason about, but does not reflect real-world server reboots.",
    section: "System Model and Reality"
  },
  {
    type: "mc",
    q: "In the crash-recovery model, what is assumed to survive a node's crash?",
    options: [
      "The volatile contents of the operating system's RAM page cache",
      "The immediate state of CPU registers and active executing threads",
      "The persistent data written to stable, nonvolatile storage (disk)",
      "The active socket bindings and TCP connections to other nodes"
    ],
    correct: 2,
    explanation: "The crash-recovery model assumes that nodes can recover after a crash. Crucially, they lose their volatile in-memory state but retain their stable, nonvolatile storage (disks), which is used to restore consistency on reboot.",
    section: "System Model and Reality"
  },
  {
    type: "write",
    q: "A QA engineer files a bug report stating: 'The consensus engine allowed two leaders to exist simultaneously.' Another files a report: 'The cluster is stuck and has not elected a leader yet.' Distinguish these using the concepts of safety and liveness properties.",
    hint: "Use the standard definitions of 'nothing bad happens' versus 'something good eventually happens', noting which violations are permanent and which are temporary.",
    modelAnswer: "A safety property informally guarantees that 'nothing bad happens.' If it is violated, we can point to a specific moment it was broken, and the violation cannot be undone (e.g., returning duplicate fencing tokens or electing two leaders). A liveness property guarantees that 'something good eventually happens.' It can be temporarily unsatisfied but can always be fulfilled in the future (e.g., a node eventually receiving a response or eventual consistency).",
    section: "System Model and Reality"
  },
  {
    type: "mc",
    q: "Eventual consistency is which type of property?",
    options: [
      "A safety property",
      "A liveness property",
      "A consistency property guaranteeing reads always reflect the most recent write",
      "A deterministic property"
    ],
    correct: 1,
    explanation: "Eventual consistency is a liveness property because it includes 'eventually'. It guarantees that if no updates occur, all replicas will eventually agree on the value. If they disagree now, it is not a safety violation, since they might sync later.",
    section: "System Model and Reality"
  },
  {
    type: "mc",
    q: "What is a key limitation of using model checkers (like TLA+) to verify distributed algorithms?",
    options: [
      "They can only verify algorithms that are written in specific, low-level systems languages like C++ or Assembly",
      "They test the abstract mathematical model of the protocol, not the actual production code implementation",
      "They require physical access to synchronized atomic clocks or high-precision hardware timers to verify states",
      "They are purely static analysis tools that cannot simulate complex network partitions or concurrent node crashes"
    ],
    correct: 1,
    explanation: "Model checkers verify a simplified, abstract model of the algorithm, which helps find design flaws. However, they do not run the actual production code, meaning implementation bugs can still exist.",
    section: "Formal Methods and Randomized Testing"
  },
  {
    type: "write",
    q: "Tired of tracking down flaky, non-reproducible distributed race conditions in integration tests, your lead engineer proposes building a system where thread scheduling, network delays, and clock drift are completely mocked and driven by a single random seed. Explain what Deterministic Simulation Testing (DST) is and how it differs from traditional testing.",
    hint: "Focus on the control of non-determinism and the ability to reproduce complex timing bugs deterministically.",
    modelAnswer: "Deterministic Simulation Testing (DST) runs the actual production code (rather than a model) inside a simulated environment where all sources of nondeterminism (clocks, network delays, disk I/O, thread scheduling) are mocked and controlled. This allows the simulator to explore a vast state space of timings and failure scenarios. Unlike standard integration testing, which is chaotic and prone to flaky tests, DST is 100% reproducible: if a bug is found, it can be replayed identically by running the simulator with the same random seed.",
    section: "Formal Methods and Randomized Testing"
  },
  {
    type: "mc",
    q: "Which of the following tools was popularized by Netflix for injecting random server crashes in production to test fault tolerance?",
    options: [
      "The Jepsen testing framework",
      "The Chaos Monkey tool",
      "The Antithesis platform",
      "The TLA+ specifications"
    ],
    correct: 1,
    explanation: "Netflix developed Chaos Monkey to randomly terminate instances in production, forcing engineers to build systems that automatically survive node failures (Chaos Engineering).",
    section: "Formal Methods and Randomized Testing"
  },
  {
    type: "mc",
    q: "If a distributed algorithm guarantees safety under all conditions, but liveness only when the network behaves, what does this mean?",
    options: [
      "If the network partitions or packets are dropped, the database will immediately return corrupted data or violate schema constraints to the application",
      "Even if the network fails indefinitely, the system will never return an incorrect result, but it may stop responding until the network recovers",
      "The distributed system is completely Byzantine fault-tolerant and can survive malicious nodes sending false or contradictory messages over the network",
      "The database does not guarantee linearizability and will allow concurrent readers to see stale snapshots of the data indefinitely after a split"
    ],
    correct: 1,
    explanation: "A safety guarantee is absolute and must never be violated, even during partitions. Liveness (making progress) can be suspended during partitions, resuming only when the network is restored.",
    section: "System Model and Reality"
  },
  {
    type: "write",
    q: "A junior developer asks: 'Why does Google Spanner deliberately introduce a delay (commit wait) before completing a write transaction, and why are they installing atomic clocks and GPS receivers in their datacenters to keep this delay short?' How would you explain this?",
    hint: "Connect the clock uncertainty interval [earliest, latest] with the requirement that consecutive transactions must have non-overlapping intervals to guarantee linearizable causal order.",
    modelAnswer: "Spanner orders transactions using TrueTime intervals [earliest, latest]. To guarantee causal order (A before B), Spanner must ensure transaction B's interval does not overlap with A's, which it does by waiting out the length of the confidence interval before committing. If the clock uncertainty is large, the commit wait time will be long, severely degrading write performance. Atomic clocks and GPS receivers keep the uncertainty (confidence interval width) very small (usually under 7ms), minimizing the required commit wait time.",
    section: "Relying on Synchronized Clocks"
  },
  {
    type: "mc",
    q: "How can virtual memory paging (swapping to disk) cause process pauses?",
    options: [
      "The physical disk controllers completely block all CPU cores when internal hardware write buffers become full",
      "A page fault forces the running thread to block while the operating system reads the required memory pages from disk",
      "Paging operations permanently delete the critical JVM garbage collection metadata and tracking tables from memory",
      "Disk swapping processes trigger the local NTP synchronization daemon to execute aggressive, immediate clock jumps"
    ],
    correct: 1,
    explanation: "When memory pressure is high, the OS may swap memory pages to disk. Accessing swapped memory causes a page fault, forcing the thread to wait for disk I/O, which can pause a process for milliseconds to seconds.",
    section: "Process Pauses"
  },
  {
    type: "mc",
    q: "What does the term 'clock slewing' mean?",
    options: [
      "Forcibly resetting the physical clock backward or forward in a single jump to match the NTP server's reference time",
      "Adjusting the frequency of the clock oscillator slightly to speed it up or slow it down gradually without jumps",
      "Disabling the hardware clock entirely during long JVM garbage collection pauses to prevent lease timeout violations",
      "Transitioning a system to use logical Lamport counters instead of relying on local physical quartz oscillators"
    ],
    correct: 1,
    explanation: "Clock slewing is NTP's default way of adjusting clocks by up to 0.05% to gradually align with the NTP server without causing sudden time jumps, which would break application timing logic.",
    section: "Clock Synchronization and Accuracy"
  },
  {
    type: "write",
    q: "A damaged ECC memory module on a router begins flipping random bits in transit, causing some packet payloads to change silently without crashing the OS or triggering TCP drop rules. Explain how this manifests as a Byzantine fault, and why standard TCP checksums aren't enough.",
    hint: "Think about how corrupted data can look syntactically valid but logically lie to the application, and how application-level validation protects integrity.",
    modelAnswer: "Memory corruption due to radiation or hardware wear can change bits in a packet or in application state. If this occurs, a node may send corrupted messages that look valid but contain incorrect values, which is a weak form of 'lying' (a Byzantine fault). Standard TCP/UDP checksums sometimes fail to detect this. Application-level checksums (e.g., checksumming data before sending it and validating it on receipt) detect these silent data corruptions and prevent corrupted data from being accepted as truth.",
    section: "Byzantine Faults"
  }
];

const FLASHCARDS = [
  { front: "What is a Partial Failure?", back: "A situation in a distributed system where some components are broken but others are working, behaving in an unpredictable, nondeterministic way." },
  { front: "What is a Shared-Nothing Architecture?", back: "A distributed system model where each node has its own memory and disk, and communication occurs exclusively via message passing over a network." },
  { front: "What is an Asynchronous Packet Network?", back: "A network (like the internet or Ethernet) that guarantees neither when a packet will arrive nor if it will arrive at all, with unbounded delay." },
  { front: "What is a Network Partition (Netsplit)?", back: "A network fault that cuts off one part of the network from the rest, dividing the nodes into isolated groups that cannot communicate." },
  { front: "What is a Time-of-Day Clock (Wall-Clock)?", back: "A clock that returns the current calendar date and time (e.g. System.currentTimeMillis), synchronized via NTP, which can jump backward or forward." },
  { front: "What is a Monotonic Clock?", back: "A clock that always moves forward and measures elapsed time intervals (durations) with high resolution (e.g. System.nanoTime). It is safe for timeouts." },
  { front: "What is Clock Drift?", back: "The gradual deviation of a hardware clock's speed from real time, often caused by quartz crystal inaccuracies and temperature variations." },
  { front: "What is a Logical Clock?", back: "A clock based on incrementing counters (e.g., Lamport timestamps) rather than physical time, used strictly to order events causally." },
  { front: "What is the TrueTime API?", back: "A Google Spanner clock API that reports time as a confidence interval [earliest, latest], explicitly exposing clock synchronization uncertainty." },
  { front: "What is Split-Brain?", back: "A condition where two nodes in a cluster simultaneously believe they are the sole leader, leading to conflicting operations and data corruption." },
  { front: "What is a Lease?", back: "A lock that has a timeout. The leaseholder must renew it periodically before it expires, otherwise it is automatically released." },
  { front: "What is a Zombie Node?", back: "A node that has lost its lease or leadership but is not yet aware of it (e.g. due to a GC pause) and continues trying to perform write operations." },
  { front: "What is a Fencing Token?", back: "An increasing number (or epoch/ballot) returned by a lock service every time a lock is granted, used to reject writes from expired leaseholders." },
  { front: "What is a Byzantine Fault?", back: "A failure where a node may arbitrarily malfunction, including sending untruthful, contradictory, or malicious messages to other nodes." },
  { front: "What is the difference between Safety and Liveness?", back: "Safety: 'nothing bad happens' (must hold always, even during crashes; violating a safety property is irreversible). Liveness: 'something good eventually happens' (holds eventually under correct conditions; a liveness violation is temporarily allowed and can be recovered from)." }
];

const CONFIDENCE_LABELS = [
  "Partial failures vs. single-node failures",
  "TCP limitations and timeouts",
  "Monotonic vs. Time-of-day clocks",
  "Physical timestamps for event ordering (LWW)",
  "Process execution pauses (GC, swapping, etc.)",
  "Fencing tokens and zombie detection",
  "Distributed system models (synchrony & node faults)"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 9", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 15 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Re-draw the Zombie lock race condition from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach timing models and fencing to someone (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! NTP does NOT guarantee accuracy. Network congestion, firewalls blocking NTP traffic, misconfigured servers, or virtual machine pauses can cause drifts of hundreds of milliseconds or even seconds.",
    true: "NTP is a best-effort sync. It can drift significantly due to congested networks, firewalls, VM context switches, or buggy public NTP servers. It provides no hard guarantees.",
    unsure: "NTP is a widely used protocol, but because networks are asynchronous and delay is variable, it can only synchronize within bounds that are subject to failure."
  },
  m2: {
    false: "Correct! Programming languages like Java can experience JVM 'stop-the-world' garbage collection pauses lasting seconds or minutes. VM migration, page faults (swapping), and OS thread preemption can also cause huge pauses.",
    true: "Even healthy processes experience pauses. GC pauses, VM live migration, swapping, and disk I/O can pause threads for seconds or minutes, unbeknownst to the process itself.",
    unsure: "Look out for 'Process Pauses' in the chapter. Thread scheduling, garbage collection, and disk access can interrupt programs for surprisingly long durations."
  },
  m3: {
    false: "Correct! Due to clock skew, the node that client B writes to might have a clock that lags behind client A's writer node. This causal relationship can be inverted in physical time, leading to data loss in Last-Write-Wins (LWW) systems.",
    true: "Because clocks are not perfectly synchronized, a causally later event (client B's write) can receive a lower physical timestamp than a causally earlier event, causing writes to be dropped in LWW.",
    unsure: "This is a classic problem with physical timestamps in multi-leader or leaderless replication. Look for the 'timestamps for ordering events' section."
  },
  m4: {
    false: "Correct! BFT protocols (like those in blockchains) are very expensive and rarely used in enterprise datacenters. They assume nodes may actively lie/cheat. In datacenters, nodes are trusted, and firewalls/isolated containers are used instead.",
    true: "BFT is too expensive and complex for datacenters. It requires a 2/3 supermajority and independent implementations to guard against software bugs. Enterprises rely on standard security and trust models.",
    unsure: "Byzantine fault tolerance assumes nodes can lie or behave maliciously. Consider whether this is practical or common in trusted, private corporate networks."
  },
  m5: {
    true: "Correct! Safety properties ('nothing bad happens', like no duplicate tokens) must hold even if all nodes crash. Liveness properties ('something good eventually happens', like eventual response) can depend on the network eventually recovering.",
    false: "Actually, safety properties are invariants that must never be violated in any state (even crashes). Liveness properties are allowed to make assumptions, like 'eventually the network recovers'.",
    unsure: "This is a key distinction in system models. Safety properties are absolute and permanent, whereas liveness properties are eventual and conditional."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch9_learning';
