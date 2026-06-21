/* ══════════════════════════════════════════════════
   DDIA Chapter 5 Learning Activities — Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the primary drawback of using language-specific serialization formats like Java's java.io.Serializable or Python's pickle for long-term data storage?",
    options: [
      "They suffer from extremely high execution latencies and consume more memory than text formats like JSON",
      "They lock you into a single programming language and introduce severe security vulnerabilities",
      "They cannot serialize complex nested data structures like arbitrary tree structures or nested hash maps",
      "They fail to compile at runtime or generate valid type definitions in statically typed target languages"
    ],
    correct: 1,
    explanation: "Language-specific formats are tied to their host language, making multi-language integration very difficult. More importantly, they frequently suffer from security flaws where decoding untrusted data allows arbitrary code execution (RCE).",
    section: "Formats for Encoding Data - Language-Specific Formats"
  },
  {
    type: "mc",
    q: "Why did Twitter (now X) have to return post IDs twice (once as a number and once as a string) in their JSON API responses?",
    options: [
      "To maintain backward compatibility with older XML parsers that require explicit schema definitions for parsing values",
      "Because JSON does not distinguish integers from floats and JavaScript cannot exactly represent integers greater than 2^53",
      "To optimize the parser throughput of JSON serializers running on memory-constrained mobile device architectures",
      "To enable database engines to index the unique identifier as a full-text search field instead of a B-tree key"
    ],
    correct: 1,
    explanation: "JavaScript uses IEEE 754 double-precision floats, which cannot accurately represent 64-bit integers greater than 2^53. To prevent truncation and rounding errors, Twitter sent the ID as a decimal string alongside the raw number. In modern API design, it is widely recommended to treat all large unique identifiers (like Snowflake IDs or database primary keys) as opaque strings rather than integers across all clients, ensuring compatibility regardless of language or JSON parser implementation.",
    section: "Formats for Encoding Data - JSON, XML, and Binary Variants"
  },
  {
    type: "write",
    q: "Your API versioning discussion gets heated. An engineer suggests using JSON Schema with 'additionalProperties: false' (a closed content model) to enforce strict payloads. Explain why this approach is a forward-compatibility killer during rolling deployments.",
    hint: "Consider what happens when a new service version sends a field that an older service version has not yet defined.",
    modelAnswer: "An open content model (default in JSON Schema) allows fields not explicitly defined in the schema to exist in the JSON payload, whereas a closed content model (setting additionalProperties to false) rejects any undocumented fields. In terms of evolvability, an open model is much more flexible because new fields can be added by writers and safely ignored by old readers (maintaining forward compatibility). A closed model (specifically using additionalProperties: false) breaks this compatibility and is a forward-compatibility killer during rolling deploys, as older services will reject payloads containing any new fields.",
    section: "Formats for Encoding Data - JSON Schema"
  },
  {
    type: "mc",
    q: "How does Protocol Buffers achieve a much smaller binary payload than binary JSON formats like MessagePack?",
    options: [
      "By utilizing adaptive Huffman coding algorithms to compress all textual metadata fields",
      "By omitting field names entirely and identifying fields using compact numeric tag numbers",
      "By encoding all variable-length strings as compressed hexadecimal representation values",
      "By enforcing that all floating-point numbers must be stored as raw 8-bit integer values"
    ],
    correct: 1,
    explanation: "In MessagePack, the field names (like 'userName') are repeated in every record. Protocol Buffers omits these strings, replacing them with a 1-byte header containing the field tag (number) and wire type.",
    section: "Protocol Buffers"
  },
  {
    type: "mc",
    q: "If a Protocol Buffers field is removed from a schema, what rule must you follow regarding its tag number to prevent future corruption?",
    options: [
      "The removed tag number must be reassigned immediately to new fields to maintain schema size",
      "You must never reuse that tag number again, and it should be marked as reserved in the schema",
      "The tag number must be converted to a negative integer to indicate its deletion in binary logs",
      "You must run a complete database migration to shift all subsequent field tag numbers down by one"
    ],
    correct: 1,
    explanation: "If you reuse a tag number that was previously removed, old records stored in databases or archives containing that tag will be decoded incorrectly by new code, assuming it is the new field type and meaning.",
    section: "Protocol Buffers - Field tags and schema evolution"
  },
  {
    type: "write",
    q: "A developer changes a Protocol Buffers field name from 'userId' to 'accountNumber', and also changes its tag number from 2 to 5. Explain why one of these changes is perfectly safe while the other will cause deserialization failures on client devices.",
    hint: "Think about what is actually written into the serialized binary payload vs what is generated in code.",
    modelAnswer: "In Protocol Buffers, the serialized binary payload does not contain field names; it only contains field tag numbers to identify fields. Therefore, changing a field's name in the proto schema is purely an API change for the generated classes and does not affect the serialized bytes (it is fully compatible). However, changing a tag number changes the identifier written to the wire. If a reader expects tag 2 and the writer sends tag 5 for the same data, the reader will ignore tag 5 and look for a default value for tag 2, resulting in data loss.",
    section: "Protocol Buffers - Field tags and schema evolution"
  },
  {
    type: "mc",
    q: "What is a key architectural difference between Apache Avro and Protocol Buffers regarding the binary payload?",
    options: [
      "Avro payloads include explicit field tag headers, whereas Protocol Buffers omits tags entirely",
      "Avro payloads contain only concatenated byte values without embedding any field names or tag numbers",
      "Avro stores schemas natively as XML definitions, while Protocol Buffers relies exclusively on JSON",
      "Avro requires all serializable record attributes to be encoded as fixed-length binary values"
    ],
    correct: 1,
    explanation: "Avro payloads contain no tags or markers to identify fields. It is simply a continuous sequence of byte values, requiring the exact writer's schema to reconstruct the data structure.",
    section: "Avro"
  },
  {
    type: "mc",
    q: "How does an Avro reader decode a binary record if the reader's schema differs from the writer's schema?",
    options: [
      "It throws an immediate runtime parsing exception and halts deserialization because of strict schema mismatch rules",
      "It dynamically compares the writer's schema and reader's schema to resolve differences by matching field names",
      "It queries a centralized schema registry to translate the binary payload into intermediate JSON representation structures",
      "It falls back to a deterministic brute-force guess of field boundaries by inspecting type flags in the payload"
    ],
    correct: 1,
    explanation: "Avro handles schema evolution by comparing the schema used to write the data (writer's schema) with the one the current code expects (reader's schema). It matches fields by name, ignoring removed fields and filling in defaults for added fields. In practice (such as in Kafka data pipelines), this is often facilitated by a central Schema Registry where the reader retrieves the writer's schema using a version ID embedded in the binary message.",
    section: "Avro - The writer’s schema and the reader’s schema"
  },
  {
    type: "write",
    q: "Your data ingestion pipeline needs to dynamically export database tables whose schemas change frequently (columns added or removed). Explain why Apache Avro is much better suited for dynamically generated schemas than Protocol Buffers.",
    hint: "Think about how Avro maps columns to field names without needing numeric field tags, and why Protobuf requires tag coordination.",
    modelAnswer: "Since Avro maps database columns directly to field names without requiring numeric field tags, it can easily generate a schema dynamically from a relational database schema. If a column is added or removed, a new Avro schema can be created on-the-fly, and readers can resolve it against their schemas by matching field names. In Protocol Buffers, assigning field tags requires coordination to ensure tag numbers are never reused or shifted. Automating tag assignment during dynamic database schema changes is highly complex and error-prone.",
    section: "Avro - Dynamically generated schemas"
  },
  {
    type: "mc",
    q: "What does the phrase 'data outlives code' refer to in database architectures?",
    options: [
      "Database storage systems must be over-provisioned because raw business data occupies significantly more physical bytes than source code files",
      "Application code is updated frequently, but historical data in the database remains in its original format unless explicitly rewritten",
      "Data is persisted on high-end solid-state drives, which have a much longer physical and operational lifespan than standard application servers",
      "Core query execution engines and storage drivers are implemented in low-level languages whose internal structures rarely undergo modification"
    ],
    correct: 1,
    explanation: "While application code can be updated to a new version in minutes, data written years ago under older schemas will sit in the database in its original representation unless a costly rewrite migration is performed.",
    section: "Dataflow Through Databases - Different values written at different times"
  },
  {
    type: "mc",
    q: "Why are Avro object container files a good fit for database backups and archival storage?",
    options: [
      "They compress all archived record blocks using highly efficient, standard LZW or gzip algorithms before writing them to disk",
      "They write the writer's schema once at the beginning of the file, allowing millions of records to be decoded efficiently",
      "They freeze schema definitions permanently at the time of creation, guaranteeing that historical data records cannot be corrupted",
      "They automatically translate binary database table dumps into human-readable, ANSI-compliant SQL migration scripts on export"
    ],
    correct: 1,
    explanation: "Since all records in a large archival file are written with the same schema, Avro object container files store the writer's schema once in the file header, keeping individual records extremely small and self-describing.",
    section: "Dataflow Through Databases - Archival storage"
  },
  {
    type: "write",
    q: "During a rolling deployment of a shopping cart service, your old servers start throwing NullPointerExceptions and crashing. Explain why forward compatibility is just as vital as backward compatibility when deploying updates incrementally.",
    hint: "Think about what happens when an older node reads a record containing new fields written by a newly deployed node.",
    modelAnswer: "During a rolling deployment, some nodes run the new version of the code while others still run the old version. If a new node writes a record containing a new schema field to a shared database, an old node may subsequently read that record. If the old code lacks forward compatibility, it might crash, fail to decode the record, or discard the new field when writing updates back to the database. Hence, forward compatibility ensures the system remains stable during gradual transitions.",
    section: "Dataflow Through Databases"
  },
  {
    type: "mc",
    q: "What is a key distinction between a database query interface and a service API in a microservices architecture?",
    options: [
      "Service APIs restrict clients to executing state-modifying write operations and do not allow any read-only query requests to be processed",
      "Service APIs encapsulate business logic and expose a restricted set of endpoints, whereas databases allow arbitrary query expressions",
      "Database query interfaces must block on thread-locked synchronous connections, while microservice endpoints are strictly asynchronous",
      "Service API schemas must be defined using strict XML formats, whereas databases communicate using binary protocols or raw SQL text"
    ],
    correct: 1,
    explanation: "A service API provides encapsulation, restricting what clients can do through predetermined business routes. Databases, by contrast, allow flexible query models which makes exposing them directly to external clients architecturally risky.",
    section: "Dataflow Through Services: REST and RPC"
  },
  {
    type: "mc",
    q: "Which of the following is a fundamental reason why the Remote Procedure Call (RPC) model of location transparency is flawed?",
    options: [
      "RPC protocols require compiling and binding the client code using native C++ environments and cannot support other languages",
      "A network call is unpredictable, subject to latency spikes, timeouts, and partial failures, unlike a local function call",
      "Local in-memory function calls incur significant overhead and are consistently slower than optimized network socket requests",
      "RPC frameworks do not support passing complex parameters or serialized arguments, restricting calls to parameterless routines"
    ],
    correct: 1,
    explanation: "Local function calls are predictable and memory-local. Network calls can fail silently (leaving it unknown if the request succeeded), suffer from congestion, or time out, which breaks the illusion of location transparency.",
    section: "Dataflow Through Services - The problems with remote procedure calls"
  },
  {
    type: "write",
    q: "Your team is debating whether to expose a new system-to-system integration using gRPC (RPC) or HTTP/JSON (REST). Contrast how these two designs model network interactions and state.",
    hint: "Compare HTTP verbs and uniform resources against calling remote functions directly while attempting to hide the network.",
    modelAnswer: "REST models network interactions as state transfers over resources identified by URLs, using standard, uniform HTTP verbs (GET, POST, PUT, DELETE) and exploiting built-in protocol features like caching, authentication, and content negotiation. RPC attempts to hide the network entirely, making remote service interactions look like local function calls (e.g. calculateBilling(user)). This makes RPC brittle because it tries to treat remote operations as if they were local, failing to naturally accommodate network-specific states, retries, and variable latencies.",
    section: "Dataflow Through Services - The problems with remote procedure calls"
  },
  {
    type: "mc",
    q: "What is the purpose of durable execution frameworks like Temporal or Restate?",
    options: [
      "To speed up and parallelize database index rebuild operations across multi-node relational cluster setups",
      "To guarantee exactly-once semantics for workflows by logging state changes and replaying execution on failure",
      "To automatically encrypt and replicate static database backup snapshots across secure cloud storage buckets",
      "To replace external layer-7 load balancers with decentralized, in-memory route translation tables on nodes"
    ],
    correct: 1,
    explanation: "Durable execution frameworks log RPCs and state modifications to a write-ahead log. If a worker crashes mid-workflow, the framework can rebuild state and resume, guaranteeing the workflow runs to completion exactly-once.",
    section: "Durable Execution and Workflows"
  },
  {
    type: "mc",
    q: "In a durable execution framework, what happens if you perform a rolling upgrade and reorder the activities inside a workflow's code?",
    options: [
      "The orchestrator automatically parses the new source file and rewrites the historical execution log on-the-fly",
      "The framework might throw an error or execute incorrect activities because replay relies on deterministic ordering",
      "The runtime optimizer compiles the workflows into vectorized CPU instructions, increasing performance execution speed",
      "The execution environment ignores the modified code paths entirely and falls back to cached, pre-compiled binaries"
    ],
    correct: 1,
    explanation: "Because durable execution replays the code to check against the event log, changing the order of activities will cause the replay to mismatch the logged history. This breaks determinism and triggers workflow execution errors.",
    section: "Durable Execution and Workflows"
  },
  {
    type: "write",
    q: "While writing a Temporal workflow to handle payment processing, you are warned: 'Never call Math.random() or new Date() directly inside the workflow function.' Explain the mechanics of durable execution that make nondeterministic calls forbidden.",
    hint: "Consider how the framework recovers state during a crash replay and matches execution history.",
    modelAnswer: "Durable execution frameworks recover state after a crash by replaying the workflow code from the beginning and checking it against the logged history of inputs and outputs. If the workflow code contains nondeterministic operations (like generating a random UUID or fetching the system clock), it will produce a different value during replay than what was logged. This causes a mismatch with the logged history, violating the execution contract and breaking workflow consistency. Such operations must instead be executed inside Activities, which log their outputs once and return the cached result on replay. Crucially, executing side-effects within activities ensures idempotency; for example, an activity that charges a credit card will only execute its external side-effects once, returning the cached result during replay instead of re-running the transaction.",
    section: "Durable Execution and Workflows"
  },
  {
    type: "mc",
    q: "What is a primary architectural advantage of using an asynchronous message broker (like Apache Kafka) over direct synchronous RPC?",
    options: [
      "It avoids the serialization step by transmitting raw application memory references directly over network sockets",
      "It acts as a buffer to handle consumer overload, improves system reliability, and decouples the sender from the consumer",
      "It compresses all event packets using zero-copy transfers, effectively reducing the active network bandwidth to zero",
      "It guarantees that all write operations to multiple database systems are wrapped in distributed commit transactions"
    ],
    correct: 1,
    explanation: "Message brokers act as temporary stores that buffer requests when consumers are offline or slow, decouple sender/receiver addresses, and can retry failed message deliveries automatically.",
    section: "Event-Driven Architectures"
  },
  {
    type: "mc",
    q: "How does the actor model handle concurrency inside a single process?",
    options: [
      "By placing distributed locking mechanisms on database tables to block concurrent execution threads dynamically",
      "By encapsulating logic in independent actors that share no state and communicate exclusively via asynchronous messages",
      "By assigning a dedicated physical CPU core to run each individual actor function sequentially inside the runtime",
      "By converting all local function calls into blocking, synchronous REST API calls routed through a service proxy"
    ],
    correct: 1,
    explanation: "The actor model avoids race conditions and deadlocks by ensuring actors do not share state. Each actor processes messages sequentially from its mailbox, making concurrency safe within each actor's scope.",
    section: "Event-Driven Architectures - Distributed actor frameworks"
  },
  {
    type: "write",
    q: "You are designing an asynchronous system with multiple microservices. Contrast the behavior of a point-to-point queue with a publish-subscribe topic when multiple consumers are listening.",
    hint: "Think about whether messages are load-balanced to a single receiver or broadcast to all active subscribers.",
    modelAnswer: "In the queue (point-to-point) pattern, each message is delivered to exactly one consumer. If there are multiple consumers listening to the queue, the broker load-balances the messages among them (each message is processed once). In the topic (publish-subscribe) pattern, each message is broadcast to all active subscribers. If there are multiple subscribers to a topic, every subscriber receives their own copy of the message, allowing different services to perform different tasks in response to the same event.",
    section: "Event-Driven Architectures - Message brokers"
  },
  {
    type: "mc",
    q: "Which text-based data format does not natively support nested structures and requires the application to manually define row and column meanings?",
    options: [
      "JSON",
      "CSV",
      "XML",
      "YAML"
    ],
    correct: 1,
    explanation: "CSV is a flat, tabular format. It has no native support for nested arrays or objects, and lack of schema means the application code must parse columns and row offsets manually.",
    section: "Formats for Encoding Data - JSON, XML, and Binary Variants"
  },
  {
    type: "write",
    q: "Your security team flags a vulnerability report showing that your app uses Python's 'pickle.loads()' or Java's 'ObjectInputStream' to read untrusted data from user cookies. Detail the security risks of these language-specific deserialization libraries.",
    hint: "Think about gadget chains, arbitrary class instantiation, and Remote Code Execution (RCE).",
    modelAnswer: "Language-specific deserialization libraries rebuild objects by instantiating arbitrary classes specified in the byte stream. If an attacker can inject a malicious byte stream into the application, they can force the deserializer to instantiate arbitrary classes (known as gadget chains) present in the classpath. These classes can perform unintended side effects upon instantiation or destruction, often leading to Remote Code Execution (RCE) or arbitrary file reads, compromising the entire host system.",
    section: "Formats for Encoding Data - Language-Specific Formats"
  },
  {
    type: "mc",
    q: "In RESTful APIs, how is versioning typically managed when backwards compatibility cannot be maintained?",
    options: [
      "By dropping the database schema and purging historical records from the storage system entirely",
      "By putting a version number in the URL path (e.g. /v2/) or utilizing the HTTP Accept header",
      "By altering the TCP port number on which the web server listens for incoming network requests",
      "By requiring all end-users to reinstall their local web browsers to load the new interface"
    ],
    correct: 1,
    explanation: "When backward-incompatible changes are required, RESTful services frequently run multiple versions side-by-side, routing clients based on the URL path (like /api/v2) or request headers.",
    section: "Dataflow Through Services - Data encoding and evolution for RPC"
  },
  {
    type: "write",
    q: "A network architect asks: 'Why did we implement a service mesh like Istio instead of using standard DNS-based load balancing for our internal microservices?' Explain how sidecar proxies and registries coordinate compared to DNS records.",
    hint: "Consider DNS caching problems, client-side load balancing, failovers, and mutual TLS (mTLS).",
    modelAnswer: "A service mesh uses sidecar proxies (like Envoy) running alongside client and server processes to intercept network traffic. These proxies query a centralized, highly dynamic registry to discover available server endpoints and metadata. This allows for client-side load balancing, immediate failovers, and secure TLS encryption transparent to the app code. Additionally, service meshes handle mutual TLS (mTLS) certificate rotation and service-to-service encryption out of the application's hands. In contrast, DNS-based load balancing maps a hostname to multiple IPs, which is cached by clients. If a server crashes or changes frequently, clients will attempt to connect to stale cached IPs, making DNS too slow for highly dynamic microservices.",
    section: "Dataflow Through Services - Load balancers, service discovery, and service meshes"
  },
  {
    type: "mc",
    q: "Which of the following is a variable-length integer encoding technique used by Protocol Buffers to compress small numbers?",
    options: [
      "Base64 schema-less text encoding (converting binary values into standard printable ASCII characters)",
      "Varints (using the most significant bit in each byte to indicate that more continuation bytes follow)",
      "Huffman prefix tree compression (generating variable-length bit keys derived from character frequencies)",
      "Floating-point exponent truncation (discarding lower-order decimal precision bits from numeric values)"
    ],
    correct: 1,
    explanation: "Protocol Buffers uses varints, where each byte contains 7 bits of the number and 1 bit (the MSB) as a flag. If the MSB is set, it means another byte follows, allowing small numbers to fit into a single byte.",
    section: "Protocol Buffers"
  },
  {
    type: "write",
    q: "Your Kafka consumer crashes with a schema resolution error when reading an Avro topic. Explain why Avro requires the exact writer's schema to decode data, whereas Protocol Buffers can decode payloads without it.",
    hint: "Think about what metadata (or lack thereof) is present in the binary payload of each format.",
    modelAnswer: "Avro does not write any metadata, field tag numbers, or datatype indicators into the serialized binary payload; it only writes the raw value bytes concatenated together. Without the writer's schema, a reader cannot know where one field ends and another begins, nor what datatype a sequence of bytes represents. Protocol Buffers, on the other hand, tags each field with its tag number and wire type in the binary payload, allowing a reader to skip unrecognized fields using only the tag wire-type information.",
    section: "Avro - The writer’s schema and the reader’s schema"
  },
  {
    type: "mc",
    q: "In the context of Avro schema evolution, if a field is added to the schema, what is the prerequisite to ensure backward compatibility?",
    options: [
      "The new field must be assigned a unique numeric tag number in the schema",
      "The new field must have a default value explicitly declared in the schema",
      "The new field name must start with a capital letter for the parser to map it",
      "The new field must be placed at the very beginning of the serialized record"
    ],
    correct: 1,
    explanation: "If a new field is added, backward compatibility requires that new readers can read old data (which lacks this field). Avro accomplishes this by filling in the declared default value. If no default is defined, the reader fails to parse old data.",
    section: "Avro - Schema evolution rules"
  },
  {
    type: "write",
    q: "Sir Tony Hoare famously called null references his 'billion-dollar mistake.' Explain how Apache Avro prevents unexpected null pointer exceptions through its schema definitions and union types.",
    hint: "Explain how to define a field that can either be a string or null, and why it isn't nullable by default.",
    modelAnswer: "Avro does not make fields nullable by default to prevent silent null-pointer exceptions. Instead, if a field can be empty or null, the developer must explicitly define it using a union type (e.g., union { null, string }). The default value must also match the first branch of the union. This forces the schema designer to explicitly declare which fields are nullable and how they should be default-initialized, preventing common bugs related to unexpected null references.",
    section: "Avro - Schema evolution rules"
  },
  {
    type: "write",
    q: "You are the lead architect presiding over a 'trade-off tribunal' comparing JSON vs. Protocol Buffers/Avro for internal service communications. Present arguments for both sides.",
    hint: "Address readability/debugging/tooling vs. network bandwidth/CPU serialization costs and schema management.",
    modelAnswer: "Using a textual format like JSON is highly advantageous because it is human-readable, making debugging network payloads and ad-hoc testing with tools like curl extremely easy. It is also standard, supported by every programming language, and requires no schema definition files or code generation steps. However, JSON is verbose, consumes more network bandwidth, and requires expensive CPU cycles for string parsing and serialization. Conversely, binary formats like Protocol Buffers are highly optimized, extremely compact, and provide static type safety through code generation. Yet, they make debugging harder because payloads are not human-readable without decoding tools, and they require managing schema repositories, which increases operational overhead, especially across organizational boundaries.",
    section: "The Merits of Schemas / Summary"
  }
];

const FLASHCARDS = [
  { front: "What is **backward compatibility**?", back: "The guarantee that newer code can read data that was written by older code." },
  { front: "What is **forward compatibility**?", back: "The guarantee that older code can read data that was written by newer code (ignoring new elements it doesn't understand)." },
  { front: "What is **schema-on-read** vs. **schema-on-write**?", back: "Schema-on-read means data is stored raw and structured only when read (e.g., Document DBs, Data Lakes). Schema-on-write enforces a schema during insertion (e.g., Relational DBs, Data Warehouses)." },
  { front: "Why are language-specific serializations (like Java's Serializable or Python's pickle) generally bad for long-term storage?", back: "They tie you to a single language, introduce severe security vulnerabilities (remote code execution), and often neglect forward/backward compatibility." },
  { front: "Why are JSON and XML numbers problematic?", back: "They don't distinguish integers from floats and lack precision constraints, meaning integers larger than 2^53 can be parsed inaccurately by JavaScript." },
  { front: "How does **Protocol Buffers** identify fields in binary form?", back: "It uses numeric **field tags** (declared in the schema) instead of string field names, saving significant space." },
  { front: "Why does **Apache Avro** not need field tags or field names in its binary payload?", back: "Because it requires the exact writer's schema to decode, allowing it to parse values in the exact order they were written." },
  { front: "What are the two schemas used in Avro decoding?", back: "The **writer's schema** (used to encode the data originally) and the **reader's schema** (the version the reading code expects). Avro resolves differences between them dynamically." },
  { front: "What does 'data outlives code' mean?", back: "Application code is updated frequently, but data in a database can remain in its historical encoding format for years without being migrated." },
  { front: "What is **location transparency** in RPC, and why is it flawed?", back: "The attempt to make remote network calls look like local function calls. It is flawed because networks introduce variable latency, timeouts, and partial failures that local calls don't have." },
  { front: "What is the primary difference between a message broker and direct RPC?", back: "A message broker acts as an asynchronous intermediary that buffers messages, handles retries, and decouples senders from receivers, whereas RPC is synchronous and direct." },
  { front: "What is **durable execution**?", back: "A programming model (e.g., Temporal) that guarantees a workflow runs to completion exactly-once by logging all side effects and replaying code deterministically upon failure." },
  { front: "Why must workflow code in durable execution frameworks be **deterministic**?", back: "Because the framework reconstructs state after a crash by replaying the workflow code from the log; any nondeterminism would lead to a different execution path." }
];

const CONFIDENCE_LABELS = [
  "Protocol Buffers vs Avro",
  "Backward & Forward Compatibility",
  "RPC vs REST APIs",
  "Database Dataflow & Migrations",
  "Durable Execution & Workflows",
  "Asynchronous Message-Passing"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Complete all pre-activity exercises", type: "due" },
  { day: "Today", task: "Read Chapter 5", type: "due" },
  { day: "Today", task: "Complete post-activity retrieval", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 13 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Re-attempt Protobuf vs. Avro comparison from memory", type: "upcoming" },
  { day: "+1 Week", task: "Interleaved scenario challenge", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake", type: "upcoming" },
  { day: "+1 Month", task: "Teach concepts to someone (Feynman technique)", type: "upcoming" }
];

const MISCONCEPTION_EXPLANATIONS = {
  m1: {
    false: "Correct. In Avro, for instance, adding a field without a default value breaks backward compatibility because new code reading old data won't know what value to fill in for the missing field. It also breaks forward compatibility if old code reads new data and expects it to be present or doesn't know how to handle its absence.",
    true: "No, if a field lacks a default value, a new reader cannot decode older data because the field is missing (breaking backward compatibility), and an old reader cannot decode newer data if it expects a default value (breaking forward compatibility).",
    unsure: "Consider how a parser handles a missing field when trying to construct an object."
  },
  m2: {
    true: "Correct. Protocol Buffers encodes fields using tag numbers (e.g. 1, 2), not field names. The field name is only used in the generated code, so you can rename the field in the .proto file without affecting the binary payload.",
    false: "Actually, it is True. Protobuf payloads contain field tags (numbers) and datatypes, not field names. So renaming the field in the schema does not break binary compatibility.",
    unsure: "Think about what is actually written to the wire in a Protocol Buffers payload: does it write user_name or a number?"
  },
  m3: {
    false: "Correct. RPC tries to make network calls look like local function calls, but network calls can time out, fail partially, retry and cause duplicate side effects (idempotence issues), and have highly variable latency.",
    true: "No, network calls are fundamentally different due to network latency, partial failures, packet loss, timeouts, and data serialization. Location transparency is a leaky abstraction.",
    unsure: "Consider what happens when a network switch fails during a call versus when a local function executes."
  },
  m4: {
    false: "Correct. Avro does not store the schema with every individual record. In large files, it writes the schema once at the beginning. In databases or message streams, it prepends a short schema version ID that the reader looks up in a registry.",
    true: "No, storing the schema with every record would be highly inefficient and negate the space savings of a binary format. Instead, Avro uses mechanisms like file headers (object container files) or schema version IDs linked to a schema registry.",
    unsure: "How does Avro achieve its compact size (e.g. 32 bytes for a small record) compared to other formats?"
  },
  m5: {
    false: "Correct. Temporal workflows must be completely deterministic because they are replayed from a event history log. Nondeterministic operations must be wrapped in activities or run via framework-provided utility functions.",
    true: "No, durable execution relies on replaying the workflow code deterministically to reconstruct state. Nondeterministic calls like system time or random number generators will produce different results during replay, breaking the workflow's consistency.",
    unsure: "How does a durable execution framework recover a crashed workflow without re-running successfully completed side effects?"
  }
};

const DIAGNOSTIC_TOPICS = [
  "protobuf-avro",
  "forward-backward",
  "rpc-vs-rest",
  "database-dataflow",
  "durable-execution",
  "message-brokers"
];

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch5_learning';


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
  console.log("[Quiz] renderQuiz() initiated");
  try {
    const container = document.getElementById('quizContainer');
    container.innerHTML = '';
    
    const state = loadState();
    console.log("[Quiz] Loaded state inside renderQuiz:", state);
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
    console.log("[Quiz] renderQuiz() successfully finished rendering");
  } catch (err) {
    console.error("[Quiz] CRITICAL EXCEPTION during renderQuiz():", err);
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
