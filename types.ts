
export type AnimalType = 'Dog' | 'Cat' | 'Bird' | 'Livestock' | 'Exotic' | 'Wild';
export type Environment = 'Indoor' | 'Outdoor' | 'Farm' | 'Forest' | 'Urban';
export type Status = 'Calm' | 'Alert' | 'Distressed' | 'Emergency';

export interface AnimalProfile {
  name: string;
  type: AnimalType;
  environment: Environment;
  age?: string;
  breed?: string;
}

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface SoundAnalysisResult {
  emotion: string;
  intent: string;
  confidence: number;
  explanation: string;
  status: Status;
  suggestedActions?: string[];
  groundingLinks?: GroundingLink[];
}

export interface TrainingSample {
  id: string;
  timestamp: number;
  userExplanation: string;
  fileName: string;
  status: 'pending' | 'verified';
}
