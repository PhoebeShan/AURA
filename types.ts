
export enum ContributionType {
  Physical = 'Physical',
  Mental = 'Mental',
  Emotional = 'Emotional',
  Strategic = 'Strategic',
  Gratitude = 'Gratitude',
  Patience = 'Patience'
}

export interface Crystal {
  id: string;
  timestamp: number;
  description: string;
  points: number;
  type: ContributionType;
  hasVoiceMessage?: boolean;
  voiceData?: string; // Base64 encoded audio data
  details: {
    outsourceCost: number;
    opportunityCost: number;
    explanation: string;
    valuationLogic?: string;
    referenceLink?: string;
  };
}

export interface Wish {
  id: string;
  title: string;
  cost: number;
  currentPoints: number;
  image: string;
  status: 'pending' | 'completed';
  referenceUrl?: string;
  referenceTitle?: string;
}

export interface UserState {
  totalAura: number;
  crystals: Crystal[];
  wishes: Wish[];
  huggedCrystalIds: string[];
}
