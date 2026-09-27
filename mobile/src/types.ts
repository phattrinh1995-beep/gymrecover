export type InjuryRegion =
  | 'KNEE'
  | 'SHOULDER'
  | 'HIP'
  | 'ANKLE_FOOT'
  | 'SPINE'
  | 'ELBOW_WRIST'
  | 'GENERAL_MUSCLE';

export type Side = 'LEFT' | 'RIGHT' | 'BILATERAL' | 'NA';

export type ClearanceStatus = 'SELF_REPORTED' | 'PROVIDER_CONFIRMED' | 'PENDING';

export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'ATHLETE';

export interface AuthUser {
  sub: string;
  email: string;
}

export interface InjuryProfile {
  id: string;
  region: InjuryRegion;
  diagnosisText: string | null;
  surgeryType: string | null;
  surgeryDate: string | null;
  side: Side;
  clearanceStatus: ClearanceStatus;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
}

export interface PhaseExercise {
  id: string;
  order: number;
  sets: number | null;
  reps: number | null;
  holdTimeSeconds: number | null;
  notes: string | null;
  exercise: Exercise;
}

export interface TodaySessionResponse {
  phaseName: string | null;
  phaseExercises: PhaseExercise[];
}

export type PromType = 'KOOS' | 'QUICKDASH';

export interface PromQuestion {
  id: string;
  text: string;
  min: number;
  max: number;
}

export interface PromDefinition {
  type: PromType;
  title: string;
  instructions: string;
  questions: PromQuestion[];
  citation: string;
}

export interface OutcomeAssessmentSummary {
  id: string;
  type: PromType;
  score: number;
  assessedAt: string;
}

export type PerformanceGoal = 'STRENGTH' | 'HYPERTROPHY' | 'CONDITIONING';

export interface ActiveProgramInstance {
  id: string;
  track: 'RECOVERY' | 'PERFORMANCE';
  performanceGoal: PerformanceGoal | null;
}

export interface MeResponse {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    goals: string | null;
    activityLevel: ActivityLevel;
  } | null;
  injuryProfiles: InjuryProfile[];
  requiresClearanceConfirmation: boolean;
  activeProgramInstances: ActiveProgramInstance[];
}
