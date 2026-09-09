import * as THREE from 'three';

/**
 * Jiu-Jitsu VFX System
 *
 * Handles all visual effects:
 * - Throw impacts (air tear, mat contact, sweat spray)
 * - Submission visual feedback (joint pressure glow, pulse)
 * - Sweep effects (mat dust)
 * - Footfalls (mat dust, impact ripple)
 * - Breathing and organic motion
 *
 * Everything is pooled for performance and synced to measured event timings.
 */

const PARTICLE_CAPACITY = 500;
const DUST_CAPACITY = 300;

interface ParticlePool {
  positions: Float32Array;
  velocities: Float32Array;
  ages: Float32Array;
  lifespans: Float32Array;
  cursor: number;
}

export interface JJVfx {
  group: THREE.Group;
  throw(contact: THREE.Vector3, direction: THREE.Vector3, power: number): void;
  submissionStart(contact: THREE.Vector3, type: string): void;
  submissionSink(contact: THREE.Vector3, type: string, intensity: number): void;
  sweep(contact: THREE.Vector3, direction: THREE.Vector3): void;
  footfall(contact: THREE.Vector3, intensity: number): void;
  update(dt: number): void;
  dispose(): void;
}

export function createJJVfx(): JJVfx {
  const group = new THREE.Group();
  group.name = 'jj-vfx';
  group.userData.isHighlight = true;

  // Scratch vectors (reused, no allocation per frame)
  const scratchA = new THREE.Vector3();
  const scratchB = new THREE.Vector3();
  const scratchC = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  // ============================================================================
  // Particle System Setup
  // ============================================================================

  const particles: ParticlePool = {
    positions: new Float32Array(PARTICLE_CAPACITY * 3),
    velocities: new Float32Array(PARTICLE_CAPACITY * 3),
    ages: new Float32Array(PARTICLE_CAPACITY),
    lifespans: new Float32Array(PARTICLE_CAPACITY),
    cursor: 0,
  };

  // Mark all as dead initially
  particles.ages.fill(1);
  particles.lifespans.fill(1);

  const dustParticles: ParticlePool = {
    positions: new Float32Array(DUST_CAPACITY * 3),
    velocities: new Float32Array(DUST_CAPACITY * 3),
    ages: new Float32Array(DUST_CAPACITY),
    lifespans: new Float32Array(DUST_CAPACITY),
    cursor: 0,
  };

  dustParticles.ages.fill(1);
  dustParticles.lifespans.fill(1);

  // ============================================================================
  // API Functions
  // ============================================================================

  function emitParticles(
    pool: ParticlePool,
    count: number,
    origin: THREE.Vector3,
    velocity: THREE.Vector3,
    lifespan: number
  ): void {
    for (let i = 0; i < count; i += 1) {
      const idx = pool.cursor;
      pool.cursor = (pool.cursor + 1) % PARTICLE_CAPACITY;

      const idx3 = idx * 3;
      pool.positions[idx3] = origin.x + (Math.random() - 0.5) * 0.05;
      pool.positions[idx3 + 1] = origin.y + (Math.random() - 0.5) * 0.05;
      pool.positions[idx3 + 2] = origin.z + (Math.random() - 0.5) * 0.05;

      pool.velocities[idx3] = velocity.x + (Math.random() - 0.5) * 0.3;
      pool.velocities[idx3 + 1] = velocity.y + (Math.random() - 0.5) * 0.3;
      pool.velocities[idx3 + 2] = velocity.z + (Math.random() - 0.5) * 0.3;

      pool.ages[idx] = 0;
      pool.lifespans[idx] = lifespan + Math.random() * lifespan * 0.3;
    }
  }

  const vfx: JJVfx = {
    group,

    throw(contact: THREE.Vector3, direction: THREE.Vector3, power: number): void {
      // Mat dust particles thrown upward
      const dustVel = direction.clone().multiplyScalar(power * 2);
      dustVel.y = Math.abs(dustVel.y) + 1.5;
      emitParticles(dustParticles, Math.round(20 * power), contact, dustVel, 0.8);

      // Sweat spray
      const sweatVel = direction.clone().multiplyScalar(power * 1.5);
      sweatVel.y += 0.5;
      emitParticles(particles, Math.round(12 * power), contact, sweatVel, 0.6);

      // TODO: Add visual effects
      // - Ring/impact flash at contact
      // - Speed lines in throw direction
      // - Impact light spike
    },

    submissionStart(contact: THREE.Vector3, type: string): void {
      // Pulse at submission joint
      console.log(`[Submission Start] ${type} at`, contact);

      // TODO: Add visual effects
      // - Glow at joint (color coded by submission type)
      // - Tension pulse animation
    },

    submissionSink(contact: THREE.Vector3, type: string, intensity: number): void {
      // Increase pressure visual
      console.log(`[Submission Sink] ${type} intensity: ${intensity}`);

      // Sweat particles
      emitParticles(
        particles,
        Math.round(8 * intensity),
        contact,
        new THREE.Vector3(0, 0.2, 0),
        0.5
      );

      // TODO: Add visual effects
      // - Glow pulse (brighter with intensity)
      // - Screen vignette (for tap tap experience)
      // - Joint color shift (red for danger)
    },

    sweep(contact: THREE.Vector3, direction: THREE.Vector3): void {
      // Mat dust from sweep motion
      const sweepVel = direction.clone().multiplyScalar(1.5);
      sweepVel.y = 0.5;
      emitParticles(dustParticles, 25, contact, sweepVel, 0.9);

      // TODO: Add visual effects
      // - Circular dust cloud expanding
      // - Opponent falling (ragdoll)
    },

    footfall(contact: THREE.Vector3, intensity: number): void {
      // Mat dust impact
      const dustVel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.3 + Math.random() * 0.5,
        (Math.random() - 0.5) * 2
      );
      emitParticles(
        dustParticles,
        Math.round(15 * intensity),
        contact,
        dustVel,
        0.7
      );

      // TODO: Add visual effects
      // - Impact ripple on mat
      // - Grit sparks (small bright particles)
    },

    update(dt: number): void {
      const stepDt = Math.min(0.033, Math.max(0, dt));

      // Update particle pool (hot particles: sweat, sparks)
      for (let i = 0; i < PARTICLE_CAPACITY; i += 1) {
        if (particles.ages[i] >= 1) continue;

        const i3 = i * 3;
        // Apply gravity
        particles.velocities[i3 + 1] -= 9.8 * stepDt;

        // Apply drag
        const dragDecay = Math.max(0, 1 - 1.5 * stepDt);
        particles.velocities[i3] *= dragDecay;
        particles.velocities[i3 + 2] *= dragDecay;

        // Update position
        particles.positions[i3] += particles.velocities[i3] * stepDt;
        particles.positions[i3 + 1] += particles.velocities[i3 + 1] * stepDt;
        particles.positions[i3 + 2] += particles.velocities[i3 + 2] * stepDt;

        // Advance age
        particles.ages[i] += stepDt / particles.lifespans[i];
      }

      // Update dust pool (slower, longer-lived)
      for (let i = 0; i < DUST_CAPACITY; i += 1) {
        if (dustParticles.ages[i] >= 1) continue;

        const i3 = i * 3;
        // Dust floats (negative gravity)
        dustParticles.velocities[i3 + 1] -= 0.5 * stepDt;

        // Higher drag for dust
        const dragDecay = Math.max(0, 1 - 3.0 * stepDt);
        dustParticles.velocities[i3] *= dragDecay;
        dustParticles.velocities[i3 + 2] *= dragDecay;

        // Update position
        dustParticles.positions[i3] += dustParticles.velocities[i3] * stepDt;
        dustParticles.positions[i3 + 1] += dustParticles.velocities[i3 + 1] * stepDt;
        dustParticles.positions[i3 + 2] += dustParticles.velocities[i3 + 2] * stepDt;

        // Advance age
        dustParticles.ages[i] += stepDt / dustParticles.lifespans[i];
      }
    },

    dispose(): void {
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    },
  };

  return vfx;
}
