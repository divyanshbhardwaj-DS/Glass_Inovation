import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { SmokeEngine } from '../effects/smokeSystem';
import type { HookahConfig } from '../types';

export interface SmokeCanvasHandle {
  emit: (x: number, y: number, count?: number) => void;
  clear: () => void;
}

interface SmokeCanvasProps {
  config: HookahConfig;
  width: number;
  height: number;
}

export const SmokeCanvas = forwardRef<SmokeCanvasHandle, SmokeCanvasProps>(
  ({ config, width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<SmokeEngine | null>(null);

    // Initialize SmokeEngine
    useEffect(() => {
      engineRef.current = new SmokeEngine(140);

      // Parse colors from config
      // Convert '#f59e0b' or 'rgba(...)' to primary/secondary rgb
      if (config.id === 'neon') {
        engineRef.current.setColors('220, 245, 255', '192, 132, 252');
      } else if (config.id === 'premium') {
        engineRef.current.setColors('245, 250, 248', '180, 220, 200');
      } else if (config.id === 'classic') {
        engineRef.current.setColors('245, 240, 235', '220, 210, 200');
      } else {
        engineRef.current.setColors('248, 250, 252', '148, 163, 184');
      }
    }, [config]);

    // Animation Loop
    useEffect(() => {
      let animId: number;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loop = () => {
        ctx.clearRect(0, 0, width, height);

        if (engineRef.current) {
          engineRef.current.update();
          engineRef.current.render(ctx);
        }

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animId);
    }, [width, height]);

    useImperativeHandle(ref, () => ({
      emit: (x: number, y: number, count = 8) => {
        if (engineRef.current) {
          engineRef.current.emit(x, y, count);
        }
      },
      clear: () => {
        if (engineRef.current) {
          engineRef.current.clear();
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none z-25"
      />
    );
  }
);

SmokeCanvas.displayName = 'SmokeCanvas';
