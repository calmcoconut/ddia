/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Application Logic
   Chapter 3: Data Models and Query Languages
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the N+1 query problem commonly encountered when using Object-Relational Mapping (ORM) frameworks?",
    options: [
      "Executing a single query that returns N database records, followed by N separate queries to resolve an associated relationship for each record.",
      "A concurrency deadlock state that occurs when N independent transactions attempt to acquire write locks on the same set of index partitions.",
      "A caching optimization pattern that buffers N distinct queries in memory and consolidates them into a single batch query on the server.",
      "A latency penalty where database queries run N times slower than native SQL commands because of serialization overhead in network APIs."
    ],
    correct: 0,
    explanation: "The N+1 query problem occurs when an application fetches a list of records (1 query) and then loops through them, executing a separate query for each record (N queries) to load a related object (e.g., author of a comment).",
    section: "Object-relational mismatch"
  },
  {
    type: "mc",
    q: "For what type of relationships is the document (JSON) model most naturally suited, according to the chapter?",
    options: [
      "Highly interconnected many-to-many relationships where records frequently reference entities in other tables",
      "Hierarchical one-to-many tree structures where data is self-contained and inter-document links are uncommon",
      "Relational table structures that enforce data consistency across multiple rows using ACID transactions",
      "Complex analytical workloads requiring ad-hoc joins across wide dimension tables in data warehouses"
    ],
    correct: 1,
    explanation: "JSON documents naturally represent tree-like, hierarchical one-to-many relationships (e.g., jobs list and education under a single user profile) where all data is nested and read together.",
    section: "The document data model for one-to-many relationships"
  },
  {
    type: "write",
    q: "During a system design meeting, a frontend engineer complains: 'Why do we have to write so much boilerplate code to translate our nested user profile objects into flat relational tables and columns?' What is the name of this architectural friction, and what does it represent?",
    hint: "Describe this object-relational mismatch and why bridging OOP designs with relational tables requires translation layers.",
    modelAnswer: "The impedance mismatch refers to the translation layer required to bridge the gap between object-oriented programming models and relational database models. Objects in code contain nested structures, inheritance, and behavior, whereas relational databases store data flatly in tables, rows, and columns. Translating between these two representations requires significant boilerplate code or complex Object-Relational Mapping (ORM) tools, which can introduce performance and design inefficiencies.",
    section: "Object-relational mismatch"
  },
  {
    type: "mc",
    q: "What is the primary advantage of normalizing database tables by storing a geographical region as a unique ID (e.g., 'region_id') instead of a raw text string?",
    options: [
      "It significantly increases database write performance because numeric region IDs can be inserted in parallel without lock contention.",
      "It reduces storage space since numeric IDs require fewer bytes than text strings, improving sequential disk I/O throughput across all records.",
      "It prevents spelling discrepancies, simplifies bulk updates, avoids naming ambiguities, and naturally supports translation and localization.",
      "It eliminates the need for running complex relational JOIN operations when retrieving and displaying user information on the frontend UI."
    ],
    correct: 2,
    explanation: "Storing an ID (normalized) ensures that user-meaningful information is in only one place, making updates easy, ensuring consistent naming, avoiding ambiguity, and allowing translation/localization without changing user records.",
    section: "Normalization, Denormalization, and Joins"
  },
  {
    type: "mc",
    q: "What is the key difference between schema-on-write and schema-on-read?",
    options: [
      "Schema-on-write is optimized for analytical data warehouses, whereas schema-on-read is designed primarily for transactional relational databases.",
      "Schema-on-write generates a physical schema at insert time by inferring column types from the first observed record, whereas schema-on-read defers all schema metadata to the application layer.",
      "Schema-on-write databases validate and enforce structure upon data insertion, whereas schema-on-read databases interpret structure during queries.",
      "Schema-on-write delays all structural validation to a background compaction job, whereas schema-on-read enforces strict column types on every read path."
    ],
    correct: 2,
    explanation: "Schema-on-write databases (like traditional relational DBs) ensure data conforms to a schema before writing. Schema-on-read (like document databases) accepts any structure and parses it when read.",
    section: "Schema flexibility in the document model"
  },
  {
    type: "write",
    q: "A developer is preparing a pull request to add a new 'middle_name' field to the user profile. Contrast the steps, risks, and client-side handling required if they are using a schema-on-write relational database versus a schema-on-read document database.",
    hint: "Think about ALTER TABLE migrations and locks versus handling missing fields dynamically in client code.",
    modelAnswer: "In a schema-on-write relational database, adding a new field requires executing an ALTER TABLE migration, which can lock the table and cause downtime on large datasets, along with setting up defaults or nullability. In a schema-on-read document database, no database-level migration is needed; new documents are simply written with the new field. However, the client application code must handle the schema flexibility by dynamically checking if the field is present when reading older documents.",
    section: "Schema flexibility in the document model"
  },
  {
    type: "mc",
    q: "What is the concept of 'data locality' in document databases, and how does it affect read performance?",
    options: [
      "It deploys database instances on virtual servers that are geographically positioned closest to the physical location of the active users.",
      "It groups all related attributes into a single nested document, allowing the application to retrieve the entire record in one disk read.",
      "It applies compression algorithms to JSON files to ensure they are physically allocated on the fastest blocks of a solid-state drive.",
      "It replicates data automatically across multiple physical servers in a cluster to guarantee local availability when partitions occur."
    ],
    correct: 1,
    explanation: "If your application frequently reads the entire record (e.g., a profile), having it in a single document provides data locality, fetching it in one operation rather than running multiple joins or lookups.",
    section: "Data locality for reads and writes"
  },
  {
    type: "mc",
    q: "Which of the following represents a convergence of relational and document databases in recent years?",
    options: [
      "Relational systems adding support for JSON columns, and document databases incorporating join operators and multi-document transactions.",
      "Both database types deprecating their respective query engines to adopt Cypher as the unified industry standard language for queries.",
      "Relational database platforms completely phasing out SQL query parsing in favor of imperative javascript map-reduce collections.",
      "Relational engines abandoning ACID transaction guarantees in order to replicate the eventually consistent nature of NoSQL databases."
    ],
    correct: 0,
    explanation: "Modern relational databases (like PostgreSQL, MySQL) have added support for storing and indexing JSON documents, while document databases (like MongoDB) have added lookup/join operators and transaction support.",
    section: "Convergence of document and relational databases"
  },
  {
    type: "write",
    q: "Your team's document database is experiencing severe write latency spikes. You notice that updates frequently grow the size of individual user documents. Explain why data locality is hurting performance here and how write amplification behaves.",
    hint: "Consider the cost of relocating documents on disk and rewriting the entire record for partial updates.",
    modelAnswer: "Data locality in a document database becomes a disadvantage when updating or writing data. If an update increases the size of a document, the database engine may need to relocate the entire document on disk, which involves writing the new copy and updating all indexes pointing to it. Furthermore, document databases suffer from partial update inefficiency: even if the document size does not change, the entire document must be re-serialized and written atomically to disk, creating significant write amplification compared to modifying a single field in a normalized relational database.",
    section: "Data locality for reads and writes"
  },
  {
    type: "mc",
    q: "In a data warehouse star schema, what is the purpose of the central 'fact table'?",
    options: [
      "To store slowly-changing contextual attributes like product names, customer profiles, and store locations for use in analytical queries.",
      "To log individual transaction events, containing specific numeric metric attributes and relational foreign keys.",
      "To maintain long-term, human-readable descriptions and details of products, customers, stores, and regions.",
      "To pre-aggregate metric totals by time period, serving as a materialized summary view for BI dashboard queries."
    ],
    correct: 1,
    explanation: "The fact table contains rows representing discrete events (like sales transactions, page clicks) with numeric values (price, cost) and foreign keys mapping to dimension tables.",
    section: "Stars and Snowflakes: Schemas for Analytics"
  },
  {
    type: "mc",
    q: "How does a snowflake schema differ from a star schema?",
    options: [
      "A snowflake schema stores all dimension attributes directly inside the fact table rows, whereas a star schema keeps dimensions in separate surrounding lookup tables.",
      "A snowflake schema keeps all data tables completely denormalized, whereas a star schema enforces third normal form across all dimension fields.",
      "A snowflake schema normalizes dimension tables into subdimensions, whereas a star schema denormalizes dimensions directly into single tables.",
      "A snowflake schema distributes event transactions across multiple source tables and does not utilize a centralized analytical fact table."
    ],
    correct: 2,
    explanation: "In a snowflake schema, dimensions are broken down further into subdimensions (e.g., normalizing product categories into a category table rather than storing category strings directly in the product dimension table).",
    section: "Stars and Snowflakes: Schemas for Analytics"
  },
  {
    type: "write",
    q: "During a data warehousing kickoff, the BI team requests a star schema rather than a snowflake schema. What is their primary motivation, and how does this affect the complexity of their SQL queries?",
    hint: "Think about the number of joins, query simplicity, and ease of use for non-technical analysts.",
    modelAnswer: "Business analysts and BI tools prefer star schemas because they are simpler and easier to query. A star schema contains fewer tables and fewer relationships, meaning SQL queries require fewer joins. In contrast, snowflake schemas normalize dimensions further, resulting in complex, multi-level joins that can make queries harder to write and understand for non-technical users, and can degrade read performance.",
    section: "Stars and Snowflakes: Schemas for Analytics"
  },
  {
    type: "mc",
    q: "What do dimension tables in dimensional modeling represent?",
    options: [
      "The numeric metrics, cost values, and aggregate totals computed from incoming event streams.",
      "The contextual details ('who, what, where, when, and why') describing events in the fact table.",
      "The physical file offsets and block metadata of column-oriented tables stored on database disks.",
      "The access control lists containing users authorized to run query reports on the warehouse."
    ],
    correct: 1,
    explanation: "Dimension tables represent the entities participating in the events (e.g., who bought it, what product was sold, where it was bought, when it occurred).",
    section: "Stars and Snowflakes: Schemas for Analytics"
  },
  {
    type: "mc",
    q: "What is the 'One Big Table' (OBT) design pattern in data warehousing?",
    options: [
      "Consolidating all analytical data into a single wide table by pre-joining facts and dimensions to eliminate query-time joins.",
      "Merging all individual spreadsheets and CSV files across the organization into a single global spreadsheet hosted on a cloud drive.",
      "Restricting the execution of the analytical database to a single dedicated CPU core node to prevent thread and memory contention.",
      "A database replication strategy that permanently consolidates multiple regional transactional servers into a single primary cluster."
    ],
    correct: 0,
    explanation: "One Big Table (OBT) goes beyond star schemas by precomputing joins and storing all events and dimension metadata in a single, extremely wide table. While this trades disk space for query speed by eliminating joins, it has a significant maintenance downside: OBT schemas are extremely brittle when source schemas change. Since everything is flattened, a single column rename in a source table requires a full rewrite of the entire wide OBT.",
    section: "Stars and Snowflakes: Schemas for Analytics"
  },
  {
    type: "write",
    q: "A junior developer asks: 'If denormalizing data into One Big Table makes analytical queries so fast, why don't we do this for our main user-facing transactional database?' Walk them through the trade-offs between OLAP and OLTP workloads.",
    hint: "Contrast read-only historical queries with high-frequency, real-time update transactions.",
    modelAnswer: "Extreme denormalization is acceptable in OLAP systems because analytical data is generally write-once, read-many historical logs that rarely change. Thus, write overhead and consistency issues from duplication are not primary concerns. Additionally, OLAP data is typically loaded via batch ETL on a periodic schedule, so data staleness is a known, accepted trade-off. In contrast, OLTP systems have high-velocity write workloads with frequent updates. In OLTP, denormalization causes significant write overhead (updating data in multiple places), risks inconsistency if some copies fail to update, and requires complex transaction controls.",
    section: "Stars and Snowflakes: Schemas for Analytics"
  },
  {
    type: "mc",
    q: "In a Property Graph database (like Neo4j), what does a vertex consist of?",
    options: [
      "A single RDF triple statement consisting of a subject, a predicate, and an object formatted using semantic XML schemas.",
      "A unique identifier, a collection of incoming edges, a collection of outgoing edges, and a map of key-value properties.",
      "A simple string label and a geographic location coordinate reference without support for key-value property assignments.",
      "A vertex label, a set of attached edge IDs, and a numeric weight value encoding the traversal cost to each neighbor."
    ],
    correct: 1,
    explanation: "In a property graph, a vertex (node) consists of a unique ID, a set of incoming and outgoing edges, and a set of properties (key-value pairs) describing it.",
    section: "Property Graphs"
  },
  {
    type: "mc",
    q: "How are relationships represented in a Cypher query?",
    options: [
      "By writing standard SQL JOIN clauses matching primary keys to foreign keys.",
      "By utilizing visual ASCII-art arrows, such as (node1) -[:RELATION]-> (node2).",
      "By executing procedural for-loops to traverse lists of memory address pointers.",
      "By structuring nested XML tags and sub-elements, like <relation>node2</relation>."
    ],
    correct: 1,
    explanation: "Cypher uses a highly visual ASCII-art style arrow syntax to match patterns of vertices and edges (e.g., `(person) -[:BORN_IN]-> (location)`).",
    section: "The Cypher Query Language"
  },
  {
    type: "write",
    q: "Your product manager wants a new feature: showing 'friends of friends who also bought this product' (a 3rd-degree network search). Explain why writing this query in standard SQL is a headache compared to using a graph query language like Cypher.",
    hint: "Think about WITH RECURSIVE syntax vs. ASCII-art style pattern matching.",
    modelAnswer: "Querying graph data in SQL is difficult because traversals require joins across tables. If the number of hops (relationships) to traverse is variable or deep (such as searching for 3rd-degree connections), you must write complex recursive queries using `WITH RECURSIVE` that are hard to read, maintain, and optimize. Graph query languages like Cypher have native syntax for variable-length paths (e.g., `[:WITHIN*0..]`), hiding the join and traversal algorithms behind a declarative query planner.",
    section: "Graph Queries in SQL"
  },
  {
    type: "mc",
    q: "In a Triple-Store database, what are the three components of a triple?",
    options: [
      "Entity, Attribute, and Value",
      "Node, Relation, and Target",
      "Subject, Predicate, and Object",
      "Subject, Edge, and Metadata"
    ],
    correct: 2,
    explanation: "Triple-stores store all information in statements of three parts: Subject, Predicate, Object (e.g., `Lucy, born_in, Idaho`).",
    section: "Triple Stores and SPARQL"
  },
  {
    type: "mc",
    q: "How is the Resource Description Framework (RDF) data model practically applied in modern web systems, given that the original vision of the Semantic Web did not succeed?",
    options: [
      "It serves as the default underlying layout for table partitioning inside high-throughput relational SQL database clusters.",
      "It functions as the primary serialization format used to compress and encrypt high-performance client-side browser caches.",
      "It is used to define open knowledge graphs like Wikidata, Schema.org metadata for search engines, and Open Graph link previews.",
      "It acts as the core communication protocol and schema definition language for RPC-based microservice network communication."
    ],
    correct: 2,
    explanation: "Although the global Semantic Web vision did not succeed, RDF triples are widely used today to represent knowledge graphs (like Wikidata), standardized web markup (Schema.org) for search engine optimization, and rich link preview metadata (Facebook's Open Graph protocol).",
    section: "The Semantic Web"
  },
  {
    type: "write",
    q: "You are comparing Neo4j (a property graph) and Apache Jena (a triple-store) for a new knowledge base. Contrast how these two models represent a simple attribute of a vertex, such as a person's name.",
    hint: "Think about key-value maps on vertices vs. representing everything uniformly as subject-predicate-object triples.",
    modelAnswer: "In a property graph, vertices and edges can have internal key-value properties. In a triple-store (RDF) model, everything is represented as a triple (subject, predicate, object). To represent an attribute of a vertex in a triple-store, you write a triple where the object is a literal value (e.g., `Lucy, name, 'Lucy'`). If you want to link two vertices, the object is another vertex URI (e.g., `Lucy, born_in, Idaho`). Thus, triple-stores represent attributes and relationships uniformly as triples.",
    section: "Triple Stores and SPARQL"
  },
  {
    type: "write",
    q: "A research engineer suggests Datalog for modeling complex hierarchical permission rules. How does Datalog use rules and facts to resolve recursive relationships, and how does this relate to the relational model?",
    hint: "Describe how rules define new relations based on existing facts, and how it evaluates them recursively.",
    modelAnswer: "Datalog is a declarative query language that represents data as facts (similar to relational tuples). To query this data, you write rules that define new relations based on existing facts or other rules. A rule consists of a head (the result) and a body (the conditions). Datalog naturally supports recursion because a rule can refer to itself in its body, allowing the query engine to iteratively apply the rule until no new facts can be derived.",
    section: "Datalog: Recursive Relational Queries"
  },
  {
    type: "mc",
    q: "Why is GraphQL intentionally designed to be more restrictive than query languages like SQL or Cypher?",
    options: [
      "To minimize compile-time overhead and package bundle sizes when compiling frontend React, iOS, or Android client applications.",
      "Because GraphQL queries originate from untrusted client devices, so limiting complex recursive paths protects against DoS attacks.",
      "Because GraphQL is designed primarily for column-oriented analytical datastores that do not support standard index-based lookups.",
      "To enforce a programming paradigm where developers implement business logic in database procedures rather than application servers."
    ],
    correct: 1,
    explanation: "GraphQL queries come from untrusted clients (browsers, mobile apps). If it allowed recursive queries or arbitrary search conditions, a client could run expensive queries that exhaust server resources, causing a denial of service (DoS). Furthermore, because of GraphQL's nested resolver execution model, recursive or overly deep queries can easily trigger severe N+1 query amplification, producing thousands of underlying database calls (a problem commonly solved with DataLoader/batching patterns). Restricting these capabilities prevents resource exhaustion.",
    section: "GraphQL"
  },
  {
    type: "write",
    q: "In a Slack thread, a developer asks: 'Since we are adopting GraphQL for our API gateway, should we migrate our relational database to Neo4j?' Clarify the difference in roles between these two technologies.",
    hint: "Differentiate between client-server data fetching protocols and underlying graph storage engines.",
    modelAnswer: "GraphQL is an API query language and runtime for fetching data from a server to a client, letting the client request specific JSON structures to render the UI. It does not dictate how data is stored and can run on top of relational, document, or graph databases. In contrast, a graph database like Neo4j is a storage technology that represents data as nodes and edges, using query languages like Cypher to perform deep traversals and recursive queries.",
    section: "GraphQL"
  },
  {
    type: "mc",
    q: "What is the core principle of Event Sourcing?",
    options: [
      "Converting all user read queries into real-time pub/sub notification triggers at the API layer.",
      "Representing application state transitions as an append-only sequence of immutable system events.",
      "Rebuilding the current application state from a normalized snapshot table on each application restart.",
      "Ensuring that every state-changing command is idempotent and can be safely replayed an arbitrary number of times."
    ],
    correct: 1,
    explanation: "Event Sourcing stores all changes to application state as a sequence of immutable events appended to a log. This log acts as the system of record.",
    section: "Event Sourcing and CQRS"
  },
  {
    type: "mc",
    q: "In CQRS (Command Query Responsibility Segregation), what is the relationship between the read model and the write model?",
    options: [
      "They are required to share the exact same relational database schema to prevent eventual consistency anomalies across nodes.",
      "The write model appends command events to a log, while separate read-optimized materialized views are updated from that log.",
      "The read model is maintained in ephemeral cache memory and must be fully rebuilt from scratch if a server node crashes or restarts.",
      "The write path is automatically disabled by the storage controller when the read path experiences transient spikes in load."
    ],
    correct: 1,
    explanation: "CQRS separates writing (commands that append to the log) from reading (materialized views or projections optimized for specific queries, updated asynchronously from the log).",
    section: "Event Sourcing and CQRS"
  },
  {
    type: "write",
    q: "Your architecture review board is debating whether to use Event Sourcing or an analytical star schema to track user action history. Compare an append-only event log with a fact table in terms of schema heterogeneity and query patterns.",
    hint: "Consider if the records are homogeneous or diverse, and the importance of chronological ordering.",
    modelAnswer: "Both Event Sourcing logs and star schema fact tables store historical records of events that happened in the past. However, there are key differences: first, fact table rows are homogeneous (sharing the exact same columns), whereas Event Sourcing logs exhibit schema heterogeneity, containing diverse event types (like OrderPlaced, OrderShipped, and OrderCancelled) in the same stream with completely different payloads. Second, a fact table is typically queried as an unordered collection of records, whereas Event Sourcing requires strict chronological ordering to compute correct state transitions. Third, because of this schema heterogeneity and ordering requirement, Event Sourcing logs are significantly harder to query directly for analytics, which is why they usually require projecting into a read-optimized schema (CQRS) first.",
    section: "Event Sourcing and CQRS"
  },
  {
    type: "write",
    q: "During a lunch-and-learn, a database administrator wonders: 'Why do data scientists write messy Pandas code when they could just write clean, declarative SQL queries?' Explain the benefits of DataFrames for data science workflows.",
    hint: "Think about step-by-step pipeline transformations, data cleaning, and integration with machine learning libraries.",
    modelAnswer: "Data scientists prefer DataFrames because they support iterative data exploration and step-by-step transformations. Instead of writing a single, massive SQL query, a data scientist can inspect intermediate results, clean data, handle outliers, and pivot tables using a series of procedural commands. Furthermore, DataFrames integrate with scientific libraries (such as NumPy or scikit-learn) and support operations that go far beyond standard SQL, such as converting data into matrices for machine learning.",
    section: "DataFrames, Matrices, and Arrays"
  },
  {
    type: "mc",
    q: "What is one-hot encoding in the context of data preparation for machine learning?",
    options: [
      "Compressing high-precision floating-point variables into eight-bit integers to fit massive matrix models into GPU memory.",
      "Converting a categorical variable into multiple binary columns of 0s and 1s, where each column represents one unique category.",
      "Encrypting user identity and profiling columns using a single-use key before exporting the dataset to a machine learning matrix.",
      "A database performance optimization that automatically pre-loads the most frequently queried rows of a matrix into CPU cache."
    ],
    correct: 1,
    explanation: "One-hot encoding represents categorical data as a vector of binary values (0 or 1), creating a column for each possible category value, which is the format expected by many ML algorithms.",
    section: "DataFrames, Matrices, and Arrays"
  },
  {
    type: "write",
    q: "You are building a recommendation engine that tracks how millions of users rate a catalog of 50,000 items. Explain why storing this ratings matrix in a relational database is highly inefficient, and how array databases or sparse matrices solve the problem.",
    hint: "Consider wide tables with thousands of null columns, join overhead, and linear algebra operations.",
    modelAnswer: "A sparse matrix representing user-item ratings would require a table with thousands of columns (one for each movie), which relational databases do not support or handle inefficiently due to row width limits and overhead of storing mostly null values. If represented as a normalized long table (user_id, item_id, rating), it requires expensive joins and cannot easily undergo linear algebra operations. Array databases and DataFrames solve this by natively supporting sparse array data structures, which store only non-zero values efficiently and allow direct execution of mathematical matrix algorithms.",
    section: "DataFrames, Matrices, and Arrays"
  }
];

