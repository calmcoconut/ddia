/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is a key characteristic of offline systems (batch processing)?",
    options: [
      "They process stream events sequentially as they arrive, maintaining active state in local memory",
      "They execute interactive request-response queries, requiring sub-second latencies for end users",
      "They take immutable, read-only inputs and generate outputs from scratch without mutating inputs",
      "They execute write-intensive online transactions (OLTP) that modify the database state in-place"
    ],
    correct: 2,
    explanation: "Batch processing jobs (offline systems) treat inputs as read-only and generate outputs from scratch every time they run. They do not mutate data in-place like read/write transactions.",
    section: "Introduction"
  },
  {
    type: "mc",
    q: "In web server access log analysis, how does the Unix command line 'sort | uniq -c | sort -r -n | head -n 5' operate?",
    options: [
      "It scans the log file and counts occurrences of each URL by maintaining a dynamically resized hash table in memory",
      "It sorts the keys alphabetically so that identical entries are adjacent, counts them, and then sorts the counts numerically",
      "It shuffles all log lines using a random permutation to generate a statistically representative sample of top URLs",
      "It partitions the log files across multiple local disk drives to perform parallel aggregation on separate CPU cores"
    ],
    correct: 1,
    explanation: "Unix pipes use sorting to bring identical lines together so that 'uniq -c' can count adjacent matching lines without keeping a hash table of all distinct keys in memory.",
    section: "Batch Processing with Unix Tools"
  },
  {
    type: "write",
    q: "Your teammate writes a Python script to count user sessions by grouping them in an in-memory dictionary, and it immediately crashes with an Out-of-Memory (OOM) error on a 50 GB log file. In contrast, a simple Unix pipeline of `sort | uniq -c` finishes successfully on the same machine. How does Unix `sort` achieve this stability under memory pressure?",
    hint: "Look into the mechanism of external mergesort, intermediate disk segments, and memory limits.",
    modelAnswer: "A Python script using a hash table keeps all distinct keys and their counts in memory. If the working set (number of distinct keys) exceeds available RAM, the script will crash with an out-of-memory error. The Unix 'sort' utility, however, implements an external mergesort: it sorts chunks of data in memory, writes them to disk as sorted segment files, and then merges them sequentially. GNU Coreutils 'sort' automatically parallelizes across CPU cores and spills to disk, scaling efficiently to large datasets.",
    section: "Batch Processing with Unix Tools"
  },
  {
    type: "mc",
    q: "How do the block sizes of distributed filesystems (like HDFS) compare to local filesystems (like ext4)?",
    options: [
      "DFS blocks are smaller (typically 512 bytes) to minimize internal storage fragmentation and slack space",
      "DFS blocks are exactly the same size (4,096 bytes) to align with standard operating system page caches",
      "DFS blocks are much larger (e.g., 128 MB) to reduce metadata tracking overhead and disk seek penalties",
      "DFS blocks are dynamically sized per record to prevent any unused space from being allocated on the disk"
    ],
    correct: 2,
    explanation: "HDFS defaults to 128 MB blocks, which is much larger than the 4 KB blocks of local filesystems like ext4. This reduces the amount of metadata the NameNode needs to track, and lowers disk seek overhead.",
    section: "Distributed Filesystems"
  },
  {
    type: "write",
    q: "An enterprise architect recommends hosting a new HDFS cluster on top of a centralized Storage Area Network (SAN) with high-speed fiber channels. Your team lead objects, preferring local drives on cheap commodity servers. Contrast the shared-nothing and shared-disk architectures to explain why the lead is right.",
    hint: "Think about scalability limits, network bottlenecks, cost, and single points of failure in centralized storage vs. local disks.",
    modelAnswer: "A shared-disk architecture relies on a centralized storage appliance (like SAN or NAS) connected via specialized networks (like Fibre Channel) to compute nodes. In contrast, a shared-nothing architecture distributes data across standard commodity servers connected by a conventional network. Distributed filesystems like HDFS use shared-nothing, where each node runs a daemon (data node) exposing local disk access over the network, avoiding the cost and single-point-of-failure issues of centralized SANs.",
    section: "Distributed Filesystems"
  },
  {
    type: "mc",
    q: "What is the role of the NameNode in HDFS?",
    options: [
      "It stores the actual raw data blocks of files across a shared-nothing network of commodity server disks",
      "It maintains file metadata, directory structures, and block locations in the cluster via an in-memory database",
      "It schedules CPU, memory, and disk resources for executing individual MapReduce tasks across worker nodes",
      "It serves as a caching proxy for client reads to reduce network traffic to local data storage daemons"
    ],
    correct: 1,
    explanation: "The HDFS NameNode is a centralized metadata server that keeps track of the file hierarchy, block locations, and replication status. DataNodes store the actual blocks.",
    section: "Distributed Filesystems"
  },
  {
    type: "mc",
    q: "What is a major limitation of object stores (like S3) compared to distributed filesystems (like HDFS)?",
    options: [
      "They restrict individual objects from exceeding a maximum size limit of 1 MB for all read operations",
      "They lack standard support for network-level transport encryption or identity-based access controls",
      "They do not support atomic directory renames or file appends because objects must be treated as immutable",
      "They require clients to be located within the same physical server rack to perform data retrieval actions"
    ],
    correct: 2,
    explanation: "Objects in S3 are immutable. Updating requires rewriting the entire object. S3 also lacks real directories (slashes are just keys), making directory renames non-atomic and slow (requiring copy-and-delete for each object).",
    section: "Object Stores"
  },
  {
    type: "write",
    q: "A junior developer asks: 'Since we are already using Kubernetes to schedule our microservices, why do we need to set up Apache Airflow to run our nightly batch pipeline?' Explain the different responsibilities of cluster resource managers and workflow schedulers.",
    hint: "Distinguish between container resource allocation (CPU/RAM) and managing a dependency graph (DAG) of job tasks.",
    modelAnswer: "Cluster resource managers (YARN, Kubernetes) allocate physical resources (CPU, RAM, GPU) and start/stop individual task executors across nodes. Workflow schedulers (Airflow, Dagster) manage the high-level dependency graphs (DAGs) of multiple batch jobs. They orchestrate when jobs should run (e.g., job B runs only after job A succeeds), handle retries on failure, and integrate with external APIs, without managing individual node resources directly.",
    section: "Distributed Job Orchestration"
  },
  {
    type: "mc",
    q: "In cluster resource managers like YARN and Kubernetes, what daemon runs on each node to manage tasks?",
    options: [
      "The NameNode or FoundationDB process which tracks block metadata and transaction commits",
      "The ApplicationMaster or Operator which coordinates resource requests for a specific job",
      "The NodeManager or kubelet process which starts, monitors, and stops individual containers",
      "The ZooKeeper or etcd service which manages cluster state synchronization and configuration"
    ],
    correct: 2,
    explanation: "Task executors like YARN's NodeManager or Kubernetes's kubelet run on each cluster node to start, monitor, and report the status of individual tasks.",
    section: "Distributed Job Orchestration"
  },
  {
    type: "mc",
    q: "Why is gang scheduling in resource allocation considered a double-edged sword?",
    options: [
      "It executes tasks sequentially to prevent network congestion, which simplifies debugging but increases total job latency and queue wait times",
      "It reserves resources until all tasks can start, preventing partial execution starvation but reducing cluster utilization and causing deadlocks",
      "It dynamically allocates additional RAM to struggling tasks to prevent out-of-memory errors, but causes severe CPU starvation on neighbor nodes",
      "It runs tasks in randomized priority batches to optimize cache locality, but requires specialized bare-metal hardware that lacks Kubernetes support"
    ],
    correct: 1,
    explanation: "Gang scheduling avoids running a job partially by waiting until all requested cores are available. However, this causes nodes to sit idle while waiting, reducing cluster utilization and risking deadlocks.",
    section: "Distributed Job Orchestration"
  },
  {
    type: "write",
    q: "During a massive 4-hour MapReduce job, one of the mapper servers experiences a hardware failure and goes offline. Explain how the framework recovers and completes the job without losing data or requiring a full manual restart.",
    hint: "Consider the immutability of input data blocks, determinism of mapper tasks, and task re-scheduling.",
    modelAnswer: "MapReduce relies on functional programming principles where mappers and reducers do not mutate state and depend only on the input records passed to them. If a node running a mapper task crashes, the scheduler simply re-runs the mapper task on another node that has a replica of the input block. Because inputs are immutable and tasks are deterministic, re-running the task produces the identical outputs, ensuring fault tolerance without complex state replication.",
    section: "MapReduce"
  },
  {
    type: "mc",
    q: "Which of the following is an implicit step in MapReduce that the user does not need to write?",
    options: [
      "The custom mapper logic that extracts and formats specific key-value pairs from raw records",
      "The custom reducer logic that aggregates and reduces list values associated with each key",
      "The sorting and grouping of mapper outputs by key before they are transferred to the reducer",
      "The format-specific parsing of incoming raw files like JSON, CSV, or Apache Avro records"
    ],
    correct: 2,
    explanation: "Sorting is a built-in step in MapReduce. The framework guarantees that the mapper's output keys are sorted and grouped before being passed to the reducer.",
    section: "MapReduce"
  },
  {
    type: "write",
    q: "A data engineer migrates a pipeline from Hadoop MapReduce to Apache Spark and observes a 10x speedup. Why is MapReduce generally much slower than modern dataflow engines?",
    hint: "Focus on how intermediate state is handled: disk I/O and replication overhead in HDFS vs. DAG lineage in memory.",
    modelAnswer: "MapReduce writes all intermediate outputs to HDFS/S3 at the end of each map and reduce stage to ensure fault tolerance (rather than because disk is inherently required by the programming model itself). This generates substantial disk I/O and replication network traffic. In contrast, dataflow engines like Spark and Flink construct a unified Directed Acyclic Graph (DAG) for the entire workflow and keep intermediate state in memory or on local disk, resorting to disk/network replication only when necessary because they can recompute lost partitions from the DAG lineage on failure.",
    section: "MapReduce"
  },
  {
    type: "mc",
    q: "What is a DAG in the context of dataflow engines?",
    options: [
      "Data Access Gateway, representing the secure network boundary for database queries",
      "Directed Acyclic Graph of operators, representing the structured flow of data",
      "Distributed Aggregation Group, representing the clustered nodes processing reductions",
      "Dynamic Allocation Grid, representing the execution slots assigned by the scheduler"
    ],
    correct: 1,
    explanation: "A Directed Acyclic Graph (DAG) represents the workflow of a dataflow engine, where vertices are processing operators (maps, filters, joins) and edges represent the flow of data between them.",
    section: "Dataflow Engines"
  },
  {
    type: "mc",
    q: "What is pipelining in dataflow engines?",
    options: [
      "Executing multiple tasks sequentially in a single-threaded queue to prevent CPU cache misses and lock contention",
      "Passing intermediate data to downstream operators as soon as it is ready, without waiting for the entire stage to finish",
      "Running concurrent database write transactions in strict isolation to prevent dirty reads and write skew anomalies",
      "Storing and compressing dataset attributes in a columnar format to speed up analytical read queries on big data"
    ],
    correct: 1,
    explanation: "Pipelining allows downstream tasks to start processing records immediately as they are output by upstream tasks, rather than waiting for the entire upstream stage to complete and write to disk.",
    section: "Dataflow Engines"
  },
  {
    type: "write",
    q: "You are explaining the inner workings of MapReduce to a new hire. Describe the steps of the distributed shuffle phase: how do key-value pairs travel from mappers to reducers, and how is sorting coordinated?",
    hint: "Think about hashing keys, local sorted segment files on mappers, HTTP pulls, and the final mergesort on the reducer side.",
    modelAnswer: "During the shuffle, mappers process inputs and partition key-value pairs by hashing the key. Mappers write these partitioned pairs as sorted segment files on their local disks. Reducers then connect to all mappers to pull their assigned key partition files. Once a reducer has downloaded all its partition segments, it merges them using a mergesort-style operation, ensuring values for the same key are consecutive before the reducer function is called.",
    section: "Shuffling Data"
  },
  {
    type: "mc",
    q: "In a sort-merge join between user clickstream logs and a user profiles database, what is typically used as the join key?",
    options: [
      "The specific page URL that the user visited during the session",
      "The high-resolution timestamp of the recorded activity event",
      "The unique user ID that is present in both input datasets",
      "The user's date of birth retrieved from their registration profile"
    ],
    correct: 2,
    explanation: "The user ID is the common key in both datasets. Both datasets are mapped and partitioned/sorted by user ID so that all logs and profiles for a specific user ID land on the same reducer.",
    section: "Joins and Grouping"
  },
  {
    type: "mc",
    q: "What is the purpose of secondary sort in a MapReduce reduce-side join?",
    options: [
      "To sort the final aggregated outputs of each individual reducer task alphabetically before writing them out to HDFS or S3",
      "To guarantee that the reducer receives the user's profile record (dimension) before any of their activity events (facts)",
      "To pre-sort the intermediate keys alphabetically in the mapper memory buffers before transmitting them over the network",
      "To run a validation check during the shuffle phase that prevents duplicate keys from being processed by different reducers"
    ],
    correct: 1,
    explanation: "Secondary sort arranges records so that the join dimension record (e.g., user profile) arrives at the reducer before the fact records (e.g., click events). This allows the reducer to cache the profile once in memory and join it with events streamingly.",
    section: "Joins and Grouping"
  },
  {
    type: "write",
    q: "You need to join a huge 10 TB clickstream log dataset with a small 50 MB table of user country codes. Explain why a map-side broadcast hash join is much faster here than a standard reduce-side sort-merge join, and detail the resource tradeoffs.",
    hint: "Compare the network cost of shuffling the 10 TB dataset with the memory cost of loading the 50 MB table on each mapper.",
    modelAnswer: "A reduce-side sort-merge join shuffles all records from both datasets across the network to partition and sort them by the join key. This uses substantial network bandwidth but does not require either dataset to fit in memory. In contrast, a map-side broadcast hash join avoids shuffling the large dataset by loading the entire small dataset into memory on every mapper node, saving network resources but risking out-of-memory errors if the small table exceeds mapper RAM.",
    section: "Joins and Grouping"
  },
  {
    type: "mc",
    q: "What does it mean for a join to be a 'reduce-side join'?",
    options: [
      "The mapper tasks perform the key lookup and join records locally in memory before executing the sorting phase",
      "The join logic is executed in the reducer after mappers partition and sort the datasets by the join key",
      "The join is executed entirely within a data warehouse cluster using declarative SQL commands and indexes",
      "The input dataset is filtered and reduced in overall size using local aggregators before joining in memory"
    ],
    correct: 1,
    explanation: "In a reduce-side join, the mappers only extract and output the join keys and values. The actual matching and merging of records from both datasets are done by the reducers after the shuffle.",
    section: "Joins and Grouping"
  },
  {
    type: "write",
    q: "Your clickstream events and user profiles are both pre-sharded into 64 partitions based on user ID. Describe how a partitioned hash join (bucketed map join) exploits this structure to perform the join efficiently.",
    hint: "Consider how mappers can load matching shards locally, avoiding both a global network shuffle and the need to load the entire database into memory.",
    modelAnswer: "In a partitioned hash join, both datasets are pre-partitioned (bucketed) by the join key in the same way (using the same hash function and number of partitions). When joining, a mapper only needs to load the corresponding partition of each dataset. The mapper can load the smaller partition into an in-memory hash table and join it with the larger partition locally. This avoids a full network shuffle and only requires a single partition (rather than the entire table) to fit in memory.",
    section: "Joins and Grouping"
  },
  {
    type: "mc",
    q: "Why did SQL become the standard language for writing batch processing jobs in modern systems?",
    options: [
      "It is the only query language whose compilers are structurally designed to run on partitioned, distributed systems",
      "It allows cost-based query optimizers to automatically determine the most efficient execution plan (like join orders)",
      "It requires more verbose and explicit code statements, which makes debugging much simpler than custom MapReduce jobs",
      "It provides a built-in virtual memory layer that completely eliminates the need for external storage like HDFS or S3"
    ],
    correct: 1,
    explanation: "SQL provides a declarative interface. This allows the query engine's optimizer to analyze the schema, table sizes, and join conditions to choose the best physical join algorithms and execute them efficiently.",
    section: "Query Languages"
  },
  {
    type: "mc",
    q: "How does Spark's DataFrame execution model differ from Pandas' local model?",
    options: [
      "Spark executes operations eagerly to return immediate feedback to the console, whereas Pandas schedules updates asynchronously via a queue",
      "Spark translates method calls into a query plan and optimizes it before executing, while Pandas executes operations immediately in memory",
      "Spark exclusively supports declarative SQL queries on flat files, whereas Pandas allows executing custom python lambda functions in parallel",
      "Spark operates strictly on unstructured stream data without joining tables, whereas Pandas is designed for complex relational aggregations"
    ],
    correct: 1,
    explanation: "Pandas executes DataFrame operations immediately when called. Spark DataFrame APIs build up a logical query plan, compile and optimize it using Spark Catalyst, and then execute it across the cluster when an action is triggered.",
    section: "DataFrames"
  },
  {
    type: "write",
    q: "A data scientist is puzzled because their local Pandas script running index-based lookups and row sorting runs slower after migrating to a distributed Spark DataFrame. Why do distributed DataFrames suffer from such 'performance surprises' when performing row-level ordering or indexing?",
    hint: "Think about how data is partitioned across nodes, and how index lookups or sorting require expensive network shuffles.",
    modelAnswer: "Local DataFrames (like Pandas) are stored sequentially in memory and support fast row-level indexing and ordering. In contrast, distributed DataFrames (like Spark) are partitioned across multiple machines and are generally unordered. Operations that assume a strict order or rely on fast random row-access index lookups require massive network shuffling and coordination in a distributed environment, leading to unexpected performance bottlenecks. To mitigate this, developers should prefer key-based operations and avoid relying on implicit row order.",
    section: "DataFrames"
  },
  {
    type: "mc",
    q: "Which model is commonly used to batch process graph data where calculations traverse edges iteratively?",
    options: [
      "Map-side joins, which join datasets using local hash tables in mappers",
      "Bulk Synchronous Parallel (BSP) / Pregel, using iterative step barriers",
      "External mergesort on local disk, which sorts records in memory chunks",
      "Data contracts mesh, which coordinates APIs and schemas between domains"
    ],
    correct: 1,
    explanation: "The Bulk Synchronous Parallel (BSP) or Pregel model is popular for graph algorithms. Nodes send messages along edges, perform local computation, and sync at synchronization barriers (supersteps).",
    section: "Machine Learning"
  },
  {
    type: "write",
    q: "Your team is preparing a raw web scrape dataset of 100 billion tokens to train a large language model. Describe three text preprocessing tasks that are highly suited for a batch processing framework like Spark.",
    hint: "Think about tasks that are 'embarrassingly parallel' and can operate on individual documents (e.g., cleaning, deduplication, tokenization).",
    modelAnswer: "Three preprocessing steps suited for batch frameworks are: 1) HTML extraction and cleaning, where raw text is parsed from HTML and malformed characters are corrected; 2) Document deduplication and quality filtering, where duplicate pages, low-quality spam, or irrelevant content are discarded; and 3) Tokenization and embedding generation, where text is split into tokens and converted into numerical vector representations. These are embarrassingly parallel tasks that can scale across multiple worker nodes.",
    section: "Machine Learning"
  },
  {
    type: "mc",
    q: "What does 'human fault tolerance' (or time travel) refer to in batch processing?",
    options: [
      "The design patterns that enable human developers to write complex processing code without introducing bugs",
      "The ability to roll back buggy code and re-run jobs on read-only inputs to fix corrupted database outputs",
      "The ability of a machine learning scheduler to predict human operator errors before they physically occur",
      "The automated process of restoring accidentally deleted input files from a local or distributed trash bin"
    ],
    correct: 1,
    explanation: "Because batch jobs treat inputs as read-only and produce outputs from scratch, a bug in the code can be corrected by simply fixing the code and re-running the job over the same inputs. This is not possible in databases with mutable transactions.",
    section: "Introduction"
  },
  {
    type: "write",
    q: "An intern proposes writing a Spark job where each executor task connects directly to the production PostgreSQL database and updates user rows in parallel. Explain why this is an architectural anti-pattern.",
    hint: "Consider the impact of concurrent connections, database load, network latency, and the lack of atomic all-or-nothing rollback guarantees for failed jobs.",
    modelAnswer: "Writing directly to a production database from parallel batch tasks can easily overwhelm the database with concurrent writes, degrading performance for live users. It is also slow because it makes row-by-row network calls rather than sequential bulk writes. Finally, it violates the all-or-nothing guarantee of batch jobs, as failures leave partial, corrupted, or duplicated write side-effects visible in the production database.",
    section: "Serving Derived Data"
  },
  {
    type: "mc",
    q: "What is a primary role of a message broker (like Kafka) when serving derived data from batch systems?",
    options: [
      "It operates as a relational database that stores indexes and serves low-latency read queries directly to users",
      "It compiles declarative SQL queries into optimized physical Spark executor tasks across the compute cluster",
      "It acts as a buffer and security boundary, allowing downstream databases to ingest data at a controlled rate",
      "It manages and persists the filesystem metadata of HDFS blocks to ensure fast block location lookups by clients"
    ],
    correct: 2,
    explanation: "Message brokers act as a buffer. Batch jobs can dump data quickly into a Kafka topic, and downstream production systems can read from it at their own pace without being overwhelmed.",
    section: "Serving Derived Data"
  },
  {
    type: "write",
    q: "Your company's data warehouse team wants to transform and clean all incoming raw logs before saving them. The data lake team objects, advocating for the 'sushi principle'. Explain this principle and how it relates to schema-on-read versus schema-on-write.",
    hint: "Think about preserving raw details for future unexpected queries versus losing information through early transformations.",
    modelAnswer: "The 'sushi principle' states that 'raw data is better.' In a data lake (schema-on-read), raw files are stored in their original formats without transformation, giving downstream analysts the maximum flexibility to interpret the data differently for different use cases. In contrast, a data warehouse (schema-on-write) transforms and structures the data upon import, which optimizes query performance but permanently discards details and limits the questions that can be asked later.",
    section: "Introduction"
  }
];

