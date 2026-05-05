/** Subject domains and their topics for the curriculum picker. */

export interface Domain {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: string[];
}

export const DOMAINS: Domain[] = [
  {
    id: 'biology',
    name: 'Biology',
    icon: '🧬',
    color: '#10b981',
    topics: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Anatomy', 'Microbiology', 'Botany', 'Zoology'],
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: '⚛️',
    color: '#3b82f6',
    topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Waves & Sound', 'Nuclear Physics'],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: '🧪',
    color: '#f59e0b',
    topics: ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Acids & Bases', 'Thermochemistry', 'Electrochemistry'],
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: '📐',
    color: '#8b5cf6',
    topics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 'Linear Algebra', 'Number Theory'],
  },
  {
    id: 'history',
    name: 'History',
    icon: '📜',
    color: '#d97706',
    topics: ['Ancient Civilizations', 'Medieval Europe', 'World War I', 'World War II', 'Cold War', 'Modern History'],
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    icon: '💻',
    color: '#06b6d4',
    topics: ['Data Structures', 'Algorithms', 'Operating Systems', 'Databases', 'Networking', 'Machine Learning'],
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: '🌍',
    color: '#22c55e',
    topics: ['Physical Geography', 'Human Geography', 'Climatology', 'Cartography', 'Geopolitics', 'Oceanography'],
  },
  {
    id: 'literature',
    name: 'Literature',
    icon: '📖',
    color: '#ec4899',
    topics: ['Poetry Analysis', 'Shakespeare', 'Modern Fiction', 'Literary Theory', 'World Literature', 'Creative Writing'],
  },
  {
    id: 'economics',
    name: 'Economics',
    icon: '💰',
    color: '#eab308',
    topics: ['Microeconomics', 'Macroeconomics', 'International Trade', 'Monetary Policy', 'Game Theory', 'Behavioral Economics'],
  },
  {
    id: 'psychology',
    name: 'Psychology',
    icon: '🧠',
    color: '#a855f7',
    topics: ['Cognitive Psychology', 'Developmental Psychology', 'Social Psychology', 'Neuroscience', 'Abnormal Psychology', 'Research Methods'],
  },
  {
    id: 'art',
    name: 'Art History',
    icon: '🎨',
    color: '#f43f5e',
    topics: ['Renaissance Art', 'Impressionism', 'Modern Art', 'Photography', 'Architecture', 'Sculpture'],
  },
  {
    id: 'music',
    name: 'Music Theory',
    icon: '🎵',
    color: '#14b8a6',
    topics: ['Scales & Modes', 'Harmony', 'Rhythm & Meter', 'Composition', 'Music History', 'Ear Training'],
  },
];
