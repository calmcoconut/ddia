/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "In the social network case study, why is the relational schema SQL query for home timelines expensive to execute directly on every request?",
    options: [
      "It requires a full table scan of the posts table even when filtering by user_id.",
      "It requires fetching recent posts for every followed user and merging them, which is extremely slow if a user follows thousands of accounts.",
      "It requires decrypting the password hash of all followers.",
      "It requires writing data to a temporary disk partition on every read query."
    ],
    correct: 1,
    explanation: "When a user follows many accounts, the database must scan and merge the recent posts of all those accounts, then sort them by timestamp. At high throughput (e.g., millions of timeline reads per second), this is too slow and resource-intensive.",
    section: "Case Study: Social Network Home Timelines"
  },
  {
    type: "mc",
    q: "What is the primary trade-off of precomputing home timelines (materialization) in the social network case study?",
    options: [
      "It makes reads much slower but writes much faster.",
      "It requires using SSDs instead of HDDs for storing the primary system of record.",
      "It makes reads very fast and cheap, but increases the complexity and work required during a write (making a post).",
      "It completely eliminates the need for a relational database."
    ],
    correct: 2,
    explanation: "Materialization stores the precomputed timeline in a cache (like Redis). Read requests are fast because they just load from the cache. However, when a post is made, it must be written to the timeline of every follower (fan-out), shifting the load from read-time to write-time.",
    section: "Case Study: Social Network Home Timelines"
  },
  {
    type: "write",
    q: "Explain the concept of 'fan-out' in message/timeline delivery, and discuss how celebrity accounts make a pure materialized timeline approach fail.",
    hint: "Mention downstream requests per write, the write load for users with millions of followers, and how to combine approaches.",
    modelAnswer: "Fan-out describes the factor by which one initial write request results in multiple downstream write requests. In a materialized timeline system, if a user with 50 followers posts, we do 50 writes. However, if a celebrity with 100 million followers posts, a pure materialized approach requires writing that post to 100 million timeline caches immediately, creating a massive write spike that can exhaust resources. To solve this, celebrity posts are stored separately and merged with the user's materialized timeline only at read time.",
    section: "Case Study: Social Network Home Timelines"
  },
  {
    type: "mc",
    q: "What is the difference between response time and latency as defined in this chapter?",
    options: [
      "Response time includes network travel time, while latency does not.",
      "Response time is measured on the server side, while latency is measured on the client side.",
      "Response time is the total client-observed time; latency is the time during which a request is waiting (not being actively processed, e.g. in network or queues).",
      "Latency is the duration of active CPU processing, while response time is the duration of database wait."
    ],
    correct: 2,
    explanation: "Response time is what the client sees, including network delays, queueing delays, and service time. Latency refers to periods where the request is latent (not being processed), such as traveling across the network or waiting in a queue.\n\nNote: In common industry usage, 'latency' is often used interchangeably with response time. This chapter makes a finer distinction.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "Why is the arithmetic mean a poor metric for understanding typical user response times?",
    options: [
      "It is mathematically impossible to calculate on rolling windows.",
      "It is heavily skewed by a few extremely slow outlier requests, which does not reflect the experience of the majority of users.",
      "It is only accurate if all requests are processed on a single CPU core.",
      "It is a security vulnerability because it reveals the server processing speed."
    ],
    correct: 1,
    explanation: "A few very slow requests (e.g., due to garbage collection or packet loss) will pull the arithmetic mean up significantly, making the service appear slower on average than it is for a typical user. The median (p50) is a much better representation of typical experience.",
    section: "Describing Performance"
  },
  {
    type: "write",
    q: "Explain why high percentiles like the 99th and 99.9th response times (tail latencies) are critical for businesses like Amazon, even though they affect only a small fraction of requests.",
    hint: "Consider which customers generate these outlier times and their value to the company.",
    modelAnswer: "High response-time percentiles, or tail latencies, directly affect the user experience of the most active customers. Customers who have made many purchases and have the most data on their accounts are often those who experience the slowest response times, because their requests require more database lookups. Since these are the most valuable and profitable customers, keeping them happy by optimizing tail latencies is crucial for business revenue.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "What is 'tail latency amplification'?",
    options: [
      "An increase in network bandwidth requirements at high loads.",
      "The phenomenon where a single slow backend call delays an entire end-user request because multiple backend services are called in parallel.",
      "A security vulnerability where attackers artificially inflate database queue lengths.",
      "The process of scaling out the database tier when response times exceed one second."
    ],
    correct: 1,
    explanation: "If an end-user request depends on parallel calls to 100 backend services, the user must wait for the slowest of those 100 calls to complete. Even if only 1% of backend calls are slow, the probability that at least one of the 100 calls is slow is very high, slowing down the overall response.",
    section: "Describing Performance"
  },
  {
    type: "write",
    q: "Describe the difference between service level objectives (SLOs) and service level agreements (SLAs), providing a concrete example of each.",
    hint: "Think about internal engineering targets versus external contract obligations and penalties.",
    modelAnswer: "A Service Level Objective (SLO) is an internal target for a service's performance or availability, such as '99% of requests must return in less than 200ms.' A Service Level Agreement (SLA) is a formal contract between a service provider and its customers that includes these metrics but also defines the penalties (like financial refunds) if the SLO targets are not met over a specified billing period.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "Which of the following is the correct way to aggregate percentile data from multiple servers?",
    options: [
      "Take the average of the percentiles from all servers.",
      "Take the median of the percentiles.",
      "Combine the raw histogram data (add the histograms) and calculate the percentiles from the combined data.",
      "Percentiles cannot be aggregated under any circumstances."
    ],
    correct: 2,
    explanation: "Averaging percentiles is mathematically meaningless (e.g., the average of the 95th percentiles of two machines is not the 95th percentile of the joint workload). To aggregate percentiles, you must merge the underlying histograms, which in practice is often done efficiently using algorithms like t-digest, DDSketch, or libraries like HdrHistogram.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "How does this chapter define the distinction between a 'fault' and a 'failure'?",
    options: [
      "A fault is a software bug, while a failure is a hardware breakdown.",
      "A fault is a component stopping working correctly, while a failure is the system as a whole failing to provide service to the user.",
      "A fault occurs in production, while a failure is caught during testing.",
      "There is no distinction; they are synonyms."
    ],
    correct: 1,
    explanation: "A fault is localized (e.g., one disk crashes). A failure means the system as a whole stops meeting its SLO. Fault-tolerant systems are designed to prevent local faults from escalating into system-wide failures.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "write",
    q: "What is 'fault injection' (or chaos engineering) and why is it useful to deliberately trigger faults in a production system?",
    hint: "Mention error handling code paths, confidence in fault-tolerance, and automated tests.",
    modelAnswer: "Fault injection involves deliberately inducing faults (like killing processes or disconnecting network links) in a production or staging system. This exercises and validates the system's error handling and recovery mechanisms under controlled conditions. Since many critical outages are caused by untested or poor recovery code, deliberately triggering faults builds confidence that the system will handle real-world failures correctly when they occur naturally.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "mc",
    q: "Why are software faults (systematic errors) often harder to handle than hardware faults?",
    options: [
      "Software faults occur because of physical wear and tear on memory gates.",
      "Software faults are highly correlated across nodes running the same software, causing them to fail simultaneously, whereas hardware faults are mostly independent.",
      "Software faults cannot be monitored or logged.",
      "Software faults only occur in cloud environments."
    ],
    correct: 1,
    explanation: "If one hard drive fails, other drives in the cluster are usually unaffected. However, a software bug (like a memory leak or a leap second bug) exists on all nodes running that code, and a specific trigger can cause all nodes to crash or fail at the same time.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "mc",
    q: "What is the leading cause of outages in large-scale internet services, according to studies cited in the chapter?",
    options: [
      "Hardware failures (e.g., motherboard or CPU crashes)",
      "Natural disasters (e.g., solar storms)",
      "Configuration changes by operators (human errors)",
      "Network cable damage by sea life"
    ],
    correct: 2,
    explanation: "Configuration changes by human operators are the leading cause of outages in large systems. As cited by Kleppmann, studies of large-scale internet services (e.g., by Oppenheimer et al.) show that configuration changes are the leading cause, whereas hardware faults (servers or network) play a role in only 10% to 25% of cases.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "write",
    q: "Explain the concept of a 'blameless postmortem' and why blaming individuals for operational errors is counterproductive.",
    hint: "Consider the organizational culture, learning from incidents, and hidden systemic or priority issues.",
    modelAnswer: "A blameless postmortem is an incident investigation process where the team shares full details of what went wrong without fear of blame or punishment. Blaming individuals is counterproductive because it leads to a culture of fear where engineers hide mistakes, making it harder to identify the true systemic issues (like poor tooling, lack of testing, or misaligned priorities) that allowed the mistake to occur in the first place.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "mc",
    q: "What does 'metastable failure' mean in the context of system overload?",
    options: [
      "A failure that only occurs when servers are run at high temperatures.",
      "A state where a system enters a vicious cycle (like a retry storm) and remains overloaded even after the external load is reduced, until it is rebooted or reset.",
      "A hardware fault that transitions between memory bits over time.",
      "A failure that resolves itself automatically without human intervention."
    ],
    correct: 1,
    explanation: "In a metastable failure, an overload triggers a feedback loop (e.g., clients timing out and retrying, adding more requests). Even if the original trigger goes away, the system's efficiency has dropped so low that it cannot recover on its own.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "Which algorithm can be used on the client side to avoid retry storms?",
    options: [
      "RAID 5 storage parity calculation",
      "Exponential backoff with jitter",
      "Lognormal percentile estimation",
      "Structured Query Language (SQL) query parsing"
    ],
    correct: 1,
    explanation: "To prevent clients from overwhelming a struggling server with retries, clients should increase the delay between retries exponentially (backoff) and add randomness (jitter) to prevent all clients from retrying at the same time.",
    section: "Describing Performance"
  },
  {
    type: "write",
    q: "Scenario: A startup launches a service on a single large cloud server. As traffic grows, the lead architect suggests: 'Let's scale out to a 10-node distributed Postgres database cluster immediately to handle future growth.' Another engineer argues they should scale up (vertically) first.\n\nCompare scaling up (vertical scaling) and scaling out (horizontal scaling). Explain the cost growth curves, operational complexity trade-offs, and architecture modifications required for each option.",
    hint: "Detail single powerful machines vs multiple commodity machines, cost growth curves, and application complexity.",
    modelAnswer: "Scaling up (vertical scaling) means upgrading to a more powerful machine (more CPU, RAM, disk). It is simple because the application architecture doesn't change, but costs grow non-linearly and there is a hard physical limit. Scaling out (horizontal scaling) means adding more commodity machines in a shared-nothing cluster. It is cheaper at scale and highly available, but it introduces distributed systems complexity, requiring data partitioning (sharding), replication, and handling network partitions.",
    section: "Scalability"
  },
  {
    type: "mc",
    q: "What is a 'shared-disk architecture'?",
    options: [
      "A system where all nodes use the same physical SSD plugged into a motherboard splitter.",
      "A cluster where independent CPUs and RAM share access to a storage array (like NAS or SAN) over a fast network.",
      "A cloud database where compute resources are shared among multiple tenants.",
      "An application server that writes all logs to the user's hard drive."
    ],
    correct: 1,
    explanation: "In a shared-disk architecture, compute nodes are independent but share storage. While it simplifies data coordination, locking overhead and network contention on the storage layer limit its scalability compared to shared-nothing architectures.",
    section: "Scalability"
  },
  {
    type: "write",
    q: "Scenario: You are designing a globally distributed database that needs to scale to tens of thousands of writes per second across multiple datacenters.\n\nDefine a 'shared-nothing architecture' and explain why it is the default choice for web-scale systems. What coordination complexity is pushed into the software layer under this model?",
    hint: "Discuss independent nodes, linear scaling, replication/sharding requirements, and network coordination.",
    modelAnswer: "A shared-nothing architecture consists of a cluster of independent machines (nodes), where each node has its own CPU, memory, and disks. Nodes coordinate solely through software APIs over a network. This is the standard for web-scale systems because it scales linearly by adding cheap, commodity hardware, avoids hardware-level storage bottlenecks, and can tolerate the loss of entire machines or datacenters by replicating data across nodes. However, shared-nothing pushes coordination complexity into the application or middleware layer, requiring explicit handling of data partitioning and replication.",
    section: "Scalability"
  },
  {
    type: "mc",
    q: "What is the general principle regarding the maximum scale an architecture should be designed for?",
    options: [
      "Design for 100 times the current load to avoid any future rewrites.",
      "Design for no more than one order of magnitude (10x) growth in advance, because requirements and bottlenecks evolve.",
      "Design for infinite scale from day one using microservices.",
      "Do not plan for any scale; rewrite the code every week."
    ],
    correct: 1,
    explanation: "Architectures that handle a certain scale rarely work at 10x or 100x that scale. Designing for too much future scale is premature optimization that locks you into an inflexible, complex design. A good rule of thumb is to design for roughly one order of magnitude of growth.",
    section: "Scalability"
  },
  {
    type: "mc",
    q: "In maintainability, what does 'operability' refer to?",
    options: [
      "The speed at which developers can write new code features.",
      "The ease with which operations teams can keep the system running smoothly, perform maintenance, and monitor health.",
      "The database's ability to run join queries in less than 5 milliseconds.",
      "The compliance of the system with local government privacy regulations."
    ],
    correct: 1,
    explanation: "Operability is about making routine tasks easy, allowing operations teams to focus on high-value tasks. It includes good monitoring, self-healing, documentation, predictable behavior, and default configurations.",
    section: "Maintainability"
  },
  {
    type: "write",
    q: "Scenario: You are migrating a legacy finance system written in manual C++ memory management to a modern platform. A senior architect remarks: 'We need to separate the essential complexity of calculating compound interest from the accidental complexity of our network timeouts and resource allocations.'\n\nExplain the difference between 'essential complexity' and 'accidental complexity'. Detail how this boundary shifts when you introduce higher-level languages or managed infrastructure.",
    hint: "Define complexity inherent in the problem versus complexity created by tooling, and give an example of a tool shift.",
    modelAnswer: "Essential complexity is inherent in the business domain or problem being solved (e.g., the rules of calculation or compliance). Accidental complexity arises from the limitations of our software engineering tooling and infrastructure (e.g., manual memory management). This boundary shifts as tools evolve; for example, high-level languages and managed databases turn what was once accidental complexity (memory allocation, manual indexes) into abstracted, solved problems.",
    section: "Maintainability"
  },
  {
    type: "mc",
    q: "What is the main tool engineers use to manage and hide complexity in software systems?",
    options: [
      "Automatic code formatting",
      "Abstractions (clean interfaces that hide implementation details)",
      "Using a single global variable for all state",
      "Re-compiling the system daily"
    ],
    correct: 1,
    explanation: "Abstractions (like high-level programming languages, SQL, or clean APIs) hide massive implementation details behind a simpler interface, allowing developers to reason about the system without being overwhelmed by low-level mechanics.",
    section: "Maintainability"
  },
  {
    type: "write",
    q: "Scenario: A software startup builds a product by hardcoding direct database queries and raw TCP sockets across their entire client codebase. Within six months, changes in the database schema break all client applications.\n\nDefine the term 'evolvability' in this context. Explain how evolvability is related to simplicity and abstractions, and how modular interfaces protect systems from cascading breakage.",
    hint: "Discuss extensibility, loose coupling, modular boundaries, and refactoring safety.",
    modelAnswer: "Evolvability (also known as extensibility or agility) is the ease with which a data system can be modified to adapt to changing requirements or new use cases. It is closely linked to simplicity and abstractions: systems that are simple and built on clean, modular abstractions are loosely coupled. This makes them much easier to change because developers can modify one component without fear of unintended side effects in other parts of the system.",
    section: "Maintainability"
  },
  {
    type: "mc",
    q: "How can a multi-node, fault-tolerant system apply security patches and OS updates without affecting users?",
    options: [
      "By using a 'rolling upgrade' where one node is taken down, patched, and restarted at a time while other nodes handle the traffic.",
      "By forcing all users to log out for 4 hours.",
      "By writing database backups directly to the network gateway.",
      "Security patches are applied automatically by hardware processors without restarting."
    ],
    correct: 0,
    explanation: "Multi-node fault tolerance allows operations to perform 'rolling upgrades.' Since the system can tolerate the loss of a single node, you can take a node offline, update it, bring it back, and repeat for all other nodes, maintaining 100% service availability.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "mc",
    q: "What is 'head-of-line blocking'?",
    options: [
      "A security mechanism that blocks malicious IP addresses.",
      "When a small number of slow requests hold up the queue, causing subsequent fast requests to experience slow response times.",
      "A database index optimization technique.",
      "The process of placing the most important database tables at the start of a disk partition."
    ],
    correct: 1,
    explanation: "Because servers have limited concurrency, slow requests occupy CPU cores or connection pool slots. Subsequent requests, even if they would normally execute instantly, are forced to wait in the queue, degrading the observed client response time.",
    section: "Describing Performance"
  },
  {
    type: "write",
    q: "Why is it mathematically incorrect to average percentiles (e.g., combining the 95th percentiles of two different servers) to get a combined percentile, and what is the correct approach?",
    hint: "Think about how percentiles represent specific ranks in distributions, and how to merge data from multiple sources.",
    modelAnswer: "Averaging percentiles is mathematically incorrect because percentiles represent ranks in a specific frequency distribution, and the sizes and shapes of the distributions on two servers may differ. For example, one server might handle 99% of the slow requests. The correct approach is to keep the underlying data in histograms (or data structures like t-digest or HdrHistogram) and merge (add) the histograms of all servers, then compute the combined percentile from the merged histogram.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "Why do modern cloud-native systems prioritize software-defined multi-node replication over relying solely on hardware-level redundancy (like RAID)?",
    options: [
      "Software-defined replication is faster to execute because it bypasses CPU caches.",
      "Hardware redundancy only increases the availability of a single node and cannot protect against correlated failures (like rack power outages) or datacenter-wide events.",
      "RAID configurations are physically incompatible with modern solid-state drives (SSDs).",
      "Multi-node replication is the only way to prevent systematic software bugs from corrupting data."
    ],
    correct: 1,
    explanation: "Hardware-level redundancy (like RAID) keeps a single machine running by protecting against individual component faults (such as a single disk crash). However, it cannot safeguard against correlated failures or datacenter outages, which require software-defined replication across independent nodes, racks, or availability zones.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "write",
    q: "What is a 'single point of failure' (SPOF)? Explain how redundancy and failover mechanisms eliminate SPOFs in a typical web application architecture.",
    hint: "Define SPOF and discuss database replicas, load balancers, and DNS.",
    modelAnswer: "A Single Point of Failure (SPOF) is any component in a system that, if it fails, causes the entire system to stop functioning because there is no backup or redundant path. In a typical web application, SPOFs are eliminated by adding redundant hardware or services and implementing automated failover mechanisms. For example, having multiple web servers behind a load balancer ensures that if one server fails, the load balancer reroutes traffic to the others. Similarly, using a primary-secondary database replica setup allows a secondary database to be promoted to primary if the primary crashes.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "write",
    q: "Why does this chapter argue that minimizing the irreversibility of decisions is a key strategy for improving a data system's extensibility/evolvability?",
    hint: "Mention database migrations, rollback options, stakes of change, and flexibility.",
    modelAnswer: "Minimizing the irreversibility of decisions ensures that if a change or new feature goes wrong, the system can easily fall back or roll back to its previous state. If a change is irreversible (such as a database migration that overwrites data formats without a fallback path), the stakes of making that change are extremely high, leading to fear, slow development, and rigid architectures. Keeping decisions reversible preserves operational flexibility and allows the system to evolve safely.",
    section: "Maintainability"
  }
];

