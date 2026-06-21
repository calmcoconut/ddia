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
      "Operating systems inject deliberate delays to optimize local CPU cache usage",
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
      "Relational database engines are structurally incompatible with synchronous circuit-switched networks and must run on asynchronous packet routing",
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
      "A persistent memory leak in the kernel causes the system timer process to drop cycles under heavy CPU scheduling",
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
      "A logical clock is a software-emulated synchronization protocol that simulates a localized hardware atomic clock cluster",
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
      "BFT implementations require highly synchronized GPS-linked atomic clocks on every node, which remain too expensive for standard datacenters"
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
      "The Byzantine fail-slow model",
      "The transient amnesia model"
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
      "A Byzantine property",
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


function loadState() {
  const s = window.dbLoadState ? window.dbLoadState(STATE_KEY) : {};
  return (s && typeof s === 'object') ? s : {};
}

function saveState(data) {
  if (window.dbSaveState) {
    window.dbSaveState(data, STATE_KEY);
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
  for (let i = 1; i <= 7; i++) {
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

  const totalToGrade = Object.keys(answered).length;
  if (totalToGrade === 0) {
    alert('Please answer at least one write-in question before grading.');
    return;
  }

  // Set up progress bar UI dynamically
  let progressContainer = document.getElementById('gradingProgressContainer');
  if (!progressContainer) {
    progressContainer = document.createElement('div');
    progressContainer.id = 'gradingProgressContainer';
    progressContainer.className = 'grading-progress-container';
    progressContainer.style.marginTop = '1rem';
    progressContainer.style.width = '100%';
    progressContainer.style.textAlign = 'left';
    progressContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
        <span id="gradingProgressStatus">Grading write-in responses...</span>
        <span id="gradingProgressPercent">0%</span>
      </div>
      <div style="width: 100%; height: 8px; background: rgba(99, 102, 241, 0.1); border-radius: 4px; overflow: hidden;">
        <div id="gradingProgressBarFill" style="width: 0%; height: 100%; background: var(--gradient-primary); border-radius: 4px; transition: width 0.3s ease;"></div>
      </div>
    `;
    const resultsActions = document.querySelector('.results-actions');
    if (resultsActions) {
      resultsActions.parentNode.insertBefore(progressContainer, resultsActions);
    }
  }
  progressContainer.classList.remove('hidden');

  const statusEl = document.getElementById('gradingProgressStatus');
  const fillEl = document.getElementById('gradingProgressBarFill');
  const percentEl = document.getElementById('gradingProgressPercent');

  statusEl.textContent = `Preparing to grade 1 of ${totalToGrade} questions...`;
  fillEl.style.width = '0%';
  percentEl.textContent = '0%';

  const grades = {};
  let currentCount = 0;

  for (const idxStr of Object.keys(answered)) {
    currentCount++;
    const idx = parseInt(idxStr);
    statusEl.textContent = `Grading question ${currentCount} of ${totalToGrade}: "${QUIZ_QUESTIONS[idx].q.substring(0, 30)}..."`;
    
    const response = await fetch('/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chapterKey: STATE_KEY,
        writeIns: { [idxStr]: answered[idxStr] },
        username: getCurrentUsername()
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.grades && data.grades[idxStr]) {
      grades[idxStr] = data.grades[idxStr];
    }

    const pct = Math.round((currentCount / totalToGrade) * 100);
    fillEl.style.width = `${pct}%`;
    percentEl.textContent = `${pct}%`;
  }

  statusEl.textContent = `All questions graded successfully!`;
  
  const currentState = loadState();
  currentState.aiGrades = { ...(currentState.aiGrades || {}), ...grades };
  saveState(currentState);
  renderAiGrades(currentState.aiGrades);

  setTimeout(() => {
    progressContainer.classList.add('hidden');
  }, 3000);

  return { grades: currentState.aiGrades };
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
        await gradeWriteIns();
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

  const baseline = state.diagnosticBaseline || [3,3,3,3,3,3,3];
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
