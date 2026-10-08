export interface PredictionRecord {
  id: string;
  period: string;
  gameType: 'wingo1' | 'wingo3' | 'aviator';
  result: 'BIG' | 'SMALL' | 'RED' | 'GREEN' | 'MULTIPLIER';
  multiplier?: string;
  color?: 'red' | 'green' | 'blue' | 'purple' | 'amber';
  accuracy: number;
  timestamp: string;
  status: 'WIN' | 'PENDING';
  predictedNumber?: number;
}

export type GameTab = 'wingo1' | 'wingo3' | 'aviator';