const FLASHCARDS = [
  {
    front: "What is the difference between Response Time and Latency?",
    back: "Response Time is the total client-observed elapsed time. Latency is the time a request spends waiting (not actively processed, e.g. in networks or queues)."
  },
  {
    front: "What is the median (p50) response time and why is it useful?",
    back: "The median represents the 50th percentile (half of requests are faster, half are slower). It is the best metric to describe the 'typical' user experience."
  },
  {
    front: "What are tail latencies and which percentiles are typically used to measure them?",
    back: "Tail latencies are high response-time percentiles (e.g., p95, p99, p99.9) that measure how slow the worst-case outlier requests are for users."
  },
  {
    front: "Explain 'tail latency amplification'.",
    back: "When a request calls multiple backend services in parallel, the overall response is delayed by the slowest service. More calls increase the likelihood of hitting a slow tail latency."
  },
  {
    front: "Define the terms 'fault' and 'failure' in a system.",
    back: "A fault is a specific component stopping working (e.g., a crashed server). A failure is the system as a whole failing to provide service to the user."
  },
  {
    front: "What is the primary goal of fault injection or chaos engineering?",
    back: "To deliberately trigger faults in production/testing to verify and build confidence that the system's fault-tolerance and recovery mechanisms work."
  },
  {
    front: "Why are software faults (systematic errors) often more dangerous than hardware faults?",
    back: "Software faults are correlated. Because identical code runs on all nodes, a trigger causes all nodes to fail simultaneously, unlike independent hardware crashes."
  },
  {
    front: "What is a Single Point of Failure (SPOF)?",
    back: "A component with no redundancy. If it fails, it escalates to cause a system-wide failure because there is no backup or alternate path."
  },
  {
    front: "Define 'vertical scaling' (scaling up) vs. 'horizontal scaling' (scaling out).",
    back: "Vertical scaling upgrades to a more powerful machine (more CPU/RAM). Horizontal scaling adds more machines in a distributed setup."
  },
  {
    front: "What is a 'shared-nothing architecture'?",
    back: "A distributed system where each node has its own CPU, memory, and disk. Nodes coordinate purely via software APIs over a network."
  },
  {
    front: "What are the three pillars of Maintainability defined in the chapter?",
    back: "Operability (making it easy to run smoothly), Simplicity (managing complexity/abstractions), and Evolvability (making it easy to adapt to change)."
  },
  {
    front: "What is the difference between essential and accidental complexity?",
    back: "Essential complexity is inherent in the business problem itself. Accidental complexity is created by limitations in our tooling or infrastructure."
  },
  {
    front: "In the timeline case study, what is 'fan-out'?",
    back: "The number of downstream requests triggered by a single incoming write (e.g., delivering a user's post to all of their followers' home timelines)."
  }
];

