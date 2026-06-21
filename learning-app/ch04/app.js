/* ══════════════════════════════════════════════════
   DDIA Chapter 4 Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "Why is a Sorted String Table (SSTable) file format superior to a simple append-only CSV log for looking up keys?",
    options: [
      "It enables random key lookups using a sparse in-memory index to locate segments, avoiding a scan of the entire disk file.",
      "It eliminates the need for in-memory indexing entirely by enabling direct binary search on the raw blocks of the disk file.",
      "It compresses record data payloads so they are guaranteed to fit entirely within the operating system's page memory cache.",
      "It supports fast in-place data updates by modifying a key's corresponding value directly at its original physical byte offset."
    ],
    correct: 0,
    explanation: "Since SSTables are sorted by key, a sparse index can map a subset of keys to their byte offsets. The database only needs to seek to the closest preceding key in the index and scan a short block of sorted records. Furthermore, this sorted order is critical for background compaction: it allows segments to be merged efficiently using a mergesort-like algorithm (streaming sequential reads/writes) rather than random I/O.",
    section: "Log-Structured Storage"
  },
  {
    type: "mc",
    q: "What is the primary purpose of the Write-Ahead Log (WAL) or append-only log in an LSM-tree storage engine like RocksDB?",
    options: [
      "To serve read queries for database keys that are currently missing from the active memtable.",
      "To reconstruct and restore the state of the in-memory memtable immediately after a system crash.",
      "To persist the sparse index of on-disk SSTables so it does not need to be rebuilt upon startup.",
      "To buffer discarded historical records and tombstone markers from the background compaction process."
    ],
    correct: 1,
    explanation: "Writes are first added to an in-memory memtable (like a red-black tree or skip list). If the database crashes, the contents of the memtable are lost. The append-only log on disk acts as a durable record of writes to rebuild the memtable.",
    section: "Log-Structured Storage"
  },
  {
    type: "write",
    q: "A developer deletes a user account, but notices the database size actually *increases* immediately afterward. Explain the concept of a 'tombstone' in LSM-trees, and how it is eventually garbage collected.",
    hint: "Think about why append-only designs cannot perform in-place updates, and how compaction resolves this.",
    modelAnswer: "In an LSM-tree, files are immutable, so a deletion cannot be performed in-place. Instead, a deletion is written as a special marker record called a 'tombstone.' When read queries scan segments, the tombstone indicates that the key has been deleted. During compaction, background threads merge old segments, and the tombstone tells the merger to discard previous values of the deleted key. Once the tombstone is merged into the oldest segment and no references to the key remain, the tombstone itself can be discarded.",
    section: "Log-Structured Storage"
  },
  {
    type: "mc",
    q: "In an LSM-tree storage engine, what problem do Bloom filters solve?",
    options: [
      "They speed up incoming writes by pre-sorting keys in heap memory before flushing them to the database's memtable.",
      "They apply block-level compression to SSTables on disk in order to minimize query-time physical disk read and write I/O.",
      "They prevent the storage engine from having to search every single on-disk SSTable segment for keys that do not exist.",
      "They resolve hash collisions within the sparse memory index when keys map to the same physical disk block addresses."
    ],
    correct: 2,
    explanation: "If a key does not exist in the database, the LSM-tree must check the memtable and all segment files from newest to oldest before concluding it is absent. A Bloom filter is a memory-efficient probabilistic data structure that can immediately tell you if a key is definitely not in a segment, saving costly disk reads.",
    section: "Log-Structured Storage"
  },
  {
    type: "mc",
    q: "Which compaction strategy in LSM-trees is characterized by merging smaller, newer SSTables into larger, older SSTables of progressively larger levels, reducing read amplification?",
    options: [
      "Size-tiered compaction strategy",
      "Leveled compaction strategy",
      "Time-window compaction strategy",
      "In-place compaction strategy"
    ],
    correct: 1,
    explanation: "In leveled compaction, the disk space is divided into levels (e.g., L1, L2, L3), where each level contains SSTables that are sorted and have non-overlapping key ranges. Leveled compaction reduces read amplification by guaranteeing a key is only in one SSTable per level. Size-tiered compaction, by contrast, merges SSTables of similar sizes into a single larger one. This is faster for writes but can cause higher read amplification since a key may exist in multiple SSTables of the same size/level, requiring multiple files to be searched.",
    section: "Log-Structured Storage"
  },
  {
    type: "write",
    q: "During a power outage, your relational database server crashes in the middle of a B-tree page split. How does a B-tree handle write updates in-place, and what mechanisms prevent structural corruption after a reboot?",
    hint: "Think about page-oriented writes, Write-Ahead Logs (WAL) replay, and latches for concurrency.",
    modelAnswer: "A B-tree modifies data in-place by breaking the database down into fixed-size pages (usually 4KB) and overwriting them on disk. When a page is full and a new key is inserted, the page splits into two pages, and the parent page must be updated. If the database crashes mid-way, the B-tree can become corrupted. To prevent this, B-trees write every update to a Write-Ahead Log (WAL) on disk before modifying the pages. If a crash occurs, the WAL is used to restore the B-tree to a consistent state. Note that the WAL does not grow indefinitely; once the dirty pages are successfully flushed/checkpointed to disk, the WAL is safely truncated. Additionally, latches (lightweight locks) are used to protect the tree structures from concurrent updates.",
    section: "B-Trees"
  },
  {
    type: "mc",
    q: "What is the purpose of 'abbreviating keys' in B-tree page design?",
    options: [
      "To encrypt sensitive field keys and payload properties before committing them to public cloud block storage volumes.",
      "To fit more keys into each page, increasing the branching factor (fan-out) and reducing the total depth of the B-tree.",
      "To accelerate string comparison routines within CPU registers by reducing variable-length keys to fixed byte lengths.",
      "To prevent hash key collision problems when nesting a B-tree index structure inside an in-memory database hash index."
    ],
    correct: 1,
    explanation: "By storing only a truncated version of the keys (sufficient to identify the boundaries between page ranges) instead of the full keys, B-trees can pack more keys into each fixed-size page. This increases the fan-out (branching factor), meaning the tree requires fewer levels to index the same amount of data, speeding up reads.",
    section: "B-Trees"
  },
  {
    type: "mc",
    q: "What does the term 'write amplification' refer to in database storage engines?",
    options: [
      "The non-linear expansion of database files on disk resulting from the use of block-level compression algorithms.",
      "The ratio of total bytes written to the physical storage media relative to the logical bytes written by application code.",
      "The network transmission overhead associated with writing data records to multiple secondary nodes in a cluster.",
      "The growth in write request latency that occurs as the primary indexing structures scale in size and depth over time."
    ],
    correct: 1,
    explanation: "Write amplification is defined as the ratio of total bytes written to storage relative to the logical bytes written by the application. For example, a ratio of 10 means 10 bytes are written to disk for every 1 byte written by the application. In a B-tree, writing a single byte requires rewriting an entire 4KB page, leading to write amplification. In an LSM-tree, background compaction continuously rewrites data segments, multiplying disk writes.",
    section: "Comparing LSM-Trees and B-Trees"
  },
  {
    type: "write",
    q: "Your LSM-tree storage engine is ingestion-heavy, but suddenly application writes drop to a crawl. How does background compaction compete for resource bandwidth, and how does this affect write throughput and read latency spikes?",
    hint: "Consider how sharing disk bandwidth causes throttling when compaction falls behind.",
    modelAnswer: "While LSM-trees handle high write throughput well by writing sequentially, compaction must run in the background to merge and discard old records. This compaction shares the disk's limited write bandwidth with incoming application writes. If compaction cannot keep up with high write volume, the disk can fill up, and the engine must throttle writes to allow compaction to catch up. Additionally, heavy compaction can cause latency spikes, where a read or write query takes longer because the disk head is busy rewriting large SSTable segments.",
    section: "Comparing LSM-Trees and B-Trees"
  },
  {
    type: "mc",
    q: "What is the difference between a 'clustered index' and a 'non-clustered index' in a relational database?",
    options: [
      "A clustered index stores the actual data rows directly inside the index structure, whereas a non-clustered index stores only references pointing to rows stored elsewhere.",
      "A clustered index strictly organizes data records using B-tree structures, whereas a non-clustered index is forced to rely on in-memory hash tables for key-value lookups.",
      "A clustered index can only be created on numeric columns like integer primary keys, whereas non-clustered indexes are built for string columns and character attributes.",
      "A clustered index partitions data across multiple physical disk files, whereas a non-clustered index resides entirely in volatile memory to ensure low-latency lookups."
    ],
    correct: 0,
    explanation: "In a clustered index, the indexed rows are stored directly inside the index pages. In a non-clustered index, the index stores a reference (like a RID/pointer or primary key) to a heap file where the actual data rows are stored.",
    section: "Storing Values Within the Index"
  },
  {
    type: "mc",
    q: "What is a 'covering index' (or index with included columns)?",
    options: [
      "An index that automatically indexes every single column within a database table, guaranteeing that all application queries can be resolved using index lookups.",
      "An index that stores specific extra column values inside the index itself, letting the engine answer queries entirely from the index without reading the raw data row.",
      "An index optimization that monitors foreign keys and dynamically indexes target columns to prevent latency spikes during multi-table relational join operations.",
      "A clustered index layout that duplicates data blocks across multiple physical hard drives in a RAID cluster to safeguard the system against hard drive failures."
    ],
    correct: 1,
    explanation: "A covering index is a type of secondary index that contains the values of additional columns. If a query only requests columns that are present in the index, the query can be satisfied entirely from the index (an index-only scan), bypassing the hop to the heap file.",
    section: "Storing Values Within the Index"
  },
  {
    type: "write",
    q: "You are designing a ride-sharing app and need to query active drivers within a 2D bounding box (latitude and longitude). Explain why a concatenated index on '(latitude, longitude)' performs poorly here compared to a multi-dimensional index like an R-tree.",
    hint: "Think about how concatenated indexes handle range queries on multiple columns vs spatial coordinates.",
    modelAnswer: "A concatenated index combines multiple columns by appending them together into a single key, which works well for equality filters or range queries on a prefix (e.g., filtering on lastname or lastname AND firstname). However, it cannot efficiently query ranges on both columns simultaneously (like looking for a region of latitude and longitude). For multi-dimensional data, a multi-dimensional index like an R-tree is preferred because it indexes space natively, allowing queries to search bounding boxes or 2D ranges efficiently without scanning all rows along one dimension. Alternatively, column-oriented databases (like BigQuery) sometimes use space-filling curves (such as Z-order/Morton codes or Hilbert curves) to map multi-dimensional coordinates onto a 1D key space while preserving spatial locality.",
    section: "Multicolumn and Secondary Indexes"
  },
  {
    type: "mc",
    q: "In full-text search engines like Apache Lucene, how are spelling corrections or fuzzy search queries typically implemented efficiently?",
    options: [
      "By sequentially scanning the full index text and computing the Levenshtein distance for each word record in the database.",
      "By utilizing a pre-computed hash map that stores the calculated edit distances for all possible alphanumeric word pairs.",
      "By building a Levenshtein automaton (a finite state transducer) over a trie representing terms present in the dictionary.",
      "By translating all query terms into phonetic soundex codes and executing range searches inside a balanced binary tree."
    ],
    correct: 2,
    explanation: "Lucene uses a term dictionary stored as a finite state transducer (FST). For fuzzy search or spelling correction, it builds a Levenshtein automaton that represents all strings within a certain edit distance of the query word, allowing it to traverse the FST and find matching terms in a highly efficient manner.",
    section: "Full-Text Search and Fuzzy Indexes"
  },
  {
    type: "mc",
    q: "If an in-memory database like Redis or VoltDB stores all its data in RAM, how does it ensure durability in the event of a power outage or crash?",
    options: [
      "It configures the operating system's virtual memory swap partition to automatically mirror all active RAM contents to disk.",
      "It relies on specialized hardware-level battery-backed RAM (NVDIMMs) that makes physical database disk writes unnecessary.",
      "It writes an append-only transaction log (WAL) and snapshots to disk, or replicates state to other nodes in the cluster.",
      "It declines to guarantee durability, operating under the assumption that in-memory systems are only used for transient caches."
    ],
    correct: 2,
    explanation: "To ensure durability, in-memory databases write an append-only write log and/or periodic snapshots to disk. On reboot, the log is replayed to reconstruct the database state. Replicating data to other nodes in the network is another way to survive individual node failures.",
    section: "Keeping Everything in Memory"
  },
  {
    type: "write",
    q: "A systems engineer claims: 'Our database has 256GB of RAM, and our database size is only 100GB, so it runs completely in memory. There's no performance benefit to switching to a native in-memory database like Redis.' Critically analyze this statement.",
    hint: "Evaluate the CPU overhead of buffer pools, page translation, locks, and serialization.",
    modelAnswer: "Even if a disk-centric database has enough RAM to cache all data, it still incurs significant overhead managing that cache. It must maintain a buffer pool, translate logical page addresses to memory pointers, write locks, and serialize/deserialize data blocks. An in-memory database avoids this overhead by storing data in memory-optimized structures directly (like simple pointers and graphs). Additionally, because RAM is fast and random access is cheap, in-memory databases can run single-threaded, eliminating lock overhead entirely.",
    section: "Keeping Everything in Memory"
  },
  {
    type: "mc",
    q: "Which of the following best describes the typical access pattern and query complexity of an OLAP (Online Analytical Processing) system?",
    options: [
      "Thousands of concurrent clients executing simple queries that read or update a small number of records identified by key lookups.",
      "A small number of analytical queries that scan millions of rows while reading and aggregating only a few columns of each record.",
      "Continuous transactional updates that modify isolated fields inside deeply nested document collections in a NoSQL database.",
      "Highly concurrent, write-only operations that append event log messages to disk without executing any query lookup operations."
    ],
    correct: 1,
    explanation: "OLAP systems are optimized for business intelligence and analytics. They typically serve a small number of internal analysts running queries that scan and aggregate huge volumes of historical data. They read a small subset of columns across millions of rows, rather than looking up whole rows by ID.",
    section: "Transaction Processing or Analytics?"
  },
  {
    type: "mc",
    q: "How does the modern ELT (Extract-Load-Transform) pattern differ from the traditional ETL pattern in cloud data warehousing, and what is reverse ETL?",
    options: [
      "ELT runs all data transformations directly within source operational OLTP databases before data extraction occurs, whereas reverse ETL is a recovery procedure that exports analytics data back into raw, localized CSV files.",
      "ELT loads raw data directly into the cloud warehouse and runs transformations using the warehouse's compute resources, while reverse ETL syncs processed analytical insights back to operational databases and business systems.",
      "ELT relies exclusively on NoSQL document databases to process raw log data payloads prior to ingestion, whereas reverse ETL represents a specialized replication protocol designed to sync B-tree index files across regions.",
      "ELT functions as a real-time message streaming protocol that completely bypasses persistent storage systems, whereas reverse ETL is an offline archive utility utilized to back up historical records to magnetic tape drives."
    ],
    correct: 1,
    explanation: "In modern cloud data warehousing (e.g., Snowflake, BigQuery), ELT is preferred: raw data is extracted and loaded immediately, leveraging the warehouse's massive parallel compute power to run transformations (e.g. using SQL/dbt) inside the warehouse. Reverse ETL is the practice of copying that processed data from the warehouse back into operational business systems (like CRMs or marketing engines) to drive day-to-day actions.",
    section: "Data Warehousing"
  },
  {
    type: "write",
    q: "An analytical query takes several minutes on a row-oriented database but completes in milliseconds on a columnar warehouse. Explain how 'column pruning' and 'predicate pushdown' minimize the bytes read from disk.",
    hint: "Think about how column-specific file storage allows skipping unneeded columns and evaluating filters at the storage layer.",
    modelAnswer: "Column pruning (or projection pushdown) allows a column-oriented database to read only the specific column files requested by a query, completely skipping disk reads for unneeded columns. Predicate pushdown (or filter pushdown) takes the query's filter conditions (e.g., WHERE age > 30) and evaluates them at the storage layer while reading the column files. This prevents the database from loading and transferring irrelevant data rows into memory, significantly reducing I/O and CPU overhead.",
    section: "Column-Oriented Storage"
  },
  {
    type: "mc",
    q: "In a column-oriented storage engine, how is a table physically stored on disk?",
    options: [
      "All values of an individual database row are kept together in contiguous segments, and new rows are appended sequentially to the end of the data file.",
      "Each column is written to an independent file on disk, where values belonging to the same database row are aligned at identical offsets in each file.",
      "Column attributes are hashed and stored in a multi-dimensional matrix of fixed-size pages that are dynamically managed by a central index controller.",
      "Related columns are grouped into logical families and written sequentially to append-only XML schemas to support flexible schema-on-read parsing."
    ],
    correct: 1,
    explanation: "Column-oriented storage stores all values of column A together on disk, then all values of column B, and so on. The relationship between columns is maintained by their position (index) within the column file: the 500th value in column A belongs to the same row as the 500th value in column B.",
    section: "Column-Oriented Storage"
  },
  {
    type: "mc",
    q: "How does bitmap encoding help compress data and speed up queries in column-oriented databases?",
    options: [
      "It transforms alphanumeric columns into standardized graphics metadata files that can be compressed efficiently using lossless PNG compression algorithms.",
      "It maps low-cardinality values to bitmaps where each bit represents a row index, enabling the query engine to run filters via fast bitwise operations.",
      "It indexes column files by constructing multi-level B-tree paths where every intermediate node holds a bitmap representation of page addresses on disk.",
      "It hashes individual column records into a centralized Bloom filter, allowing the query optimizer to check for duplicate keys without reading files."
    ],
    correct: 1,
    explanation: "When a column has a low cardinality (few distinct values), the database can create a bitmap for each distinct value, where each bit corresponds to a row index (1 if the row has that value, 0 otherwise). This is highly compressible (e.g., using run-length encoding) and allows the database to resolve query filters using CPU-efficient bitwise operations.",
    section: "Column-Oriented Storage"
  },
  {
    type: "write",
    q: "An engineer proposes performing real-time, row-by-row updates directly inside a column-oriented analytics warehouse. Explain why in-place writes are highly inefficient in this architecture, and how modern columnar engines work around this limit.",
    hint: "Consider the necessity of modifying and aligning dozens of separate column files, and the LSM-tree buffering approach.",
    modelAnswer: "In a columnar database, rows are split across separate files for each column. If you want to insert a row, you must modify every single column file, ensuring the new value is appended at the exact same index. If you perform this in-place for every write, it leads to massive random I/O and realignment costs. To handle this, modern columnar engines use a log-structured (LSM) approach: incoming writes are written to a row-oriented memtable on disk/RAM and appended to a temporary log. In the background, these writes are merged and converted into column-oriented segments.",
    section: "Writes in Column-Oriented Storage"
  },
  {
    type: "mc",
    q: "What is an OLAP data cube, and what are its trade-offs compared to querying raw columnar data?",
    options: [
      "A specialized 3D storage drive that records transaction values holographically to eliminate disk read latency for analytical query pipelines.",
      "A grid of pre-computed aggregates across multiple dimensions, providing sub-millisecond query performance at the expense of query flexibility.",
      "A relational warehouse design that strictly enforces exactly three normalized foreign keys on the central fact table to simplify SQL joins.",
      "A distributed partition cache that automatically replicates analytical queries and aggregates to exactly six adjacent servers in the cluster."
    ],
    correct: 1,
    explanation: "A data cube is a multi-dimensional aggregate table. It pre-computes values like total sales grouped by date, product, and region. Queries are extremely fast because the aggregation has already been done, but it is less flexible because you cannot run arbitrary ad-hoc queries on attributes that were not pre-aggregated (e.g., grouping by a new dimension).",
    section: "Aggregation: Data Cubes and Materialized Views"
  },
  {
    type: "write",
    q: "A product manager is delighted by the sub-millisecond load times of a pre-aggregated data cube, but asks: 'Why can't we run arbitrary ad-hoc filters or see real-time updates through this cube?' Discuss the trade-offs of data cubes versus raw columnar queries.",
    hint: "Contrast the speed of pre-computed aggregates against rigidity and data staleness/maintenance overhead.",
    modelAnswer: "An OLAP data cube offers ultra-fast query performance by pre-computing aggregates along various dimensions, bypassing the need to scan raw data. However, it suffers from two major trade-offs: first, it lacks query flexibility because you cannot perform ad-hoc queries on attributes or dimensions that were not pre-aggregated. Second, it suffers from pre-aggregation staleness: the data cube becomes stale the moment the underlying data changes, requiring costly recomputations on a schedule to stay up-to-date.",
    section: "Aggregation: Data Cubes and Materialized Views"
  },
  {
    type: "write",
    q: "During a database audit, you notice that your B-tree table file size remains huge even after deleting millions of rows, whereas your LSM-tree table reclaimed disk space. Contrast how these two engines handle disk space fragmentation.",
    hint: "Think about B-tree fixed-size page splits and empty slots vs LSM sequential immutable files and background compaction.",
    modelAnswer: "B-trees are page-oriented and update in-place. When rows are deleted or when a page splits because it is full, empty spaces are left within the page, leading to internal fragmentation. Over time, pages may only be partially full. LSM-trees, by contrast, write immutable files sequentially. Since they don't update in-place, there is no page-level internal fragmentation. Instead, LSM-trees generate multiple segment files (external fragmentation of versions), which are consolidated and cleaned up during background compaction to free disk space.",
    section: "Comparing LSM-Trees and B-Trees"
  },
  {
    type: "write",
    q: "You are designing secondary indexes for a table that has very frequent row updates. Contrast the performance trade-offs of storing row data in a heap file versus using a clustered index.",
    hint: "Think about whether secondary indexes store direct pointers or primary keys, and the cost of row movement during updates.",
    modelAnswer: "A heap file stores rows in no particular order, and secondary indexes store pointers to these heap file locations. This makes row updates efficient: if a row is modified and stays the same size, it doesn't move, and secondary indexes don't need updates. In contrast, a clustered index stores rows inside the primary index. When rows are updated or inserted, they may split pages and move physically. In a clustered database, secondary indexes must store the primary key instead of a direct row pointer, which adds an extra lookup step (secondary index search -> primary index search -> data row).",
    section: "Storing Values Within the Index"
  },
  {
    type: "mc",
    q: "Why are standard B-trees unsuitable for querying 2D spatial data, such as finding all restaurants within a bounding box of latitude and longitude?",
    options: [
      "B-trees are mathematically incapable of sorting floating-point values, which prevents them from indexing decimal coordinates like latitude and longitude.",
      "B-trees index a one-dimensional key space, meaning they can only filter on one coordinate field efficiently while executing a slow scan on the second.",
      "B-trees are restricted to sorting alphanumeric string attributes and cannot be used to index any form of numeric values or geographic coordinate keys.",
      "B-trees cannot process the extremely high write workloads generated by active mobile clients updating their GPS coordinates in real-time database apps."
    ],
    correct: 1,
    explanation: "A B-tree is a 1D index; it sorts keys along a single dimension. If you index on '(latitude, longitude)', a query for a region can scan a range of latitude, but it must then filter longitude sequentially, or vice versa, resulting in poor performance. Specialized multidimensional indexes like R-trees index spatial coordinates natively.",
    section: "Multidimensional and Full-Text Indexes"
  },
  {
    type: "mc",
    q: "In B-tree terminology, what is a 'latch' used for?",
    options: [
      "To lock individual database rows to ensure transaction isolation and prevent concurrent transactions from executing dirty reads.",
      "To protect the tree's internal structures from concurrent thread access, avoiding race conditions during page splits or updates.",
      "To guarantee that updated data pages are committed and flushed to physical disk files in a single atomic filesystem operation.",
      "To link index pages across separate database instances in a distributed cluster to maintain eventual consistency of schemas."
    ],
    correct: 1,
    explanation: "Latches are lightweight concurrency control structures (similar to read-write locks or mutexes) used to protect the B-tree's internal data pages from inconsistent states when multiple threads are traversing or updating the tree structure.",
    section: "B-Trees"
  },
  {
    type: "write",
    q: "Your data warehouse query engine is running at 100% CPU, but profile trace shows low instruction counts. Explain how 'vectorized query execution' uses modern CPU architectures to speed up analytical processing in columnar databases.",
    hint: "Think about CPU cache locality, loop overhead, SIMD operations, and processing data in contiguous chunks.",
    modelAnswer: "Vectorized query execution allows the database engine to pass chunks of data (e.g., arrays of 1000 values from a column) through the CPU cache at once, rather than processing data row-by-row. This design takes advantage of modern CPU architectures by keeping loop logic simple, minimizing instruction overhead, and enabling the compiler to use SIMD (Single Instruction, Multiple Data) instructions. Because column-oriented storage stores values of a column contiguously, it provides data in the exact contiguous array format that vectorized loops need to run at maximum speed.",
    section: "Column-Oriented Storage"
  },
  {
    type: "mc",
    q: "Which of the following is a B-tree optimization that reduces random disk writes by writing new pages to a different location on disk rather than overwriting existing pages?",
    options: [
      "Page-overlay B-tree configurations",
      "Append-only or copy-on-write B-trees",
      "Leveled B-tree indexing strategies",
      "Sharded distributed index tree maps"
    ],
    correct: 1,
    explanation: "Copy-on-write or append-only B-trees write updated pages to a new location on disk and update parent pages to point to the new location. This avoids overwriting pages in place, turning random writes into sequential writes and assisting in crash recovery (since the old version remains intact).",
    section: "B-Trees"
  },
  {
    type: "write",
    q: "An operator wants to prevent OS swapping (thrashing) when their in-memory database exceeds physical RAM limits. Explain how the database-level 'anti-caching' approach solves this, and how it manages indexes versus evicted data.",
    hint: "Think about database-controlled eviction of cold data vs OS blind page swapping.",
    modelAnswer: "Anti-caching allows an in-memory database to support datasets larger than RAM by evicting cold data (the least recently used records) to disk, while keeping all indexes in memory. Unlike OS virtual memory, which swaps entire pages of memory blindly and can cause thrashing, anti-caching is database-managed: the database knows exactly which records are cold, serializes them to disk, and frees up RAM. When a query accesses an evicted record via the in-memory index, the database fetches only that specific record back into RAM.",
    section: "Keeping Everything in Memory"
  },
  {
    type: "write",
    q: "Your team decides to sort a column-oriented table by the 'order_date' column. Explain how this sort order improves compression and speed for queries, but complicates writes.",
    hint: "Think about run-length encoding on consecutive values, binary search filtering, and the overhead of rewriting sorted files.",
    modelAnswer: "If rows are sorted by a column, say date, then all values of the date column will be contiguous, which allows excellent compression like run-length encoding. Furthermore, secondary columns (like product_id) will also have repeated values in sequence, compressing them well. Sorting also speeds up queries that filter on the sorted column (e.g., date range) because the engine can perform binary search to find the start and end offsets. However, write operations become much harder: inserting a new row in a sorted columnar database requires rewriting all column files to maintain the sort order, which is why updates are typically buffered in an LSM-like write path.",
    section: "Writes in Column-Oriented Storage"
  }
];

const FLASHCARDS = [
  { front: "Write-Ahead Log (WAL)", back: "An append-only disk log used for crash recovery. All writes are appended to it before modifying the main database pages (B-trees) or memtable (LSM-trees)." },
  { front: "Memtable", back: "An in-memory, sorted data structure (usually a red-black tree or skip list) that buffers incoming writes in an LSM-tree before they are flushed to disk as SSTables." },
  { front: "SSTable (Sorted Strings Table)", back: "An immutable, sorted-by-key disk file format used by LSM-trees. It consists of blocks of sorted key-value pairs and a sparse index." },
  { front: "Bloom Filter", back: "A space-efficient probabilistic data structure used to check if a key is definitely NOT in an SSTable segment, saving unnecessary disk reads." },
  { front: "Write Amplification", back: "The ratio of bytes written to disk relative to the logical bytes written by the application. High write amplification degrades write performance and SSD life." },
  { front: "Heap File", back: "A database storage design where data rows are stored in no particular order. Secondary indexes store pointers (byte offsets) to rows in the heap file." },
  { front: "Clustered Index", back: "An index structure where the actual data rows of the table are stored directly within the index leaf nodes, sorted by the primary key." },
  { front: "Covering Index", back: "A secondary index that contains (covers) all columns required by a specific query, allowing the database to satisfy the query without hopping to the heap file." },
  { front: "R-Tree", back: "A specialized multi-dimensional index structure used for spatial and geographical queries (e.g., 'find all restaurants in a bounding box')." },
  { front: "Star Schema", back: "An OLAP database schema with a central fact table (events) surrounded by denormalized dimension tables (entities). It is simple and requires fewer joins." },
  { front: "Snowflake Schema", back: "A variation of the star schema where dimension tables are normalized into sub-dimension tables, reducing redundancy but increasing join complexity." },
  { front: "Vectorized Query Execution", back: "A query engine optimization that processes chunks of data (arrays) in loop structures using CPU registers and SIMD instructions, rather than row-by-row." },
  { front: "Anti-Caching", back: "An in-memory database strategy that evicts cold records to disk when RAM is full while keeping all indexes in memory, avoiding OS swap overhead." },
  { front: "Materialized View", back: "A table-like object containing the pre-computed results of a query, written to disk and updated when underlying data changes, speeding up analytics." }
];

const CONFIDENCE_LABELS = [
  "LSM-Tree vs B-Tree read/write trade-offs",
  "Heap files, clustered, and covering indexes",
  "OLTP vs OLAP workload separation",
  "Columnar storage and bitmap compression",
  "Spatial indexes (R-trees) and full-text search",
  "In-memory database performance and durability",
  "Data cubes and materialized views"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Read Chapter 4, complete Pre-Activity, and complete the Retrieval Quiz.", type: "due" },
  { day: "+1 Day", task: "Review Flashcards (focus on LSM-tree vs B-tree mechanics) and read write-in model answers.", type: "upcoming" },
  { day: "+3 Days", task: "Re-take the Quiz (filtered for Write-In questions) and review telemetry puzzle.", type: "upcoming" },
  { day: "+1 Week", task: "Review Interleaved Scenarios (focus on columnar storage and index trade-offs) and practice flashcards.", type: "upcoming" },
  { day: "+2 Weeks", task: "Re-take the entire Chapter 4 Quiz and self-assess confidence levels.", type: "upcoming" },
  { day: "+3 Weeks", task: "Analyze forgetting curve, review flashcards, and practice Scenario 4 (Trade-off Tribunal).", type: "upcoming" },
  { day: "+1.5 Months", task: "Complete a 5-minute brain dump on Chapter 4 and compare it to initial baseline.", type: "upcoming" },
  { day: "+3 Months", task: "Final review of flashcards and core storage engine trade-offs to cement memory.", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct! B-trees remain the dominant indexing technology. While LSM-trees handle higher write throughput, B-trees offer much more predictable read performance and avoid the overhead and CPU spikes associated with continuous background compaction.",
    true: "Keep an eye out for this in the chapter! The book explains that B-trees are still the default in most relational databases because they offer predictable read latency with exactly one page lookup per level.",
    unsure: "Good to be unsure. B-trees are far from obsolete because they avoid LSM-tree background compaction write throttling and tail latency spikes."
  },
  m2: {
    false: "Correct! A clustered index stores the actual row data directly inside the index structure. A covering index is a secondary index that contains (covers) all the columns needed for a query, allowing the database to answer it without hopping to the heap file.",
    true: "Actually, they are different! A clustered index sorts and stores the actual row data on disk. A covering index is just a secondary index that includes copy values of extra columns.",
    unsure: "They are different. A clustered index contains the primary row data, while a covering index is a secondary index containing extra columns to bypass heap lookups."
  },
  m3: {
    false: "Correct! To ensure durability, in-memory databases use mechanisms like write-ahead logging (WAL), periodic snapshots, or network replication. If the power goes out, they replay the log from disk to reconstruct the RAM state.",
    true: "The chapter explains that most in-memory databases are durable. They write write-ahead logs (WALs) and periodic snapshots to disk to survive outages.",
    unsure: "Most in-memory databases are durable! They append writes to a disk log or snapshot their state regularly."
  },
  m4: {
    false: "Correct! Columnar databases do not use heavy, general-purpose compression like ZIP. They use lightweight schemes like bitmap encoding and run-length encoding. This enables vectorized query execution where the CPU performs operations directly on compressed arrays.",
    true: "Actually, they use specialized, lightweight compression like bitmap encoding and run-length encoding so that they can run queries and operations directly on the compressed data without full decompression.",
    unsure: "They use lightweight, columnar-specific compression schemes rather than general ZIP-like files, enabling fast processing directly on compressed data."
  },
  m5: {
    false: "Correct! While indexes speed up read queries, they slow down writes. Every time a row is inserted, updated, or deleted, the database must write to the heap file/clustered index and also update all secondary indexes.",
    true: "Watch out! Adding indexes speeds up reads but slows down writes (inserts, updates, deletes) because the database must update every index whenever data changes.",
    unsure: "Indexes are a trade-off. They speed up reads but add write overhead because all indexes must be kept up-to-date."
  }
};

const DIAGNOSTIC_TOPICS = [
  "lsm-vs-btree",
  "indexing-mechanics",
  "oltp-vs-olap",
  "columnar-storage",
  "multidimensional",
  "in-memory",
  "materialized-views"
];

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch4_learning';


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

  updateQuizProgress();

  if (!graded) {
    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', function() {
        const qIndex = parseInt(this.dataset.q);
        const oIndex = parseInt(this.dataset.o);
        
        container.querySelectorAll(`.quiz-option[data-q="${qIndex}"]`).forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        const state = loadState();
        const selections = state.quizSelections || {};
        selections[qIndex] = oIndex;
        saveState({ quizSelections: selections });

        updateQuizProgress();
      });
    });

    container.querySelectorAll('.quiz-writein-textarea').forEach(tx => {
      tx.addEventListener('input', function() {
        const qIndex = parseInt(this.dataset.q);
        const val = this.value;

        const state = loadState();
        const writeIns = state.writeInAnswers || {};
        writeIns[qIndex] = val;
        saveState({ writeInAnswers: writeIns });

        updateQuizProgress();
      });
    });
  }

  if (graded) {
    showQuizResultsPanel(loadState());
    const cachedState = loadState();
    if (cachedState.aiGrades) {
      renderAiGrades(cachedState.aiGrades);
    }
  } else {
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
  saveState({ quizGraded: true });
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
  saveState({ quizGraded: false, quizSelections: {}, writeInAnswers: {} });
  document.getElementById('quizResults').classList.add('hidden');
  renderQuiz();
});

// ── Post-Activity: Revisit ──────────────────────────

function renderRevisitPredictions() {
  const state = loadState();
  if (state.puzzleAnswers && state.puzzleAnswers.q1) {
    document.getElementById('revisit-puzzle-1').textContent = `
    Q1 choice: ${state.puzzleAnswers.q1}
    Q2 index approach: ${state.puzzleAnswers.q2}
    Q3 column updates: ${state.puzzleAnswers.q3}
    `;
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

  document.getElementById('flashcardInner').classList.remove('flipped');
  document.getElementById('fcRating').classList.add('hidden');
  document.getElementById('fcFlip').classList.remove('hidden');

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

  const state = loadState();

  if (state.diagnosticBaseline) {
    state.diagnosticBaseline.forEach((v, i) => {
      const el = document.getElementById(`conf-${i + 1}`);
      if (el) el.value = v;
    });
    document.getElementById('diagnosticSaved').classList.remove('hidden');
  }

  if (state.puzzleAnswers) {
    Object.keys(state.puzzleAnswers).forEach(key => {
      const idx = key.replace('q', '');
      const el = document.getElementById(`puzzle-a${idx}`);
      if (el) el.value = state.puzzleAnswers[key];
    });
    document.getElementById('puzzleSaved').classList.remove('hidden');
  }

  if (state.brainDump) {
    document.getElementById('brainDumpArea').value = state.brainDump;
  }

  if (state.scenarioAnswers) {
    Object.keys(state.scenarioAnswers).forEach(key => {
      const match = key.match(/s(\d)q(\d)/);
      if (match) {
        const el = document.getElementById(`sc-${match[1]}-${match[2]}`);
        if (el) el.value = state.scenarioAnswers[key];
      }
    });
  }

  setupQuizFilters();
  setupLLMGrading();
  renderQuiz();
  renderSchedule();
  renderScenarioDots();
  renderConfidenceComparison();
  renderRevisitPredictions();

  fcDeck = shuffleArray(FLASHCARDS);
  renderFlashcard();

  drawForgettingCurve();
  window.addEventListener('resize', drawForgettingCurve);
}

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
