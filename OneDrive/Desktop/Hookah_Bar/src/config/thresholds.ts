export const INTERACTION_CONFIG = {
  // Proximity thresholds in normalized coordinates (0..1 screen space)
  grabThreshold: 0.20,
  pipeDropThreshold: 0.35, // Hand has to move away to drop the pipe
  mouthThreshold: 0.18,
  pipeRemovalThreshold: 0.18,

  // Timing thresholds in milliseconds
  mouthHoldDuration: 250,      // stability check before inhale starts
  inhaleDuration: 2000,         // inhale effect duration
  blowMinDuration: 200,        // blow facial gesture duration
  blowTimeout: 6000,           // time user has to blow before reverting

  // Smoothing
  smoothingFactor: 0.26,       // lerp factor (0 = frozen, 1 = instantaneous/noisy)
  pipeRotationSmoothing: 0.22,

  // Facial geometry thresholds
  // MAR = mouthHeight / mouthWidth
  blowPuckerThreshold: 0.25,   // Blendshape / metric score for puckered lips
  openMouthThreshold: 0.22,

  // Smoke system configuration
  smokeParticleCount: 110,
  smokeLifetimeMin: 1800,
  smokeLifetimeMax: 3500,
  smokeExpansionRate: 1.025,
  smokeDriftSpeed: 0.65,
};
