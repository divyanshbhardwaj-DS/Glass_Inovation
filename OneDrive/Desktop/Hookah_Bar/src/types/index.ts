export type InteractionState =
  | 'IDLE'
  | 'HOOKAH_SELECTION'
  | 'CAMERA_REQUESTED'
  | 'CAMERA_READY'
  | 'TRACKING_INITIALIZING'
  | 'HAND_SEARCH'
  | 'READY_TO_GRAB'
  | 'PIPE_GRABBED'
  | 'MOVING_TO_MOUTH'
  | 'PIPE_NEAR_MOUTH'
  | 'INHALING'
  | 'INHALED'
  | 'PIPE_REMOVED'
  | 'EXHALE_READY'
  | 'BLOW_DETECTED'
  | 'SMOKE_ACTIVE'
  | 'SMOKE_COOLDOWN';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z?: number;
}

export interface HandTrackingResult {
  handDetected: boolean;
  x: number; // 0..1 normalized (mirrored horizontally)
  y: number; // 0..1 normalized
  confidence: number;
  indexFinger: Point2D;
  palm: Point2D;
  rawLandmarks?: Point3D[];
}

export interface FaceTrackingResult {
  faceDetected: boolean;
  mouthX: number; // 0..1 normalized (mirrored horizontally)
  mouthY: number; // 0..1 normalized
  mouthWidth: number;
  mouthHeight: number;
  mouthAspectRatio: number;
  puckerScore: number;
  rawLandmarks?: Point3D[];
}

export interface GestureResult {
  isGrabbing: boolean;
  isNearMouth: boolean;
  isBlowing: boolean;
  distanceToPipe: number;
  distancePipeToMouth: number;
  confidence: number;
}

export type HookahModelId = 'classic' | 'premium' | 'neon' | 'modern';

export interface HookahConfig {
  id: HookahModelId;
  name: string;
  tagline: string;
  description: string;
  flavor: string;
  accentColor: string;
  glowColor: string;
  smokeColor: string;
  smokeSecondaryColor: string;
  baseColor: string;
  stemColor: string;
  bowlColor: string;
  hoseColor: string;
  badge: string;
}

export interface TrackingDebugInfo {
  fps: number;
  faceFps: number;
  handFps: number;
  mouthDistance: number;
  grabDistance: number;
  mar: number;
  pucker: number;
  holdTime: number;
}
