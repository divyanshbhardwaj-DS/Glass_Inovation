export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  growthRate: number;
  alpha: number;
  maxAlpha: number;
  age: number;
  lifetime: number;
  rotation: number;
  rotationSpeed: number;
  turbulenceFreq: number;
  turbulenceAmp: number;
  phase: number;
}

export class SmokeEngine {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private maxParticles: number = 130;
  private primaryColor: string = '240, 240, 250';
  private secondaryColor: string = '200, 210, 230';

  constructor(maxParticles: number = 130) {
    this.maxParticles = maxParticles;
  }

  public setColors(primaryRgb: string, secondaryRgb: string) {
    this.primaryColor = primaryRgb;
    this.secondaryColor = secondaryRgb;
  }

  /**
   * Spawn a burst of smoke particles originating from mouth coordinates
   * @param x Screen X coordinate
   * @param y Screen Y coordinate
   * @param count Number of particles to spawn in this frame
   * @param directionAngle Direction of blowing (default slightly downward/forward)
   */
  public emit(x: number, y: number, count: number = 8, directionAngle: number = Math.PI / 2) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const spread = (Math.random() - 0.5) * 0.9;
      const angle = directionAngle + spread;
      const speed = 1.8 + Math.random() * 2.8;

      const particle: Particle = this.pool.pop() || {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        maxSize: 0,
        growthRate: 0,
        alpha: 0,
        maxAlpha: 0,
        age: 0,
        lifetime: 0,
        rotation: 0,
        rotationSpeed: 0,
        turbulenceFreq: 0,
        turbulenceAmp: 0,
        phase: 0,
      };

      particle.x = x + (Math.random() - 0.5) * 16;
      particle.y = y + (Math.random() - 0.5) * 14;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed * 0.5 - (0.8 + Math.random() * 1.2); // upward buoyancy
      particle.size = 14 + Math.random() * 16;
      particle.maxSize = 85 + Math.random() * 65;
      particle.growthRate = 1.02 + Math.random() * 0.02;
      particle.maxAlpha = 0.22 + Math.random() * 0.18;
      particle.alpha = 0.05;
      particle.age = 0;
      particle.lifetime = 65 + Math.floor(Math.random() * 55); // ~2-3 seconds at 60fps
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 0.02;
      particle.turbulenceFreq = 0.03 + Math.random() * 0.04;
      particle.turbulenceAmp = 0.8 + Math.random() * 1.2;
      particle.phase = Math.random() * Math.PI * 2;

      this.particles.push(particle);
    }
  }

  /**
   * Update particle physics and lifecycles
   */
  public update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age++;

      if (p.age >= p.lifetime) {
        this.particles.splice(i, 1);
        this.pool.push(p);
        continue;
      }

      const progress = p.age / p.lifetime;

      // Alpha curve: fast fade in, long plateau, soft fade out
      if (progress < 0.2) {
        p.alpha = (progress / 0.2) * p.maxAlpha;
      } else {
        p.alpha = (1 - (progress - 0.2) / 0.8) * p.maxAlpha;
      }

      // Expansion
      if (p.size < p.maxSize) {
        p.size *= p.growthRate;
      }

      // Aerodynamic drag + upward thermal draft + turbulence
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.vy -= 0.035; // buoyancy rising

      const turbulence = Math.sin(p.age * p.turbulenceFreq + p.phase) * p.turbulenceAmp;
      p.x += p.vx + turbulence;
      p.y += p.vy;

      p.rotation += p.rotationSpeed;
    }
  }

  /**
   * Render organic smoke particles to the canvas
   */
  public render(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();
    // Use composite operation for smooth overlapping plumes
    ctx.globalCompositeOperation = 'screen';

    for (const p of this.particles) {
      if (p.alpha <= 0.001) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // Multi-stop radial gradient for wispy organic edges
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      grad.addColorStop(0, `rgba(${this.primaryColor}, ${p.alpha * 1.1})`);
      grad.addColorStop(0.35, `rgba(${this.primaryColor}, ${p.alpha * 0.75})`);
      grad.addColorStop(0.7, `rgba(${this.secondaryColor}, ${p.alpha * 0.3})`);
      grad.addColorStop(1, `rgba(${this.secondaryColor}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Draw smooth slightly oblong cloud puff
      ctx.ellipse(0, 0, p.size, p.size * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  public clear() {
    this.pool.push(...this.particles);
    this.particles = [];
  }

  public getActiveCount(): number {
    return this.particles.length;
  }
}
