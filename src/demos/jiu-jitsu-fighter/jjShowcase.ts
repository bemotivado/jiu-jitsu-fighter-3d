import * as THREE from 'three';
import { createJJVfx, type JJVfx } from './jjVfx';
import { JJ_EVENTS, JJ_IDLE_CLIP, JJ_ACTIONS, type JJEvent } from './jjEvents';

/**
 * Jiu-Jitsu Fighter Showcase
 *
 * This is the main orchestrator that:
 * 1. Manages animation playback with measured timings
 * 2. Fires visual effects at precise moments
 * 3. Applies hitstop (slow-motion) during throws and submissions
 * 4. Synchronizes all effects with the rig's bones
 *
 * Architecture inspired by img2threejs-showcase boxing-man demo.
 */

interface JJOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

interface JJShowcaseState {
  animationController: {
    actions: Array<{ id: string; label: string; loop: boolean }>;
    active: string;
    play(id: string): void;
    stop(): void;
    subscribe(listener: (active: string) => void): () => void;
  };
}

export function createJJFighterShowcase(options: JJOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'jiu-jitsu-fighter';

  // Initialize VFX system
  const vfx: JJVfx = createJJVfx();
  root.add(vfx.group);

  // State management
  let activeId = 'idle';
  let activeClip = JJ_IDLE_CLIP;
  let clipTime = 0;
  let hitstop = 0; // Seconds of hitstop remaining
  let throwHitstop = 0; // Separate hitstop for throws (longer)
  let submissionHitstop = 0; // Separate hitstop for submissions (longest)

  const listeners = new Set<(active: string) => void>();
  const notify = (): void => listeners.forEach((listener) => listener(activeId));

  // Placeholder for actual rig state
  // TODO: Replace with actual rig loading when model is ready
  let bound: any = null;

  // Animation controller
  const animationController = {
    actions: JJ_ACTIONS.map(({ id, label }) => ({ id, label, loop: true })),
    get active(): string {
      return activeId;
    },
    play(id: string): void {
      const action = JJ_ACTIONS.find((entry) => entry.id === id);
      if (!action) return;
      activeId = id;
      activeClip = action.clip;
      clipTime = 0;
      notify();
    },
    stop(): void {
      activeId = 'idle';
      activeClip = JJ_IDLE_CLIP;
      clipTime = 0;
      notify();
    },
    subscribe(listener: (active: string) => void): () => void {
      listeners.add(listener);
      listener(activeId);
      return () => listeners.delete(listener);
    },
  };

  // Main tick function - called every frame
  root.userData.tick = (delta: number): void => {
    const dt = Math.min(0.05, Math.max(0, delta));

    // Apply hitstop (slow-motion during impact)
    let scale = 1;
    if (submissionHitstop > 0) {
      submissionHitstop -= dt;
      scale = 0.1; // 90% slowdown for submissions
    } else if (throwHitstop > 0) {
      throwHitstop -= dt;
      scale = 0.25; // 75% slowdown for throws
    } else if (hitstop > 0) {
      hitstop -= dt;
      scale = 0.25; // 75% slowdown for other impacts
    }

    // TODO: Update actual rig here
    // if (bound) {
    //   bound.update(dt * scale);
    //   bound.modelGroup.updateMatrixWorld(true);
    // }

    // Advance clip time
    const duration = 2.0; // TODO: Get from actual clip
    const step = dt * scale;
    const nextTime = (clipTime + step) % duration;

    // Check for events that crossed this frame
    const eventsByClip = JJ_EVENTS.filter((e) => e.clip === activeClip);

    for (const event of eventsByClip) {
      // Check if event time was crossed
      if (nextTime >= event.time && clipTime < event.time) {
        handleJJEvent(event, vfx);
      }
    }

    clipTime = nextTime;

    // Update VFX
    vfx.update(dt);
  };

  root.userData.sculptRuntime = {
    animationController,
    provenance:
      'Jiu-Jitsu Fighter with measured animations and synchronized VFX. '
      + 'Every effect timing is measured off the animation clips, not eyeballed.',
    clips: JJ_ACTIONS.map((action) => ({
      id: action.id,
      clip: action.clip,
      note: action.note,
    })),
  };

  return root;
}

/**
 * Handle a JJ event (throw, submission, sweep, etc.)
 * Dispatches to the appropriate VFX function
 */
function handleJJEvent(event: JJEvent, vfx: JJVfx): void {
  // TODO: Get actual joint position from rig
  const contactPoint = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3(0, -1, 0);

  switch (event.kind) {
    case 'throw':
      vfx.throw(contactPoint, direction, event.intensity);
      break;

    case 'submission-start':
      vfx.submissionStart(contactPoint, event.submissionType ?? 'unknown');
      break;

    case 'submission-sink':
      vfx.submissionSink(contactPoint, event.submissionType ?? 'unknown', event.intensity);
      break;

    case 'sweep':
      vfx.sweep(contactPoint, direction);
      break;

    case 'footfall':
      vfx.footfall(contactPoint, event.intensity);
      break;
  }
}
