/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "In the social network case study, why is the relational schema SQL query for home timelines expensive to execute directly on every request?",
    options: [
      "It forces a sequential full table scan of all database records because the main posts table lacks a composite user_id partition or index.",
      "It requires fetching recent posts from every followed account and merging them, which is slow if a user follows thousands of accounts.",
      "It requires the application to retrieve, decrypt, and verify the cryptographic signature and password hash of every follower's profile.",
      "It forces the query optimizer to write temporary transaction log files to a slow, unindexed disk partition on every incoming read path."
    ],
    correct: 1,
    explanation: "When a user follows many accounts, the database must scan and merge the recent posts of all those accounts, then sort them by timestamp. At high throughput (e.g., millions of timeline reads per second), this is too slow and resource-intensive.",
    section: "Case Study: Social Network Home Timelines",
    caseStudy: {
      id: "twitter_timeline",
      title: "Twitter Home Timelines",
      text: "<p><em>Use the following case study details to answer Questions 1–3:</em></p><p>Twitter's timeline delivery has two primary operations:</p><ol><li><strong>Post tweet:</strong> A user can publish a new message to their followers (average 4.6k requests/sec, peak 12k requests/sec).</li><li><strong>Home timeline:</strong> A user can view tweets posted by the people they follow (average 300k requests/sec).</li></ol><p>Handling the write volume is straightforward, but the primary challenge is <strong>fan-out</strong>: coordinating timeline delivery across large follower counts.</p><ul><li><strong>Approach 1 (Query on read):</strong> A user's tweet is inserted into a global table. To read a timeline, the system queries:<pre><code>SELECT tweets.*, users.* FROM tweets<br>  JOIN users ON tweets.user_id = users.id<br>  JOIN follows ON follows.invitee_id = users.id<br>  WHERE follows.follower_id = ?<br>  ORDER BY tweets.timestamp DESC LIMIT 100</code></pre>This requires complex relational joins and is expensive to run on every request.</li><li><strong>Approach 2 (Materialize on write):</strong> Each user has a precomputed home timeline cache. When a user posts a tweet, it is inserted into the caches of all their followers. Reading a timeline is a single cache lookup, but writing a tweet triggers massive write loads for high-follower (celebrity) accounts.</li></ul>"
    }
  },
  {
    type: "mc",
    q: "What is the primary trade-off of precomputing home timelines (materialization) in the social network case study?",
    options: [
      "It significantly decreases the latency of database write operations while forcing read queries to perform complex runtime joins",
      "It necessitates upgrading the primary persistence system from spinning disks to solid-state drives to handle random read I/O",
      "It makes reading timelines extremely fast and cheap, but increases the computational work and complexity required on writes",
      "It entirely removes the requirement for a primary relational database by moving all transactional state into cold log storage"
    ],
    correct: 2,
    explanation: "Materialization stores the precomputed timeline in a cache (like Redis). Read requests are fast because they just load from the cache. However, when a post is made, it must be written to the timeline of every follower (fan-out), shifting the load from read-time to write-time.",
    section: "Case Study: Social Network Home Timelines",
    caseStudy: {
      id: "twitter_timeline",
      title: "Twitter Home Timelines",
      text: "<p><em>Use the following case study details to answer Questions 1–3:</em></p><p>Twitter's timeline delivery has two primary operations:</p><ol><li><strong>Post tweet:</strong> A user can publish a new message to their followers (average 4.6k requests/sec, peak 12k requests/sec).</li><li><strong>Home timeline:</strong> A user can view tweets posted by the people they follow (average 300k requests/sec).</li></ol><p>Handling the write volume is straightforward, but the primary challenge is <strong>fan-out</strong>: coordinating timeline delivery across large follower counts.</p><ul><li><strong>Approach 1 (Query on read):</strong> A user's tweet is inserted into a global table. To read a timeline, the system queries:<pre><code>SELECT tweets.*, users.* FROM tweets<br>  JOIN users ON tweets.user_id = users.id<br>  JOIN follows ON follows.invitee_id = users.id<br>  WHERE follows.follower_id = ?<br>  ORDER BY tweets.timestamp DESC LIMIT 100</code></pre>This requires complex relational joins and is expensive to run on every request.</li><li><strong>Approach 2 (Materialize on write):</strong> Each user has a precomputed home timeline cache. When a user posts a tweet, it is inserted into the caches of all their followers. Reading a timeline is a single cache lookup, but writing a tweet triggers massive write loads for high-follower (celebrity) accounts.</li></ul>"
    }
  },
  {
    type: "write",
    q: "Explain the concept of 'fan-out' in message/timeline delivery, and discuss how celebrity accounts make a pure materialized timeline approach fail.",
    hint: "Mention downstream requests per write, the write load for users with millions of followers, and how to combine approaches.",
    modelAnswer: "Fan-out describes the factor by which one initial write request results in multiple downstream write requests. In a materialized timeline system, if a user with 50 followers posts, we do 50 writes. However, if a celebrity with 100 million followers posts, a pure materialized approach requires writing that post to 100 million timeline caches immediately, creating a massive write spike that can exhaust resources. To solve this, celebrity posts are stored separately and merged with the user's materialized timeline only at read time.",
    section: "Case Study: Social Network Home Timelines",
    caseStudy: {
      id: "twitter_timeline",
      title: "Twitter Home Timelines",
      text: "<p><em>Use the following case study details to answer Questions 1–3:</em></p><p>Twitter's timeline delivery has two primary operations:</p><ol><li><strong>Post tweet:</strong> A user can publish a new message to their followers (average 4.6k requests/sec, peak 12k requests/sec).</li><li><strong>Home timeline:</strong> A user can view tweets posted by the people they follow (average 300k requests/sec).</li></ol><p>Handling the write volume is straightforward, but the primary challenge is <strong>fan-out</strong>: coordinating timeline delivery across large follower counts.</p><ul><li><strong>Approach 1 (Query on read):</strong> A user's tweet is inserted into a global table. To read a timeline, the system queries:<pre><code>SELECT tweets.*, users.* FROM tweets<br>  JOIN users ON tweets.user_id = users.id<br>  JOIN follows ON follows.invitee_id = users.id<br>  WHERE follows.follower_id = ?<br>  ORDER BY tweets.timestamp DESC LIMIT 100</code></pre>This requires complex relational joins and is expensive to run on every request.</li><li><strong>Approach 2 (Materialize on write):</strong> Each user has a precomputed home timeline cache. When a user posts a tweet, it is inserted into the caches of all their followers. Reading a timeline is a single cache lookup, but writing a tweet triggers massive write loads for high-follower (celebrity) accounts.</li></ul>"
    }
  },
  {
    type: "mc",
    q: "What is the difference between response time and latency as defined in this chapter?",
    options: [
      "Response time represents the total duration including network transit and transmission delays, whereas latency refers exclusively to the internal CPU instruction cycle time.",
      "Response time is measured exclusively on the server backend during query execution, whereas latency is monitored solely from the user's browser or frontend application.",
      "Response time is the total client-observed time; latency is the time during which a request is waiting and not being actively processed in network queues or server buffers.",
      "Latency measures the active duration of CPU execution and thread scheduling, whereas response time measures only the idle time spent waiting on disk read/write requests."
    ],
    correct: 2,
    explanation: "Response time is what the client sees, including network delays, queueing delays, and service time. Latency refers to periods where the request is latent (not being processed), such as traveling across the network or waiting in a queue.\n\nNote: In common industry usage, 'latency' is often used interchangeably with response time. This chapter makes a finer distinction.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "Why is the arithmetic mean a poor metric for understanding typical user response times?",
    options: [
      "It cannot be mathematically calculated over rolling time windows without buffering the entire historical stream of raw database requests",
      "It is heavily skewed by a small number of extremely slow outlier requests, failing to represent the actual experience of most users",
      "It only yields correct statistical results if all concurrent incoming HTTP requests are processed on a single, isolated CPU core node",
      "It introduces a security vulnerability by exposing the exact microsecond-level hardware processing speed of backend server instances"
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
      "The non-linear increase in network bandwidth consumption and packet loss that occurs when database write workloads exceed standard capacity limits.",
      "The phenomenon where a single slow backend service call delays the entire end-user request because multiple downstream services are queried in parallel.",
      "A system vulnerability where malicious client connections artificially inflate message queue lengths to trigger cascading database thread timeouts.",
      "The automated process of scaling out the database persistence tier when observed tail response times for write endpoints exceed a fixed threshold."
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
      "Calculate the simple arithmetic average of the corresponding percentiles across all individual backend servers.",
      "Find the median value of the percentiles and use it as the representative metric for the entire cluster.",
      "Combine the underlying raw histogram data and calculate the percentiles directly from the consolidated dataset.",
      "Avoid any aggregation as percentiles represent isolated distributions that cannot be mathematically combined."
    ],
    correct: 2,
    explanation: "Averaging percentiles is mathematically meaningless (e.g., the average of the 95th percentiles of two machines is not the 95th percentile of the joint workload). To aggregate percentiles, you must merge the underlying histograms, which in practice is often done efficiently using algorithms like t-digest, DDSketch, or libraries like HdrHistogram.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "How does this chapter define the distinction between a 'fault' and a 'failure'?",
    options: [
      "A fault is a software bug in the application logic, whereas a failure represents a physical hardware breakdown in the server or network.",
      "A fault is an individual component deviating from its spec, whereas a failure is when the entire system stops providing service to the user.",
      "A fault refers to errors that occur in live production systems, whereas a failure refers to bugs caught during pre-release testing cycles.",
      "There is no functional or technical distinction between the two terms; they are used interchangeably as synonyms in systems engineering."
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
      "Software faults are caused by progressive physical wear and tear on memory gates and silicon processors, which makes their failure rates highly unpredictable.",
      "Software faults are highly correlated across nodes running the same application version, causing simultaneous failures, whereas hardware faults are independent.",
      "Software faults bypass the operating system's execution kernel entirely, preventing them from being captured by standard logging libraries or monitoring tools.",
      "Software faults are unique to virtualized container environments and do not occur when application databases are run on physical, bare-metal server nodes."
    ],
    correct: 1,
    explanation: "If one hard drive fails, other drives in the cluster are usually unaffected. However, a software bug (like a memory leak or a leap second bug) exists on all nodes running that code, and a specific trigger can cause all nodes to crash or fail at the same time.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "mc",
    q: "What is the leading cause of outages in large-scale internet services, according to studies cited in the chapter?",
    options: [
      "Unpreventable hardware failures, such as RAM or CPU crashes",
      "Natural disasters and power grid failures in data centers",
      "Configuration changes made by operators, representing human error",
      "Physical damage to undersea fiber-optic cabling by marine life"
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
      "A hardware-level failure that only occurs when server nodes are run at high temperatures, causing CPU instruction cycles to degrade and eventually crash the database.",
      "A state where a system enters a feedback loop (like a retry storm) and remains overloaded even after the external load is reduced, requiring manual intervention to reset.",
      "A transient hardware fault where memory bits flip intermittently due to cosmic rays, causing progressive data corruption in active transaction storage logs over time.",
      "A software failure that resolves itself automatically without any operator intervention, by dynamically shedding requests when internal database queue lengths exceed limits."
    ],
    correct: 1,
    explanation: "In a metastable failure, an overload triggers a feedback loop (e.g., clients timing out and retrying, adding more requests). Even if the original trigger goes away, the system's efficiency has dropped so low that it cannot recover on its own.",
    section: "Describing Performance"
  },
  {
    type: "mc",
    q: "Which algorithm can be used on the client side to avoid retry storms?",
    options: [
      "RAID 5 storage parity algorithms",
      "Exponential backoff with jitter",
      "Lognormal percentile estimation",
      "SQL abstract syntax tree parsing"
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
      "A storage array configuration where all database nodes share access to a single physical solid-state drive via a splitter.",
      "A cluster where independent compute nodes access a shared network-attached storage array over a high-speed interconnect.",
      "A multi-tenant cloud database architecture where compute resources are shared dynamically among several independent clients.",
      "An application deployment pattern where the server writes all operational transaction logs directly to the client's local disk."
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
      "Design the database for at least two orders of magnitude (100x) growth from the start to prevent expensive software rewrites later.",
      "Design for no more than one order of magnitude (10x) growth in advance, since scaling requirements and system bottlenecks will evolve.",
      "Design for near-infinite scale from day one by adopting a distributed, multi-region microservices architecture for all workloads.",
      "Avoid planning for future scale entirely and instead rewrite the core application code and database schema in weekly sprint cycles."
    ],
    correct: 1,
    explanation: "Architectures that handle a certain scale rarely work at 10x or 100x that scale. Designing for too much future scale is premature optimization that locks you into an inflexible, complex design. A good rule of thumb is to design for roughly one order of magnitude of growth.",
    section: "Scalability"
  },
  {
    type: "mc",
    q: "In maintainability, what does 'operability' refer to?",
    options: [
      "The velocity at which developers can write and deploy new features and application logic to the production database.",
      "The ease with which operations teams can keep the system running smoothly, perform routine maintenance, and track health.",
      "The speed at which the relational database engine can execute complex join queries and return results to the user.",
      "The strict alignment and compliance of the data storage system with regional and federal privacy protection laws."
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
      "Formatting tools that automatically standardize code layouts across the repository",
      "Modular abstractions that hide complex underlying implementation details behind clean APIs",
      "Global state management where all application variables are stored in a single namespace",
      "Compilation routines that rebuild and test the entire codebase on a daily schedule"
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
      "By executing rolling upgrades where individual nodes are sequentially taken offline, patched, and restarted while other nodes handle traffic.",
      "By scheduling a maintenance window and requiring all users to log out of the platform for a period of four hours while the servers reboot.",
      "By streaming active database backups directly through the network gateway to update the operating system kernels dynamically at runtime.",
      "By leveraging hardware-level processor redundancy that applies security patches directly to running CPU registers without a system reboot."
    ],
    correct: 0,
    explanation: "Multi-node fault tolerance allows operations to perform 'rolling upgrades.' Since the system can tolerate the loss of a single node, you can take a node offline, update it, bring it back, and repeat for all other nodes, maintaining 100% service availability.",
    section: "Reliability and Fault Tolerance"
  },
  {
    type: "mc",
    q: "What is 'head-of-line blocking'?",
    options: [
      "A security firewall mechanism that automatically detects and blocks traffic from malicious client IP addresses at the gateway.",
      "A queueing phenomenon where a small number of slow requests block the queue, causing subsequent fast requests to experience high latency.",
      "A database index optimization technique that forces the query planner to evaluate primary keys before examining secondary index attributes.",
      "A disk optimization process that physically places the most frequently queried database tables at the beginning of a storage partition."
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
      "Software-defined replication processes are significantly faster to execute at scale because they completely bypass CPU instruction caches and local operating system kernel layers.",
      "Hardware redundancy only increases the reliability of a single server node and cannot protect against correlated failures (such as rack power cuts) or datacenter outages.",
      "RAID disk configurations and hardware controllers are physically incompatible with modern solid-state drives and NVMe storage systems deployed in modern data centers.",
      "Multi-node replication is the only known architectural mechanism that can actively prevent systematic software bugs from corrupting application state files in database memory."
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
