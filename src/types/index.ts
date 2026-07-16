export interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  organization_id: number;
  created_at: string;
}

export interface Advisor {
  id: number;
  name: string;
  email: string;
  team_id: number;
  created_at: string;
}

export interface IssueTag {
  id: number;
  call_id: number;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string | null;
  transcript_quote: string | null;
  reason: string | null;
  recommendation: string | null;
  confidence: number | null;
  created_at: string;
}

export interface Score {
  id: number;
  call_id: number;
  overall_score: number;
  needs_discovery: number;
  product_knowledge: number;
  rapport: number;
  empathy: number;
  objection_handling: number;
  compliance: number;
  closing: number;
  trial_booking: number;
  created_at: string;
}

export interface Transcript {
  id: number;
  call_id: number;
  full_text: string;
  utterances_json: string;
  created_at: string;
}

export interface Call {
  id: number;
  advisor_id: number;
  client_name: string | null;
  audio_url: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  duration_seconds: number;
  created_at: string;
  advisor?: Advisor;
  score?: Score;
  transcript?: Transcript;
  issues?: IssueTag[];
}
