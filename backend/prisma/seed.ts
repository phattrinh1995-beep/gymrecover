/**
 * Seeds two sample protocol templates end-to-end: ACL reconstruction (knee) and rotator cuff
 * repair (shoulder). Every clinical value in this file — phase durations, criteria thresholds,
 * exercise selection/dosage — is a CLEARLY-MARKED PLACEHOLDER for demoing the data model and the
 * Adaptive Program Engine. None of it has been authored or reviewed by a licensed clinician and
 * NONE OF IT is safe to show to a real patient. See `reviewedBy` on each ProtocolTemplate.
 */
import { PrismaClient, InjuryRegion, PerformanceGoal } from '@prisma/client';

const prisma = new PrismaClient();

const PLACEHOLDER_REVIEWER = 'PLACEHOLDER - requires licensed clinical review';

type ExerciseSeed = {
  name: string;
  description: string;
  equipment?: string;
  sets?: number;
  reps?: number;
  holdTimeSeconds?: number;
  notes?: string;
};

type PhaseSeed = {
  name: string;
  description: string;
  entryCriteria: Record<string, unknown>;
  exitCriteria: Record<string, unknown>;
  exercises: ExerciseSeed[];
};

type ProtocolSeed = {
  name: string;
  region: InjuryRegion;
  description: string;
  sourceCitation: string | null;
  phases: PhaseSeed[];
};

