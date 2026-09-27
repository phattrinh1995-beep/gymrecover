export interface AuthUser {
  sub: string;
  email: string;
}

export interface PatientSummary {
  patientId: string;
  name: string;
  region: string | null;
  currentPhaseName: string | null;
  manualHold: boolean;
  pendingPhaseId: string | null;
  sessionsThisWeek: number;
  latestPainScore: number | null;
  latestPromScore: number | null;
}

export interface SessionLogRow {
  id: string;
  completed: boolean;
  redFlagTriggered: boolean;
  painScore: number | null;
  rpe: number | null;
  createdAt: string;
}

export interface OutcomeAssessmentRow {
  id: string;
  type: string;
  score: number;
  assessedAt: string;
}

export interface Phase {
  id: string;
  order: number;
  name: string;
}

export interface ProgramInstance {
  id: string;
  track: string;
  status: string;
  manualHold: boolean;
  manualHoldReason: string | null;
  pendingPhaseId: string | null;
  currentPhase: (Phase & { protocolTemplate: { phases: Phase[] } }) | null;
  sessionLogs: SessionLogRow[];
  outcomeAssessments: OutcomeAssessmentRow[];
}

export interface InjuryProfile {
  id: string;
  region: string;
  side: string;
  surgeryType: string | null;
  surgeryDate: string | null;
  clearanceStatus: string;
}

export interface PatientDetail {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string; activityLevel: string } | null;
  injuryProfiles: InjuryProfile[];
  programInstances: ProgramInstance[];
}

export interface RedFlagAlert {
  id: string;
  createdAt: string;
  redFlagDetails: Record<string, unknown>;
}

export interface OrgInvite {
  id: string;
  email: string;
  role: 'PROVIDER' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  token: string;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  email: string;
  role: string;
}

export interface AdminExercise {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  equipment: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

export interface AdminPhaseExercise {
  id: string;
  order: number;
  sets: number | null;
  reps: number | null;
  holdTimeSeconds: number | null;
  notes: string | null;
  exercise: AdminExercise;
}

export interface AdminPhase {
  id: string;
  order: number;
  name: string;
  description: string | null;
  entryCriteria: Record<string, unknown>;
  exitCriteria: Record<string, unknown>;
  phaseExercises: AdminPhaseExercise[];
}

export interface AdminProtocolTemplate {
  id: string;
  name: string;
  region: string;
  description: string | null;
  reviewedBy: string;
  sourceCitation: string | null;
  isActive: boolean;
  phases?: AdminPhase[];
}

export interface AdminPerformanceProgramExercise {
  id: string;
  order: number;
  sets: number | null;
  reps: number | null;
  holdTimeSeconds: number | null;
  notes: string | null;
  exercise: AdminExercise;
}

export interface AdminPerformanceProgramTemplate {
  id: string;
  name: string;
  goal: 'STRENGTH' | 'HYPERTROPHY' | 'CONDITIONING';
  description: string | null;
  isActive: boolean;
  exercises?: AdminPerformanceProgramExercise[];
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  subscription: { plan: string; status: string; seats: number } | null;
  users: OrgMember[];
  invites: OrgInvite[];
}
