import { InjuryRegion, PromType } from '@prisma/client';

/**
 * PLACEHOLDER PROM CONTENT — NOT THE REAL LICENSED INSTRUMENTS.
 *
 * KOOS (Knee injury and Osteoarthritis Outcome Score) and the QuickDASH (Disabilities of the Arm,
 * Shoulder and Hand — short form) are real, validated, licensed patient-reported outcome
 * measures. Their actual item wording is copyrighted/licensed content (QuickDASH specifically
 * requires registration/license from the Institute for Work & Health for use in a product), so it
 * is not reproduced here. The item text below is clearly-labeled placeholder copy, structurally
 * shaped like the real instruments (same domains, same response scale, same scoring formula
 * where that formula is public methodology rather than owned content) purely so the data model,
 * scoring pipeline, and trend UI can be built and demoed end to end.
 *
 * ACTION ITEM before any real use: replace `questions` below with the actual licensed item text
 * (KOOS is free to use with citation for most non-commercial contexts; QuickDASH requires
 * obtaining a license from the Institute for Work & Health), and have a licensed clinician confirm
 * the scoring implementation matches the official manual before this ever reaches a real patient.
 */

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
  /** Placeholder citation — must be replaced with the real instrument's required citation. */
  citation: string;
}

// Placeholder KOOS: 5 items, one per real KOOS subscale (Pain, Symptoms, ADL, Sport/Rec, QoL),
// each 0 (extreme problems) to 4 (no problems) — mirrors the real instrument's response direction.
export const KOOS_DEFINITION: PromDefinition = {
  type: 'KOOS',
  title: 'Knee Survey (placeholder)',
  instructions:
    'PLACEHOLDER QUESTIONNAIRE — not the licensed KOOS instrument. For each item, choose the option that best describes your knee over the last week.',
  questions: [
    { id: 'pain', text: '[Placeholder] How much knee pain have you had?', min: 0, max: 4 },
    { id: 'symptoms', text: '[Placeholder] How much knee stiffness or swelling have you noticed?', min: 0, max: 4 },
    { id: 'adl', text: '[Placeholder] How much difficulty with daily activities (stairs, standing up)?', min: 0, max: 4 },
    { id: 'sport', text: '[Placeholder] How much difficulty with sport/recreational activities?', min: 0, max: 4 },
    { id: 'qol', text: '[Placeholder] How much has your knee affected your overall quality of life?', min: 0, max: 4 },
  ],
  citation: 'PLACEHOLDER - real KOOS citation and license terms to be added before production use',
};

// Placeholder QuickDASH: 11 items, each 1 (no difficulty) to 5 (unable), matching the real
// instrument's item count and response scale so the standard DASH scoring transformation applies.
export const QUICKDASH_DEFINITION: PromDefinition = {
  type: 'QUICKDASH',
  title: 'Arm & Shoulder Survey (placeholder)',
  instructions:
    'PLACEHOLDER QUESTIONNAIRE — not the licensed QuickDASH instrument. Rate your ability to do the following over the past week.',
  questions: Array.from({ length: 11 }, (_, i) => ({
    id: `q${i + 1}`,
    text: `[Placeholder QuickDASH item ${i + 1}] Difficulty with an everyday shoulder/arm task.`,
    min: 1,
    max: 5,
  })),
  citation: 'PLACEHOLDER - real QuickDASH requires a license from the Institute for Work & Health before use',
};

const DEFINITIONS: Record<PromType, PromDefinition> = {
  KOOS: KOOS_DEFINITION,
  QUICKDASH: QUICKDASH_DEFINITION,
};

export function getPromDefinition(type: PromType): PromDefinition {
  return DEFINITIONS[type];
}

/** Only knee and shoulder have a seeded protocol + PROM in this build (build order item 7). */
export function promTypeForRegion(region: InjuryRegion): PromType | null {
  if (region === 'KNEE') return 'KOOS';
  if (region === 'SHOULDER') return 'QUICKDASH';
  return null;
}
