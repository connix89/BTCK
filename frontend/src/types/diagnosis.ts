export interface Diagnosis {
  error_type: string;
  locations: {
    line: number;
    why: string;
  }[];
  reasoning_steps: string[];
  fix_steps: string[];
  suggested_patch: string;
  source: 'Rule Engine' | 'LLM';
  icon: string;
}