const ACL_RECONSTRUCTION: ProtocolSeed = {
  name: 'ACL Reconstruction — Placeholder Protocol',
  region: InjuryRegion.KNEE,
  description:
    'Placeholder 4-phase post-operative pathway for ACL reconstruction. Thresholds (days, ROM, pain) are illustrative only.',
  sourceCitation: null,
  phases: [
    {
      name: 'Phase 1 — Protection & Early Motion',
      description: 'Protect the graft, control swelling, and restore basic range of motion.',
      entryCriteria: { min_days_since_surgery: 0, provider_hold: false },
      exitCriteria: {
        min_days_since_surgery: 14,
        max_pain_score: 4,
        no_swelling_increase_24h: true,
        min_knee_flexion_rom_degrees: 90,
        provider_hold: false,
      },
      exercises: [
        { name: 'Quad Sets', description: 'Isometric quadriceps contraction, knee straight.', sets: 3, reps: 15, holdTimeSeconds: 5 },
        { name: 'Ankle Pumps', description: 'Ankle dorsiflexion/plantarflexion to promote circulation.', sets: 3, reps: 20 },
        { name: 'Heel Slides', description: 'Slide heel toward glutes to gain knee flexion.', sets: 3, reps: 10 },
        { name: 'Patellar Mobilization', description: 'Gentle manual mobilization of the kneecap in all directions.', sets: 1, reps: 10 },
        { name: 'Straight Leg Raise', description: 'Lift straight leg with quad engaged, if cleared and no extension lag.', sets: 3, reps: 10 },
        { name: 'Seated Calf Stretch', description: 'Towel-assisted calf stretch, gentle hold.', sets: 2, holdTimeSeconds: 30 },
      ],
    },
    {
      name: 'Phase 2 — Early Strength & ROM',
      description: 'Normalize gait, expand ROM, and begin closed-chain strengthening.',
      entryCriteria: {
        min_days_since_surgery: 14,
        max_pain_score: 4,
        min_knee_flexion_rom_degrees: 90,
        provider_hold: false,
      },
      exitCriteria: {
        min_days_since_surgery: 42,
        max_pain_score: 3,
        min_knee_flexion_rom_degrees: 120,
        quad_control_no_lag: true,
        provider_hold: false,
      },
      exercises: [
        { name: 'Mini Squats', description: 'Bodyweight squat to a shallow depth.', sets: 3, reps: 12 },
        { name: 'Stationary Bike (No Resistance)', description: 'Light cycling to build ROM and endurance.', sets: 1, notes: '10-15 minutes' },
        { name: 'Low Step-Ups', description: 'Step onto a low platform, controlled tempo.', sets: 3, reps: 10 },
        { name: 'Standing Hamstring Curls', description: 'Band-resisted knee flexion, standing.', sets: 3, reps: 12 },
        { name: 'Single-Leg Balance (Eyes Open)', description: 'Static balance on operated leg with support nearby.', sets: 3, holdTimeSeconds: 20 },
        { name: 'Wall Sits', description: 'Isometric wall sit at a comfortable knee angle.', sets: 3, holdTimeSeconds: 20 },
      ],
    },
    {
      name: 'Phase 3 — Progressive Strengthening',
      description: 'Build strength, proprioception, and neuromuscular control toward higher demand movement.',
      entryCriteria: {
        min_days_since_surgery: 42,
        max_pain_score: 3,
        min_knee_flexion_rom_degrees: 120,
        provider_hold: false,
      },
      exitCriteria: {
        min_days_since_surgery: 84,
        max_pain_score: 2,
        single_leg_stance_seconds: 30,
        provider_hold: false,
      },
      exercises: [
        { name: 'Leg Press', description: 'Bilateral, progressing to single-leg as tolerated.', sets: 3, reps: 10 },
        { name: 'Lateral Band Walks', description: 'Mini-band around ankles, sideways steps.', sets: 3, reps: 15 },
        { name: 'Single-Leg Balance (Eyes Closed)', description: 'Advanced balance challenge on operated leg.', sets: 3, holdTimeSeconds: 20 },
        { name: 'Forward Lunges', description: 'Controlled lunge, limited depth initially.', sets: 3, reps: 10 },
        { name: 'Glute Bridges', description: 'Double-leg progressing to single-leg bridge.', sets: 3, reps: 12 },
        { name: 'Box Step-Downs', description: 'Controlled eccentric step-down from a low box.', sets: 3, reps: 8 },
        { name: 'Bike Intervals', description: 'Moderate-resistance interval cycling.', sets: 1, notes: '15-20 minutes' },
      ],
    },
    {
      name: 'Phase 4 — Return to Activity',
      description: 'Sport/activity-specific loading, plyometrics, and change-of-direction work, gated by provider sign-off.',
      entryCriteria: {
        min_days_since_surgery: 84,
        max_pain_score: 2,
        single_leg_stance_seconds: 30,
        provider_hold: false,
      },
      exitCriteria: {
        min_days_since_surgery: 168,
        hop_test_limb_symmetry_index_percent: 90,
        // Full return-to-sport clearance always requires explicit provider sign-off in this
        // placeholder protocol, regardless of other criteria being met.
        provider_hold: true,
      },
      exercises: [
        { name: 'Jogging Progression', description: 'Straight-line jogging, gradually increasing distance/speed.', sets: 1, notes: 'Progress per tolerance' },
        { name: 'Agility Ladder Drills', description: 'Basic footwork patterns at low intensity.', sets: 3, reps: 1, notes: '1 pass through ladder' },
        { name: 'Low-Amplitude Box Jumps', description: 'Double-leg jump onto a low box, focus on soft landing.', sets: 3, reps: 6 },
        { name: 'Single-Leg Hop Test Prep', description: 'Sub-maximal single-leg hops, building toward formal hop testing.', sets: 3, reps: 5 },
        { name: 'Light Cutting Drills', description: 'Low-intensity change-of-direction drills.', sets: 3, reps: 4 },
        { name: 'Sport-Specific Drill Circuit', description: 'Individualized drills matched to the patient\'s sport/activity.', sets: 1, notes: 'Provider/PT-directed' },
      ],
    },
  ],
};

