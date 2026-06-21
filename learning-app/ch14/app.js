/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Chapter 14 Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the primary ethical distinction between using predictive analytics for predicting weather versus predicting parole recidivism?",
    options: [
      "Weather prediction requires significantly more CPU cycles and complex physics simulations.",
      "Weather systems operate deterministically, whereas human decisions are completely random.",
      "Recidivism prediction directly gatekeeps individual human freedom and societal participation.",
      "Parole systems are run on distributed database clusters, making transaction audits harder."
    ],
    correct: 2,
    explanation: "While both use probabilistic models, predictive analytics in the social sphere (parole, credit, employment) has direct, systemic consequences on human dignity, freedom, and rights.",
    section: "Predictive Analytics"
  },
  {
    type: "mc",
    q: "What does Maciej Cegłowski mean by the phrase 'machine learning is like money laundering for bias'?",
    options: [
      "It conceals fraudulent transaction and financial records inside massive training sets to evade regulatory tax audits.",
      "It processes biased historical data through opaque algorithms to output results that appear neutral and objective.",
      "It accelerates algorithm execution by automatically identifying and deleting input data records with protected attributes.",
      "It dynamically encrypts discriminatory variables in database tables so compliance audit processes cannot access them."
    ],
    correct: 1,
    explanation: "Opaque algorithms learn from historically biased human choices. By wrapping the output in a mathematical model, the resulting discrimination appears to be objective, data-driven truth.",
    section: "Bias and Discrimination"
  },
  {
    type: "write",
    q: "A credit card company removes 'race' and 'gender' fields from their applicant dataset before training a model to assess creditworthiness. However, during a compliance audit, the system is still found to discriminate against minority neighborhoods. Explain how the model managed to learn and amplify this bias, and how proxy variables play a role.",
    hint: "Consider how geographical or social markers correlate with protected traits, allowing the model to reconstruct and reinforce historical discrimination under a veneer of mathematical neutrality.",
    modelAnswer: "Even if protected traits like race, gender, or religion are excluded, other features in the dataset act as strong proxies. For example, in racially segregated neighborhoods, a user's postal code, IP address, or school is highly correlated with race. The algorithm detects these statistical patterns and continues to make discriminatory predictions, effectively laundering the bias and compounding historical inequalities under the guise of mathematical neutrality.",
    section: "Bias and Discrimination"
  },
  {
    type: "mc",
    q: "What is the 'algorithmic prison' as defined by Bill Davidow?",
    options: [
      "A database transaction deadlock state that completely prevents tables from being updated due to corrupted log segments.",
      "The systematic, automated exclusion of a person from key societal services without proof of guilt or chance of appeal.",
      "A security architecture where clients are locked into solving complex cryptographic puzzles to maintain access control.",
      "A permanent partition state where worker nodes are isolated and blocked from communicating with the cluster coordinator."
    ],
    correct: 1,
    explanation: "As automated decision-making spreads, individuals flagged as 'risky' face systemic exclusions (housing, travel, jobs) without a human authority or appeal mechanism, constraining their freedom.",
    section: "Predictive Analytics"
  },
  {
    type: "mc",
    q: "Which of the following is a classic example of a self-reinforcing feedback loop in predictive analytics?",
    options: [
      "A database index that expands past memory limits, triggering garbage collection cycles that cause the storage node to crash.",
      "A job applicant being denied a job due to a poor credit score, which worsens their poverty and further lowers their credit score.",
      "A routing load balancer directing all incoming web traffic to a single node because its response latency is temporarily low.",
      "A real-time stream processor consuming events from an input topic and publishing them back to the same topic in a loop."
    ],
    correct: 1,
    explanation: "This downward spiral occurs when a system's output (denying employment due to a bad credit score) directly causes the input condition to worsen (poverty causing worse credit scores), reinforcing the initial prediction.",
    section: "Feedback Loops"
  },
  {
    type: "write",
    q: "An automated HR screening system automatically rejects job applicants with credit scores below 600. During a systems-thinking workshop, you are asked to diagram the feedback loop this introduces between economic hardship, employment opportunities, and credit metrics. Describe how this loop functions.",
    hint: "Trace the relationship and downward spiral where a low credit score denies a user job opportunities, which prevents them from earning income to pay down debt, further damaging their credit score.",
    modelAnswer: "A feedback loop is created because a credit score reflects past financial difficulties. When an employer screens out an applicant due to a low credit score, they deny that person a source of income. This joblessness worsens the applicant's financial situation, causing them to miss more payments, which further lowers their credit score. This makes them even less likely to find work in the future, creating a self-reinforcing downward spiral.",
    section: "Feedback Loops"
  },
  {
    type: "mc",
    q: "What is 'systems thinking' as defined in the context of evaluating data systems?",
    options: [
      "Writing optimizer software that dynamically selects and compiles query execution plans for database engines.",
      "Analyzing how a computerized system interacts with and responds to the people and structures around it as a whole.",
      "Ensuring that a database cluster replicates data to multiple hot standby instances to prevent hardware failures.",
      "Designing decoupled microservices such that every domain model retains exclusive ownership of its own data store."
    ],
    correct: 1,
    explanation: "Systems thinking involves looking at the entire loop, including human reactions and institutional feedback, to predict the broader consequences and side effects of an automated system.",
    section: "Feedback Loops"
  },
  {
    type: "write",
    q: "An engineer during a lunch-and-learn session proposes that we adopt Daniel J. Bernstein's vocabulary experiment: substituting the word 'data' with 'surveillance' in all our system design documents. Explain what this substitution reveals about the power dynamics between companies collecting information and the users generating it.",
    hint: "Contrast benign-sounding terms like 'data collection' and 'data warehouse' with 'surveillance collection' and 'surveillance warehouse,' noting how it shifts the perception of consent.",
    modelAnswer: "The purpose of the thought experiment is to strip away the neutral, benign connotations of the word 'data' and reveal the power asymmetry inherent in its collection. By substituting 'data' with 'surveillance' (e.g. converting 'data warehouse' to 'surveillance warehouse' or 'data science' to 'surveillance science'), engineers and users are forced to confront the fact that behavioral tracking is not a passive, harmless byproduct, but a form of active monitoring that serves the interests of the collector over the subject.",
    section: "Surveillance"
  },
  {
    type: "write",
    q: "Your marketing department wants to start tracking user click timing, scroll depths, and hover durations to build user profiles for targeted advertising. As a privacy advocate on the team, explain how the alignment of interests between the company and the user changes when transitioning from explicitly entered data (like shipping addresses) to behavioral tracking.",
    hint: "Contrast serving the user as a paying customer with treating the user as a source of behavioral raw material to serve advertisers.",
    modelAnswer: "When a system only stores data that a user explicitly enters to perform a task, the company is performing a service for the user, who is the customer. However, when behavioral data is tracked as a side effect (e.g. clicks, viewing duration, search history), the company's interests often diverge from the user's. In ad-funded models, the advertisers are the actual customers, and user tracking serves to build detailed profiles for marketing, turning the relationship into one of surveillance.",
    section: "Privacy and Tracking"
  },
  {
    type: "mc",
    q: "Under the GDPR, which of the following is required for consent to be considered 'freely given'?",
    options: [
      "The user must actively scroll through the entire terms of service document before the accept button is active.",
      "The user must be able to refuse or withdraw consent at any time without detriment or loss of core service quality.",
      "The consent confirmation checkbox must be configured as checked by default to minimize user interaction time.",
      "The consent description request must be formulated using precise legal jargon to guarantee compliance audits."
    ],
    correct: 1,
    explanation: "Under the GDPR, consent is not considered freely given if there is a detriment to the user for refusing it, or if it is bundled as a non-negotiable condition for using the service.",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "write",
    q: "A social media platform argues that because users clicked 'I Agree' on a 50-page privacy policy, they have freely consented to extensive tracking. How do you argue that this choice is not truly free in the modern digital economy, and what role do network effects play?",
    hint: "Think about the professional or social isolation costs a user faces if they decide to opt out of major digital public squares.",
    modelAnswer: "A user's choice to accept a tracking policy is not truly free because popular platforms often become essential for basic social and professional participation. Due to network effects, declining to use a service because of its privacy policy carries a high social cost, such as professional isolation or missing out on community events. Therefore, for most people, especially those in less privileged positions, opting out is not a viable option, making surveillance effectively mandatory.",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "write",
    q: "During a debate on privacy tools, a developer argues that 'if users have nothing to hide, they shouldn't care about our database collecting their background location.' How does Shoshana Zuboff's concept of privacy as a 'decision right' counter this argument, and how does it relate to individual autonomy?",
    hint: "Focus on the right to choose what is shared and who controls that choice, rather than the mere secrecy of the information itself.",
    modelAnswer: "Privacy is not about hiding everything from the world; it is the freedom to choose what information to reveal, to whom, and under what conditions. It is a fundamental decision right that preserves individual autonomy and agency. When surveillance systems extract data without meaningful choice, this decision right is stripped from the individual and transferred to the collecting corporation, which then decides how to disclose or utilize that data for profit.",
    section: "Privacy and Use of Data"
  },
  {
    type: "mc",
    q: "When a data-collecting company goes bankrupt, what typically happens to the personal data of its users?",
    options: [
      "It is automatically deleted and purged from all storage media by regulatory mandates.",
      "It is cryptographically locked with a master key and archived indefinitely on server tapes.",
      "It is sold as one of the company's financial property assets to the highest bidding buyer.",
      "It is transferred to and managed by a neutral public trust run directly by government agencies."
    ],
    correct: 2,
    explanation: "Under bankruptcy proceedings, user data is treated as a property asset and can be sold to other corporations, potentially with different values and policies.",
    section: "Data as Assets and Power"
  },
  {
    type: "mc",
    q: "Why does Bruce Schneier compare personal data to a 'toxic asset' or 'hazardous material'?",
    options: [
      "It degrades physical silicon state and hard drive sectors significantly faster than non-personal binary files.",
      "It contains high entropy structures that cannot be compressed, wasting network bandwidth during replication.",
      "Its presence creates immense security liabilities, risk of leaks, and exposure to government compulsion.",
      "It is legally classified as a biological or physical hazard under international environmental safety treaties."
    ],
    correct: 2,
    explanation: "Storing data creates liabilities. If a system is breached, data is leaked, or the company is compelled by a future hostile government to hand it over, the data itself becomes the source of harm.",
    section: "Data as Assets and Power"
  },
  {
    type: "write",
    q: "Your database administrator suggests storing all user raw clickstream logs indefinitely in an unencrypted S3 bucket because storage is extremely cheap. Drawing on Bruce Schneier's concept of data as a 'toxic asset,' explain the security, reputational, and legal risks of this retention policy.",
    hint: "Address how holding massive amounts of sensitive personal data increases breach impact, liability, and susceptibility to hostile government subpoenas.",
    modelAnswer: "Collecting and retaining personal data indefinitely creates a massive surface area for security and legal liabilities. In the event of a breach, leaked data can lead to severe reputational damage, customer churn, and massive regulatory fines. Furthermore, as political environments and corporate management change, held data is vulnerable to insider theft or government subpoenas. Treating data as a toxic asset implies that companies should minimize collection and purge old records, as data that doesn't exist cannot be compromised.",
    section: "Data as Assets and Power"
  },
  {
    type: "mc",
    q: "What is the principle of 'data minimization' (Datensparsamkeit) under the GDPR?",
    options: [
      "Converting all schema columns in database tables to the smallest possible integer or character types.",
      "Reducing the overall storage size of backup archives by regularly purging index and schema metadata.",
      "Limiting data collection to what is strictly necessary and adequate for specified, explicit purposes.",
      "Restricting data access permissions to a small, certified team of engineers executing SQL commands."
    ],
    correct: 2,
    explanation: "Data minimization requires that personal data must be adequate, relevant, and limited to what is necessary for the explicit purposes for which they are processed.",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "mc",
    q: "How does the principle of data minimization conflict with the core philosophy of 'big data'?",
    options: [
      "Data minimization requires high-performance CPU architectures to run validation algorithms, whereas big data runs on cheap commodity hardware arrays.",
      "Data minimization restricts collection to specified purposes, whereas big data aims to store everything speculatively to discover unforeseen insights.",
      "Data minimization is structurally constrained to relational schemas, whereas big data processing is optimized for unstructured NoSQL document databases.",
      "Data minimization is exclusively applicable to corporate entities inside Europe, whereas big data infrastructure is only deployed across Asian markets."
    ],
    correct: 1,
    explanation: "Big data relies on collecting and cross-referencing massive amounts of data for exploratory analysis. This directly contradicts the requirement to collect data only for a narrow, predetermined purpose.",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "write",
    q: "You are designing an automated fraud detection system that flags accounts performing rapid credit card checkouts. A developer suggests asking every user for explicit consent before running the fraud scan. Explain why you should use the GDPR's 'legitimate interest' basis instead of user consent for this system.",
    hint: "Consider how requesting consent from a malicious actor is counterproductive to security and how the legal basis balances business utility against user rights.",
    modelAnswer: "The 'legitimate interest' basis allows a company to process personal data without user consent if it has a valid business reason that does not override the individual's rights and freedoms. This is typically used in scenarios like fraud prevention, network security, or credit checks. In these cases, asking for explicit consent would be counterproductive, as fraudulent actors would simply deny consent to evade detection, making the system ineffective.",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "mc",
    q: "Which of the following did economists observe when German gas stations introduced algorithmic pricing?",
    options: [
      "Pricing competition aggressively increased, driving down gasoline retail costs for consumers.",
      "The pricing algorithms learned to tacitly collude, reducing competition and raising consumer prices.",
      "The retail pricing database engines suffered deadlock errors due to high concurrent write volumes.",
      "Operators reverted to manual pricing workflows due to competitor API response network latency."
    ],
    correct: 1,
    explanation: "The pricing algorithms analyzed competitor prices in real-time and learned that mutual cooperation (price matching/raising) maximized profit, leading to tacit collusion.",
    section: "Feedback Loops"
  },
  {
    type: "write",
    q: "A regulator notices that the automated pricing algorithms of competing retail stores have tacitly learned to keep prices artificially high without any direct developer communication. What system design constraints or API modifications could you propose to disrupt this algorithmic collusion?",
    hint: "Think about limiting the frequency of updates, adding randomized pricing delays, or restricting access to real-time competitor price data feeds.",
    modelAnswer: "To mitigate tacit algorithmic collusion, regulators could impose system and market constraints such as: 1) Limiting pricing update frequency (e.g., allowing updates only once a day), which prevents algorithms from instantly punishing price cuts and destroys the feedback loop of rapid retaliation. 2) Restricting real-time competitor feeds, forcing algorithms to rely on delayed or aggregated pricing data so they cannot coordinate instantly. 3) Introducing randomized delays to pricing updates, making it harder for algorithms to predict and synchronize price adjustments.",
    section: "Feedback Loops"
  },
  {
    type: "mc",
    q: "What term does Shoshana Zuboff use to describe the economic model that exploits human experience as free raw material for translation into behavioral data?",
    options: [
      "Digital Socialism, which advocates for collective public ownership of storage platforms",
      "Surveillance Capitalism, which extracts and processes human experience for behavioral data",
      "Data Exhaust Recycling, which cleans and aggregates unused logs for system optimizations",
      "Behavioral Futures Markets, where companies trade predictive models of consumer purchases"
    ],
    correct: 1,
    explanation: "Zuboff coined 'Surveillance Capitalism' to describe how corporate entities claim private human experience as raw material for behavioral analysis and prediction. The predictions generated from this data are then traded in 'Behavioral Futures Markets.'",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "write",
    q: "A fitness app requests permission to upload raw, high-frequency smartwatch accelerometer and gyroscope data to the cloud. You are asked to perform a privacy impact assessment. Explain how an algorithm can abuse this low-level sensor stream, and what this tells us about the safety of 'raw sensor data.'",
    hint: "Discuss how machine learning can reconstruct sensitive user inputs like keystrokes, passwords, or PINs just from hand movements, showing that raw sensor data is highly descriptive.",
    modelAnswer: "A movement sensor in a smartwatch captures high-frequency accelerometer and gyroscope data. Research has shown that deep learning algorithms can analyze these tiny hand movements to reconstruct what a user is typing on a keyboard, potentially exposing passwords, PINs, or private messages. This implies that even seemingly harmless, low-level physical sensor readings carry rich, highly sensitive behavioral details that must be treated with the same privacy safeguards as text communications.",
    section: "Surveillance"
  },
  {
    type: "mc",
    q: "According to the chapter, why is it dangerous to have a 'blind belief in the supremacy of data' for making societal decisions?",
    options: [
      "Historical training data is statistically too small to represent or generalize major sociological trends.",
      "It treats statistical averages as absolute truths and ignores the inevitability of errors in individual cases.",
      "Standard relational database systems cannot guarantee or maintain data integrity under high write concurrency.",
      "It forces public and private organizations to allocate excessive budgets to recruit certified data scientists."
    ],
    correct: 1,
    explanation: "While a statistical distribution might hold true on average, applying it to make decisions about individual lives inevitably results in incorrect categorizations and unfair denials.",
    section: "Responsibility and Accountability"
  },
  {
    type: "mc",
    q: "What comparison does the chapter draw to illustrate the need for tech-industry regulation and environmental challenges?",
    options: [
      "The creation of international space agencies to coordinate orbits and prevent debris collisions.",
      "The historical rise of the printing press and the subsequent development of copyright laws.",
      "The Industrial Revolution's air/water pollution and the eventual safety/labor regulations.",
      "The adoption and eventual collapse of the gold standard in international monetary policy."
    ],
    correct: 2,
    explanation: "Just as early industrialists ignored pollution and child labor until society demanded regulations (which raised business costs but benefited everyone), the tech industry must confront and regulate 'privacy pollution.'",
    section: "Remembering the Industrial Revolution"
  },
  {
    type: "write",
    q: "A tech lobbyist argues that privacy regulations will harm software innovation and increase operational overhead. Drawing parallels to the history of the Industrial Revolution, explain why regulations (like GDPR) are necessary safeguards for society despite raising business costs.",
    hint: "Discuss the tragedy of the commons, negative externalities like pollution or data breaches, and how safety laws eventually benefit the digital public.",
    modelAnswer: "During the Industrial Revolution, factories dumped waste into rivers and exploited labor to maximize profits, treating these harms as externalities. Only after decades of struggle did society implement regulations like workplace safety laws and environmental protections, which increased business costs but created a healthier, fairer society. Similarly, in the information age, companies extract and retain personal data as an unpriced resource, leaving users to bear the risks of surveillance and breaches. The tech industry must accept regulations—such as data minimization and deletion mandates—as necessary safeguards for the digital commons, even if they increase operational friction.",
    section: "Remembering the Industrial Revolution"
  },
  {
    type: "mc",
    q: "What is the first practical step the chapter recommends for engineers to reduce data vulnerability and prevent leakage?",
    options: [
      "Implement active multi-master replication setups across all database nodes.",
      "Encrypt all historical offline database backups using AES-256 cipher keys.",
      "Purge data as soon as it is no longer needed and minimize what is collected.",
      "Deploy GraphQL query boundaries instead of standard RESTful API endpoints."
    ],
    correct: 2,
    explanation: "The most effective way to secure data is not to have it. 'Data you don't have is data that can't be leaked, stolen, or compelled by governments.'",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "mc",
    q: "According to the chapter, what is the status of professional guidelines like the ACM Code of Ethics in the software industry?",
    options: [
      "They are legally binding regulations that are strictly audited and enforced by government tech agencies.",
      "They are rarely discussed, applied, or enforced in practice, leading to a cavalier attitude toward privacy.",
      "They are automatically parsed and integrated into modern compiler libraries as static code analysis warnings.",
      "They have been completely replaced and superseded by international data protection treaties like the GDPR."
    ],
    correct: 1,
    explanation: "While guidelines like the ACM Code of Ethics exist, they are rarely enforced or integrated into daily practice, which often leads to engineers taking a cavalier attitude toward privacy and unintended consequences.",
    section: "Introduction"
  },
  {
    type: "write",
    q: "A developer claims that their only job is to optimize the throughput of an algorithm that recommends content, even if that algorithm happens to promote extremist propaganda to maximize watch time. Citing Jez Humble's perspective, discuss the ethical responsibility of engineers regarding the societal outcomes of their code.",
    hint: "Address whether engineers can claim moral neutrality when building systems that directly influence human behavior and shape social outcomes.",
    modelAnswer: "Focusing exclusively on technical metrics (like scalability, latency, or throughput) while ignoring societal impacts is a dereliction of professional duty. As Jez Humble notes, if developers do not consider the social and political consequences of their work, they are not doing their job. Engineers who build mass surveillance features or biased ranking systems cannot claim moral neutrality; they are active participants in constructing systems that shape human behavior, restrict freedoms, and amplify systemic inequalities.",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "mc",
    q: "Why does the GDPR's 'right to be forgotten' pose a severe technical challenge to modern event-sourced and append-only database architectures?",
    options: [
      "Append-only database systems are designed in such a way that they cannot support read queries for individual user IDs.",
      "Deleting a user's events requires rewriting or compacting immutable log files, which is operationally complex and costly.",
      "It requires the distributed cluster coordinator to transition its voting mechanisms from Paxos to Raft consensus protocols.",
      "The regulation mandates that all system logs must be stored in plain text CSV format instead of binary files on disks."
    ],
    correct: 1,
    explanation: "Since event logs are architected to be immutable, editing or removing individual events (to comply with a deletion request) violates the immutability assumption and requires rewriting logs or employing cryptographic shredding.",
    section: "Law and Society"
  },
  {
    type: "write",
    q: "A customer submits a GDPR deletion request, but your system is built on an append-only event store. Your DBA says it is impossible to delete their history because the log is immutable. Explain two technical methods you can use to comply with the law without rewriting the physical files on disk.",
    hint: "Detail how cryptographic erasure (key shredding) or log compaction with deletion tombstones can render the data unreadable or eventually clean it up.",
    modelAnswer: "To comply with the right to erasure in an append-only/immutable architecture, systems typically use one of two main approaches: 1) Cryptographic Erasure (Key Shredding), where each user's data is encrypted with a unique key, and 'deletion' is achieved by destroying that key, leaving the immutable log ciphertext permanently unreadable. 2) Log Compaction with Tombstones, where a deletion marker (tombstone) is appended for the user, and subsequent log compaction sweeps discard all historical records associated with that user's ID while preserving the log integrity for others.",
    section: "Law and Society"
  },
  {
    type: "mc",
    q: "In the context of the modern information economy, how do data brokers operate?",
    options: [
      "They publish user datasets openly on public registries to promote collaborative open-source data science research.",
      "They operate in secrecy, aggregating, analyzing, and reselling personal data, primarily for marketing target profiles.",
      "They function as government-audited security repositories where individual users pay to lock and secure their private files.",
      "They host public validation endpoints that enable clients to check if specific phone numbers or email addresses are active."
    ],
    correct: 1,
    explanation: "Data brokers aggregate huge amounts of credit, behavioral, and public data on individuals from various sources and sell this information to marketing firms and other companies without the individuals' awareness.",
    section: "Data as Assets and Power"
  },
  {
    type: "write",
    q: "You are the chief privacy officer at a research hospital. You must draft an ethical evaluation on a proposal to upload all patient health histories to a centralized cloud AI database to train diagnostic models. Present the core trade-offs between public health innovation and strict data minimization/local-only storage.",
    hint: "Balance the potential for discovering new medical treatments against the risks of massive data breaches, lack of patient control, and surveillance creep.",
    modelAnswer: "On one side, aggregating medical histories in a centralized database enables researchers to run large-scale AI models to detect rare diseases, discover treatments, and improve public health outcomes. On the other side, centralizing such highly sensitive data creates an enormous security risk; a single breach could expose patients to identity theft, insurance discrimination, and blackmail. Furthermore, strict local-only storage and data minimization preserve patient autonomy, prevent surveillance creep, and maintain trust in healthcare systems, though it limits the speed and scope of medical innovation.",
    section: "Legislation and Self-Regulation"
  }
];

