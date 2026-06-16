/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Chapter 14 Application Logic
   ══════════════════════════════════════════════════ */

// ── Data ────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    type: "mc",
    q: "What is the primary ethical distinction between using predictive analytics for predicting weather versus predicting parole recidivism?",
    options: [
      "Weather prediction requires significantly more CPU cycles and complex simulations.",
      "Weather systems are deterministic, whereas human systems are completely random.",
      "Recidivism prediction directly gatekeeps individual human freedom and societal participation.",
      "Parole systems run on distributed databases, which are harder to audit."
    ],
    correct: 2,
    explanation: "While both use probabilistic models, predictive analytics in the social sphere (parole, credit, employment) has direct, systemic consequences on human dignity, freedom, and rights.",
    section: "Predictive Analytics"
  },
  {
    type: "mc",
    q: "What does Maciej Cegłowski mean by the phrase 'machine learning is like money laundering for bias'?",
    options: [
      "It hides illegal financial records inside huge training datasets to avoid tax audits.",
      "It processes biased historical data through opaque algorithms to output results that appear neutral and objective.",
      "It speeds up model execution by automatically deleting records containing sensitive terms.",
      "It encrypts discriminatory variables so they cannot be accessed by compliance auditors."
    ],
    correct: 1,
    explanation: "Opaque algorithms learn from historically biased human choices. By wrapping the output in a mathematical model, the resulting discrimination appears to be objective, data-driven truth.",
    section: "Bias and Discrimination"
  },
  {
    type: "write",
    q: "Explain why a predictive analytics model trained on historical data is likely to amplify discrimination, even if protected traits (like race) are explicitly omitted from the features.",
    hint: "Consider proxy variables, correlation, and how algorithms treat statistical patterns.",
    modelAnswer: "Even if protected traits like race, gender, or religion are excluded, other features in the dataset act as strong proxies. For example, in racially segregated neighborhoods, a user's postal code, IP address, or school is highly correlated with race. The algorithm detects these statistical patterns and continues to make discriminatory predictions, effectively laundering the bias and compounding historical inequalities under the guise of mathematical neutrality.",
    section: "Bias and Discrimination"
  },
  {
    type: "mc",
    q: "What is the 'algorithmic prison' as defined by Bill Davidow?",
    options: [
      "A database system that cannot be updated due to corrupted transaction logs.",
      "The systematic, automated exclusion of a person from key societal services without proof of guilt or chance of appeal.",
      "A strict security architecture where users must solve continuous CAPTCHAs.",
      "A network partition where nodes are permanently isolated from the cluster coordinator."
    ],
    correct: 1,
    explanation: "As automated decision-making spreads, individuals flagged as 'risky' face systemic exclusions (housing, travel, jobs) without a human authority or appeal mechanism, constraining their freedom.",
    section: "Predictive Analytics"
  },
  {
    type: "mc",
    q: "Which of the following is a classic example of a self-reinforcing feedback loop in predictive analytics?",
    options: [
      "An index that grows too large, causing the storage engine to crash.",
      "A job applicant being denied a job due to a poor credit score, which worsens their poverty and further lowers their credit score.",
      "A load balancer directing all requests to a single node because its latency is temporarily low.",
      "A stream processor reading from a topic and writing to the same topic in an infinite loop."
    ],
    correct: 1,
    explanation: "This downward spiral occurs when a system's output (denying employment due to a bad credit score) directly causes the input condition to worsen (poverty causing worse credit scores), reinforcing the initial prediction.",
    section: "Feedback Loops"
  },
  {
    type: "write",
    q: "Analyze how a feedback loop is created when employers use credit scores to screen potential job applicants.",
    hint: "Trace the relationship between joblessness, financial stability, and credit scores.",
    modelAnswer: "A feedback loop is created because a credit score reflects past financial difficulties. When an employer screens out an applicant due to a low credit score, they deny that person a source of income. This joblessness worsens the applicant's financial situation, causing them to miss more payments, which further lowers their credit score. This makes them even less likely to find work in the future, creating a self-reinforcing downward spiral.",
    section: "Feedback Loops"
  },
  {
    type: "mc",
    q: "What is 'systems thinking' as defined in the context of evaluating data systems?",
    options: [
      "Writing software that automatically selects the fastest database engine based on queries.",
      "Analyzing how a computerized system interacts with and responds to the people and structures around it as a whole.",
      "Ensuring that your database cluster has multiple standby replicas in case of hardware failure.",
      "Designing microservices so that each service has its own independent storage engine."
    ],
    correct: 1,
    explanation: "Systems thinking involves looking at the entire loop, including human reactions and institutional feedback, to predict the broader consequences and side effects of an automated system.",
    section: "Feedback Loops"
  },
  {
    type: "write",
    q: "Explain the purpose and effect of Daniel J. Bernstein's thought experiment where the word 'data' is replaced with 'surveillance'.",
    hint: "Consider phrases like 'data warehouse', 'data science', and how it changes one's perception of technology.",
    modelAnswer: "The purpose of the thought experiment is to strip away the neutral, benign connotations of the word 'data' and reveal the power asymmetry inherent in its collection. By substituting 'data' with 'surveillance' (e.g. converting 'data warehouse' to 'surveillance warehouse' or 'data science' to 'surveillance science'), engineers and users are forced to confront the fact that behavioral tracking is not a passive, harmless byproduct, but a form of active monitoring that serves the interests of the collector over the subject.",
    section: "Surveillance"
  },
  {
    type: "write",
    q: "Contrast the relationship between a user and a company when storing explicitly entered data versus when tracking behavioral data as a side effect.",
    hint: "Think about customer-vendor dynamics, alignment of interests, and the monetization model.",
    modelAnswer: "When a system only stores data that a user explicitly enters to perform a task, the company is performing a service for the user, who is the customer. However, when behavioral data is tracked as a side effect (e.g. clicks, viewing duration, search history), the company's interests often diverge from the user's. In ad-funded models, the advertisers are the actual customers, and user tracking serves to build detailed profiles for marketing, turning the relationship into one of surveillance.",
    section: "Privacy and Tracking"
  },
  {
    type: "mc",
    q: "Under the GDPR, which of the following is required for consent to be considered 'freely given'?",
    options: [
      "The user must scroll through the entire terms of service document before clicking accept.",
      "The user must be able to refuse or withdraw consent without detriment or loss of service quality.",
      "The consent checkbox must be pre-checked by default to save the user time.",
      "The consent request must be written in complex legal terms to ensure complete accuracy."
    ],
    correct: 1,
    explanation: "Under the GDPR, consent is not considered freely given if there is a detriment to the user for refusing it, or if it is bundled as a non-negotiable condition for using the service.",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "write",
    q: "Why is a user's choice to accept a tracking policy often considered 'not free' in practice for popular online platforms, and how do network effects play a role?",
    hint: "Think about what happens if a user decides to opt out of an essential social network.",
    modelAnswer: "A user's choice to accept a tracking policy is not truly free because popular platforms often become essential for basic social and professional participation. Due to network effects, declining to use a service because of its privacy policy carries a high social cost, such as professional isolation or missing out on community events. Therefore, for most people, especially those in less privileged positions, opting out is not a viable option, making surveillance effectively mandatory.",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "write",
    q: "Explain Shoshana Zuboff's perspective that privacy is a 'decision right' rather than just keeping things secret.",
    hint: "Focus on individual autonomy, agency, and the transfer of rights.",
    modelAnswer: "Privacy is not about hiding everything from the world; it is the freedom to choose what information to reveal, to whom, and under what conditions. It is a fundamental decision right that preserves individual autonomy and agency. When surveillance systems extract data without meaningful choice, this decision right is stripped from the individual and transferred to the collecting corporation, which then decides how to disclose or utilize that data for profit.",
    section: "Privacy and Use of Data"
  },
  {
    type: "mc",
    q: "When a data-collecting company goes bankrupt, what typically happens to the personal data of its users?",
    options: [
      "It is automatically purged from the databases by regulatory mandates.",
      "It is encrypted with a master key and locked permanently.",
      "It is sold as one of the company's financial assets to the highest bidder.",
      "It is transferred to a public trust run by the government."
    ],
    correct: 2,
    explanation: "Under bankruptcy proceedings, user data is treated as a property asset and can be sold to other corporations, potentially with different values and policies.",
    section: "Data as Assets and Power"
  },
  {
    type: "mc",
    q: "Why does Bruce Schneier compare personal data to a 'toxic asset' or 'hazardous material'?",
    options: [
      "It degrades physical storage drives faster than regular files.",
      "It cannot be easily compressed and wastes network bandwidth.",
      "Its presence creates immense security liabilities, risk of leaks, and exposure to government compulsion.",
      "It is legally classified as a biological hazard under international treaties."
    ],
    correct: 2,
    explanation: "Storing data creates liabilities. If a system is breached, data is leaked, or the company is compelled by a future hostile government to hand it over, the data itself becomes the source of harm.",
    section: "Data as Assets and Power"
  },
  {
    type: "write",
    q: "Argue why collecting and retaining personal data indefinitely presents a significant security and legal risk to a company, drawing on Schneier's 'toxic asset' concept.",
    hint: "Address breaches, changing political climates, and legal liability.",
    modelAnswer: "Collecting and retaining personal data indefinitely creates a massive surface area for security and legal liabilities. In the event of a breach, leaked data can lead to severe reputational damage, customer churn, and massive regulatory fines. Furthermore, as political environments and corporate management change, held data is vulnerable to insider theft or government subpoenas. Treating data as a toxic asset implies that companies should minimize collection and purge old records, as data that doesn't exist cannot be compromised.",
    section: "Data as Assets and Power"
  },
  {
    type: "mc",
    q: "What is the principle of 'data minimization' (Datensparsamkeit) under the GDPR?",
    options: [
      "Converting all database columns to the smallest possible integer types.",
      "Reducing the size of backup archives by deleting index metadata.",
      "Limiting data collection to what is strictly necessary and adequate for specified, explicit purposes.",
      "Allowing only a small, selected team of developers to write SQL queries."
    ],
    correct: 2,
    explanation: "Data minimization requires that personal data must be adequate, relevant, and limited to what is necessary for the explicit purposes for which they are processed.",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "mc",
    q: "How does the principle of data minimization conflict with the core philosophy of 'big data'?",
    options: [
      "Data minimization requires faster CPUs, whereas big data runs on cheap hardware.",
      "Data minimization restricts collection to specified purposes, whereas big data aims to store everything speculatively to discover unforeseen insights.",
      "Data minimization requires relational tables, whereas big data requires NoSQL document stores.",
      "Data minimization is only applicable in Europe, whereas big data is only used in Asia."
    ],
    correct: 1,
    explanation: "Big data relies on collecting and cross-referencing massive amounts of data for exploratory analysis. This directly contradicts the requirement to collect data only for a narrow, predetermined purpose.",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "write",
    q: "Explain how the 'legitimate interest' basis for lawful processing under the GDPR operates, and give an example of when it would be used instead of user consent.",
    hint: "Contrast it with user consent, and think about situations where asking permission is counterproductive.",
    modelAnswer: "The 'legitimate interest' basis allows a company to process personal data without user consent if it has a valid business reason that does not override the individual's rights and freedoms. This is typically used in scenarios like fraud prevention, network security, or credit checks. In these cases, asking for explicit consent would be counterproductive, as fraudulent actors would simply deny consent to evade detection, making the system ineffective.",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "mc",
    q: "Which of the following did economists observe when German gas stations introduced algorithmic pricing?",
    options: [
      "Competition increased, driving down gasoline prices for consumers.",
      "The algorithms learned to collude, reducing competition and raising consumer prices.",
      "The pricing databases suffered frequent deadlocks due to rapid write operations.",
      "Gas stations reverted to manual pricing due to API network latency."
    ],
    correct: 1,
    explanation: "The pricing algorithms analyzed competitor prices in real-time and learned that mutual cooperation (price matching/raising) maximized profit, leading to tacit collusion.",
    section: "Feedback Loops"
  },
  {
    type: "write",
    q: "In markets where pricing algorithms learn to collude tacitly (as observed with German gas stations), what system design constraints or market-rules could a regulator require to prevent this collusion and protect consumers?",
    hint: "Think about limiting the frequency of updates, adding randomized delays, or restricting access to real-time competitor price data feeds.",
    modelAnswer: "To mitigate tacit algorithmic collusion, regulators could impose system and market constraints such as: 1) Limiting pricing update frequency (e.g., allowing updates only once a day), which prevents algorithms from instantly punishing price cuts and destroys the feedback loop of rapid retaliation. 2) Restricting real-time competitor feeds, forcing algorithms to rely on delayed or aggregated pricing data so they cannot coordinate instantly. 3) Introducing randomized delays to pricing updates, making it harder for algorithms to predict and synchronize price adjustments.",
    section: "Feedback Loops"
  },
  {
    type: "mc",
    q: "What term does Shoshana Zuboff use to describe the economic model that exploits human experience as free raw material for translation into behavioral data?",
    options: [
      "Digital Socialism",
      "Surveillance Capitalism",
      "Data Exhaust Recycling",
      "Behavioral Futures Markets"
    ],
    correct: 1,
    explanation: "Zuboff coined 'Surveillance Capitalism' to describe how corporate entities claim private human experience as raw material for behavioral analysis and prediction. The predictions generated from this data are then traded in 'Behavioral Futures Markets.'",
    section: "Consent and Freedom of Choice"
  },
  {
    type: "write",
    q: "Explain how a movement sensor in a smartwatch can be used by an algorithm in an intrusive way, and what this implies about the granularity of sensor data.",
    hint: "Think about what motions are captured and what sensitive inputs could be reconstructed.",
    modelAnswer: "A movement sensor in a smartwatch captures high-frequency accelerometer and gyroscope data. Research has shown that deep learning algorithms can analyze these tiny hand movements to reconstruct what a user is typing on a keyboard, potentially exposing passwords, PINs, or private messages. This implies that even seemingly harmless, low-level physical sensor readings carry rich, highly sensitive behavioral details that must be treated with the same privacy safeguards as text communications.",
    section: "Surveillance"
  },
  {
    type: "mc",
    q: "According to the chapter, why is it dangerous to have a 'blind belief in the supremacy of data' for making societal decisions?",
    options: [
      "Data is statistically too small to represent major trends.",
      "It treats statistical averages as absolute truths and ignores the inevitability of errors in individual cases.",
      "Relational databases cannot maintain integrity under high concurrency.",
      "It forces organizations to hire too many data scientists."
    ],
    correct: 1,
    explanation: "While a statistical distribution might hold true on average, applying it to make decisions about individual lives inevitably results in incorrect categorizations and unfair denials.",
    section: "Responsibility and Accountability"
  },
  {
    type: "mc",
    q: "What comparison does the chapter draw to illustrate the need for tech-industry regulation and environmental challenges?",
    options: [
      "The creation of national space agencies.",
      "The rise of the printing press and copyright laws.",
      "The Industrial Revolution's air/water pollution and the eventual safety/labor regulations.",
      "The implementation of the gold standard in monetary policy."
    ],
    correct: 2,
    explanation: "Just as early industrialists ignored pollution and child labor until society demanded regulations (which raised business costs but benefited everyone), the tech industry must confront and regulate 'privacy pollution.'",
    section: "Remembering the Industrial Revolution"
  },
  {
    type: "write",
    q: "Draw parallels between the safeguards established during the Industrial Revolution (such as child labor laws and safety regulations) and the challenges of the information age.",
    hint: "Focus on business costs, the tragedy of the commons, and societal health.",
    modelAnswer: "During the Industrial Revolution, factories dumped waste into rivers and exploited labor to maximize profits, treating these harms as externalities. Only after decades of struggle did society implement regulations like workplace safety laws and environmental protections, which increased business costs but created a healthier, fairer society. Similarly, in the information age, companies extract and retain personal data as an unpriced resource, leaving users to bear the risks of surveillance and breaches. The tech industry must accept regulations—such as data minimization and deletion mandates—as necessary safeguards for the digital commons, even if they increase operational friction.",
    section: "Remembering the Industrial Revolution"
  },
  {
    type: "mc",
    q: "What is the first practical step the chapter recommends for engineers to reduce data vulnerability and prevent leakage?",
    options: [
      "Implement multi-master replication in all database clusters.",
      "Encrypt all offline backups with AES-256.",
      "Purge data as soon as it is no longer needed and minimize what is collected.",
      "Use GraphQL instead of REST APIs."
    ],
    correct: 2,
    explanation: "The most effective way to secure data is not to have it. 'Data you don't have is data that can't be leaked, stolen, or compelled by governments.'",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "mc",
    q: "According to the chapter, what is the status of professional guidelines like the ACM Code of Ethics in the software industry?",
    options: [
      "They are legally binding and strictly enforced by government agencies.",
      "They are rarely discussed, applied, or enforced in practice, leading to a cavalier attitude toward privacy.",
      "They are automatically integrated into modern compiler warnings.",
      "They have been replaced entirely by international treaties like the GDPR."
    ],
    correct: 1,
    explanation: "While guidelines like the ACM Code of Ethics exist, they are rarely enforced or integrated into daily practice, which often leads to engineers taking a cavalier attitude toward privacy and unintended consequences.",
    section: "Introduction"
  },
  {
    type: "write",
    q: "Discuss the ethical conflicts software engineers face when they focus exclusively on the technology they build while ignoring its societal consequences.",
    hint: "Reference the quote by Jez Humble and the concept of engineer responsibility.",
    modelAnswer: "Focusing exclusively on technical metrics (like scalability, latency, or throughput) while ignoring societal impacts is a dereliction of professional duty. As Jez Humble notes, if developers do not consider the social and political consequences of their work, they are not doing their job. Engineers who build mass surveillance features or biased ranking systems cannot claim moral neutrality; they are active participants in constructing systems that shape human behavior, restrict freedoms, and amplify systemic inequalities.",
    section: "Legislation and Self-Regulation"
  },
  {
    type: "mc",
    q: "Why does the GDPR's 'right to be forgotten' pose a severe technical challenge to modern event-sourced and append-only database architectures?",
    options: [
      "Append-only systems do not support read operations for specific users.",
      "Deleting a user's historical events requires rewriting or compacting immutable log files, which is operationally complex and expensive.",
      "It forces the database coordinator to switch from Paxos to Raft consensus.",
      "GDPR mandates that all logs must be stored in plain text CSV files."
    ],
    correct: 1,
    explanation: "Since event logs are architected to be immutable, editing or removing individual events (to comply with a deletion request) violates the immutability assumption and requires rewriting logs or employing cryptographic shredding.",
    section: "Law and Society"
  },
  {
    type: "write",
    q: "Describe the technical mechanisms a stream-processing or event-sourced system can use to comply with the GDPR's 'right to be forgotten' (right to erasure) without breaking the immutability of the underlying log storage.",
    hint: "Think about cryptographic erasure (key shredding) and log compaction with tombstones.",
    modelAnswer: "To comply with the right to erasure in an append-only/immutable architecture, systems typically use one of two main approaches: 1) Cryptographic Erasure (Key Shredding), where each user's data is encrypted with a unique key, and 'deletion' is achieved by destroying that key, leaving the immutable log ciphertext permanently unreadable. 2) Log Compaction with Tombstones, where a deletion marker (tombstone) is appended for the user, and subsequent log compaction sweeps discard all historical records associated with that user's ID while preserving the log integrity for others.",
    section: "Law and Society"
  },
  {
    type: "mc",
    q: "In the context of the modern information economy, how do data brokers operate?",
    options: [
      "They publish user databases openly to promote open-source data science.",
      "They operate in secrecy, purchasing, aggregating, analyzing, and reselling people's personal data, mostly for marketing purposes.",
      "They act as government-audited repositories that users can pay to secure their files.",
      "They run public validation services to check if an email address is valid."
    ],
    correct: 1,
    explanation: "Data brokers aggregate huge amounts of credit, behavioral, and public data on individuals from various sources and sell this information to marketing firms and other companies without the individuals' awareness.",
    section: "Data as Assets and Power"
  },
  {
    type: "write",
    q: "Argue both sides of the trade-off: 'A hospital sharing patient medical histories with a centralized AI research database' vs. 'Enforcing strict data minimization and local-only storage.'",
    hint: "Consider public health benefits, scientific discovery, data breach risks, and patient consent.",
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
let _state = null;

function loadState() {
  if (!_state) {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) _state = JSON.parse(raw);
    } catch (e) {}

    if (!_state) {
      try {
        if (window.parent && window.parent.__ddiaState && window.parent.__ddiaState[STATE_KEY]) {
          _state = window.parent.__ddiaState[STATE_KEY];
        }
      } catch (e) {}
    }

    if (!_state) _state = {};
  }
  // Return a snapshot, not the live object
  return JSON.parse(JSON.stringify(_state));
}