const ROTATOR_CUFF_REPAIR: ProtocolSeed = {
  name: 'Rotator Cuff Repair — Placeholder Protocol',
  region: InjuryRegion.SHOULDER,
  description:
    'Placeholder 4-phase post-operative pathway for arthroscopic rotator cuff repair. Thresholds are illustrative only.',
  sourceCitation: null,
  phases: [
    {
      name: 'Phase 1 — Immobilization & Passive ROM',
      description: 'Protect the repair; passive motion only, no active lifting.',
      entryCriteria: { min_days_since_surgery: 0, provider_hold: false },
      exitCriteria: {
        min_days_since_surgery: 42,
        max_pain_score: 4,
        no_swelling_increase_24h: true,
        min_passive_forward_flexion_degrees: 120,
        provider_hold: false,
      },
      exercises: [
        { name: 'Pendulum Swings', description: 'Gentle gravity-assisted circular arm swings.', sets: 3, reps: 10 },
        { name: 'Passive Forward Flexion (Table Slides)', description: 'Passive assisted flexion using the sound arm or a table surface.', sets: 3, reps: 10 },
        { name: 'Passive External Rotation with Stick', description: 'Supine, cane-assisted passive external rotation within pain-free range.', sets: 3, reps: 10 },
        { name: 'Scapular Squeezes', description: 'Gentle scapular retraction, no shoulder loading.', sets: 3, reps: 10, holdTimeSeconds: 5 },
        { name: 'Elbow / Wrist / Hand ROM', description: 'Active motion of distal joints to prevent stiffness.', sets: 2, reps: 15 },
        { name: 'Posture Correction Cueing', description: 'Seated/standing postural awareness drills.', sets: 3, holdTimeSeconds: 30 },
      ],
    },
    {
      name: 'Phase 2 — Active-Assisted ROM & Early Strengthening',
      description: 'Progress to active-assisted motion and begin gentle isometric strengthening.',
      entryCriteria: {
        min_days_since_surgery: 42,
        max_pain_score: 4,
        min_passive_forward_flexion_degrees: 120,
        provider_hold: false,
      },
      exitCriteria: {
        min_days_since_surgery: 84,
        max_pain_score: 3,
        min_active_forward_flexion_degrees: 140,
        provider_hold: false,
      },
      exercises: [
        { name: 'Active-Assisted Flexion with Pulley', description: 'Overhead pulley system, sound arm assists.', sets: 3, reps: 10 },
        { name: 'Isometric External Rotation', description: 'Submaximal isometric hold against light resistance, elbow at side.', sets: 3, holdTimeSeconds: 10 },
        { name: 'Isometric Internal Rotation', description: 'Submaximal isometric hold against light resistance, elbow at side.', sets: 3, holdTimeSeconds: 10 },
        { name: 'Scapular Retraction with Band', description: 'Light resistance band rows focusing on scapular squeeze.', sets: 3, reps: 12 },
        { name: 'Table Slides Progression', description: 'Active-assisted forward reach along a table.', sets: 3, reps: 10 },
        { name: 'Active Abduction Below 90°', description: 'Active arm lift to shoulder height only, within pain-free range.', sets: 3, reps: 10 },
      ],
    },
    {
      name: 'Phase 3 — Progressive Strengthening',
      description: 'Introduce resisted strengthening through a fuller range of motion.',
      entryCriteria: {
        min_days_since_surgery: 84,
        max_pain_score: 3,
        min_active_forward_flexion_degrees: 140,
        provider_hold: false,
      },
      exitCriteria: {
        min_days_since_surgery: 112,
        max_pain_score: 2,
        min_active_forward_flexion_degrees: 160,
        provider_hold: false,
      },
      exercises: [
        { name: 'Resistance Band External Rotation', description: 'Elbow at side, band-resisted external rotation.', sets: 3, reps: 12 },
        { name: 'Resistance Band Internal Rotation', description: 'Elbow at side, band-resisted internal rotation.', sets: 3, reps: 12 },
        { name: 'Prone Y-T-W Raises (Light)', description: 'Light scapular strengthening in prone position.', sets: 3, reps: 8 },
        { name: 'Standing Rows', description: 'Band or light dumbbell rows, controlled tempo.', sets: 3, reps: 12 },
        { name: 'Wall Push-Ups (Modified)', description: 'Incline push-up variation to limit shoulder load.', sets: 3, reps: 10 },
        { name: 'Side-Lying External Rotation', description: 'Light dumbbell external rotation, side-lying.', sets: 3, reps: 10 },
      ],
    },
    {
      name: 'Phase 4 — Return to Function/Sport',
      description: 'Restore full strength and prepare for functional/sport-specific overhead demands, gated by provider sign-off.',
      entryCriteria: {
        min_days_since_surgery: 112,
        max_pain_score: 2,
        min_active_forward_flexion_degrees: 160,
        provider_hold: false,
      },
      exitCriteria: {
        min_days_since_surgery: 168,
        strength_symmetry_index_percent: 90,
        // Full return-to-sport/overhead-work clearance always requires explicit provider
        // sign-off in this placeholder protocol.
        provider_hold: true,
      },
      exercises: [
        { name: 'Light Dumbbell Press Progression', description: 'Gradually loaded overhead or bench press variation.', sets: 3, reps: 10 },
        { name: 'Overhead Reach Patterns', description: 'Functional reaching drills through full ROM.', sets: 3, reps: 10 },
        { name: 'Push-Up Progression', description: 'Progress from incline to full push-up as tolerated.', sets: 3, reps: 10 },
        { name: 'Full Can Raises', description: 'Scaption raises with light resistance.', sets: 3, reps: 12 },
        { name: 'Plyometric Wall Toss (Light)', description: 'Light medicine ball toss against a wall.', sets: 3, reps: 10 },
        { name: 'Sport-Specific Throwing/Overhead Progression', description: 'Individualized, provider/PT-directed return-to-sport drills.', sets: 1, notes: 'Provider/PT-directed' },
      ],
    },
  ],
};

