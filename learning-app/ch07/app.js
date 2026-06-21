/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Chapter 7: Sharding
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the primary reason for sharding a database, as opposed to replication?",
    options: [
      "To achieve high operational availability and automated fault tolerance across regions",
      "To scale read query throughput horizontally by provisioning read-only node replicas",
      "To handle extremely large datasets or write throughput that exceed a single node's capacity",
      "To support complex distributed transactions and cross-shard SQL joins across schemas"
    ],
    correct: 2,
    explanation: "Sharding is primarily used for horizontal scalability of data storage volume and write throughput. If read capacity is the only bottleneck, read replicas (replication) are often a simpler solution.",
    section: "Pros and Cons of Sharding"
  },
  {
    type: "mc",
    q: "Which databases are noted for using sharding on a single machine to run one single-threaded process per CPU core, particularly to leverage NUMA architectures?",
    options: [
      "PostgreSQL, MySQL, and Oracle",
      "Redis, VoltDB, and FoundationDB",
      "Cassandra, MongoDB, and HBase",
      "BigQuery, Snowflake, and Delta Lake"
    ],
    correct: 1,
    explanation: "Redis, VoltDB, and FoundationDB run single-threaded processes per CPU core, using sharding within a single node to parallelize across cores and optimize for Non-Uniform Memory Access (NUMA).",
    section: "Pros and Cons of Sharding"
  },
  {
    type: "write",
    q: "Your enterprise clients are extremely paranoid about data privacy, and a compliance auditor demands to know how you isolate user data. How does sharding by tenant provide security and compliance benefits in a multitenant SaaS system compared to storing everyone in a single shared table?",
    hint: "Explain this in terms of physical vs. logical separation, mitigating data leak bugs, handling GDPR 'right to be forgotten' requests, and satisfying regional data residency laws.",
    modelAnswer: "Sharding for multitenancy isolates each customer's data, which enhances security by preventing access control bugs from exposing data across tenants (permission isolation). If a tenant requests data erasure under privacy laws like the GDPR, it is much easier to delete or export an entire separate shard rather than scanning a shared database table. Additionally, it helps satisfy data residency requirements by placing specific tenant shards in servers located in the correct geographical region.",
    section: "Sharding for Multitenancy"
  },
  {
    type: "mc",
    q: "Which of the following is a significant architectural challenge when using sharding to implement a multitenant system?",
    options: [
      "Tenant datasets are consistently too small in practice to fit comfortably within the resources of single database nodes",
      "It is technically impossible to coordinate and run isolated backup operations on individual shards on a per-tenant basis",
      "Grouped small tenants are highly difficult to migrate as they grow in size, and queries joining data across tenants become very hard",
      "It completely prevents database administrators from executing rolling schema upgrades and migrations gradually across the cluster"
    ],
    correct: 2,
    explanation: "If small tenants are grouped on a single shard to reduce overhead, moving a tenant to a new shard as it grows requires complex data migration. Also, features requiring cross-tenant joins or queries are very difficult to implement across different shards.",
    section: "Sharding for Multitenancy"
  },
  {
    type: "mc",
    q: "Why are key ranges not necessarily evenly spaced in key-range sharding?",
    options: [
      "Because non-cryptographic hash functions always produce highly skewed and non-uniform output distributions",
      "To accommodate non-uniform data distribution and prevent some database shards from becoming much larger than others",
      "Because standard B-tree index structures require key ranges to be partitioned into fixed lengths of exactly 100 values",
      "To guarantee that all alphanumeric keys starting with the same character prefix are stored within identical shard sizes"
    ],
    correct: 1,
    explanation: "Key ranges are adjusted dynamically or manually so that each shard holds a roughly equal amount of data. Equal-width ranges (e.g. two letters of the alphabet per volume) would result in highly skewed shard sizes because data is not uniformly distributed.",
    section: "Sharding by Key Range"
  },
  {
    type: "write",
    q: "Our IoT metrics database uses key-range sharding where the primary key is simply the timestamp. During a traffic surge, the database starts throwing timeout alerts because one node is melting under heavy load while the others sit idle. Explain why this write hotspot occurs and how we can redesign the compound key to mitigate it.",
    hint: "Explain where writes for the current time land, and how prefixing the key with a non-temporal attribute (like sensor ID) changes the partition distribution.",
    modelAnswer: "If the key is just the timestamp, all current writes will have nearby keys and will route to the same active shard (the one covering the current time range), leaving all older shards idle. This write hotspot can be mitigated by prefixing the timestamp with another column, such as a sensor ID or user ID, to form a compound key. This distributes the concurrent writes across different shards, though it makes range queries across multiple sensors or users within a time range more expensive since they must be run on multiple shards.",
    section: "Sharding by Key Range"
  },
  {
    type: "mc",
    q: "Which of the following databases utilizes automatic key-range splitting based on shard sizes (e.g. reaching 10 GB)?",
    options: [
      "Citus and Riak",
      "Cassandra and ScyllaDB",
      "HBase and CockroachDB",
      "VoltDB and Elasticsearch"
    ],
    correct: 2,
    explanation: "HBase, CockroachDB, RethinkDB, and MongoDB's range sharding automatically split shards when they grow past a configured size threshold, distributing the resulting subranges across nodes.",
    section: "Sharding by Key Range"
  },
  {
    type: "write",
    q: "During a flash sale, one of your database nodes is already running at 95% CPU and disk utilization. Suddenly, the autoscaler detects the shard has crossed its size limit and initiates a shard split, which immediately crashes the node. Why is splitting a shard such an expensive operation, and why is doing it on an overloaded node a recipe for disaster?",
    hint: "Think about the disk I/O, file reading/rewriting, and network transfer overhead involved in re-partitioning the data.",
    modelAnswer: "Splitting a shard is an expensive operation because the database must rewrite all the data from the original shard into new, smaller files, which requires substantial disk read/write I/O and network transfer. Because shard splitting is often triggered when a node is already under heavy write load, the added resource consumption of the split process can degrade performance further, potentially pushing the node into failure or timeouts.",
    section: "Sharding by Key Range"
  },
  {
    type: "mc",
    q: "Why are the built-in hash functions of languages like Java (`Object.hashCode()`) or Ruby (`Object#hash`) unsuitable for database sharding?",
    options: [
      "They lack cryptographic security guarantees and can be easily decrypted by malicious clients",
      "They return different hash values for the same key in different processes or executions",
      "They are restricted by design to only hash integer-based numeric attributes, not string values",
      "They fail to distribute keys uniformly across the partition space, leading to severe hash collisions"
    ],
    correct: 1,
    explanation: "Many programming languages generate process-specific hashes for strings to prevent hash-collision attacks. If used for sharding, different database processes or clients would compute different shard locations for the same key.",
    section: "Sharding by Hash of Key"
  },
  {
    type: "mc",
    q: "What is the main drawback of taking `hash(key) % N` (where N is the number of nodes) to assign keys to shards?",
    options: [
      "It fails to distribute key signatures uniformly across the available database nodes, causing hotspots",
      "It is computationally slow and CPU-intensive to calculate modulo division operations for every read query",
      "Adding or removing a physical node (which changes N) forces almost all keys to be migrated between nodes",
      "It requires contacting a centralized coordination cluster like ZooKeeper to resolve every client query"
    ],
    correct: 2,
    explanation: "If N changes, the mapping of hashes to nodes shifts completely. For example, going from 3 to 4 nodes changes the destination node of nearly all keys, causing massive, unnecessary data movement during rebalancing.",
    section: "Hash modulo number of nodes"
  },
  {
    type: "write",
    q: "You need to add five new physical servers to your database cluster. If you were using simple modulo hashing, this change would trigger a massive, cluster-wide data migration. Explain how the 'fixed number of shards' approach resolves this rebalancing inefficiency by decoupling logical shards from physical nodes.",
    hint: "Describe what happens to key-to-shard assignments and node-to-shard mappings when physical nodes are added or removed.",
    modelAnswer: "In the fixed number of shards approach, the database is split into a fixed, large number of logical shards (e.g. 1000) from the start, and each key's assignment to a shard (`hash(key) % 1000`) never changes. The system separately maps these logical shards to physical nodes. When a new node is added, only entire logical shards are reassigned and moved from existing nodes to the new node, avoiding any recalculation of key-to-shard mapping and minimizing the volume of data transferred.",
    section: "Fixed number of shards"
  },
  {
    type: "mc",
    q: "When using a fixed number of shards, what is the trade-off of choosing the number of shards?",
    options: [
      "Too many logical shards slows down read queries due to scatter-gather overhead, while too few shards results in non-uniform key distribution hashes",
      "Too many shards increases management and metadata overhead, while too few shards makes shards very large and expensive to rebalance or recover",
      "Too many logical shards forces the storage engine to write exclusively to SSD arrays, while too few shards permits using cheaper physical HDDs",
      "Too many logical shards restricts the maximum cluster size to exactly two nodes, while too few shards limits the architecture to ten nodes"
    ],
    correct: 1,
    explanation: "If the shard count is too high, the system incurs significant management and query planning overhead. If it is too low, each shard holds a large portion of the dataset, making network transfer during rebalancing and recovery from node outages extremely slow and expensive.",
    section: "Fixed number of shards"
  },
  {
    type: "mc",
    q: "What are the two core properties that define a consistent hashing algorithm?",
    options: [
      "ACID transactional properties are maintained on all writes, and reads are guaranteed to be linearly consistent",
      "Keys are uniformly distributed across all shards, and a minimal number of keys are moved when shard counts change",
      "Reads are strictly served from a single primary coordinator node, and writes are replicated asynchronously to disk",
      "Keys are sorted sequentially within each storage node, and the hashing function is guaranteed to be secure"
    ],
    correct: 1,
    explanation: "Consistent hashing is a technique where keys are mapped to shards such that the load is roughly balanced, and when a node joins or leaves, the number of keys that must be reassigned is minimized.",
    section: "Consistent hashing"
  },
  {
    type: "write",
    q: "You are choosing between a 'fixed number of shards' architecture and 'consistent hashing' (like Rendezvous or Jump consistent hashing) for a high-performance database cluster. When we add a new node, how does the actual movement and source of keys differ between these two models?",
    hint: "Contrast moving whole pre-allocated logical shards between nodes with pulling individual, scattered keys from across all existing nodes.",
    modelAnswer: "In the fixed number of shards approach, rebalancing is done by moving entire pre-existing logical shards from some nodes to the new node. In contrast, under consistent hashing algorithms like Rendezvous or Jump consistent hashing, there are no fixed logical shards; instead, the new node is assigned individual keys that are collected and pulled from being scattered across all existing nodes, minimizing data movement at the key level directly.",
    section: "Consistent hashing"
  },
  {
    type: "mc",
    q: "If a key is highly popular (such as a celebrity user ID on a social network), how can it cause a 'hot spot' even if consistent hashing is used?",
    options: [
      "Because the underlying hash routing algorithm will map that specific key to multiple target shards simultaneously",
      "Because consistent hashing only ensures uniform distribution of keys, not the request throughput or data volume per key",
      "Because highly popular keys like celebrity user IDs bypass the hash function entirely and are routed to random nodes",
      "Because the database engine automatically locks all other nodes in the cluster when a celebrity user log-in occurs"
    ],
    correct: 1,
    explanation: "Consistent hashing distributes key names uniformly across the partition space, assuming all keys are accessed with equal frequency. If a single key has a massive volume of traffic (like a celebrity), the node containing that key will be overloaded while others are idle.",
    section: "Skewed Workloads and Relieving Hot Spots"
  },
  {
    type: "mc",
    q: "If you append a 2-digit random decimal number to a hot key to split its write load across 100 shards, what is the cost when reading data for that key?",
    options: [
      "Reads must query a centralized metadata coordinator service to determine which specific suffix digit was written",
      "Reads must perform a parallel scatter-gather query across all 100 suffixed key variations and merge their results",
      "Reads will be blocked by a cluster-wide distributed transaction lock on all partitions for at least 10 seconds",
      "Reads are completely prohibited on active online nodes and must be performed via asynchronous offline batch jobs"
    ],
    correct: 1,
    explanation: "Because writes are randomly distributed among the 100 variations of the key (e.g. key_00 to key_99), a read query must scan all 100 keys and aggregate their contents, making reads significantly more expensive.",
    section: "Skewed Workloads and Relieving Hot Spots"
  },
  {
    type: "write",
    q: "An ultra-popular celebrity is hosting a live giveaway, causing millions of concurrent writes to a single database key. A senior engineer suggests: 'Let's append a random 2-digit suffix to the key in our application code to spread the writes!' Explain the architectural trade-offs of this key-randomization hack on write and read performance.",
    hint: "Compare the parallel write capacity gains against the scatter-gather read complexity, and explain why applying this to every key in the database is a bad idea.",
    modelAnswer: "Appending a random suffix to a hot key successfully distributes its write load across multiple shards, allowing high-throughput parallel writes. However, this introduces significant read overhead because any read for that key must query all possible suffixed variations and merge the results. Furthermore, it requires additional application-level bookkeeping to identify which specific keys are hot enough to justify this suffixing, as applying it to all keys would introduce massive unnecessary read overhead.",
    section: "Skewed Workloads and Relieving Hot Spots"
  },
  {
    type: "mc",
    q: "What is a major risk associated with fully automated rebalancing in combination with automatic failure detection?",
    options: [
      "It forces the entire database cluster into a read-only state for the duration of the partition movement process to ensure data consistency",
      "It can trigger a cascading failure where slow, overloaded nodes are incorrectly assumed dead, shifting load and overloading the rest of the cluster",
      "It permanently locks all existing shard boundaries and partition keys, preventing them from ever being split or split-merged in the future",
      "It blocks external application clients from executing standard DNS resolution queries to locate the active IP addresses of database nodes"
    ],
    correct: 1,
    explanation: "If a node is slow due to high load, automated failure detection might mark it dead. Shifting its shards to other nodes requires expensive data transfer over the network, overloading the remaining nodes and causing them to fail, leading to a cascading outage.",
    section: "Operations: Automatic Versus Manual Rebalancing"
  },
  {
    type: "mc",
    q: "In request routing, which strategy relies on a routing tier?",
    options: [
      "Clients contact any random database node, which acts as a proxy and forwards the request if it does not own the target shard",
      "A separate, shard-aware load balancing or proxy tier receives all requests, determines the correct node, and forwards them",
      "Clients maintain a local copy of the partition map to determine the correct node and establish a direct connection to it",
      "Clients cache all database record states locally inside the application runtime memory to avoid contacting any node over networks"
    ],
    correct: 1,
    explanation: "A routing tier acts as a shard-aware proxy or load balancer. It does not store or process data itself but routes the client requests to the appropriate database node.",
    section: "Request Routing"
  },
  {
    type: "write",
    q: "In a production cluster running distributed search indexes, you use ZooKeeper to manage request routing metadata. How do the database nodes and the routing tier interact with this coordination service to keep routing updated, and how does the service prevent split-brain routing maps?",
    hint: "Mention how nodes register their shards, how the routing tier subscribes to changes, and the consensus algorithms ZooKeeper/etcd use to maintain a single source of truth.",
    modelAnswer: "These systems use ZooKeeper or etcd as an authoritative registry of which shards live on which nodes. Each database node registers its active shards with the coordination service, and the routing tier or clients subscribe to changes in this registry. Split-brain is avoided because ZooKeeper/etcd run consensus protocols (such as Paxos or Raft) to ensure that only a single, globally agreed-upon shard assignment metadata exists, preventing conflicting coordinators from assigning shards.",
    section: "Request Routing"
  },
  {
    type: "write",
    q: "You are architecting a multi-region database cluster that serves requests from millions of mobile apps (untrusted client devices). Which routing strategy—client-side awareness, a dedicated routing tier, or random node-forwarding—would you choose for this deployment, and what is your design rationale?",
    hint: "Evaluate the trade-offs regarding internal network security exposure, WAN latency, and mobile client code complexity.",
    modelAnswer: "A routing tier (load balancer/proxy) is the preferred choice. For untrusted clients, client-side shard awareness is a security risk because it exposes internal database topology and node IP addresses. A routing tier hides the database topology behind a single entry point, handles SSL termination, and rate-limiting. For a multi-region deployment, the routing tier can route the user to the closest datacenter node. Although it adds a network hop, it is much more secure and keeps the client code simple compared to client-side routing, and is more efficient than random node-forwarding which can cause cross-region WAN hops.",
    section: "Request Routing"
  },
  {
    type: "mc",
    q: "What is the main difference between Riak's gossip protocol and ZooKeeper-based shard management?",
    options: [
      "Gossip protocols disseminate state changes peer-to-peer with eventually consistent results, allowing temporary routing mismatches",
      "Gossip protocols are exclusively deployed in relational databases, whereas ZooKeeper-based systems are restricted to NoSQL storage",
      "Gossip protocols require manual partition routing table configuration by a database administrator for every single client query",
      "ZooKeeper acts as a primary database storing the actual user records, whereas gossip protocols only transmit and store backups"
    ],
    correct: 0,
    explanation: "Riak's gossip protocol distributes cluster state changes peer-to-peer. It provides weaker consistency than ZooKeeper, allowing different nodes to temporarily have different views of shard assignments, which leaderless databases can tolerate.",
    section: "Request Routing"
  },
  {
    type: "mc",
    q: "Why are writes to a database with local secondary indexes simpler than with global secondary indexes?",
    options: [
      "Local secondary index structures are held in volatile RAM cache memory and do not require any physical database disk writes",
      "A write only needs to execute updates on the single shard containing the primary key and its corresponding local index",
      "Local secondary indexes are updated asynchronously by the client-side application layer rather than by the storage engine",
      "Global secondary indexes require the database to synchronously write updates to all active nodes in the cluster on every write"
    ],
    correct: 1,
    explanation: "A local secondary index is partitioned in exact alignment with the primary key. Therefore, when writing or updating a record, the database only needs to write to the single shard containing that record's primary key and update its local index.",
    section: "Local Secondary Indexes"
  },
  {
    type: "write",
    q: "A developer complains: 'Our search queries using local secondary indexes are incredibly slow, and our p99 tail latency is spiking horribly as our cluster grows!' Why does a local secondary index force a 'scatter-gather' read operation, and why is this pattern so toxic for tail latency?",
    hint: "Explain what happens when a query searches by an indexed attribute without specifying the partition key, and how querying all nodes in parallel amplifies the chance of hitting a slow response.",
    modelAnswer: "If you query a database using a local secondary index without knowing the partition key, the database cannot determine which shard holds the matching records. It must perform a 'scatter-gather' query, sending the request to all shards in parallel and merging the results. This is highly vulnerable to tail latency amplification because the overall response time of the query is bound by the slowest individual shard node to respond, which degrades performance as the cluster grows.",
    section: "Local Secondary Indexes"
  },
  {
    type: "mc",
    q: "Which of the following sets of databases rely on local secondary indexes?",
    options: [
      "CockroachDB, YugabyteDB, and TiDB",
      "MongoDB, Cassandra, and Elasticsearch",
      "BigQuery, Snowflake, and Delta Lake",
      "VoltDB, BigQuery, and Citus"
    ],
    correct: 1,
    explanation: "MongoDB, Cassandra, Riak, VoltDB, Elasticsearch, and SolrCloud all use local secondary indexes (document-partitioned indexes) for sharding their search capabilities.",
    section: "Local Secondary Indexes"
  },
  {
    type: "mc",
    q: "How is a global secondary index (term-partitioned) sharded relative to the primary key?",
    options: [
      "It is partitioned using the exact same primary key boundaries and routing paths as the underlying primary database table",
      "It is sharded based on the indexed value (the term itself), completely independently of the primary key's partitioning",
      "It bypasses sharding entirely and is maintained as a single monolithic index structure stored on the master database node",
      "It is sharded dynamically and randomly across different cluster nodes for every incoming write query to balance capacity"
    ],
    correct: 1,
    explanation: "A global secondary index is partitioned by the index values themselves (the 'terms'). This means entries for a specific value (e.g. color:red) are grouped in one shard of the index, even if the primary records they point to are scattered across all primary shards.",
    section: "Global Secondary Indexes"
  },
  {
    type: "write",
    q: "Your team decides to switch from local indexes to a global secondary index to speed up search queries. However, the write latency of the application immediately doubles. Walk us through why updating a record with a global secondary index is so complex and requires coordinating multiple shards.",
    hint: "Trace a write containing multiple attributes whose index entries reside on different shards, and mention the trade-offs between distributed transaction overhead and asynchronous replica lag.",
    modelAnswer: "In a global secondary index, the index is sharded by the values of the indexed attributes (terms) rather than the primary key. When a single record is written or updated, it may modify multiple indexed fields whose corresponding index entries reside on different shards. Thus, the database must write to the primary shard as well as coordinate updates to multiple index shards, which requires either expensive distributed transactions to guarantee consistency or accepting asynchronous propagation lag. As a consequence of this asynchronous update pipeline (like in DynamoDB), reads against a global secondary index are eventually consistent, meaning strongly consistent reads must go via the primary key or specially configured paths.",
    section: "Global Secondary Indexes"
  },
  {
    type: "mc",
    q: "In DynamoDB, how are writes propagated to global secondary indexes, and what does this mean for reads?",
    options: [
      "Synchronously via distributed transactions, ensuring reads are always strongly consistent",
      "Asynchronously, meaning reads may temporarily return stale data due to replication lag",
      "Manually, requiring client applications to write updates to both the table and the index",
      "Periodically, during scheduled database maintenance windows executed once every week"
    ],
    correct: 1,
    explanation: "DynamoDB propagates writes to global secondary indexes asynchronously. As a result, reads from these indexes are eventually consistent and may temporarily return stale data due to replication lag.",
    section: "Global Secondary Indexes"
  },
  {
    type: "mc",
    q: "Which architecture is the primary foundation for horizontally scaling sharded databases?",
    options: [
      "Shared-Memory system architectures",
      "Shared-Disk system architectures",
      "Shared-Nothing system architectures",
      "Non-Uniform Memory Access architectures"
    ],
    correct: 2,
    explanation: "Shared-nothing architecture distributes data across independent machines (nodes) that share neither CPU nor RAM nor disk. The nodes coordinate using standard network protocols, which is the basis for scaling out sharded databases.",
    section: "Pros and Cons of Sharding"
  },
  {
    type: "write",
    q: "During an architecture review, the team is debating whether to index our product catalog using local secondary indexes or global secondary indexes. Compare and contrast these two indexing strategies across read latency, write latency, and how they scale as we add nodes.",
    hint: "Walk through the write path (single-shard writes vs. multi-shard coordination) and the read path (parallel scatter-gather vs. single-shard index scans) for each approach.",
    modelAnswer: "Local secondary indexes optimize for write latency because updates are confined to the single shard containing the primary record, but they suffer from high read latency for general queries because they require a scatter-gather scan across all shards. Global secondary indexes optimize for read latency because a query on a single attribute can be resolved by scanning a single index shard, but they suffer from high write latency and complexity because writing a record requires updating multiple scattered index shards. Additionally, because global indexes are updated asynchronously, reads from them are eventually consistent, and strongly consistent reads must go via the primary key or specially configured paths.",
    section: "Sharding and Secondary Indexes"
  },
  {
    type: "write",
    q: "A major database schema migration needs to be deployed for a multi-tenant SaaS application. If all clients shared one database table, this migration would be high-risk. How does sharding the database by tenant simplify this schema migration process, and what blast radius risks does it reduce?",
    hint: "Consider rolling upgrades for individual tenants, lock durations on shared resources, and the containment of migration bugs.",
    modelAnswer: "Sharding by tenant allows schema migrations to be rolled out gradually, one tenant at a time, rather than performing a massive migration on a single monolithic database. This reduces operational risk because any migration bugs or performance regressions are isolated to a single tenant's shard (limited blast radius) and can be resolved before impacting other customers. It also avoids locking a shared database table for long periods, which would cause downtime for all tenants.",
    section: "Sharding for Multitenancy"
  }
];

