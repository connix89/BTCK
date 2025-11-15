export type ActiveTurn = 'rule' | 'llm' | null;

export interface StepAnalysis {
  icon: string;
  title: string;
  reasoning_steps: string[];
  fix_steps: string[];
  suggested_patch?: string;
  highlightLines?: number[];
}

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      analysis: { rule: StepAnalysis; llm: StepAnalysis };
      progress: { rule: number; llm: number; active: ActiveTurn };
    };
