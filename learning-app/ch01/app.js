/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What does the term 'data-intensive' mean?",
    options: [
      "An app that requires the most powerful CPUs available",
      "An app where data management is one of the primary development challenges",
      "An app that processes data faster than 1GB per second",
      "An app that stores more than 1 petabyte of data"
    ],
    correct: 1,
    explanation: "A data-intensive app is one where data management (storing, processing, consistency, availability) is the primary challenge — not raw CPU power.",
    section: "Introduction"
  },
  {
    type: "mc",
    q: "Which is a characteristic of OLAP (analytical) systems, NOT OLTP?",
    options: [
      "Point queries that fetch individual records by key",
      "Fixed queries predefined by the application code",
      "Aggregate queries scanning large numbers of records",
      "Create, update, and delete individual records"
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
      "The fastest database in your architecture",
      "Any database that uses SQL",
      "The authoritative, canonical version of data — where new data is first written",
      "A backup copy of your production database"
    ],
    correct: 2,
    explanation: "A system of record holds the authoritative version. Each fact is represented exactly once (normalized). If there's a discrepancy, the system of record wins by definition.",
    section: "System of Record"
  },
  {
    type: "mc",
    q: "When is self-hosting often cheaper than cloud services?",
    options: [
      "Always — cloud providers add markup",
      "When load is unpredictable and spiky",
      "When you have experience operating the systems and predictable, stable load",
      "When you're a startup with fewer than 10 engineers"
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
      "Using different programming languages for storage and processing code",
      "Storage (e.g., S3) and computation (CPU/RAM) are independent, separately scalable resources",
      "Keeping your database server in a different room from your application server",
      "Using SSDs for storage and GPUs for compute"
    ],
    correct: 1,
    explanation: "Cloud native systems disaggregate storage (e.g., S3) from compute (CPU/RAM), allowing each to scale independently. Traditional systems bundle both on the same machine.",
    section: "Cloud vs Self-Hosting"
  },
  {
    type: "mc",
    q: "According to the chapter, microservices are primarily a solution to what kind of problem?",
    options: [
      "A performance problem — distributed systems are always faster",
      "A security problem — isolation between services",
      "A people problem — allowing teams to work independently",
      "A storage problem — databases can't handle the load"
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
      "Compressing data to use less storage space",
      "Only storing data that serves a specified, explicit purpose — to reduce legal and security risk",
      "Using the smallest possible database for your needs",
      "Minimizing the number of database queries per request"
    ],
    correct: 1,
    explanation: "Data minimization means not storing data 'just in case.' The GDPR mandates collecting data only for a specified purpose. The chapter argues the cost of storage includes liability, reputational damage, and legal risk — not just S3 bills.",
    section: "Law and Society"
  },
  {
    type: "mc",
    q: "What is the main reason for separating OLTP and OLAP workloads?",
    options: [
      "They use different data structures (e.g., JSON vs XML)",
      "Running heavy analytical queries on OLTP databases can degrade performance for operational users",
      "OLTP is only for SQL databases, while OLAP is only for NoSQL databases",
      "OLAP data is encrypted, while OLTP data is not"
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
      "Encryption, Transmission, Latency",
      "Elasticity, Throughput, Load-balancing",
      "Extract, Transform, Load",
      "Execute, Test, Log"
    ],
    correct: 2,
    explanation: "ETL is the process of extracting data from operational databases, transforming it (cleaning, restructuring), and loading it into a data warehouse.",
    section: "Data Warehouses"
  },
  {
    type: "mc",
    q: "What is the primary difference between a data warehouse and a data lake?",
    options: [
      "A warehouse uses file storage, while a lake uses relational tables",
      "A warehouse is for write-intensive tasks, while a lake is for read-intensive tasks",
      "A warehouse enforces a schema on write, while a lake stores raw data and applies schema on read",
      "A warehouse is cloud-only, while a lake is on-premise-only"
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
      "Extracting data from a data warehouse and loading it back into operational systems of record",
      "Moving data from a data lake to a data warehouse",
      "Converting a data lake back into raw CSV files",
      "Restoring a database backup after a failure"
    ],
    correct: 0,
    explanation: "Reverse ETL takes derived, processed, or model-scored data from analytical systems (like a customer churn prediction score) and pushes it back into OLTP tools (like Salesforce) to drive business operations.",
    section: "Data Warehouses"
  },
  {
    type: "mc",
    q: "Why is distributing a system across multiple machines considered a 'double-edged sword'?",
    options: [
      "It makes the system cheaper but reduces scalability",
      "It scales capacity and improves availability but introduces complex failure modes and network latency",
      "It requires more developers but reduces server electricity costs",
      "It only works for OLAP and is impossible for OLTP"
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
      "High Throughput Application Protocol",
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
      "A user's original signup password hash",
      "A transaction record created when a customer purchases an item",
      "A search index updated in response to changes in the primary database",
      "A raw, uploaded user profile image"
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
      "When a developer is locked out of their AWS console",
      "High costs and difficulty associated with migrating from one cloud provider to another",
      "An automated firewall rule blocking external databases",
      "Using a database that requires a proprietary license key"
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
      "PCI-DSS",
      "GDPR (General Data Protection Regulation)",
      "SOX"
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
      "To store raw files indefinitely for audit purposes",
      "To keep expensive, frequently accessed read results in memory for low-latency retrieval",
      "To execute analytical queries over petabytes of data",
      "To isolate services for security compliance"
    ],
    correct: 1,
    explanation: "Caches sit in front of database layers to remember common queries, protecting downstream systems from read load and returning results in milliseconds.",
    section: "Introduction"
  },
  {
    type: "mc",
    q: "Which of the following workloads is typically compute-intensive rather than data-intensive?",
    options: [
      "A banking system processing millions of credit card transactions",
      "A video streaming service serving thousands of concurrent users",
      "An atmospheric simulation calculating global wind currents on a supercomputer",
      "An analytics dashboard querying sales data from the past five years"
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
      "The ability of a database schema to accept new columns dynamically",
      "The automatic scaling of compute or storage resources up or down to match current demand",
      "The physical durability of database backup drives",
      "The network latency buffer when a connection is unstable"
    ],
    correct: 1,
    explanation: "Elasticity is the cloud's ability to scale resources (e.g., spinning up new virtual machines) automatically in response to load spikes and scale them down when load decreases, saving costs.",
    section: "Cloud vs Self-Hosting"
  },
  {
    type: "mc",
    q: "Which architectural pattern is commonly used to sync a system of record with a derived search index?",
    options: [
      "Manual batch files sent over FTP once a week",
      "Change Data Capture (CDC) streaming updates in near-real-time",
      "Dual writes directly from the client application without transaction controls",
      "Re-installing the database every night"
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
  { front: "Name 3 reasons to distribute a system across multiple machines.", back: "Any 3 of: inherent distribution, cloud service requests, fault tolerance, scalability, latency, elasticity, specialized hardware, legal compliance." },
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
      username:   getCurrentUsername()   // returns the active username from db.js
    })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
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
          alert('Grading completed successfully! Check the console or logs.');
          console.log('Grades:', data.grades);
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
