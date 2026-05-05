/** Diagnostic question bank for each domain. */

import type { DiagnosticQuestion } from '@/types';

type QuestionBank = Record<string, DiagnosticQuestion[]>;

export const DIAGNOSTIC_BANK: QuestionBank = {
  biology: [
    { id: 'bio-1', question: 'What organelle is known as the "powerhouse of the cell"?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'], correctIndex: 1, difficulty: 1 },
    { id: 'bio-2', question: 'What molecule carries genetic information in most organisms?', options: ['RNA', 'Protein', 'DNA', 'Lipids'], correctIndex: 2, difficulty: 1 },
    { id: 'bio-3', question: 'What process do plants use to convert sunlight into chemical energy?', options: ['Respiration', 'Fermentation', 'Photosynthesis', 'Osmosis'], correctIndex: 2, difficulty: 1 },
    { id: 'bio-4', question: 'Which phase of mitosis involves chromosomes aligning at the cell equator?', options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], correctIndex: 1, difficulty: 2 },
    { id: 'bio-5', question: 'What enzyme unwinds DNA during replication?', options: ['DNA Polymerase', 'Ligase', 'Helicase', 'Primase'], correctIndex: 2, difficulty: 2 },
    { id: 'bio-6', question: 'In genetics, what term describes when one allele is not completely dominant over another?', options: ['Codominance', 'Incomplete dominance', 'Epistasis', 'Pleiotropy'], correctIndex: 1, difficulty: 3 },
    { id: 'bio-7', question: 'What is the role of tRNA in protein synthesis?', options: ['Copies DNA', 'Carries amino acids to ribosome', 'Splices introns', 'Regulates gene expression'], correctIndex: 1, difficulty: 2 },
    { id: 'bio-8', question: 'Which cellular process generates the most ATP per glucose molecule?', options: ['Glycolysis', 'Krebs cycle', 'Oxidative phosphorylation', 'Fermentation'], correctIndex: 2, difficulty: 3 },
  ],
  physics: [
    { id: 'phy-1', question: 'What is the SI unit of force?', options: ['Watt', 'Newton', 'Joule', 'Pascal'], correctIndex: 1, difficulty: 1 },
    { id: 'phy-2', question: 'What force keeps planets in orbit around the Sun?', options: ['Electromagnetic', 'Nuclear', 'Gravity', 'Friction'], correctIndex: 2, difficulty: 1 },
    { id: 'phy-3', question: 'What is the formula for kinetic energy?', options: ['mgh', '½mv²', 'Fd', 'mv'], correctIndex: 1, difficulty: 2 },
    { id: 'phy-4', question: 'What is the speed of light in a vacuum?', options: ['3×10⁶ m/s', '3×10⁸ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], correctIndex: 1, difficulty: 1 },
    { id: 'phy-5', question: 'Which law states that for every action there is an equal and opposite reaction?', options: ['Newton\'s 1st', 'Newton\'s 2nd', 'Newton\'s 3rd', 'Conservation of Energy'], correctIndex: 2, difficulty: 2 },
    { id: 'phy-6', question: 'What principle states you cannot simultaneously know both position and momentum of a particle?', options: ['Pauli exclusion', 'Heisenberg uncertainty', 'Superposition', 'Complementarity'], correctIndex: 1, difficulty: 3 },
  ],
  chemistry: [
    { id: 'chem-1', question: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correctIndex: 1, difficulty: 1 },
    { id: 'chem-2', question: 'What type of bond involves the sharing of electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correctIndex: 1, difficulty: 1 },
    { id: 'chem-3', question: 'What is the pH of a neutral solution?', options: ['0', '5', '7', '14'], correctIndex: 2, difficulty: 1 },
    { id: 'chem-4', question: 'Which gas law relates pressure and volume at constant temperature?', options: ['Charles\'s Law', 'Boyle\'s Law', 'Avogadro\'s Law', 'Dalton\'s Law'], correctIndex: 1, difficulty: 2 },
    { id: 'chem-5', question: 'What is the hybridization of carbon in methane (CH₄)?', options: ['sp', 'sp²', 'sp³', 'sp³d'], correctIndex: 2, difficulty: 2 },
    { id: 'chem-6', question: 'In an electrochemical cell, at which electrode does reduction occur?', options: ['Anode', 'Cathode', 'Both', 'Neither'], correctIndex: 1, difficulty: 3 },
  ],
  mathematics: [
    { id: 'math-1', question: 'What is the value of π (pi) to two decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], correctIndex: 1, difficulty: 1 },
    { id: 'math-2', question: 'What is the derivative of x²?', options: ['x', '2x', '2x²', 'x/2'], correctIndex: 1, difficulty: 1 },
    { id: 'math-3', question: 'What is the sum of interior angles of a triangle?', options: ['90°', '180°', '270°', '360°'], correctIndex: 1, difficulty: 1 },
    { id: 'math-4', question: 'What is the integral of 1/x?', options: ['x²', 'ln|x| + C', '1/x² + C', 'e^x + C'], correctIndex: 1, difficulty: 2 },
    { id: 'math-5', question: 'What does the determinant of a matrix tell you?', options: ['Trace', 'Eigenvalue', 'Scaling factor / invertibility', 'Rank'], correctIndex: 2, difficulty: 2 },
    { id: 'math-6', question: 'What is the limit of sin(x)/x as x approaches 0?', options: ['0', '1', '∞', 'undefined'], correctIndex: 1, difficulty: 3 },
  ],
  history: [
    { id: 'hist-1', question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2, difficulty: 1 },
    { id: 'hist-2', question: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'], correctIndex: 1, difficulty: 1 },
    { id: 'hist-3', question: 'The Renaissance began in which country?', options: ['France', 'England', 'Italy', 'Spain'], correctIndex: 2, difficulty: 1 },
    { id: 'hist-4', question: 'What was the main cause of the Cold War?', options: ['Territory disputes', 'Ideological conflict (capitalism vs communism)', 'Religious differences', 'Trade wars'], correctIndex: 1, difficulty: 2 },
    { id: 'hist-5', question: 'Which ancient civilization built the pyramids at Giza?', options: ['Roman', 'Greek', 'Egyptian', 'Mesopotamian'], correctIndex: 2, difficulty: 1 },
    { id: 'hist-6', question: 'What treaty ended World War I?', options: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Vienna', 'Treaty of Westphalia'], correctIndex: 1, difficulty: 2 },
  ],
  'computer-science': [
    { id: 'cs-1', question: 'What data structure follows LIFO (Last In, First Out)?', options: ['Queue', 'Stack', 'Array', 'Tree'], correctIndex: 1, difficulty: 1 },
    { id: 'cs-2', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctIndex: 2, difficulty: 2 },
    { id: 'cs-3', question: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transmission Process', 'High Text Transfer Protocol'], correctIndex: 0, difficulty: 1 },
    { id: 'cs-4', question: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'], correctIndex: 2, difficulty: 2 },
    { id: 'cs-5', question: 'What is the purpose of an index in a database?', options: ['Store data', 'Speed up queries', 'Encrypt data', 'Backup data'], correctIndex: 1, difficulty: 1 },
    { id: 'cs-6', question: 'What is a deadlock in operating systems?', options: ['System crash', 'Processes waiting forever for each other\'s resources', 'Memory leak', 'CPU overload'], correctIndex: 1, difficulty: 3 },
  ],
  geography: [
    { id: 'geo-1', question: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctIndex: 2, difficulty: 1 },
    { id: 'geo-2', question: 'What layer of the atmosphere do we live in?', options: ['Stratosphere', 'Troposphere', 'Mesosphere', 'Thermosphere'], correctIndex: 1, difficulty: 1 },
    { id: 'geo-3', question: 'What type of rock is formed from cooled magma?', options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Limestone'], correctIndex: 2, difficulty: 2 },
    { id: 'geo-4', question: 'What causes tides on Earth?', options: ['Wind', 'Earth rotation only', 'Gravitational pull of Moon and Sun', 'Ocean currents'], correctIndex: 2, difficulty: 2 },
    { id: 'geo-5', question: 'Which continent has the most countries?', options: ['Asia', 'Europe', 'Africa', 'South America'], correctIndex: 2, difficulty: 2 },
    { id: 'geo-6', question: 'What is the Coriolis effect?', options: ['Ocean warming', 'Wind deflection due to Earth rotation', 'Mountain formation', 'Volcanic activity'], correctIndex: 1, difficulty: 3 },
  ],
  literature: [
    { id: 'lit-1', question: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correctIndex: 1, difficulty: 1 },
    { id: 'lit-2', question: 'What is a metaphor?', options: ['A direct comparison using "like"', 'An implied comparison without "like" or "as"', 'An exaggeration', 'A repeated sound'], correctIndex: 1, difficulty: 1 },
    { id: 'lit-3', question: 'What literary device is "the wind whispered through the trees"?', options: ['Simile', 'Hyperbole', 'Personification', 'Alliteration'], correctIndex: 2, difficulty: 2 },
    { id: 'lit-4', question: 'What genre is "1984" by George Orwell?', options: ['Romance', 'Dystopian fiction', 'Mystery', 'Historical fiction'], correctIndex: 1, difficulty: 1 },
    { id: 'lit-5', question: 'What is the narrative point of view in a story told using "I"?', options: ['Second person', 'Third person limited', 'First person', 'Omniscient'], correctIndex: 2, difficulty: 2 },
    { id: 'lit-6', question: 'What is "stream of consciousness" in literature?', options: ['A type of poem', 'A narrative technique mimicking thought flow', 'A plot structure', 'A character archetype'], correctIndex: 1, difficulty: 3 },
  ],
  economics: [
    { id: 'econ-1', question: 'What does GDP stand for?', options: ['General Domestic Price', 'Gross Domestic Product', 'Global Development Program', 'Grand Domestic Plan'], correctIndex: 1, difficulty: 1 },
    { id: 'econ-2', question: 'What happens to demand when price increases (for a normal good)?', options: ['Increases', 'Decreases', 'Stays the same', 'Doubles'], correctIndex: 1, difficulty: 1 },
    { id: 'econ-3', question: 'What is inflation?', options: ['Decrease in prices', 'Increase in unemployment', 'General rise in price levels', 'Growth in GDP'], correctIndex: 2, difficulty: 1 },
    { id: 'econ-4', question: 'What is an opportunity cost?', options: ['The price of a product', 'The cost of the next best alternative given up', 'Tax on goods', 'Interest rate'], correctIndex: 1, difficulty: 2 },
    { id: 'econ-5', question: 'What does the Federal Reserve primarily control?', options: ['Tax rates', 'Monetary policy', 'Immigration', 'Trade agreements'], correctIndex: 1, difficulty: 2 },
    { id: 'econ-6', question: 'What is a Nash Equilibrium?', options: ['Market equilibrium', 'A state where no player benefits from changing strategy unilaterally', 'Zero-sum outcome', 'Perfect competition'], correctIndex: 1, difficulty: 3 },
  ],
  psychology: [
    { id: 'psy-1', question: 'Who is considered the father of psychoanalysis?', options: ['Carl Jung', 'B.F. Skinner', 'Sigmund Freud', 'Ivan Pavlov'], correctIndex: 2, difficulty: 1 },
    { id: 'psy-2', question: 'What is classical conditioning?', options: ['Learning by rewards', 'Learning by association', 'Learning by observation', 'Learning by insight'], correctIndex: 1, difficulty: 1 },
    { id: 'psy-3', question: 'What part of the brain is primarily responsible for memory formation?', options: ['Cerebellum', 'Hippocampus', 'Amygdala', 'Prefrontal cortex'], correctIndex: 1, difficulty: 2 },
    { id: 'psy-4', question: 'What does Maslow\'s hierarchy of needs place at the top?', options: ['Safety', 'Love', 'Esteem', 'Self-actualization'], correctIndex: 3, difficulty: 2 },
    { id: 'psy-5', question: 'What is cognitive dissonance?', options: ['Memory loss', 'Mental discomfort from conflicting beliefs', 'A learning disability', 'Dream analysis'], correctIndex: 1, difficulty: 2 },
    { id: 'psy-6', question: 'What is the bystander effect?', options: ['Increased helping in groups', 'Decreased helping as group size increases', 'Group conformity', 'Social facilitation'], correctIndex: 1, difficulty: 3 },
  ],
  art: [
    { id: 'art-1', question: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'], correctIndex: 1, difficulty: 1 },
    { id: 'art-2', question: 'What art movement did Claude Monet pioneer?', options: ['Cubism', 'Impressionism', 'Surrealism', 'Baroque'], correctIndex: 1, difficulty: 1 },
    { id: 'art-3', question: 'What are the three primary colors in painting?', options: ['Red, Green, Blue', 'Red, Yellow, Blue', 'Cyan, Magenta, Yellow', 'Red, Orange, Yellow'], correctIndex: 1, difficulty: 1 },
    { id: 'art-4', question: 'Which artist is famous for cutting off part of his ear?', options: ['Picasso', 'Dalí', 'Van Gogh', 'Rembrandt'], correctIndex: 2, difficulty: 1 },
    { id: 'art-5', question: 'What is "chiaroscuro" in art?', options: ['A type of sculpture', 'Use of strong light/dark contrasts', 'A painting technique with dots', 'Abstract geometric forms'], correctIndex: 1, difficulty: 2 },
    { id: 'art-6', question: 'Which art movement was Salvador Dalí associated with?', options: ['Pop Art', 'Impressionism', 'Surrealism', 'Expressionism'], correctIndex: 2, difficulty: 2 },
  ],
  music: [
    { id: 'mus-1', question: 'How many notes are in a standard octave?', options: ['7', '8', '12', '5'], correctIndex: 2, difficulty: 1 },
    { id: 'mus-2', question: 'What does "forte" mean in music?', options: ['Soft', 'Loud', 'Fast', 'Slow'], correctIndex: 1, difficulty: 1 },
    { id: 'mus-3', question: 'What is a chord?', options: ['A single note', 'Three or more notes played together', 'A rhythm pattern', 'A musical key'], correctIndex: 1, difficulty: 1 },
    { id: 'mus-4', question: 'What time signature is a waltz typically in?', options: ['4/4', '3/4', '2/4', '6/8'], correctIndex: 1, difficulty: 2 },
    { id: 'mus-5', question: 'What is a "tritone" interval?', options: ['Perfect 4th', 'Augmented 4th / Diminished 5th', 'Minor 3rd', 'Major 7th'], correctIndex: 1, difficulty: 3 },
    { id: 'mus-6', question: 'What is the relative minor of C major?', options: ['D minor', 'E minor', 'A minor', 'G minor'], correctIndex: 2, difficulty: 2 },
  ],
};

/**
 * Get diagnostic questions for a domain. Returns all available questions.
 * Users can answer as many as they want before proceeding.
 */
export function getDiagnosticQuestions(domainId: string): DiagnosticQuestion[] {
  return DIAGNOSTIC_BANK[domainId] ?? [];
}

/**
 * Compute student level from diagnostic answers.
 */
export function computeLevel(
  questions: DiagnosticQuestion[],
  answers: (number | null)[]
): { level: 'beginner' | 'intermediate' | 'advanced'; score: number; total: number } {
  let score = 0;
  let total = 0;

  answers.forEach((answer, i) => {
    if (answer !== null && questions[i]) {
      total++;
      if (answer === questions[i].correctIndex) {
        score++;
      }
    }
  });

  if (total === 0) return { level: 'intermediate', score: 0, total: 0 };

  const ratio = score / total;
  let level: 'beginner' | 'intermediate' | 'advanced';

  if (ratio <= 0.35) level = 'beginner';
  else if (ratio <= 0.7) level = 'intermediate';
  else level = 'advanced';

  return { level, score, total };
}
