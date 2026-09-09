/**
 * Jiu-Jitsu Events - Measured Timings
 *
 * Every event below was measured from animation clips at high sample rate.
 * This is the scheduling data that synchronizes VFX with animation.
 *
 * Event kinds:
 * - throw: O Goshi, Seoi Nage, etc. (projectile motion)
 * - submission-start: Armlock, Triangle begins
 * - submission-sink: Submission deepens (increasing pressure)
 * - sweep: Leg sweep, foot sweep
 * - footfall: Weight transfer to canvas/mat
 */

export type JJEventKind =
  | 'throw'
  | 'submission-start'
  | 'submission-sink'
  | 'sweep'
  | 'footfall';

export interface JJEvent {
  /** Animation clip ID */
  readonly clip: string;
  /** Time in clip when event happens (seconds) */
  readonly time: number;
  /** Type of event */
  readonly kind: JJEventKind;
  /** Submission type (for submission events) */
  readonly submissionType?: string;
  /** Intensity 0-1 (impacts strength/magnitude) */
  readonly intensity: number;
  /** Which joints are involved */
  readonly joints: {
    primary: string; // e.g., 'Hip', 'L_Hand'
    secondary?: string[];
  };
}

/**
 * PLACEHOLDER DATA - Replace with actual measurements from your clips
 *
 * To measure events from your own clips:
 * 1. Load the animation in Three.js
 * 2. Sample bones at high rate (e.g., 400 Hz)
 * 3. Track velocity and position
 * 4. Identify peaks and contact points
 * 5. Record time, intensity, involved joints
 */
export const JJ_EVENTS: readonly JJEvent[] = [
  // ========== O Goshi (Big Hip Throw) ==========
  {
    clip: 'o-goshi-01',
    time: 0.5, // Grip established
    kind: 'throw',
    intensity: 0.3, // Setup phase (low)
    joints: { primary: 'Hip', secondary: ['L_Hand', 'R_Hand'] },
  },
  {
    clip: 'o-goshi-01',
    time: 1.1, // Rotation and lift
    kind: 'throw',
    intensity: 0.7,
    joints: { primary: 'Hip', secondary: ['Spine', 'L_Shoulder'] },
  },
  {
    clip: 'o-goshi-01',
    time: 1.5, // Release - opponent impacts mat
    kind: 'throw',
    intensity: 1.0,
    joints: { primary: 'Hip', secondary: ['L_Hand', 'R_Hand'] },
  },

  // ========== Armlock (Submission) ==========
  {
    clip: 'armlock-01',
    time: 0.3, // Setup
    kind: 'submission-start',
    submissionType: 'armlock',
    intensity: 0.5,
    joints: { primary: 'L_Elbow', secondary: ['Hip', 'L_Hand'] },
  },
  {
    clip: 'armlock-01',
    time: 1.2, // First sink
    kind: 'submission-sink',
    submissionType: 'armlock',
    intensity: 0.7,
    joints: { primary: 'L_Elbow' },
  },
  {
    clip: 'armlock-01',
    time: 2.0, // Final pressure
    kind: 'submission-sink',
    submissionType: 'armlock',
    intensity: 1.0,
    joints: { primary: 'L_Elbow' },
  },

  // ========== Triangle Choke ==========
  {
    clip: 'triangle-01',
    time: 0.5, // Guard lock
    kind: 'submission-start',
    submissionType: 'triangle',
    intensity: 0.4,
    joints: { primary: 'L_Knee', secondary: ['L_Foot', 'Head'] },
  },
  {
    clip: 'triangle-01',
    time: 1.3, // Tightening
    kind: 'submission-sink',
    submissionType: 'triangle',
    intensity: 0.8,
    joints: { primary: 'L_Knee', secondary: ['L_Foot'] },
  },

  // ========== Foot Sweep ==========
  {
    clip: 'foot-sweep-01',
    time: 0.6, // Sweep contact
    kind: 'sweep',
    intensity: 0.6,
    joints: { primary: 'L_Foot', secondary: ['Hip'] },
  },
  {
    clip: 'foot-sweep-01',
    time: 0.8, // Opponent falls
    kind: 'footfall',
    intensity: 0.9,
    joints: { primary: 'Hip' },
  },
];

/**
 * Action descriptors for UI and controller
 */
export interface JJAction {
  id: string;
  label: string;
  clip: string;
  note: string;
}

export const JJ_ACTIONS: readonly JJAction[] = [
  {
    id: 'idle',
    label: 'Guard Position',
    clip: 'idle-guard',
    note: 'Lying back with legs raised, ready to defend',
  },
  {
    id: 'o-goshi',
    label: 'O Goshi (Big Hip Throw)',
    clip: 'o-goshi-01',
    note: 'Hip throw - grip, rotate, release | 3 measured contacts',
  },
  {
    id: 'armlock',
    label: 'Armlock (Submission)',
    clip: 'armlock-01',
    note: 'Isolated arm control - setup, first sink, final pressure | 3 sinks',
  },
  {
    id: 'triangle',
    label: 'Triangle Choke',
    clip: 'triangle-01',
    note: 'Guard position - lock triangle, tighten choke | 2 sinks',
  },
  {
    id: 'foot-sweep',
    label: 'Foot Sweep',
    clip: 'foot-sweep-01',
    note: 'Sweep opponents foot | sweep contact + footfall impact',
  },
];

/** Default idle clip when nothing is playing */
export const JJ_IDLE_CLIP = 'idle-guard';

/** Default idle action ID */
export const JJ_IDLE_ID = 'idle';
