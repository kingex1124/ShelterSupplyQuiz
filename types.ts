
export interface Option {
  id: string;
  text: string;
  // This category is for internal use by AI and for evaluation, not shown to user during quiz.
  category: 'essential' | 'optional' | 'non-essential';
}

export interface Question {
  id: string;
  theme: string;
  questionText: string;
  options: Option[];
}

export interface UserAnswers {
  [questionId: string]: string[]; // Array of selected option IDs
}

export interface EvaluationItem {
  itemText: string;
  reason: string;
  questionText?: string; 
}

export interface CorrectlySelectedItem {
  questionText: string;
  selectedItems: string[];
}

export interface EvaluationResult {
  score: number;
  selectedNonEssential: EvaluationItem[];
  selectedOptional: EvaluationItem[];
  missedEssential: EvaluationItem[];
  summaryOfMissedEssentials: string;
  correctlySelectedSummary: CorrectlySelectedItem[];
  overallFeedback: string;
}

// For Gemini's question generation response structure
export interface RawQuestionOption {
  id: string; // e.g., "q1o1"
  text: string;
  category: 'essential' | 'optional' | 'non-essential';
}
export interface RawQuestion {
  id: string; // e.g., "q1"
  theme: string;
  questionText: string;
  options: RawQuestionOption[];
}
export interface GeneratedQuestionsResponse {
  questions: RawQuestion[];
}
    