const FLASHCARDS = [
  { front: "What is an 'algorithmic prison'?", back: "The systematic and arbitrary exclusion of individuals from jobs, travel, finance, and services by automated systems without recourse or appeal." },
  { front: "How does Maciej Cegłowski describe machine learning regarding bias?", back: "'Machine learning is like money laundering for bias' — it makes biased historical data appear objective and fair." },
  { front: "What is a self-reinforcing feedback loop in predictive analytics?", back: "A scenario where an algorithm's decision reinforces the negative state of a user, causing future data inputs to confirm the negative prediction." },
  { front: "What is 'systems thinking'?", back: "An approach to system design that analyzes the entire loop, including the computerized parts, human interactions, and societal effects." },
  { front: "What is Daniel J. Bernstein's tracking thought experiment?", back: "Mentally replacing the word 'data' with 'surveillance' (e.g. 'surveillance warehouse') to expose the power asymmetry of data collection." },
  { front: "How does Shoshana Zuboff define the right to privacy?", back: "Privacy is a 'decision right' — the freedom to choose what to reveal, to whom, and when, preserving individual autonomy." },
  { front: "What does the GDPR require for consent to be legally valid?", back: "Consent must be freely given, specific, informed, unambiguous, and able to be refused or withdrawn without detriment." },
  { front: "Why is opting out of tracking not a free choice for major platforms?", back: "Due to network effects, opting out carries high social and professional costs, making participation effectively mandatory." },
  { front: "What does Bruce Schneier mean by calling data a 'toxic asset'?", back: "Storing personal data is a liability because it attracts breaches, is vulnerable to theft, and can be compelled by hostile governments." },
  { front: "What is the GDPR principle of 'data minimization'?", back: "The legal requirement that personal data must be limited to what is necessary for specified, explicit, and legitimate purposes." },
  { front: "How do data warehouses and data lakes conflict with data minimization?", back: "They encourage collecting and retaining as much data as possible for speculative, unforeseen future analysis." },
  { front: "Why are professional codes (like the ACM Code) weak in practice?", back: "They are rarely discussed, applied, or enforced, leading to a cavalier attitude toward privacy and consequences." },
  { front: "What is the 'tragedy of the commons' in the context of data privacy?", back: "The erosion of individual privacy rights under mass surveillance, where individual concessions destroy the collective right to privacy." }
];

