/**
 * Mock AI Curriculum Generator
 * Generates topic-specific lessons based on topic + skill level
 */

const LESSON_TEMPLATES = {
  beginner: [
    { title: 'Introduction & Fundamentals', conceptDepth: 1, explanationStyle: 'simple' },
    { title: 'Core Concepts',               conceptDepth: 1, explanationStyle: 'analogy' },
    { title: 'Basic Terminology',           conceptDepth: 1, explanationStyle: 'definition' },
    { title: 'Your First Example',          conceptDepth: 2, explanationStyle: 'hands-on' },
    { title: 'Common Patterns',             conceptDepth: 2, explanationStyle: 'examples' },
    { title: 'Practice Basics',             conceptDepth: 2, explanationStyle: 'quiz' },
    { title: 'Building Blocks',             conceptDepth: 2, explanationStyle: 'step-by-step' },
    { title: 'Review & Recap',              conceptDepth: 2, explanationStyle: 'summary' },
  ],
  intermediate: [
    { title: 'Advanced Fundamentals',      conceptDepth: 3, explanationStyle: 'technical' },
    { title: 'Deep Dive: Core Mechanics',  conceptDepth: 3, explanationStyle: 'detailed' },
    { title: 'Real-world Applications',    conceptDepth: 3, explanationStyle: 'case-study' },
    { title: 'Problem Solving Patterns',   conceptDepth: 4, explanationStyle: 'problem-solution' },
    { title: 'Best Practices',             conceptDepth: 4, explanationStyle: 'guidelines' },
    { title: 'Common Pitfalls',            conceptDepth: 4, explanationStyle: 'anti-patterns' },
    { title: 'Optimization Techniques',    conceptDepth: 4, explanationStyle: 'performance' },
    { title: 'Integration & Composition',  conceptDepth: 5, explanationStyle: 'architecture' },
  ],
  advanced: [
    { title: 'Expert Patterns',            conceptDepth: 5, explanationStyle: 'expert' },
    { title: 'System Design',              conceptDepth: 5, explanationStyle: 'architecture' },
    { title: 'Performance & Scale',        conceptDepth: 5, explanationStyle: 'optimization' },
    { title: 'Edge Cases & Robustness',    conceptDepth: 6, explanationStyle: 'defensive' },
    { title: 'Production Considerations',  conceptDepth: 6, explanationStyle: 'production' },
    { title: 'Research Frontiers',         conceptDepth: 6, explanationStyle: 'cutting-edge' },
    { title: 'Teaching Others',            conceptDepth: 6, explanationStyle: 'mentorship' },
    { title: 'Mastery Challenge',          conceptDepth: 7, explanationStyle: 'challenge' },
  ],
};

// BUG FIX: "default" key is excluded from iteration so it cannot accidentally
// match a topic whose name contains the substring "default".
const TOPIC_SEEDS = {
  programming:  { emoji: '💻', keywords: ['code', 'function', 'algorithm', 'syntax', 'debugging'] },
  javascript:   { emoji: '⚡', keywords: ['variables', 'functions', 'async', 'DOM', 'ES6'] },
  python:       { emoji: '🐍', keywords: ['syntax', 'lists', 'classes', 'libraries', 'debugging'] },
  react:        { emoji: '⚛️', keywords: ['component', 'hook', 'state', 'props', 'render'] },
  math:         { emoji: '📐', keywords: ['equation', 'proof', 'theorem', 'calculation', 'formula'] },
  science:      { emoji: '🔬', keywords: ['hypothesis', 'experiment', 'theory', 'observation', 'data'] },
  history:      { emoji: '📜', keywords: ['event', 'era', 'cause', 'impact', 'timeline'] },
  music:        { emoji: '🎵', keywords: ['note', 'rhythm', 'melody', 'harmony', 'composition'] },
  design:       { emoji: '🎨', keywords: ['layout', 'color', 'typography', 'UX', 'composition'] },
  blockchain:   { emoji: '🔗', keywords: ['ledger', 'consensus', 'decentralized', 'token', 'smart contract'] },
};