const FLASHCARDS = [
  { front: "What is the impedance mismatch (object-relational mismatch)?", back: "The disconnect between object-oriented application code and flat relational tables/rows/columns." },
  { front: "Schema-on-write vs. Schema-on-read: what is the key difference?", back: "Schema-on-write enforces structure on insertion (RDBMS). Schema-on-read accepts any data and interprets it on query (NoSQL/document)." },
  { front: "What is data locality in document databases?", back: "Storing all nested elements of a record together in a single document on disk, making reads fast but updates potentially expensive." },
  { front: "What are fact tables in a data warehouse star schema?", back: "Central tables storing discrete events (e.g., purchases) containing numeric metrics and foreign keys to dimension tables." },
  { front: "What is a snowflake schema?", back: "A variation of a star schema where dimension tables are further normalized into subdimension tables." },
  { front: "What is One Big Table (OBT) in analytics?", back: "A design that pre-joins fact and dimension tables into a single extremely wide table to avoid SQL joins." },
  { front: "What is a Property Graph?", back: "A graph model where vertices (nodes) and edges (relationships) have unique IDs and arbitrary key-value properties." },
  { front: "What is the Cypher query language?", back: "A declarative query language for property graphs (popularized by Neo4j) using visual ASCII-art style pattern matching." },
  { front: "What is a Triple-Store database?", back: "A graph-like database that represents all facts in three-part statements: Subject, Predicate, Object (RDF)." },
  { front: "What is Datalog?", back: "A declarative, recursive relational query language that uses rules and facts to evaluate complex relationships." },
  { front: "Is GraphQL a graph database? What is it?", back: "No. It is a client-server API query language for requesting structured JSON data, and can run on top of any database." },
  { front: "What is Event Sourcing?", back: "A model where the application's source of truth is an append-only log of immutable, chronological event facts." },
  { front: "What is CQRS (Command Query Responsibility Segregation)?", back: "Separating the write pathway (commands appending to a log) from the read pathway (optimized materialized views/projections)." },
  { front: "What is a DataFrame?", back: "A data structure (e.g., Pandas, R) that holds tabular data and supports relational-like operators and complex matrix transformations." },
  { front: "What is one-hot encoding?", back: "Representing a categorical value as a vector of binary columns (0 or 1), enabling machine learning models to process categorical data." }
];