async function seedProtocol(protocol: ProtocolSeed) {
  const template = await prisma.protocolTemplate.upsert({
    where: { name: protocol.name },
    create: {
      name: protocol.name,
      region: protocol.region,
      description: protocol.description,
      reviewedBy: PLACEHOLDER_REVIEWER,
      sourceCitation: protocol.sourceCitation,
      isActive: true,
    },
    update: {
      region: protocol.region,
      description: protocol.description,
      reviewedBy: PLACEHOLDER_REVIEWER,
      sourceCitation: protocol.sourceCitation,
    },
  });

  for (const [index, phaseSeed] of protocol.phases.entries()) {
    const order = index + 1;
    const phase = await prisma.phase.upsert({
      where: { protocolTemplateId_order: { protocolTemplateId: template.id, order } },
      create: {
        protocolTemplateId: template.id,
        order,
        name: phaseSeed.name,
        description: phaseSeed.description,
        entryCriteria: phaseSeed.entryCriteria,
        exitCriteria: phaseSeed.exitCriteria,
      },
      update: {
        name: phaseSeed.name,
        description: phaseSeed.description,
        entryCriteria: phaseSeed.entryCriteria,
        exitCriteria: phaseSeed.exitCriteria,
      },
    });

    for (const [exIndex, exerciseSeed] of phaseSeed.exercises.entries()) {
      const exercise = await prisma.exercise.upsert({
        where: { name: exerciseSeed.name },
        create: {
          name: exerciseSeed.name,
          description: exerciseSeed.description,
          region: protocol.region,
          equipment: exerciseSeed.equipment,
        },
        update: {
          description: exerciseSeed.description,
        },
      });

      await prisma.phaseExercise.upsert({
        where: { phaseId_exerciseId: { phaseId: phase.id, exerciseId: exercise.id } },
        create: {
          phaseId: phase.id,
          exerciseId: exercise.id,
          order: exIndex + 1,
          sets: exerciseSeed.sets,
          reps: exerciseSeed.reps,
          holdTimeSeconds: exerciseSeed.holdTimeSeconds,
          notes: exerciseSeed.notes,
        },
        update: {
          order: exIndex + 1,
          sets: exerciseSeed.sets,
          reps: exerciseSeed.reps,
          holdTimeSeconds: exerciseSeed.holdTimeSeconds,
          notes: exerciseSeed.notes,
        },
      });
    }
  }

  return template;
}

// --- Performance track (build order item 9): general strength/conditioning templates, deliberately
// separate from the recovery-track ProtocolTemplate/Phase structure above. These are ordinary
// general-fitness programming templates, not medical content, so they don't carry the clinical
// reviewedBy/citation gate the recovery protocols do — but they're still generic templates, not
// personalized programming, which the app's persistent disclaimer already makes clear.
type PerformanceExerciseSeed = {
  name: string;
  description: string;
  sets?: number;
  reps?: number;
  holdTimeSeconds?: number;
  notes?: string;
};

type PerformanceTemplateSeed = {
  name: string;
  goal: PerformanceGoal;
  description: string;
  exercises: PerformanceExerciseSeed[];
};