const FLASHCARDS = [
  { front: "What is the main performance metric for batch systems compared to online systems?", back: "Throughput (volume of data processed per unit of time) is the key metric for batch systems, whereas response time/latency is key for online systems." },
  { front: "What is the 'sushi principle' in data lakes?", back: "The idea that 'raw data is better.' Storing data in its raw form allows maximum flexibility for future, unanticipated analysis using schema-on-read." },
  { front: "How does HDFS tolerate hardware failures?", back: "By replicating blocks (typically 128 MB) across multiple data nodes or using erasure coding (like Reed-Solomon codes)." },
  { front: "What is the primary difference in directory structure between HDFS and S3?", back: "HDFS has a real directory tree hierarchy. S3 is a flat key-value store where slashes in keys are just a naming convention." },
  { front: "What is YARN's equivalent of Kubernetes' kubelet?", back: "NodeManager, a daemon that runs on each node to start and monitor task executors." },
  { front: "What are the two user-defined callback functions in MapReduce?", back: "Mapper (extracts keys and values from records) and Reducer (aggregates or processes values grouped by key)." },
  { front: "What is the MapReduce shuffle phase?", back: "The framework-managed sorting and partitioning of mapper outputs, ensuring all values for the same key reach the same reducer." },
  { front: "Why are Flink and Spark called dataflow engines?", back: "Because they explicitly model the flow of data through a Directed Acyclic Graph (DAG) of operators without writing intermediate state to a DFS." },
  { front: "What is a broadcast hash join?", back: "A map-side join where a small dataset is loaded entirely into memory on all mapper nodes, avoiding any network shuffling." },
  { front: "What is a partitioned hash join?", back: "A map-side join where both datasets are pre-sharded by the join key, allowing mappers to join matching buckets locally." },
  { front: "How does 'human fault tolerance' benefit from batch processing?", back: "If buggy code corrupts output, you can fix the bug, delete the bad output, and re-run the job over immutable inputs." },
  { front: "What is the main downside of writing directly to a database from batch tasks?", back: "It is slow, can overwhelm the production database, and leaves partial/failed write side-effects visible." },
  { front: "What is the Pregel or Bulk Synchronous Parallel (BSP) model?", back: "An iterative computation model for graph processing where vertices send messages, compute locally, and synchronize at barriers." },
  { front: "What is 'reverse ETL'?", back: "Pushing derived or aggregated data from a data warehouse or batch system back into operational OLTP systems (e.g., Salesforce)." },
  { front: "Why is decoupled storage and compute preferred in cloud native architectures?", back: "It allows scaling CPU/memory resources independently from storage size, lowering costs and increasing flexibility." }
];