const CONFIDENCE_LABELS = [
  "Relational vs. Document Models",
  "Object-Relational Impedance Mismatch",
  "Declarative vs. Imperative Query Languages",
  "Graph-Like Data Models",
  "Star and Snowflake Schemas",
  "Schema-on-Read vs. Schema-on-Write",
  "Event Sourcing and CQRS"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 3", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 15 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Re-attempt Graph vs. Relational vs. Document table from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach concepts to someone (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! Document databases lack relational join features or have weaker join support (like lookup queries), meaning developers often have to execute multiple queries and join in application code. Relational databases excel at arbitrary joins.",
    true: "Wait, look out! Joins are often still necessary. In a document database, if you need to join document records, you may have to implement joins manually in application code, which is more complex.",
    unsure: "Good to reflect on this. The chapter discusses the trade-offs of joins in document vs relational databases."
  },
  m2: {
    false: "Correct! NoSQL/document databases are 'schema-on-read'. The database engine doesn't enforce schema constraints, but the application code reading the data still expects a structured schema (otherwise, it couldn't display it).",
    true: "No! The data still has an implicit structure that the client code relies on. It is simply not enforced by the database (hence 'schema-on-read').",
    unsure: "Let's learn about schema-on-read vs schema-on-write in the chapter."
  },
  m3: {
    false: "Correct! GraphQL is a client-server API query language for fetching JSON. It can run on top of any backend (SQL, document, or graph) and is not a database storage engine.",
    true: "No, GraphQL is actually an API query language. It can query any database (like Postgres or MongoDB) and is not a database itself.",
    unsure: "Look for the difference between GraphQL and actual graph storage in the chapter."
  },
  m4: {
    false: "Correct! Cypher is a declarative query language, similar to SQL. The database query optimizer figures out the best way to traverse the graph to find your pattern, so you do not need to write manual loops.",
    true: "Wait, that's not right. Cypher is declarative, not imperative. You describe the pattern of the graph you want (using ASCII-art style syntax), and the query planner decides the execution strategy, hiding procedural loops.",
    unsure: "Think about SQL's declarative nature versus imperative loops. Cypher operates similarly for graph data."
  },
  m5: {
    false: "Correct! Append-only event logs are extremely fast because they use sequential writes, avoiding expensive random writes (such as updating in-place rows or indexes) that slow down CRUD databases.",
    true: "Actually, logging is append-only, which uses sequential writes. This is much faster than random CRUD updates on disk.",
    unsure: "Look for Event Sourcing performance characteristics in the chapter."
  }
};

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch3_learning';
