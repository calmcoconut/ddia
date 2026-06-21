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