const FLASHCARDS = [
  { front: "What is the primary difference between replication and sharding?", back: "Replication copies the same data to multiple nodes for fault tolerance. Sharding splits the dataset into smaller subsets (shards) across nodes to scale storage and writes." },
  { front: "What is a partition key?", back: "The attribute or column used to determine which shard a specific record belongs to." },
  { front: "What are the security/operational benefits of sharding for multitenancy?", back: "Resource isolation, permission isolation, cell-based fault isolation, per-tenant backups, and easier compliance with data residence or deletion laws." },
  { front: "Name three databases that use Raft consensus protocol internally to track shard assignments.", back: "CockroachDB, YugabyteDB, and TiDB." },
  { front: "What is the primary drawback of key-range sharding?", back: "Risk of write hotspots, particularly when writing sorted data like timestamps, since all writes go to the same active shard." },
  { front: "How does prefixing a key with a sensor ID solve time-series write hotspots?", back: "It distributes writes across different shards based on the sensor ID, rather than appending all writes to the end of the current time range shard." },
  { front: "Why is modulo hashing (hash(key) % N) bad for dynamic database clusters?", back: "When the node count N changes, nearly all keys map to different nodes, requiring massive, expensive data migration during rebalancing." },
  { front: "How does the 'fixed number of shards' approach solve the modulo hashing rebalancing issue?", back: "By creating many logical shards at the outset. Shards (not individual keys) are moved to new nodes, meaning key-to-shard assignments never change." },
  { front: "What is consistent hashing?", back: "A hash mapping technique where changing the number of nodes only requires moving a minimal number of keys between nodes, ensuring balanced distribution." },
  { front: "What is a 'hot key' in a sharded database?", back: "A single partition key that receives a disproportionately high volume of read or write requests (e.g., a celebrity user's profile)." },
  { front: "What is the scatter-gather query pattern?", back: "Querying all shards in parallel because the partition key is unknown, then merging the results. It is prone to tail latency amplification." },
  { front: "What is a local secondary index (document-partitioned index)?", back: "An index where each shard independently maintains search indexes for its own records. Fast writes, but reads require scatter-gather." },
  { front: "What is a global secondary index (term-partitioned index)?", back: "An index that covers all shards and is itself sharded by the indexed values. Reads only query one shard, but writes require updating multiple shards." },
  { front: "What is a cell-based architecture?", back: "An architecture where both application services and database shards for a subset of users are grouped into self-contained, independent cells for fault isolation." },
  { front: "Name three databases that use Raft consensus protocol internally to track shard assignments.", back: "Kafka, YugabyteDB, TiDB, and ScyllaDB." },
  { front: "How does Riak manage cluster state changes, and what consistency drawback does it have?", back: "Riak uses a gossip protocol to disseminate cluster state, which is eventually consistent and can temporarily result in split-brain shard mappings." }
];

