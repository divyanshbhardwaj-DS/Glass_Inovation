import { FilesetResolver, HandLandmarker, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { HandTrackingResult, FaceTrackingResult } from '../types';
import { computeHandMetrics, computeMouthMetrics } from './landmarkUtils';

export class VisionManager {
  private handLandmarker: HandLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private lastHandResult: HandTrackingResult | null = null;
  private lastFaceResult: FaceTrackingResult | null = null;

  public async initialize(onProgress?: (msg: string) => void): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      onProgress?.('Loading Vision WebAssembly runtime...');
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('/wasm');
      } catch (localWasmErr) {
        console.warn('Local wasm failed, falling back to CDN', localWasmErr);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      onProgress?.('Loading Hand Landmarker model...');
      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      } catch {
        console.warn('Falling back to CPU delegate for Hand Landmarker');
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      }

      onProgress?.('Loading Face Landmarker model...');
      try {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.35,
          minFacePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      } catch {
        console.warn('Falling back to CPU delegate for Face Landmarker');
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
            delegate: 'CPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.35,
          minFacePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      }

      this.isInitialized = true;
      this.isInitializing = false;
      onProgress?.('Computer vision models ready');
      return true;
    } catch (err) {
      console.error('Failed to initialize vision models:', err);
      this.isInitializing = false;
      return false;
    }
  }

  private lastHandTimestamp: number = 0;
  private lastFaceTimestamp: number = 0;

  public processVideoFrame(
    video: HTMLVideoElement,
    timestamp: number
  ): {
    hand: HandTrackingResult | null;
    face: FaceTrackingResult | null;
  } {
    if (!this.isInitialized || video.readyState < 2 || video.videoWidth === 0) {
      return { hand: this.lastHandResult, face: this.lastFaceResult };
    }

    const nowMs = Math.max(Math.round(performance.now()), Math.round(timestamp));

    // 1. Process Hand
    if (this.handLandmarker && nowMs > this.lastHandTimestamp) {
      this.lastHandTimestamp = nowMs;
      try {
        const handResult = this.handLandmarker.detectForVideo(video, nowMs);
        if (handResult && handResult.landmarks && handResult.landmarks.length > 0) {
          const landmarks = handResult.landmarks[0];
          const metrics = computeHandMetrics(landmarks);

          this.lastHandResult = {
            handDetected: true,
            x: metrics.handCenter.x,
            y: metrics.handCenter.y,
            confidence: 0.9,
            indexFinger: metrics.indexFinger,
            palm: metrics.palmCenter,
            rawLandmarks: landmarks,
          };
        } else {
          this.lastHandResult = {
            handDetected: false,
            x: 0.5,
            y: 0.5,
            confidence: 0,
            indexFinger: { x: 0.5, y: 0.5 },
            palm: { x: 0.5, y: 0.5 },
          };
        }
      } catch (e) {
        console.warn('Hand detection error:', e);
      }
    }

    // 2. Process Face
    if (this.faceLandmarker && nowMs > this.lastFaceTimestamp) {
      this.lastFaceTimestamp = nowMs;
      try {
        const faceResult = this.faceLandmarker.detectForVideo(video, nowMs);
        if (faceResult && faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
          const landmarks = faceResult.faceLandmarks[0];
          const mouth = computeMouthMetrics(landmarks);

          // Check MediaPipe blendshapes if present for mouthPucker / mouthFunnel
          let blendshapePucker = 0;
          if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
            const categories = faceResult.faceBlendshapes[0].categories;
            const puckerCat = categories.find((c) => c.categoryName === 'mouthPucker');
            const funnelCat = categories.find((c) => c.categoryName === 'mouthFunnel');
            const puckerVal = puckerCat ? puckerCat.score : 0;
            const funnelVal = funnelCat ? funnelCat.score : 0;
            blendshapePucker = Math.max(puckerVal, funnelVal);
          }

          const combinedPucker = Math.max(mouth.puckerScore, blendshapePucker);

          this.lastFaceResult = {
            faceDetected: true,
            mouthX: mouth.mouthCenter.x,
            mouthY: mouth.mouthCenter.y,
            mouthWidth: mouth.mouthWidth,
            mouthHeight: mouth.mouthHeight,
            mouthAspectRatio: mouth.mar,
            puckerScore: combinedPucker,
            rawLandmarks: landmarks,
          };
        } else {
          this.lastFaceResult = {
            faceDetected: false,
            mouthX: 0.5,
            mouthY: 0.5,
            mouthWidth: 0,
            mouthHeight: 0,
            mouthAspectRatio: 0,
            puckerScore: 0,
          };
        }
      } catch (e) {
        console.warn('Face detection error:', e);
      }
    }

    return { hand: this.lastHandResult, face: this.lastFaceResult };
  }

  public destroy() {
    this.handLandmarker?.close();
    this.faceLandmarker?.close();
    this.handLandmarker = null;
    this.faceLandmarker = null;
    this.isInitialized = false;
  }
}

export const visionManager = new VisionManager();
