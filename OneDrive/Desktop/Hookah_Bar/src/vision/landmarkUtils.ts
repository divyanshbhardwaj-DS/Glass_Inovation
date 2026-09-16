import type { Point2D, Point3D } from '../types';

export const MEDIA_PIPE_FACE_LANDMARKS = {
  LIP_TOP: 13,
  LIP_BOTTOM: 14,
  LIP_LEFT: 61,
  LIP_RIGHT: 291,
  UPPER_LIP_OUTER: 0,
  LOWER_LIP_OUTER: 17,
  NOSE_TIP: 1,
  CHIN: 152,
  LEFT_EYE: 33,
  RIGHT_EYE: 263,
};

export const MEDIA_PIPE_HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_TIP: 16,
  PINKY_TIP: 20,
};

/**
 * Calculates 2D Euclidean distance between two points
 */
export function distance2D(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Mirror X coordinate for natural webcam mirror behavior
 */
export function mirrorNormalizedX(x: number): number {
  return 1 - x;
}

/**
 * Convert normalized 0..1 coordinates into screen pixel coordinates
 */
export function normalizedToScreen(
  point: Point2D,
  screenWidth: number,
  screenHeight: number,
  mirrored: boolean = true
): Point2D {
  const nx = mirrored ? mirrorNormalizedX(point.x) : point.x;
  return {
    x: nx * screenWidth,
    y: point.y * screenHeight,
  };
}

/**
 * Calculate Mouth Aspect Ratio (MAR) and Puckering metric
 */
export function computeMouthMetrics(landmarks: Point3D[]): {
  mouthCenter: Point2D;
  mouthWidth: number;
  mouthHeight: number;
  mar: number;
  puckerScore: number;
} {
  const lipTop = landmarks[MEDIA_PIPE_FACE_LANDMARKS.LIP_TOP];
  const lipBottom = landmarks[MEDIA_PIPE_FACE_LANDMARKS.LIP_BOTTOM];
  const lipLeft = landmarks[MEDIA_PIPE_FACE_LANDMARKS.LIP_LEFT];
  const lipRight = landmarks[MEDIA_PIPE_FACE_LANDMARKS.LIP_RIGHT];
  const nose = landmarks[MEDIA_PIPE_FACE_LANDMARKS.NOSE_TIP];
  const chin = landmarks[MEDIA_PIPE_FACE_LANDMARKS.CHIN];
  const leftEye = landmarks[MEDIA_PIPE_FACE_LANDMARKS.LEFT_EYE];
  const rightEye = landmarks[MEDIA_PIPE_FACE_LANDMARKS.RIGHT_EYE];

  // Mirror X for natural front-camera display
  const mouthCenterX = mirrorNormalizedX((lipLeft.x + lipRight.x) / 2);
  const mouthCenterY = (lipTop.y + lipBottom.y) / 2;

  const mouthWidth = distance2D(lipLeft, lipRight);
  const mouthHeight = distance2D(lipTop, lipBottom);
  // faceWidth used to normalize mouth width for pucker detection
  const faceWidth = (distance2D(leftEye, rightEye) || 0.15) + (distance2D(nose, chin) || 0.15) * 0;

  // MAR = how open the mouth is
  const mar = mouthWidth > 0 ? mouthHeight / mouthWidth : 0;

  // Pucker score: when blowing/puckering lips narrow relative to face width
  // and MAR is low (lips pushed together / rounded)
  const normalizedMouthWidth = mouthWidth / faceWidth;
  // normalizedMouthWidth ~0.6-0.9 for relaxed, ~0.4-0.6 when puckered
  const puckerScore = Math.max(0, Math.min(1, (0.72 - normalizedMouthWidth) / 0.3));

  return {
    mouthCenter: { x: mouthCenterX, y: mouthCenterY },
    mouthWidth,
    mouthHeight,
    mar,
    puckerScore,
  };
}

/**
 * Calculate hand center of interaction (weighted between index tip and palm)
 */
export function computeHandMetrics(landmarks: Point3D[]): {
  handCenter: Point2D;
  indexFinger: Point2D;
  palmCenter: Point2D;
  isGripFormed: boolean;
} {
  const indexTip = landmarks[MEDIA_PIPE_HAND_LANDMARKS.INDEX_FINGER_TIP];
  const middleMcp = landmarks[MEDIA_PIPE_HAND_LANDMARKS.MIDDLE_FINGER_MCP];
  const wrist = landmarks[MEDIA_PIPE_HAND_LANDMARKS.WRIST];
  const thumbTip = landmarks[MEDIA_PIPE_HAND_LANDMARKS.THUMB_TIP];

  const palmX = mirrorNormalizedX((wrist.x + middleMcp.x) / 2);
  const palmY = (wrist.y + middleMcp.y) / 2;

  const indexX = mirrorNormalizedX(indexTip.x);
  const indexY = indexTip.y;

  // Center of interaction is slightly biased toward fingertip/pinch
  const handCenterX = indexX * 0.65 + palmX * 0.35;
  const handCenterY = indexY * 0.65 + palmY * 0.35;

  // Pinch/grip heuristic: distance between thumb tip and index tip
  const pinchDist = distance2D(thumbTip, indexTip);
  const isGripFormed = pinchDist < 0.085;

  return {
    handCenter: { x: handCenterX, y: handCenterY },
    indexFinger: { x: indexX, y: indexY },
    palmCenter: { x: palmX, y: palmY },
    isGripFormed,
  };
}