const DEFAULT_SEED = { emoji: '🧠', keywords: ['concept', 'principle', 'application', 'theory', 'practice'] };

function detectTopicSeed(topic) {
  const lower = topic.toLowerCase();
  for (const [key, seed] of Object.entries(TOPIC_SEEDS)) {
    if (lower.includes(key)) return seed;
  }
  return DEFAULT_SEED;
}

function generateLesson(topic, template, lessonIndex, totalLessons, level) {
  const seed = detectTopicSeed(topic);
  const explanations = generateExplanations(topic, template);
  const question = generateQuestion(topic, lessonIndex);

  return {
    id: `lesson-${lessonIndex + 1}`,
    index: lessonIndex,
    title: `${seed.emoji} ${template.title}`,
    topic,
    level,
    conceptDepth: template.conceptDepth,
    explanation: explanations.main,
    simpleExplanation: explanations.simple,
    alternativeExplanation: explanations.alternative,
    example: explanations.example,
    keyTakeaway: explanations.keyTakeaway,
    question,
    estimatedMinutes: level === 'beginner' ? 3 : level === 'intermediate' ? 5 : 7,
    xpReward: 10 + lessonIndex * 5,
    isLast: lessonIndex === totalLessons - 1,
  };
}

function generateExplanations(topic, template) {
  const depth = template.conceptDepth;

  const mainExplanations = {
    1: `${topic} starts with understanding its core purpose. At its heart, ${topic} is about solving a specific kind of problem in a structured, repeatable way. Think of it as a toolkit — you learn the tools, then learn when and how to use them effectively.`,
    2: `Now that you know what ${topic} is, let's look at how it actually works. The key mechanisms behind ${topic} involve several interconnected ideas that build on each other. Understanding these connections is what separates beginners from confident practitioners.`,
    3: `${topic} becomes powerful when you start applying it to real scenarios. At this stage, you should be recognizing patterns — situations where ${topic} shines and situations where it might not be the best tool. This pattern recognition is the hallmark of an intermediate learner.`,
    4: `At this level, we explore the nuances of ${topic}. You'll encounter trade-offs, edge cases, and design decisions that don't have a single "right" answer. Developing good judgment about these decisions is a key skill to build.`,
    5: `Expert-level ${topic} involves systems thinking — how your decisions affect performance, maintainability, and scalability. You're no longer just making things work; you're making them work well under real-world conditions.`,
    6: `At this advanced stage, you're engaging with ${topic} at a research or architecture level. This means questioning assumptions, understanding the history of how the field evolved, and staying current with new developments.`,
    7: `True mastery of ${topic} means you can teach it, adapt it, and innovate within it. You can explain complex ideas simply, spot subtle issues quickly, and contribute new insights to the community.`,
  };

  const simpleExplanations = {
    1: `Imagine ${topic} is like learning to cook. First, you learn what ingredients exist. Then you learn basic techniques. Then you combine them to make something delicious. This lesson is your "ingredients" phase.`,
    2: `Think of this part of ${topic} like learning to drive. At first there are many things to think about simultaneously, but with practice each step becomes automatic and you can focus on where you're going.`,
    3: `This is like going from reading recipes to actually improvising in the kitchen. You know the basics of ${topic} — now you're learning when to follow the rules and when to bend them.`,
    4: `We're now at the "master chef" level of ${topic}. You not only know the techniques, but you understand why they work, which lets you handle situations that aren't in any recipe book.`,
    5: `Think of this as going from being a great chef to running a kitchen. With ${topic} at this level, it's about systems, efficiency, and making everything work together seamlessly.`,
    6: `You're now at the level of creating new recipes — contributing to the field of ${topic} rather than just consuming it.`,
    7: `This is the full-circle moment: you understand ${topic} deeply enough to help others understand it, which deepens your own understanding further.`,
  };

  const alternativeExplanations = {
    1: `Another way to think about it: ${topic} is like learning a new language. You start with vocabulary (concepts), then grammar (rules), then conversation (application). We're building your vocabulary right now.`,
    2: `Let's try a different angle: ${topic} works like a machine with interconnected gears. When you turn one gear (apply one concept), others move too. Understanding those connections is the key insight here.`,
    3: `Here's a different perspective: ${topic} at this level is like reading a map vs. exploring terrain. You've read the map (learned concepts). Now you're navigating real terrain and encountering things the map didn't show.`,
    4: `Alternative view: Think of ${topic} decisions at this level like engineering trade-offs in architecture. Every choice has consequences — performance vs. simplicity, flexibility vs. predictability.`,
    5: `Different angle: At this level, ${topic} is like urban planning, not just architecture. You're thinking about how everything interacts at scale, not just individual buildings.`,
    6: `Research perspective: You're now asking "why does ${topic} work this way?" and "could it work differently?" — the questions that drive innovation.`,
    7: `Meta-perspective: Teaching ${topic} reveals gaps in your own knowledge. The Feynman technique — explain it simply until you truly understand it.`,
  };

  const examples = {
    1: `Basic Example: Suppose someone asks you to explain ${topic} to a 10-year-old. You would say: "${topic} is a way to solve a real problem without the usual difficulty. Instead of the old, complicated way, you can use a simpler, structured approach." That's the core of it.`,
    2: `Practical Example: Here's how ${topic} appears in the real world — imagine you have a common problem. Using ${topic}, you break it into smaller steps: first identify the pieces, then handle each one, then combine the results. Each step uses a core principle of ${topic}.`,
    3: `Applied Example: A real project using ${topic} might look like: You're building something useful. You apply ${topic} principles — first lay the foundation, then add the features, then test for edge cases. The result is cleaner, more maintainable, and easier to extend.`,
    4: `Advanced Example: Consider this nuanced scenario — there are two approaches using ${topic}: Approach A (faster to implement but less flexible) vs. Approach B (more setup but scales better). Choosing wisely depends on your specific constraints and future requirements.`,
    5: `System-level Example: At scale, ${topic} decisions ripple through your entire system. A change in strategy can affect performance, reliability, and developer experience simultaneously. The expert balances all three.`,
    6: `Research Example: Current thinking in ${topic} is evolving. Understanding where the field came from — and where it's heading — positions you to adopt new developments before they become mainstream.`,
    7: `Teaching Example: When explaining ${topic} to a colleague, you might say: "The core insight is this one idea. Most people get confused here. The key is to remember this memorable principle." That's expert communication in action.`,
  };

  const keyTakeaways = {
    1: `${topic} = core concepts + consistent application`,
    2: `Understanding why matters as much as knowing how`,
    3: `Pattern recognition accelerates ${topic} mastery`,
    4: `Good judgment comes from understanding trade-offs`,
    5: `Systems thinking separates good from great practitioners`,
    6: `Stay curious — the field of ${topic} keeps evolving`,
    7: `Teaching is the highest form of understanding`,
  };

  return {
    main:        mainExplanations[depth]        || mainExplanations[1],
    simple:      simpleExplanations[depth]      || simpleExplanations[1],
    alternative: alternativeExplanations[depth] || alternativeExplanations[1],
    example:     examples[depth]                || examples[1],
    keyTakeaway: keyTakeaways[depth]            || keyTakeaways[1],
  };
}

