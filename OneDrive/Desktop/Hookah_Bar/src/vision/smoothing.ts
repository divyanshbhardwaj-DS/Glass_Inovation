import type { Point2D } from '../types';

/**
 * Standard linear interpolation
 */
export function lerp(start: number, target: number, factor: number): number {
  return start + (target - start) * factor;
}

/**
 * Angle interpolation accounting for 360/2PI wrapping
 */
export function lerpAngle(start: number, target: number, factor: number): number {
  let diff = (target - start) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return start + diff * factor;
}

/**
 * Exponential 2D Point Smoother to eliminate camera jitter
 */
export class PointSmoother {
  private current: Point2D | null = null;
  private factor: number;

  constructor(factor: number = 0.25) {
    this.factor = factor;
  }

  public setFactor(factor: number) {
    this.factor = Math.max(0.01, Math.min(1, factor));
  }

  public update(target: Point2D): Point2D {
    if (!this.current) {
      this.current = { x: target.x, y: target.y };
      return this.current;
    }

    this.current.x = lerp(this.current.x, target.x, this.factor);
    this.current.y = lerp(this.current.y, target.y, this.factor);

    return { x: this.current.x, y: this.current.y };
  }

  public get(): Point2D | null {
    return this.current ? { ...this.current } : null;
  }

  public reset(point?: Point2D) {
    this.current = point ? { ...point } : null;
  }
}
