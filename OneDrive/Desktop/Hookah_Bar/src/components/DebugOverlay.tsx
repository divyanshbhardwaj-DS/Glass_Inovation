import React, { useRef, useEffect } from 'react';
import type { HandTrackingResult, FaceTrackingResult, Point2D } from '../types';
import { INTERACTION_CONFIG } from '../config/thresholds';

interface DebugOverlayProps {
  hand: HandTrackingResult | null;
  face: FaceTrackingResult | null;
  pipeGrabPoint: Point2D;
  pipeTipPoint: Point2D;
  width: number;
  height: number;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  hand,
  face,
  pipeGrabPoint,
  pipeTipPoint,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Pipe Grab Threshold Area
    ctx.beginPath();
    ctx.arc(
      pipeGrabPoint.x * width,
      pipeGrabPoint.y * height,
      INTERACTION_CONFIG.grabThreshold * width,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pipe grab center point
    ctx.beginPath();
    ctx.arc(pipeGrabPoint.x * width, pipeGrabPoint.y * height, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // 2. Draw Hand Landmarks
    if (hand && hand.handDetected && hand.rawLandmarks) {
      const landmarks = hand.rawLandmarks;
      // Draw bones/connections
      const connections: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 4], // thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // index
        [5, 9], [9, 10], [10, 11], [11, 12], // middle
        [9, 13], [13, 14], [14, 15], [15, 16], // ring
        [13, 17], [17, 18], [18, 19], [19, 20], // pinky
        [0, 17], // palm base
      ];

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 2;
      for (const [startIdx, endIdx] of connections) {
        if (landmarks[startIdx] && landmarks[endIdx]) {
          const p1 = landmarks[startIdx];
          const p2 = landmarks[endIdx];
          ctx.beginPath();
          ctx.moveTo((1 - p1.x) * width, p1.y * height);
          ctx.lineTo((1 - p2.x) * width, p2.y * height);
          ctx.stroke();
        }
      }

      // Draw landmark nodes
      landmarks.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc((1 - p.x) * width, p.y * height, idx === 8 ? 6 : 3, 0, Math.PI * 2);
        ctx.fillStyle = idx === 8 ? '#10b981' : 'rgba(52, 211, 153, 0.8)';
        ctx.fill();
      });

      // Line from hand center to pipe grab point
      ctx.beginPath();
      ctx.moveTo(hand.x * width, hand.y * height);
      ctx.lineTo(pipeGrabPoint.x * width, pipeGrabPoint.y * height);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Mouth Landmarks & Mouth Center
    if (face && face.faceDetected) {
      const mx = face.mouthX * width;
      const my = face.mouthY * height;

      // Mouth center indicator
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mouth Threshold boundary
      ctx.beginPath();
      ctx.arc(mx, my, INTERACTION_CONFIG.mouthThreshold * width, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance line from Pipe tip to mouth
      ctx.beginPath();
      ctx.moveTo(pipeTipPoint.x * width, pipeTipPoint.y * height);
      ctx.lineTo(mx, my);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Telemetry Text
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`MAR: ${face.mouthAspectRatio.toFixed(2)}`, mx + 16, my - 12);
      ctx.fillText(`Pucker: ${face.puckerScore.toFixed(2)}`, mx + 16, my + 4);
    }
  }, [hand, face, pipeGrabPoint, pipeTipPoint, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-20"
    />
  );
};
