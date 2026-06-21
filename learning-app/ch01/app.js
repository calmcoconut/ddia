/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What does the term 'data-intensive' mean?",
    options: [
      "An application whose performance is bottlenecked by raw CPU processing power, mathematical operations, or graphics rendering",
      "An application where the complexity, volume, and rate of change of data represent the primary system development challenges",
      "An application that relies on low-latency networks and real-time streaming interfaces to process over one gigabyte per second",
      "An application designed specifically to store and archive massive datasets exceeding several petabytes of cold storage"
    ],
    correct: 1,
    explanation: "A data-intensive app is one where data management (storing, processing, consistency, availability) is the primary challenge — not raw CPU power.",
    section: "Introduction"
  },
  {
    type: "mc",
    q: "Which is a characteristic of OLAP (analytical) systems, NOT OLTP?",
    options: [
      "Point queries that retrieve a small number of records based on a specific key",
      "Highly predictable queries that are pre-configured within the application code",
      "Complex aggregate queries that scan and summarize a huge volume of database records",
      "Frequent write operations that insert, modify, or delete individual user records"
    ],
    correct: 2,
    explanation: "OLAP systems run aggregate queries over huge datasets (count, sum, average). OLTP handles individual record lookups and modifications.",
    section: "OLTP vs OLAP"
  },
  {
    type: "write",
    q: "Scenario: You are the Lead Architect at BiteSized, a food delivery startup. A junior engineer submits an RFC proposing: 'Let's clean, transform, and normalize all raw app event logs immediately at ingestion, storing only structured SQL records in our warehouse to keep things tidy.'\n\nExplain the 'Sushi Principle' (raw data is better) in a code review comment to convince them why throwing away the raw event payload is a mistake. Contrast data lakes (schema-on-read) and data warehouses (schema-on-write) regarding analyst flexibility, and warn them about the operational risk of a 'data swamp' if we have zero governance.",
    hint: "Your response should touch on schema-on-write vs schema-on-read, downstream flexibility, and data swamp risks.",
    modelAnswer: "The 'sushi principle' states that 'raw data is better.' In a data lake, data is stored in its raw, unprocessed form (schema-on-read), giving downstream consumers (analysts, data scientists) the flexibility to interpret and transform it according to their specific needs. In contrast, a data warehouse enforces a rigid schema during the import process (schema-on-write), which optimizes read performance but limits flexibility for ad-hoc analytical exploration. However, without governance, data lakes can become data swamps where raw data is unusable.",
    section: "Data Warehouses"
  },
  {
    type: "mc",
    q: "What is a 'system of record' (source of truth)?",
    options: [
      "The highest-throughput database optimized for processing transient cache and session data",
      "Any relational database system that enforces strict SQL schemas and ACID transaction safety",
      "The authoritative, canonical version of data where new writes are first received and stored",
      "A cold-storage backup copy of the primary production database used solely for disaster recovery"
    ],
    correct: 2,
    explanation: "A system of record holds the authoritative version. Each fact is represented exactly once (normalized). If there's a discrepancy, the system of record wins by definition.",
    section: "System of Record"
  },
  {
    type: "mc",
    q: "When is self-hosting often cheaper than cloud services?",
    options: [
      "In virtually all circumstances because cloud infrastructure providers always charge a premium markup",
      "When application workloads are highly dynamic, unpredictable, and require automatic elastic scaling",
      "When your team has operational expertise and system workloads are predictable and relatively stable",
      "When running as an early-stage startup with fewer than ten engineers and limited initial funding"
    ],
    correct: 2,
    explanation: "The chapter states: if you already have operational expertise and your load is predictable (no need for elastic scaling), self-hosting is often cheaper.",
    section: "Cloud vs Self-Hosting"
  },
  {
    type: "write",
    q: "Scenario: Your CTO wants to migrate your predictable, highly stable database workload from self-hosted hardware to a fully managed cloud service. An experienced engineer objects, arguing that managed services will introduce unnecessary control limits.\n\nExplain how the 'expertise reversal effect' applies here. Under what conditions do managed cloud services benefit a team, and under what conditions do they act as a hindrance for experienced operators with predictable loads?",
    hint: "Contrast cognitive load reduction for novices with the control limits, debugging boundaries, and costs faced by experts.",
    modelAnswer: "The expertise reversal effect suggests that assistance that helps novices can actually hinder experts. Managed cloud services reduce cognitive load for teams without operational expertise, helping them launch quickly. However, for an experienced operations team with predictable loads, managed cloud services can act as a hindrance by introducing a lack of control, limited diagnostic capabilities, vendor lock-in, and higher costs than self-hosting.",
    section: "Cloud vs Self-Hosting"
  },
  {
    type: "mc",
    q: "What does 'separation of storage and compute' mean in cloud native architecture?",
    options: [
      "Developing the persistence layers and the business logic engines in different, isolated programming languages",
      "Provisioning storage systems and compute capacity as independent resources that can be scaled and billed separately",
      "Physically separating primary database servers from application servers by deploying them in different subnetworks",
      "Allocating solid-state drives exclusively for data persistence and graphics processing units for execution threads"
    ],
    correct: 1,
    explanation: "Cloud native systems disaggregate storage (e.g., S3) from compute (CPU/RAM), allowing each to scale independently. Traditional systems bundle both on the same machine.",
    section: "Cloud vs Self-Hosting"
  },
  {
    type: "mc",
    q: "According to the chapter, microservices are primarily a solution to what kind of problem?",
    options: [
      "A hardware performance problem by distributing processing tasks so that they run faster across separate nodes",
      "A network security problem by enforcing strict access control boundaries and resource isolation between services",
      "An organizational people problem by enabling multiple engineering teams to develop and deploy code independently",
      "A database storage problem by splitting large database tables across multiple independent physical disks"
    ],
    correct: 2,
    explanation: "The chapter explicitly states: 'Microservices are primarily a technical solution to a people problem: allowing different teams to make progress independently.'",
    section: "Microservices"
  },
  {
    type: "write",
    q: "Scenario: A tech lead claims: 'Converting our monolith to microservices will make our application run faster and improve CPU utilization.'\n\nWrite a response clarifying why microservices are primarily a solution to a 'people problem' rather than a technical performance problem. Detail the trade-offs of microservices in terms of team coordination vs. technical overhead (network latency, serialization, transaction complexity).",
    hint: "Focus on organizational scaling, team independence, communication overhead, and operational complexity.",
    modelAnswer: "Microservices solve the organizational challenge of coordinate overhead by letting teams operate independent services with clear interfaces. This avoids blocking on other teams' release schedules or shared codebases. Technically, microservices introduce performance overhead (network latency, serialization) and complexity (distributed transactions), meaning they are often a trade-off of technical efficiency for organizational scaling.",
    section: "Microservices"
  },
  {
    type: "mc",
    q: "What is 'data minimization' (Datensparsamkeit) and why does it matter?",
    options: [
      "Applying compression algorithms to binary data payloads in order to minimize active storage costs",
      "Collecting and storing only data that serves a specified, explicit purpose to limit legal and security risk",
      "Selecting the smallest hardware capacity and disk sizes necessary to run your production database cluster",
      "Optimizing application algorithms to minimize the frequency of queries sent to the relational database"
    ],
    correct: 1,
    explanation: "Data minimization means not storing data 'just in case.' The GDPR mandates collecting data only for a specified purpose. The chapter argues the cost of storage includes liability, reputational damage, and legal risk — not just S3 bills.",
    section: "Law and Society"
  },
  {
    type: "mc",
    q: "What is the main reason for separating OLTP and OLAP workloads?",
    options: [
      "They inherently rely on completely different serialization structures, such as nested JSON and XML documents",
      "Running resource-intensive analytical queries on OLTP databases can severely degrade performance for active users",
      "OLTP is restricted to relational SQL systems, whereas OLAP can only be executed on schema-less NoSQL platforms",
      "Analytical OLAP data must be encrypted at rest, whereas transactional OLTP data only requires transit encryption"
    ],
    correct: 1,
    explanation: "Heavy aggregate queries in OLAP scan millions of rows and consume significant CPU/memory, which would starve resources for critical transaction operations in OLTP.",
    section: "OLTP vs OLAP"
  },
  {
    type: "write",
    q: "Scenario: An eager data analyst runs a giant SQL query containing multiple multi-table JOINs and GROUP BY operations directly on your production Postgres primary server to build a live dashboard. Immediately, your checkout service starts throwing 504 Gateway Timeouts.\n\nExplain why running complex analytical queries directly on OLTP databases causes these user-facing issues. Detail the physical resource bottlenecks involved.",
    hint: "Think about locks, CPU starvation, memory consumption, and transaction response times.",
    modelAnswer: "An analytical query typically performs full-table scans, large joins, and aggregations across millions of rows. This consumes substantial CPU cycles and RAM. Additionally, it may hold locks on tables or indexes. In an OLTP system, this resource starvation blocks fast, concurrent transactional queries, causing checkout delays, timeouts, and a degraded user experience.",
    section: "OLTP vs OLAP"
  },
  {
    type: "mc",
    q: "What does ETL stand for?",
    options: [
      "Encryption, Transmission, and Latency-limits",
      "Elasticity, Throughput, and Load-balancing",
      "Extraction, Transformation, and Loading",
      "Execution, Testing, and Logging-procedures"
    ],
    correct: 2,
    explanation: "ETL is the process of extracting data from operational databases, transforming it (cleaning, restructuring), and loading it into a data warehouse.",
    section: "Data Warehouses"
  },
  {
    type: "mc",
    q: "What is the primary difference between a data warehouse and a data lake?",
    options: [
      "A warehouse stores data in flat files on cloud drives, while a lake organizes all data into relational SQL tables",
      "A warehouse is optimized for high-volume write workloads, while a lake is built specifically for low-latency read paths",
      "A warehouse enforces a structured schema on write, while a lake stores raw files and applies a schema on read",
      "A warehouse is exclusively deployed in public cloud platforms, while a lake is restricted to on-premise hardware"
    ],
    correct: 2,
    explanation: "Data warehouses store structured, cleaned, and schema-conforming data. Data lakes store raw, unstructured or semi-structured files, letting analysts choose how to parse it later.",
    section: "Data Warehouses"
  },
  {
    type: "write",
    q: "Scenario: A new database project requires choosing between a structured Data Warehouse and an unstructured Data Lake. The executive team demands: 'We want maximum flexibility to adapt to new user fields next month, but we also need our analytical dashboard queries to run in under 2 seconds.'\n\nCompare Data Warehouses (schema-on-write) and Data Lakes (schema-on-read). Explain why this request represents a fundamental engineering trade-off that cannot be completely bypassed.",
    hint: "Explain how pre-processing and indexing affect query speed versus the ease of changing structures.",
    modelAnswer: "A data warehouse (schema-on-write) offers high query performance because the data is clean, pre-structured, and indexed, but it is less flexible because changing the schema requires complex migrations. A data lake (schema-on-read) offers maximum flexibility because raw data is loaded without pre-processing, allowing analysts to write custom parses later, but query performance is typically slower because formatting is resolved during execution.",
    section: "Data Warehouses"
  },
  {
    type: "mc",
    q: "What is 'reverse ETL'?",
    options: [
      "Extracting structured data from an analytical warehouse and loading it back into operational transactional systems",
      "Migrating raw, unstructured data payloads from a distributed data lake directly into a relational data warehouse",
      "Converting processed database records in a data warehouse back into raw, uncompressed CSV files on a local disk",
      "Restoring an archived database backup to primary production servers immediately following a critical node failure"
    ],
    correct: 0,
    explanation: "Reverse ETL takes derived, processed, or model-scored data from analytical systems (like a customer churn prediction score) and pushes it back into OLTP tools (like Salesforce) to drive business operations.",
    section: "Data Warehouses"
  },
  {
    type: "mc",
    q: "Why is distributing a system across multiple machines considered a 'double-edged sword'?",
    options: [
      "It significantly reduces hardware hosting costs but severely limits horizontal scale-out capacity",
      "It scales throughput and availability but introduces complex partial failure modes and network latency",
      "It requires a larger engineering team to maintain but reduces overall electricity consumption in data centers",
      "It is only compatible with analytical OLAP engines and cannot be implemented for transactional OLTP workloads"
    ],
    correct: 1,
    explanation: "Distribution lets you handle more load and tolerate node failures, but it introduces partial failure states, network partitions, split-brain issues, and consistency challenges.",
    section: "Single-Node vs Distributed"
  },
  {
    type: "write",
    q: "Scenario: A developer proposes sharding your database across a 5-node cluster. The database currently fits easily on a single high-spec server, and transactional consistency is critical for your financial ledger operations.\n\nExplain why sticking with a single-node database running on a high-spec server might be preferable in this situation. Contrast the complexity, coordination, and network costs.",
    hint: "Discuss complexity, network latency, transactional safety (ACID), and actual dataset size.",
    modelAnswer: "A single-node database is preferable when the load can fit on a single large machine, when strict ACID transactional guarantees across all data are required without the latency overhead of distributed consensus, and when the team lacks the operational expertise to manage a complex distributed cluster. A single-node system avoids the network delay, serialization cost, and coordination overhead of a multi-node database.",
    section: "Single-Node vs Distributed"
  },
  {
    type: "mc",
    q: "What does HTAP stand for?",
    options: [
      "High-Throughput Application-Level Protocol",
      "Hybrid Transactional/Analytical Processing",
      "Hierarchical Transaction Allocation Process",
      "Horizontal Topology Architecture Paradigm"
    ],
    correct: 1,
    explanation: "HTAP refers to database engines designed to handle both transactional (OLTP) and analytical (OLAP) workloads on the same data store concurrently.",
    section: "OLTP vs OLAP"
  },
  {
    type: "mc",
    q: "Which of the following is an example of derived data?",
    options: [
      "A security hash of a user's original signup password stored in the database",
      "A transaction record generated and saved when a customer purchases an item",
      "A search index updated automatically based on changes in the primary database",
      "A raw, uncompressed user profile image uploaded directly to an object store"
    ],
    correct: 2,
    explanation: "A search index is derived from the system of record. If lost, it can be fully rebuilt by re-processing the primary database's records.",
    section: "System of Record"
  },
  {
    type: "write",
    q: "Scenario: You are designing an e-commerce platform. You have a PostgreSQL primary database (system of record) and an Elasticsearch cluster (for fast keyword search).\n\nDefine 'derived data' in this context, explain how the Elasticsearch index qualifies as derived data, and briefly outline how they stay synchronized.",
    hint: "Define derived data. Explain redundancy, and discuss change synchronization channels.",
    modelAnswer: "Derived data is information that is created by transforming existing data from another source. It is redundant and can be fully reconstructed if lost. A search index is derived because it extracts text columns from the system of record (primary database) and indexes them in a specialized format (e.g., inverted index). When updates occur in the primary database, change data capture (CDC) or application logic syncs those changes to update the search index.",
    section: "System of Record"
  },
  {
    type: "mc",
    q: "What is vendor lock-in?",
    options: [
      "A security mechanism that automatically locks developers out of their cloud console after suspicious logins",
      "The high financial cost and technical difficulty of migrating an application from one cloud provider to another",
      "An automated network firewall policy that blocks external database connections from entering local environments",
      "Deploying a relational database that requires purchasing a proprietary, commercial license key from a vendor"
    ],
    correct: 1,
    explanation: "Vendor lock-in happens when an architecture relies on proprietary, provider-specific features (like DynamoDB or BigQuery) making a migration to a competitor extremely expensive.",
    section: "Cloud vs Self-Hosting"
  },
  {
    type: "mc",
    q: "Which regulatory framework is directly mentioned as impacting data system design?",
    options: [
      "CCPA (California Consumer Privacy Act)",
      "PCI-DSS (Payment Card Security Act)",
      "GDPR (General Data Protection Regulation)",
      "SOX (Sarbanes-Oxley Compliance Act)"
    ],
    correct: 2,
    explanation: "The chapter specifically discusses the GDPR (and similar laws like CCPA) under 'Data Systems, Law, and Society,' highlighting how rules like the 'right to be forgotten' affect system architecture.",
    section: "Law and Society"
  },
  {
    type: "write",
    q: "Scenario: Your engineering team is proud of their append-only, immutable event ledger that records all historical user activities. A user submits a formal GDPR 'Right to be Forgotten' request demanding their profile and action history be deleted.\n\nExplain why append-only immutable logs clash with this legal mandate. What workarounds or design techniques (e.g., cryptographic erasure or log compaction) can resolve this conflict?",
    hint: "Discuss the conflict between log immutability and data deletion, and how techniques like key shredding help.",
    modelAnswer: "GDPR guarantees individuals the 'right to be forgotten' (erasure), requiring companies to delete all personal data of a user. In contrast, append-only logs are designed to be immutable histories of events. Deleting a single user's data from an immutable log requires rewriting history or using complex workarounds like cryptographic erasure (shredding the user's specific encryption key) or log compaction, introducing technical friction.",
    section: "Law and Society"
  },
  {
    type: "mc",
    q: "What is the role of a cache in a data-intensive application?",
    options: [
      "To store raw log files indefinitely on durable object storage for compliance auditing purposes",
      "To keep expensive, frequently accessed read results in memory to enable low-latency data retrieval",
      "To execute complex analytical queries across petabytes of relational data in a distributed warehouse",
      "To isolate microservice databases from one another in order to ensure strict security compliance"
    ],
    correct: 1,
    explanation: "Caches sit in front of database layers to remember common queries, protecting downstream systems from read load and returning results in milliseconds.",
    section: "Introduction"
  },
  {
    type: "mc",
    q: "Which of the following workloads is typically compute-intensive rather than data-intensive?",
    options: [
      "A retail banking system processing millions of credit card transactions daily",
      "A media streaming service distributing live video to thousands of active users",
      "An atmospheric simulation modeling global wind currents on a supercomputer node",
      "A sales dashboard running aggregate queries on transaction data from five years"
    ],
    correct: 2,
    explanation: "Atmospheric simulation requires executing complex mathematical models (millions of floating-point operations) on a fixed set of boundary conditions, bottlenecked by CPU/GPU computation. Conversely, a banking system is data-intensive because its primary challenges are data management, reliability, concurrency, and volume—not complex CPU math.",
    section: "Introduction"
  },
  {
    type: "write",
    q: "Scenario: A PM suggests: 'Let's store every single click, mouse movement, and page view for all users indefinitely. Disk space is cheap, and we might find a use for it in five years.'\n\nExplain 'Data Minimization' (Datensparsamkeit) and how it challenges this 'big data' philosophy. Discuss the hidden costs (e.g. security liability, legal compliance under GDPR) of storing speculative data.",
    hint: "Contrast speculative data storage with the legal and operational liabilities of accumulating unneeded personal data.",
    modelAnswer: "Data minimization states that you should only collect and retain personal data that is strictly necessary for a specified, explicit purpose. This directly challenges the 'big data' philosophy, which advocates for storing as much raw data as possible, speculative of future analytical value. Data minimization argues that unneeded data is a liability, exposing the organization to security breaches, legal risks, and regulatory fines.",
    section: "Law and Society"
  },
  {
    type: "mc",
    q: "What does the term 'elasticity' mean in cloud systems?",
    options: [
      "The capacity of a relational database schema to accommodate new columns and indices without downtime",
      "The automatic provisioning and deprovisioning of compute or storage resources to match current workload demands",
      "The physical durability and read-write lifecycle limits of enterprise solid-state backup disk drives",
      "The network latency buffer and package retransmission window configured when a connection is unstable"
    ],
    correct: 1,
    explanation: "Elasticity is the cloud's ability to scale resources (e.g., spinning up new virtual machines) automatically in response to load spikes and scale them down when load decreases, saving costs.",
    section: "Cloud vs Self-Hosting"
  },
  {
    type: "mc",
    q: "Which architectural pattern is commonly used to sync a system of record with a derived search index?",
    options: [
      "Generating flat batch files manually and sending them via FTP once a week to the index server",
      "Using Change Data Capture (CDC) to stream database modifications to the search index in near-real-time",
      "Executing dual writes directly from the client application to both systems without transaction controls",
      "Rebuilding the search index entirely by copying and exporting database records every single night"
    ],
    correct: 1,
    explanation: "Change Data Capture (CDC) reads the database transaction log and streams inserts/updates to the search index, ensuring consistency without client-side dual-write complexity.",
    section: "System of Record"
  },
  {
    type: "write",
    q: "Describe a scenario where a database transaction in an OLTP system must guarantee atomicity, and why this level of guarantee is less critical in an OLAP system.",
    hint: "Think about financial transactions or bank transfers vs a monthly sales dashboard.",
    modelAnswer: "In an OLTP system, a bank transfer between two accounts must guarantee atomicity: either both the debit and credit succeed (completed by a COMMIT), or both fail and rollback. This is typically managed using BEGIN/COMMIT blocks and enforced via a Write-Ahead Log (WAL), or a Two-Phase Commit (2PC) if distributed. If it fails halfway, funds would vanish or be duplicated. In an OLAP system, an analyst running a query to aggregate monthly sales average can tolerate slight consistency delays or temporary discrepancies, as minor transaction lag does not impact high-level trend analysis or store operation integrity.",
    section: "OLTP vs OLAP"
  }
];