function generateQuestion(topic, lessonIndex) {
  const questionSets = [
    {
      text: `What is the PRIMARY purpose of learning ${topic}?`,
      options: [
        { id: 'a', text: `To understand its core concepts and apply them practically`, correct: true },
        { id: 'b', text: `To memorize every detail without understanding`, correct: false },
        { id: 'c', text: `To avoid using ${topic} altogether`, correct: false },
        { id: 'd', text: `To only read about ${topic} without practicing`, correct: false },
      ],
      explanation: `The goal of learning ${topic} is to understand its principles deeply enough to apply them effectively in real situations.`,
    },
    {
      text: `When you're a beginner in ${topic}, what should you focus on FIRST?`,
      options: [
        { id: 'a', text: `Advanced edge cases and optimizations`, correct: false },
        { id: 'b', text: `Core vocabulary and fundamental concepts`, correct: true },
        { id: 'c', text: `Memorizing every possible detail`, correct: false },
        { id: 'd', text: `Building complex projects immediately`, correct: false },
      ],
      explanation: `Beginners should build a strong foundation in core concepts before tackling advanced topics.`,
    },
    {
      text: `Which learning strategy is MOST effective for mastering ${topic}?`,
      options: [
        { id: 'a', text: `Only reading about it without practice`, correct: false },
        { id: 'b', text: `Passive consumption of tutorials`, correct: false },
        { id: 'c', text: `Active application + reflection on mistakes`, correct: true },
        { id: 'd', text: `Skipping to the most advanced content`, correct: false },
      ],
      explanation: `Active practice combined with reflecting on your mistakes is the most effective learning strategy.`,
    },
    {
      text: `How does understanding ${topic} patterns help you?`,
      options: [
        { id: 'a', text: `It doesn't — just memorize everything`, correct: false },
        { id: 'b', text: `It makes you faster at recognizing and solving new problems`, correct: true },
        { id: 'c', text: `Patterns only work in simple cases`, correct: false },
        { id: 'd', text: `Patterns always apply to every situation without exception`, correct: false },
      ],
      explanation: `Pattern recognition lets you quickly map new problems to solutions you already understand, dramatically speeding up your problem-solving.`,
    },
    {
      text: `At an intermediate level in ${topic}, what distinguishes you from a beginner?`,
      options: [
        { id: 'a', text: `You never make mistakes`, correct: false },
        { id: 'b', text: `You know all possible applications`, correct: false },
        { id: 'c', text: `You can recognize patterns and understand trade-offs`, correct: true },
        { id: 'd', text: `You only work on easy problems`, correct: false },
      ],
      explanation: `Intermediate learners can recognize patterns and reason about trade-offs, not just follow instructions.`,
    },
    {
      text: `What is a key sign of MASTERY in ${topic}?`,
      options: [
        { id: 'a', text: `You can explain it clearly to someone else`, correct: true },
        { id: 'b', text: `You memorized the most advanced concepts`, correct: false },
        { id: 'c', text: `You never need to look anything up`, correct: false },
        { id: 'd', text: `You only work on it alone`, correct: false },
      ],
      explanation: `The Feynman Technique confirms: if you can explain a concept simply and clearly to others, you truly understand it.`,
    },
    {
      text: `Why is daily consistent practice important when learning ${topic}?`,
      options: [
        { id: 'a', text: `It's not — you can learn everything in one session`, correct: false },
        { id: 'b', text: `Spaced repetition builds stronger long-term memory`, correct: true },
        { id: 'c', text: `Practice is only needed for physical skills`, correct: false },
        { id: 'd', text: `Daily practice makes learning more stressful`, correct: false },
      ],
      explanation: `Spaced repetition — revisiting concepts regularly over time — is proven to dramatically improve long-term retention.`,
    },
    {
      text: `When you get an answer WRONG in ${topic}, what's the best response?`,
      options: [
        { id: 'a', text: `Give up and move on to an easier topic`, correct: false },
        { id: 'b', text: `Treat it as a learning signal and revisit the concept`, correct: true },
        { id: 'c', text: `Skip to the next lesson immediately`, correct: false },
        { id: 'd', text: `Mistakes mean you're not suited for ${topic}`, correct: false },
      ],
      explanation: `Mistakes are your most valuable learning signal. Each wrong answer tells you exactly where to focus next.`,
    },
  ];

  return questionSets[lessonIndex % questionSets.length];
}

function generateCurriculum(topic, level, dailyMinutes) {
  const templates = LESSON_TEMPLATES[level] || LESSON_TEMPLATES.beginner;
  const totalLessons = templates.length;

  const lessons = templates.map((template, index) =>
    generateLesson(topic, template, index, totalLessons, level)
  );

  const seed = detectTopicSeed(topic);

  return {
    topic,
    level,
    dailyMinutes,
    emoji: seed.emoji,
    totalLessons,
    estimatedDays: Math.ceil(
      lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0) / dailyMinutes
    ),
    lessons,
  };
}

module.exports = { generateCurriculum };
