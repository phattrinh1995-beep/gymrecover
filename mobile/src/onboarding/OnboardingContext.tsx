import React, { createContext, useContext, useState } from 'react';
import type { ActivityLevel, ClearanceStatus, InjuryRegion, Side } from '../types';

export interface OnboardingState {
  firstName: string;
  lastName: string;
  goals: string;
  activityLevel: ActivityLevel | null;
  hasCurrentInjury: boolean | null;
  region: InjuryRegion | null;
  diagnosisText: string;
  side: Side | null;
  hadSurgery: boolean | null;
  surgeryType: string;
  surgeryDate: string | null;
  clearanceStatus: ClearanceStatus | null;
}

const initialState: OnboardingState = {
  firstName: '',
  lastName: '',
  goals: '',
  activityLevel: null,
  hasCurrentInjury: null,
  region: null,
  diagnosisText: '',
  side: null,
  hadSurgery: null,
  surgeryType: '',
  surgeryDate: null,
  clearanceStatus: null,
};

interface OnboardingContextValue {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const update = (patch: Partial<OnboardingState>) => setState((prev) => ({ ...prev, ...patch }));
  const reset = () => setState(initialState);
  return <OnboardingContext.Provider value={{ state, update, reset }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