const FLASHCARDS = [
  { front: "What are the 5 building blocks most data-intensive applications need?", back: "Databases, Caches, Search Indexes, Stream Processing, Batch Processing" },
  { front: "OLTP vs OLAP: Which uses point queries and which uses aggregate queries?", back: "OLTP uses point queries (fetch by key). OLAP uses aggregate queries (scan many records, compute sum/count/avg)." },
  { front: "What is a data warehouse and why does it exist?", back: "A separate database for analytics. It exists because running expensive analytical queries on OLTP databases would hurt performance for real users." },
  { front: "What is ETL? What is ELT?", back: "ETL: Extract → Transform → Load (transform before loading). ELT: Extract → Load → Transform (transform after loading, in the destination)." },
  { front: "What is the difference between a data lake and a data warehouse?", back: "Data lake: stores raw files without imposing schema (flexible, cheap). Data warehouse: stores structured relational data with schema (optimized for SQL/BI)." },
  { front: "System of record vs. derived data — what's the key difference?", back: "System of record: authoritative source, data written here first, normalized. Derived data: result of transformation, redundant, can be recreated from the source." },
  { front: "Name 3 reasons to distribute a system across multiple machines.", back: "Any 3 of: inherent distribution, cloud service requests, fault tolerance, scalability, legacy, elasticity, specialized hardware, legal compliance." },
  { front: "What is the biggest downside of cloud services?", back: "Lack of control: can't add missing features, can't diagnose bugs, can't run old versions, vendor lock-in, geopolitical risk, trust for data security." },
  { front: "What is HTAP and why doesn't it replace data warehouses?", back: "HTAP = Hybrid Transactional/Analytical Processing. Doesn't replace warehouses because enterprises have hundreds of operational DBs but typically one warehouse combining all data." },
  { front: "What is 'reverse ETL'?", back: "Sending outputs of analytical systems (e.g., ML model predictions) back to operational systems for real-time use — e.g., deploying a recommendation model." },
  { front: "What is the 'expertise reversal effect' (in cloud hosting context)?", back: "Techniques that help novices can hinder experts. Cloud services help teams without ops expertise, but experienced teams may find self-hosting cheaper and more controllable." },
  { front: "What does Datensparsamkeit mean and how does it conflict with 'big data'?", back: "Datensparsamkeit = data minimization. Don't store data 'just in case.' Conflicts with big data's philosophy of storing everything speculatively. GDPR supports minimization." }
];