const CONFIDENCE_LABELS = [
  "Sharding vs replication trade-offs",
  "Multitenancy and cell-based architectures",
  "Key-range sharding and time-series hotspots",
  "Hash-based sharding and fixed shards",
  "Request routing and consensus services",
  "Local vs global secondary indexes"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 7", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 15 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Re-attempt sharding trade-offs comparison from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach concepts to someone (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! If read throughput is the bottleneck, replication (read replicas) is a much simpler and more effective solution than sharding. Sharding is primarily needed for write throughput and data volumes that exceed a single node's capacity.",
    true: "Not quite. Sharding is a heavyweight solution. The book notes that if read throughput is your only issue, read scaling (replication) is much simpler and cheaper than sharding.",
    unsure: "Read throughput bottlenecks are often solved differently. Look at the 'Pros and Cons of Sharding' section."
  },
  m2: {
    false: "Correct! Language-specific hash functions often yield different hash values for the same key across different processes or executions, which would break routing. Database sharding requires stable, process-independent hash functions like Murmur3 or MD5.",
    true: "Be careful! The book warns that built-in language hash functions can vary across runs or processes, making them completely unsuitable for distributed systems.",
    unsure: "This is a common trap! Look for the discussion on hash functions in 'Sharding by Hash of Key'."
  },
  m3: {
    false: "Correct! Modulo hashing is highly inefficient during rebalancing because changing N forces almost all keys to move. Decoupled shard mapping (fixed shards or consistent hashing) is used instead to minimize data movement.",
    true: "Actually, modulo hashing is the worst choice for dynamic clusters! Adding or removing a single node forces nearly all data to move to different nodes.",
    unsure: "Think about what happens to the math when N changes. Look at the 'Hash modulo number of nodes' section."
  },
  m4: {
    true: "Correct! Because a local secondary index only covers the records stored in its own shard, writing a record only requires updating that single shard, making writes highly performant.",
    false: "Actually, this is true! Local secondary indexes are fast on writes because they don't require cross-shard coordination. Their drawback is on the read side (scatter-gather).",
    unsure: "This is a key characteristic of local indexes. Read the section 'Local Secondary Indexes' to see the write-path benefits."
  },
  m5: {
    false: "Correct! While some databases use distributed transactions, many (like DynamoDB) update global secondary indexes asynchronously to keep writes fast, which means reads from global indexes can be stale.",
    true: "Not necessarily. While they can be synchronous, many databases (like DynamoDB) choose to update global indexes asynchronously to avoid the heavy performance cost of distributed transactions.",
    unsure: "Consistency in global indexes is a major design choice. Look at the 'Global Secondary Indexes' section for how DynamoDB handles it."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch7_learning';
