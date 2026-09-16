import type { Point2D, HandTrackingResult, FaceTrackingResult, InteractionState } from '../types';
import { distance2D } from './landmarkUtils';
import { INTERACTION_CONFIG } from '../config/thresholds';

export class GestureDetector {
  private mouthHoldTimer: number = 0;
  private inhaleTimer: number = 0;
  private blowTimer: number = 0;
  private smokeTimer: number = 0;

  public update(
    currentState: InteractionState,
    hand: HandTrackingResult | null,
    face: FaceTrackingResult | null,
    pipeGrabPoint: Point2D,
    pipeTipPoint: Point2D,
    deltaMs: number,
    onStateTransition: (newState: InteractionState) => void,
    onBlowTriggered: (mouthPos: Point2D) => void
  ) {
    const handDetected = !!(hand && hand.handDetected);
    const faceDetected = !!(face && face.faceDetected);

    const distHandToPipe = handDetected
      ? distance2D({ x: hand!.x, y: hand!.y }, pipeGrabPoint)
      : 999;

    const distPipeToMouth = faceDetected
      ? distance2D(pipeTipPoint, { x: face!.mouthX, y: face!.mouthY })
      : 999;

    switch (currentState) {
      case 'TRACKING_INITIALIZING':
      case 'HAND_SEARCH':
        if (handDetected) onStateTransition('READY_TO_GRAB');
        break;

      case 'READY_TO_GRAB':
        if (handDetected && distHandToPipe < INTERACTION_CONFIG.grabThreshold) {
          onStateTransition('PIPE_GRABBED');
        }
        break;

      case 'PIPE_GRABBED':
      case 'MOVING_TO_MOUTH':
        if (faceDetected && distPipeToMouth < INTERACTION_CONFIG.mouthThreshold) {
          this.mouthHoldTimer += deltaMs;
          if (this.mouthHoldTimer >= INTERACTION_CONFIG.mouthHoldDuration) {
            this.mouthHoldTimer = 0;
            this.inhaleTimer = 0;
            onStateTransition('INHALING');
          } else {
            onStateTransition('PIPE_NEAR_MOUTH');
          }
        } else {
          this.mouthHoldTimer = 0;
        }
        break;

      case 'PIPE_NEAR_MOUTH':
        if (faceDetected && distPipeToMouth < INTERACTION_CONFIG.mouthThreshold) {
          this.mouthHoldTimer += deltaMs;
          if (this.mouthHoldTimer >= INTERACTION_CONFIG.mouthHoldDuration) {
            this.mouthHoldTimer = 0;
            this.inhaleTimer = 0;
            onStateTransition('INHALING');
          }
        } else {
          this.mouthHoldTimer = 0;
          onStateTransition('PIPE_GRABBED');
        }
        break;

      case 'INHALING':
        this.inhaleTimer += deltaMs;
        if (this.inhaleTimer >= INTERACTION_CONFIG.inhaleDuration) {
          this.inhaleTimer = 0;
          onStateTransition('INHALED');
        }
        break;

      case 'INHALED':
        // Move pipe away from mouth, OR just wait 1.5s
        if (distPipeToMouth > INTERACTION_CONFIG.pipeRemovalThreshold || !faceDetected) {
          onStateTransition('EXHALE_READY');
        }
        // Auto-advance after 1.5 seconds even if face is lost
        this.smokeTimer += deltaMs;
        if (this.smokeTimer > 1500) {
          this.smokeTimer = 0;
          onStateTransition('EXHALE_READY');
        }
        break;

      case 'PIPE_REMOVED':
      case 'EXHALE_READY': {
        if (faceDetected && face) {
          // Detect blowing via multiple signals:
          // 1. Blendshape pucker score from MediaPipe
          // 2. Mouth open (MAR > threshold)
          // 3. Cheek puff / any pronounced mouth movement
          const isPuckering = face.puckerScore > INTERACTION_CONFIG.blowPuckerThreshold;
          const isMouthOpen = face.mouthAspectRatio > INTERACTION_CONFIG.openMouthThreshold;
          const isBlowingShape = isPuckering || isMouthOpen;

          if (isBlowingShape) {
            this.blowTimer += deltaMs;
            if (this.blowTimer >= INTERACTION_CONFIG.blowMinDuration) {
              this.blowTimer = 0;
              this.smokeTimer = 0;
              onBlowTriggered({ x: face.mouthX, y: face.mouthY });
              onStateTransition('SMOKE_ACTIVE');
            }
          } else {
            this.blowTimer = Math.max(0, this.blowTimer - deltaMs * 0.5);
          }
        }
        break;
      }

      case 'SMOKE_ACTIVE':
        this.smokeTimer += deltaMs;
        if (faceDetected && face && this.smokeTimer < 2500) {
          onBlowTriggered({ x: face.mouthX, y: face.mouthY });
        }
        if (this.smokeTimer > 3500) {
          this.smokeTimer = 0;
          onStateTransition('SMOKE_COOLDOWN');
        }
        break;

      case 'SMOKE_COOLDOWN':
        this.smokeTimer += deltaMs;
        if (this.smokeTimer > 1200) {
          this.smokeTimer = 0;
          onStateTransition('READY_TO_GRAB');
        }
        break;

      default:
        break;
    }

    return { distHandToPipe, distPipeToMouth };
  }

  public reset() {
    this.mouthHoldTimer = 0;
    this.inhaleTimer = 0;
    this.blowTimer = 0;
    this.smokeTimer = 0;
  }
}