const PERFORMANCE_TEMPLATES: PerformanceTemplateSeed[] = [
  {
    name: 'Strength Building — General Template',
    goal: 'STRENGTH',
    description: 'A general lower-rep, heavier-load strength template built around compound lifts.',
    exercises: [
      { name: 'Back Squat', description: 'Barbell back squat, full depth.', sets: 4, reps: 5 },
      { name: 'Bench Press', description: 'Barbell bench press.', sets: 4, reps: 5 },
      { name: 'Deadlift', description: 'Conventional barbell deadlift.', sets: 3, reps: 5 },
      { name: 'Barbell Row', description: 'Bent-over barbell row.', sets: 4, reps: 6 },
      { name: 'Overhead Press', description: 'Standing barbell overhead press.', sets: 3, reps: 6 },
      { name: 'Plank', description: 'Front plank hold, neutral spine.', sets: 3, holdTimeSeconds: 45 },
    ],
  },
  {
    name: 'Hypertrophy — General Template',
    goal: 'HYPERTROPHY',
    description: 'A general moderate-rep template emphasizing muscle growth via higher volume.',
    exercises: [
      { name: 'Bench Press', description: 'Barbell bench press.', sets: 4, reps: 10 },
      { name: 'Lat Pulldown', description: 'Cable lat pulldown, wide grip.', sets: 4, reps: 10 },
      { name: 'Leg Press', description: 'Machine leg press.', sets: 4, reps: 12 },
      { name: 'Dumbbell Bicep Curl', description: 'Standing alternating dumbbell curl.', sets: 3, reps: 12 },
      { name: 'Dumbbell Tricep Extension', description: 'Overhead dumbbell triceps extension.', sets: 3, reps: 12 },
      { name: 'Walking Lunge', description: 'Bodyweight or dumbbell walking lunge.', sets: 3, reps: 12 },
    ],
  },
  {
    name: 'Conditioning — General Template',
    goal: 'CONDITIONING',
    description: 'A general cardiovascular/metabolic conditioning circuit.',
    exercises: [
      { name: 'Jump Rope', description: 'Continuous jump rope intervals.', sets: 5, notes: '1 minute per set' },
      { name: 'Burpees', description: 'Full-body burpee.', sets: 4, reps: 15 },
      { name: 'Kettlebell Swing', description: 'Two-handed kettlebell swing.', sets: 4, reps: 20 },
      { name: 'Mountain Climbers', description: 'Fast-tempo mountain climbers.', sets: 4, holdTimeSeconds: 30 },
      { name: 'Battle Ropes', description: 'Alternating battle rope waves.', sets: 4, holdTimeSeconds: 30 },
      { name: 'Row Erg Intervals', description: 'Rowing machine intervals.', sets: 6, notes: '250m per interval' },
    ],
  },
];

async function seedPerformanceTemplate(seed: PerformanceTemplateSeed) {
  const template = await prisma.performanceProgramTemplate.upsert({
    where: { name: seed.name },
    create: { name: seed.name, goal: seed.goal, description: seed.description, isActive: true },
    update: { goal: seed.goal, description: seed.description },
  });

  for (const [i, exerciseSeed] of seed.exercises.entries()) {
    const exercise = await prisma.exercise.upsert({
      where: { name: exerciseSeed.name },
      create: { name: exerciseSeed.name, description: exerciseSeed.description },
      update: { description: exerciseSeed.description },
    });

    await prisma.performanceProgramExercise.upsert({
      where: { templateId_exerciseId: { templateId: template.id, exerciseId: exercise.id } },
      create: {
        templateId: template.id,
        exerciseId: exercise.id,
        order: i + 1,
        sets: exerciseSeed.sets,
        reps: exerciseSeed.reps,
        holdTimeSeconds: exerciseSeed.holdTimeSeconds,
        notes: exerciseSeed.notes,
      },
      update: {
        order: i + 1,
        sets: exerciseSeed.sets,
        reps: exerciseSeed.reps,
        holdTimeSeconds: exerciseSeed.holdTimeSeconds,
        notes: exerciseSeed.notes,
      },
    });
  }

  return template;
}

async function main() {
  console.log('Seeding placeholder protocol templates (NOT reviewed by a clinician)...');
  const acl = await seedProtocol(ACL_RECONSTRUCTION);
  const cuff = await seedProtocol(ROTATOR_CUFF_REPAIR);
  console.log(`Seeded: ${acl.name} (${acl.id})`);
  console.log(`Seeded: ${cuff.name} (${cuff.id})`);

  console.log('Seeding performance track templates...');
  for (const seed of PERFORMANCE_TEMPLATES) {
    const template = await seedPerformanceTemplate(seed);
    console.log(`Seeded: ${template.name} (${template.id})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