const CONFIDENCE_LABELS = [
  "Online vs. offline (batch) systems",
  "Unix pipelines (awk, sort, uniq)",
  "Distributed filesystems vs. object stores",
  "Cluster resource managers & workflow schedulers",
  "MapReduce vs. dataflow engines",
  "Serving batch-derived data to production DBs"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 11", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 15 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Explain MapReduce shuffle from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach batch join algorithms (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! In MapReduce, sorting (the shuffle phase) is hardcoded into the framework. Mappers write key-value pairs sorted by key, and reducers merge these sorted segments. It cannot be bypassed.",
    true: "Look for this in the text! MapReduce forces a sort phase between map and reduce. It cannot be disabled, which is a major reason why MapReduce is less flexible than dataflow engines.",
    unsure: "Think about MapReduce's pipeline. Sorting is a fundamental step that happens after mappers finish."
  },
  m2: {
    false: "Correct! S3 has no real concept of directories — the slash is just part of the key. Renaming a 'directory' requires copying every object to a new key and deleting the old one, which is slow and non-atomic.",
    true: "Object stores are flat key-value stores. Slashes are just a naming convention. Renaming a directory requires copying and deleting each object, making it slow and non-atomic.",
    unsure: "Look for S3 vs HDFS filesystem details. Object stores handle directory-like behavior as key prefixes."
  },
  m3: {
    false: "Correct! The overhead of sharding, network serialization, and distributed coordination (shuffling) can make a distributed job slower than a simple Python script or Unix pipeline on a single large machine for small-to-medium datasets.",
    true: "The text highlights that distributed engines introduce significant network and serialization overhead. For smaller datasets that fit on a single node, distributed systems can be slower.",
    unsure: "Think about network overhead and coordination cost vs CPU speed."
  },
  m4: {
    false: "Correct! Writing directly from batch tasks can overwhelm the database with concurrent connections, is extremely slow due to network roundtrips, and violates the all-or-nothing transaction guarantee. Bulk loading or message broker buffering is preferred.",
    true: "Writing directly to the production database from executors is slow and dangerous, as it lacks all-or-nothing transactional guarantees and can easily overwhelm the live database.",
    unsure: "What happens when hundreds of parallel executors concurrently write to the same relational database?"
  },
  m5: {
    true: "Correct! Cloud warehouses like Snowflake/BigQuery use sharding, distributed filesystems, and column-oriented formats (like Parquet), while Spark/Flink support SQL query compilation and DataFrame APIs.",
    false: "Data warehouses have adopted decoupled storage/compute, distributed filesystems, and DataFrame APIs, while batch frameworks have adopted SQL, making them highly converged.",
    unsure: "Look at the section comparing Cloud Data Warehouses and Batch Processing systems."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch11_learning';


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
