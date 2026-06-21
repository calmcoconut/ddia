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
      "It enables schema-on-read processing, allowing the database engine to interpret different region data structures on the fly at query time.",
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
      "Schema-on-write is optimized for analytical data warehouses, whereas schema-on-read is restricted to transactional relational databases.",
      "Schema-on-write systems disable column indexing entirely, whereas schema-on-read engines index every single nested attribute automatically.",
      "Schema-on-write databases validate and enforce structure upon data insertion, whereas schema-on-read databases interpret structure during queries.",
      "Schema-on-write allows applications to store arbitrary, unvalidated JSON, whereas schema-on-read requires defining strict relational tables."
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
      "To store system metadata, ingestion rules, and configuration parameters for the analytical ETL pipelines.",
      "To log individual transaction events, containing specific numeric metric attributes and relational foreign keys.",
      "To maintain long-term, human-readable descriptions and details of products, customers, stores, and regions.",
      "To manage and synchronize the database schemas and constraints for all secondary snowflake dimension tables."
    ],
    correct: 1,
    explanation: "The fact table contains rows representing discrete events (like sales transactions, page clicks) with numeric values (price, cost) and foreign keys mapping to dimension tables.",
    section: "Stars and Snowflakes: Schemas for Analytics"
  },
  {
    type: "mc",
    q: "How does a snowflake schema differ from a star schema?",
    options: [
      "A snowflake schema represents data using graph vertices and edges, whereas a star schema groups everything into isolated document collections.",
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
      "A sequence of low-level memory pointers referencing the preceding and succeeding vertices in a contiguous linked list."
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
      "Table, Column, and Value",
      "Vertex, Edge, and Property",
      "Subject, Predicate, and Object",
      "Document, Key, and Field"
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
      "Because GraphQL is built exclusively for column-oriented analytical datastores that do not support standard index-based lookups.",
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
      "Running automated background cron jobs to purge historical transaction events from database disks.",
      "Configuring the storage engine to ensure database writes execute in under five milliseconds."
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
      "The read model is maintained exclusively in ephemeral cache memory and cannot be reconstructed if a server node crashes.",
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