const CONFIDENCE_LABELS = [
  "Bias & discrimination in ML models",
  "Algorithmic accountability & recourse",
  "Feedback loops & economic spirals",
  "Corporate surveillance & tracking",
  "Limits of consent & GDPR bases",
  "Privacy as a decision right",
  "Data as a toxic asset"
];

const SCHEDULE_ITEMS = [
  { day: "Today", task: "Read Chapter 14", type: "due" },
  { day: "Today", task: "Complete all pre-activity and post-activity retrieval tasks", type: "due" },
  { day: "+1 Day", task: "Flashcard review (all 13 cards)", type: "upcoming" },
  { day: "+3 Days", task: "Review algorithmic bias and feedback loop models", type: "upcoming" },
  { day: "+1 Week", task: "Re-solve the Interleaved Scenario Challenges", type: "upcoming" },
  { day: "+2 Weeks", task: "Full retrieval quiz retake (32 questions)", type: "upcoming" },
  { day: "+1 Month", task: "Teach 'Privacy as a Decision Right' and 'Toxic Assets' to an engineering colleague", type: "upcoming" }
];

const MISCONCEPTIONS = [
  {
    key: "m1",
    statement: "Automating decisions with machine learning eliminates human prejudice and guarantees objective fairness.",
    correct: "false",
    explanation: {
      true: "Incorrect. Machine learning models train on historical data, which often carries systematic biases. The algorithm codifies and amplifies these prejudices rather than eliminating them.",
      false: "Correct! Algorithmic models learn patterns from past human actions. If the past was discriminatory, the system codifies and amplifies that bias under a veneer of mathematical rigor.",
      unsure: "Consider the training data: if the input carries bias, can the output be truly impartial?"
    }
  },
  {
    key: "m2",
    statement: "Under the GDPR, user consent is the only lawful basis for processing personal data on the internet.",
    correct: "false",
    explanation: {
      true: "Incorrect. While consent is common, the GDPR provides several other lawful bases, including compliance with legal obligations, protecting vital interests, and 'legitimate interest' (e.g. for fraud prevention).",
      false: "Correct! The GDPR outlines multiple lawful bases for processing personal data, including 'legitimate interest' (e.g., for security or fraud prevention) and legal obligations, not just consent.",
      unsure: "Think about fraud prevention: would a fraudster consent to being tracked?"
    }
  },
  {
    key: "m3",
    statement: "Privacy is dead because people voluntarily share intimate details of their lives on social media anyway.",
    correct: "false",
    explanation: {
      true: "Incorrect. Sharing details publicly is a choice. Privacy is not keeping everything secret; it is the freedom to choose what to reveal, to whom, and when (a decision right).",
      false: "Correct! Privacy is a 'decision right' (as Shoshana Zuboff describes it)—the autonomy to decide what to make public and what to keep secret. Voluntarily sharing some info does not mean giving up this right.",
      unsure: "Is there a difference between voluntarily sharing a photo and being tracked surreptitiously across the web?"
    }
  },
  {
    key: "m4",
    statement: "Storing as much user behavioral data as possible is a standard, low-risk engineering practice that only adds small storage fees.",
    correct: "false",
    explanation: {
      true: "Incorrect. Storing data is a massive liability. Bruce Schneier describes data as a 'toxic asset' because it is vulnerable to breaches, theft, and government compulsion.",
      false: "Correct! Storing personal data is a liability ('toxic asset' or 'hazardous material'). The legal, security, and reputational risks of data leaks far outweigh simple storage costs.",
      unsure: "Think about what happens when a database is breached or subpoenaed."
    }
  },
  {
    key: "m5",
    statement: "Tacit algorithmic collusion (like gas stations raising prices) requires explicit programming or communication between the servers.",
    correct: "false",
    explanation: {
      true: "Incorrect. Economists found that pricing algorithms can learn to collude (raise prices for consumers) purely by reacting to market changes and competitor pricing in real-time, without explicit agreement.",
      false: "Correct! Algorithms can learn to collude and reduce competition purely by reacting dynamically to competitor price adjustments in real-time, with no explicit message exchange.",
      unsure: "Can machine learning models learn cooperative strategies without direct communication?"
    }
  }
];

// ── State Management ────────────────────────────────

const STATE_KEY = 'ddia_ch14_learning';
