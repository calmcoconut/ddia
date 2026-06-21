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

function renderMisconceptions() {
  const listEl = document.getElementById('misconceptionList');
  if (!listEl) return;
  listEl.innerHTML = '';

  MISCONCEPTIONS.forEach(m => {
    const div = document.createElement('div');
    div.className = 'misconception-item';
    div.setAttribute('data-correct', m.correct);
    div.setAttribute('data-id', m.key);
    div.innerHTML = `
      <p class="misconception-text">"${m.statement}"</p>
      <div class="misconception-btns">
        <button class="mc-btn" data-value="true">True</button>
        <button class="mc-btn" data-value="false">False</button>
        <button class="mc-btn" data-value="unsure">Not Sure</button>
      </div>
      <div class="misconception-feedback hidden"></div>
    `;
    listEl.appendChild(div);
  });

  // Re-attach event listeners
  listEl.querySelectorAll('.misconception-item').forEach(item => {
    const btns = item.querySelectorAll('.mc-btn');
    const feedbackEl = item.querySelector('.misconception-feedback');
    const correct = item.dataset.correct;
    const id = item.dataset.id;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const value = btn.dataset.value;
        const mObj = MISCONCEPTIONS.find(m => m.key === id);
        const explanationText = mObj.explanation[value];
        feedbackEl.textContent = explanationText;
        feedbackEl.className = 'misconception-feedback';
        if (value === correct || value === 'unsure') {
          feedbackEl.classList.add(value === correct ? 'correct' : 'noted');
        } else {
          feedbackEl.classList.add('noted');
        }
        feedbackEl.classList.remove('hidden');

        // Check if all misconceptions have been answered
        checkMisconceptionsComplete();
      });
    });
  });
}

function checkMisconceptionsComplete() {
  const items = document.querySelectorAll('.misconception-item');
  let answeredCount = 0;
  items.forEach(item => {
    if (item.querySelector('.mc-btn.selected')) answeredCount++;
  });

  if (answeredCount === items.length) {
    const summaryEl = document.getElementById('misconceptionSummary');
    if (summaryEl) {
      // Calculate how many were correct (excluding unsure)
      let correctCount = 0;
      items.forEach(item => {
        const selected = item.querySelector('.mc-btn.selected');
        if (selected && selected.dataset.value === item.dataset.correct) {
          correctCount++;
        }
      });
      document.getElementById('misconceptionResult').innerHTML = `You correctly identified <strong>${correctCount} out of ${items.length}</strong> common misconceptions.`;
      summaryEl.classList.remove('hidden');
    }
  }
}

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
      Cards rated \"Didn't know\" or \"Hard\" should be reviewed again tomorrow.
      Cards rated \"Easy\" can be pushed to next week.
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
  renderMisconceptions();

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

// Wire up Anki export button
document.getElementById('exportAnkiBtn')?.addEventListener('click', () => {
  if (typeof exportToAnki === 'function') {
    exportToAnki(FLASHCARDS, document.title);
  }
});
