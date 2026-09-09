# Jiu-Jitsu Fighter 3D

A 3D jiu-jitsu fighter with **measured animations** and **synchronized visual effects**, built with Three.js, TypeScript, and Vite.

Inspired by the [img2threejs-showcase boxing-man demo](https://github.com/img2threejs/img2threejs-showcase), this project demonstrates:

- ✅ Rigged character with 40+ bones (skeleton)
- ✅ Measured animation events (throws, submissions, sweeps)
- ✅ Synchronized VFX system (particle effects, impacts, hitstop)
- ✅ Hitstop (slow-motion) during throws and submissions
- ✅ Pooled particle system for performance

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will open at http://localhost:5173

## Architecture

```
src/
├── main.ts                              # Entry point, scene setup
├── demos/jiu-jitsu-fighter/
│   ├── jjShowcase.ts                    # Main orchestrator (animation scheduler + VFX)
│   ├── jjEvents.ts                      # Measured event timings (throws, submissions, etc)
│   └── jjVfx.ts                         # Visual effects system (particles, impacts, glows)
```

### How It Works

1. **Animation Playback** (`jjShowcase.ts`)
   - Plays animation clips with precise timing
   - Measures every frame to detect events

2. **Event Scheduling** (`jjEvents.ts`)
   - Contains all measured timings for actions
   - Each event specifies: time, intensity, involved joints
   - Events are checked every frame

3. **Visual Effects** (`jjVfx.ts`)
   - Fires effects when events are triggered
   - Particle pools for performance (no allocation per frame)
   - Synchronized with animation via measured timings

4. **Hitstop**
   - 75% slowdown for throws (125ms)
   - 90% slowdown for submissions (200ms)
   - Creates "impact" feeling

## Adding Your Own Animations

### Step 1: Add Event Data

Edit `jjEvents.ts`:

```typescript
export const JJ_EVENTS: readonly JJEvent[] = [
  {
    clip: 'your-move-01',
    time: 1.5,           // seconds into clip
    kind: 'throw',       // or 'submission-start', 'sweep', etc
    intensity: 0.8,      // 0-1
    joints: { primary: 'Hip' },
  },
  // ... more events
];
```

### Step 2: Add Action

Add to `JJ_ACTIONS`:

```typescript
{
  id: 'your-move',
  label: 'Your Move Name',
  clip: 'your-move-01',
  note: 'Description of what happens',
}
```

### Step 3: Test

Run `npm run dev` and click the action button to test!

## Measuring Animation Events

To extract event timings from your animations:

1. Load animation in Three.js
2. Sample bones at high rate (400 Hz = every 2.5ms)
3. Track key joints (Hip, hands, feet)
4. Identify peaks: velocity maxima, contact points
5. Record time, intensity, involved bones

Example:

```typescript
const mixer = new THREE.AnimationMixer(rig);
const action = mixer.clipAction(clip);
action.play();

for (let time = 0; time < clip.duration; time += 0.0025) {
  mixer.update(0.0025);
  
  // Check for events
  const hipPos = getWorldPosition(skeleton, 'Hip');
  const handSpeed = calculateSpeed(hand, lastHand);
  
  if (handSpeed > threshold && hipDist > minReach) {
    console.log(`Event at ${time.toFixed(3)}s, speed: ${handSpeed}`);
    // Record this!
  }
}
```

## TODO

- [ ] Load actual 3D model (GLB/FBX with rigged character)
- [ ] Connect to real skeleton bones
- [ ] Build submission glow indicators (color-coded by type)
- [ ] Add ragdoll opponent (for throws)
- [ ] Cinematic camera controls
- [ ] UI panel to switch actions
- [ ] Audio (impact sounds, mat contact)

## Resources

- [img2threejs-showcase](https://github.com/img2threejs/img2threejs-showcase) - Inspiration
- [Three.js Documentation](https://threejs.org/docs/)
- [SkinnedMesh & Animation](https://threejs.org/docs/index.html#api/en/objects/SkinnedMesh)
- [Jiu-Jitsu Technique Reference](https://www.ibjjf.org/)

## License

MIT