const CONFIDENCE_LABELS = [
  "Timeline polling vs. materialization",
  "Response time percentiles (median vs. tail latency)",
  "Tail latency amplification",
  "Faults vs. failures and fault injection",
  "Vertical vs. horizontal scaling",
  "The three pillars of maintainability"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Read Chapter 2", type: "due" },
  { day: "Today", task: "Complete pre-activity exercises", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 13 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Draw the response time components (service time, network, queueing) from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach percentiles and tail latency amplification (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! Latency is the time a request spends traveling or waiting (latent), while response time includes latency plus active service time.",
    true: "Not quite. Look for the difference in the chapter! Response time is what the client sees, and latency is just the 'latent' waiting/traveling time.",
    unsure: "It's easy to confuse them, but the chapter draws a specific line between the two."
  },
  m2: {
    false: "Correct! Averaging is skewed by outliers. The median (p50) is the correct metric for typical response times, and higher percentiles show outliers.",
    true: "Averaging can be misleading because a few extremely slow requests will skew the mean, not representing what most users actually experience.",
    unsure: "Median is usually better for 'typical' experiences. Keep reading to see why averages can lie!"
  },
  m3: {
    false: "Correct! Due to tail latency amplification, a user request calling 100 services in parallel must wait for the slowest one, drastically increasing the chance of a slow response.",
    true: "Actually, because the request must wait for all parallel calls to finish, the chance of hitting a slow tail latency call is multiplied by 100.",
    unsure: "This is a key concept called tail latency amplification. Check the section on 'Use of Response Time Metrics'!"
  },
  m4: {
    false: "Correct! Hardware redundancy is local and cannot protect against datacenter failures or correlated software bugs, which must be handled at the software layer.",
    true: "Even with redundant hardware, a power cut, natural disaster, or software bug can bring down the machine. Software fault tolerance is still necessary.",
    unsure: "Redundancy helps, but it has limits. Look for how cloud providers approach node failures at the software level."
  },
  m5: {
    false: "Correct! The chapter notes that if load is fairly predictable, a manually scaled system is simpler and may have fewer operational surprises than a complex autoscaling system.",
    true: "Not quite. The chapter states that if load is predictable, a manually scaled system is simpler and can actually have fewer operational surprises.",
    unsure: "It seems like a magic bullet, but the chapter highlights that manually scaled systems can have fewer operational surprises if load is predictable."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch2_learning';
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
    breakdown.innerHTML = `<p style="color: var(--accent-rose);">📖 Retrieval gaps detected: <strong>${percent}%</strong> (${mcCorrect}/${mcTotal}) on Multiple Choice. The struggle of recalling makes re-reading the text highly effective! Use LLM grading below to check your write-in responses.</p>`;
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