const CONFIDENCE_LABELS = [
  "OLTP vs OLAP systems",
  "Data warehouses & ETL",
  "Cloud vs self-hosting trade-offs",
  "Distributed vs single-node",
  "Privacy law & system architecture"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 1", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 12 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Re-attempt OLTP vs OLAP table from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach concepts to someone (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! A single-threaded program on one machine can outperform a 100-core cluster for some workloads. Distribution adds network latency, coordination overhead, and complexity.",
    true: "Keep an eye out for this in the chapter! The book argues that more machines can actually be slower due to network overhead and coordination costs.",
    unsure: "Good instinct to be unsure! The chapter has a surprising answer about when a single machine beats a cluster."
  },
  m2: {
    false: "Correct! With predictable load and operational expertise, self-hosting is often cheaper. Cloud excels for variable load and when you lack ops skills.",
    true: "The chapter challenges this assumption! It depends heavily on your load patterns and operational expertise.",
    unsure: "Smart to be cautious! The answer is more nuanced than most people expect."
  },
  m3: {
    false: "Correct! The chapter says: 'A database is just a tool; how you use it is up to you.' The same PostgreSQL instance can be either — it depends on its role in your architecture.",
    true: "Interesting assumption! The chapter argues the distinction is about the role, not the technology. The same DB can be either.",
    unsure: "This is a subtle point the chapter addresses. Look for the section on 'Systems of Record and Derived Data.'"
  },
  m4: {
    false: "Correct! The chapter introduces 'data minimization' — data you don't store can't be leaked, subpoenaed, or violate GDPR. Storage costs include legal liability.",
    true: "The chapter makes a compelling case against this! Look for the section on 'Data Systems, Law, and Society.'",
    unsure: "Great question to hold! The chapter has a fascinating perspective on the hidden costs of storing data."
  },
  m5: {
    true: "Correct! The chapter states: 'Microservices are primarily a technical solution to a people problem: allowing different teams to make progress independently.'",
    false: "The chapter actually agrees with this statement! Look for the microservices section to see why it's about team independence.",
    unsure: "Good instinct! The chapter has a clear position on this — look for it in the 'Microservices and Serverless' section."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch1_learning';