function saveState(data) {
  if (!_state) loadState();
  // Clone incoming data and merge to avoid reference aliasing
  _state = { ..._state, ...JSON.parse(JSON.stringify(data)) };

  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(_state));
  } catch (e) {}

  try {
    window.parent.__ddiaState = window.parent.__ddiaState || {};
    window.parent.__ddiaState[STATE_KEY] = _state;
  } catch (e) {}
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

function setupLLMGrading() {
  const modal = document.getElementById('llmModal');
  const gradeBtn = document.getElementById('gradeWriteIns');
  const closeBtn = document.getElementById('closeModal');
  const copyBtn = document.getElementById('copyLlmPrompt');
  const copyFeedback = document.getElementById('copyFeedback');
  const promptArea = document.getElementById('llmPromptArea');

  if (gradeBtn) {
    gradeBtn.addEventListener('click', () => {
      const state = loadState();
      const writeIns = state.writeInAnswers || {};
      
      // Collect answered write-ins
      const answeredList = QUIZ_QUESTIONS.filter((q, idx) => q.type === 'write' && writeIns[idx] && writeIns[idx].trim().length > 0);

      if (answeredList.length === 0) {
        alert('Please answer at least one write-in question before generating the LLM grading prompt!');
        return;
      }

      // Compile prompt
      let prompt = `You are grading a student's responses to Chapter 14 ("Doing the Right Thing") of Designing Data-Intensive Applications.
For each question, provide:
1. A Score from 1 to 5 (1 = Incorrect/No attempt, 3 = Partially correct/Gaps present, 5 = Excellent/Nuanced understanding).
2. Strengths: What did the student capture accurately?
3. Gaps: What crucial elements, terms, or architectural trade-offs did they miss?
4. Model Comparison: Explain why the model answer is complete and how they can bridge any gaps.

---
`;

      QUIZ_QUESTIONS.forEach((q, idx) => {
        if (q.type === 'write') {
          const studentAns = writeIns[idx] || '';
          if (studentAns.trim().length > 0) {
            prompt += `
QUESTION #${idx + 1}: ${q.q}
RUBRIC/MODEL ANSWER: ${q.modelAnswer}
STUDENT'S RESPONSE: "${studentAns}"
--------------------------------------------------
`;
          }
        }
      });

      prompt += `
After grading all questions, provide:
- Overall conceptual score (e.g., "82% - Solid Conceptual Foundation")
- Top 2 strengths across their responses
- Top 2 areas for conceptual improvement
- A custom 1-2 sentence recommendation on which specific sub-sections of Chapter 14 (e.g. Predictive Analytics, Bias and Discrimination, Feedback Loops, Privacy and Tracking, Data as Assets and Power) they should review.`;

      promptArea.value = prompt;
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Close modal on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      promptArea.select();
      navigator.clipboard.writeText(promptArea.value)
        .then(() => {
          copyFeedback.classList.remove('hidden');
          setTimeout(() => {
            copyFeedback.classList.add('hidden');
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          alert('Could not auto-copy. Please select all text and copy manually.');
        });
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
document.addEventListener('DOMContentLoaded', init);
