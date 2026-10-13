import {
  Component,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  PLATFORM_ID,
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SYMBOL_STROKES, strokeColor } from '../../core/data/planning-symbol';

interface Particle {
  x: number; y: number;
  tx: number; ty: number;
  vx: number; vy: number;
  color: string;
  r: number;
  phase: number; ampX: number; ampY: number; spd: number;
}

type Phase = 'converge' | 'pulse' | 'exit';

@Component({
  selector: 'app-intro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #cv
      style="position:fixed;inset:0;width:100vw;height:100vh;display:block;background:#040805">
    </canvas>
    <div class="skip-btn" (click)="skipNow()" role="button" tabindex="0"
         (keydown.enter)="skipNow()" aria-label="Pular animação">
      Pular ↗
    </div>
  `,
  styles: [`
    :host    { display:block; position:fixed; inset:0; z-index:9999; background:#040805; }
    .skip-btn {
      position: fixed;
      bottom: 1.5rem;
      right: 1.75rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: rgba(0,255,102,0.35);
      letter-spacing: 0.08em;
      cursor: pointer;
      text-transform: uppercase;
      user-select: none;
      transition: color 0.2s;
      z-index: 10000;
    }
    .skip-btn:hover { color: rgba(0,255,102,0.7); }
  `],
})
export class IntroPage implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) cvRef!: ElementRef<HTMLCanvasElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone       = inject(NgZone);
  private readonly router     = inject(Router);

  private raf   = 0;
  private start = 0;
  private phase: Phase = 'converge';
  private skipped = false;

  private W = 0; private H = 0;
  private cx = 0; private cy = 0;
  private R  = 0;
  private pts: Particle[] = [];
  private masterAlpha = 1;

  private readonly DUR_CONVERGE = 2.5;
  private readonly DUR_PULSE    = 2.0;
  private readonly DUR_EXIT     = 0.7;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) { this.navigate(); return; }

    // prefers-reduced-motion → pula direto
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.navigate();
      return;
    }

    this.zone.runOutsideAngular(() => this.boot());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }

  skipNow(): void {
    if (this.skipped) return;
    this.skipped = true;
    cancelAnimationFrame(this.raf);
    this.navigate();
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  private boot(): void {
    const cv  = this.cvRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.W  = window.innerWidth;
    this.H  = window.innerHeight;
    this.cx = this.W / 2;
    this.cy = this.H / 2;
    this.R  = Math.max(80, Math.min(this.W, this.H) * 0.21);

    cv.width  = this.W * dpr;
    cv.height = this.H * dpr;

    const ctx = cv.getContext('2d', { alpha: false })!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.buildParticles();
    this.start = performance.now();
    this.loop(ctx);
  }

  // ── Partículas ────────────────────────────────────────────────────────────

  private buildParticles(): void {
    this.pts = [];
    for (let si = 0; si < SYMBOL_STROKES.length; si++) {
      const s   = SYMBOL_STROKES[si];
      const len = (s.outer - s.inner) * this.R;
      const n   = Math.max(5, Math.round(len / 4.5));

      for (let i = 0; i < n; i++) {
        const t   = n === 1 ? 0.5 : i / (n - 1);
        const rad = (s.angle - 90) * (Math.PI / 180);
        const d   = (s.inner + (s.outer - s.inner) * t) * this.R;
        const tx  = this.cx + Math.cos(rad) * d;
        const ty  = this.cy + Math.sin(rad) * d;

        // Dispersão: posição inicial espalhada ao redor
        const spread = Math.min(this.W, this.H) * (0.3 + Math.random() * 0.35);
        const sAng   = Math.random() * Math.PI * 2;

        this.pts.push({
          x: this.cx + Math.cos(sAng) * spread,
          y: this.cy + Math.sin(sAng) * spread,
          tx, ty,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: strokeColor(s.colorStop),
          r: 1.1 + s.width * 0.55,
          phase: Math.random() * Math.PI * 2,
          ampX:  0.5 + Math.random() * 0.9,
          ampY:  0.5 + Math.random() * 0.9,
          spd:   0.8 + Math.random() * 0.7,
        });
      }
    }
  }

  // ── Loop ──────────────────────────────────────────────────────────────────

  private loop(ctx: CanvasRenderingContext2D): void {
    this.raf = requestAnimationFrame(() => this.loop(ctx));

    const e  = (performance.now() - this.start) / 1000;
    const t0 = this.DUR_CONVERGE;
    const t1 = t0 + this.DUR_PULSE;
    const t2 = t1 + this.DUR_EXIT;

    if      (e < t0) this.phase = 'converge';
    else if (e < t1) this.phase = 'pulse';
    else if (e < t2) this.phase = 'exit';
    else {
      cancelAnimationFrame(this.raf);
      this.navigate();
      return;
    }

    this.masterAlpha = this.phase === 'exit'
      ? Math.max(0, 1 - this.easeIn((e - t1) / this.DUR_EXIT))
      : 1;

    this.update(e, t0);
    this.render(ctx, e, t0, t1);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  private update(e: number, t0: number): void {
    if (this.phase === 'converge') {
      const prog = this.smoothStep(e / t0);
      const pull = 0.025 + prog * 0.28;
      const damp = 0.76  + prog * 0.16;
      for (const p of this.pts) {
        p.vx += (p.tx - p.x) * pull;
        p.vy += (p.ty - p.y) * pull;
        p.vx *= damp; p.vy *= damp;
        p.x  += p.vx; p.y  += p.vy;
      }
    } else {
      for (const p of this.pts) {
        p.phase += 0.016 * p.spd;
        const ox = Math.sin(p.phase)              * p.ampX;
        const oy = Math.cos(p.phase * 1.3 + 0.7) * p.ampY;
        p.vx += (p.tx + ox - p.x) * 0.20;
        p.vy += (p.ty + oy - p.y) * 0.20;
        p.vx *= 0.70; p.vy *= 0.70;
        p.x  += p.vx; p.y  += p.vy;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private render(ctx: CanvasRenderingContext2D, e: number, t0: number, t1: number): void {
    const bgA = this.phase === 'converge' ? 0.18 : 0.55;
    ctx.fillStyle = `rgba(4,8,5,${bgA})`;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.save();
    ctx.globalAlpha = this.masterAlpha;

    // Halo central
    const prog = this.phase === 'converge' ? this.smoothStep(e / t0) : 1;
    const hPulse = this.phase === 'pulse' ? 1 + 0.07 * Math.sin((e - t0) * 2.1) : 1;
    const hR  = this.R * 2.3 * hPulse;
    const hGrd = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, hR);
    hGrd.addColorStop(0,    `rgba(0,255,102,${0.13 * prog})`);
    hGrd.addColorStop(0.45, `rgba(0,180,70,${0.05 * prog})`);
    hGrd.addColorStop(1,    'transparent');
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, hR, 0, Math.PI * 2);
    ctx.fillStyle = hGrd;
    ctx.fill();

    // Traços vetoriais do símbolo (aparecem na 2ª metade da convergência)
    const symT = this.phase === 'converge'
      ? this.smoothStep(Math.max(0, (e / t0 - 0.5) / 0.5)) * 0.45
      : this.phase === 'pulse'
        ? 0.55 + 0.07 * Math.sin((e - t0) * 2.1)
        : 0.55 * this.masterAlpha;

    if (symT > 0.01) this.drawSymbol(ctx, symT, e, t0);

    // Partículas
    for (const p of this.pts) {
      const near = Math.hypot(p.x - p.tx, p.y - p.ty) < 5;
      const hr   = p.r * (near ? 7 : 4.5);
      const ph   = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, hr);
      ph.addColorStop(0, this.ca(p.color, near ? 0.22 : 0.10));
      ph.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, hr, 0, Math.PI * 2);
      ctx.fillStyle = ph;
      ctx.fill();

      const pc = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      pc.addColorStop(0,    'rgba(228,255,240,1)');
      pc.addColorStop(0.45, p.color);
      pc.addColorStop(1,    this.ca(p.color, 0.3));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = pc;
      ctx.fill();
    }

    // Texto (aparece no pulse)
    const textT = this.phase === 'pulse'
      ? this.easeOut(Math.min(1, (e - t0) / 0.55))
      : this.phase === 'exit' ? this.masterAlpha : 0;

    if (textT > 0.01) {
      ctx.globalAlpha = this.masterAlpha * textT;
      const fs = Math.round(this.R * 0.27);
      ctx.font         = `400 ${fs}px 'Bebas Neue','Arial Narrow',Arial,sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor  = 'rgba(0,255,102,0.55)';
      ctx.shadowBlur   = 14;
      ctx.fillStyle    = '#00FF66';
      ctx.fillText('NEXORA-PLANNING', this.cx, this.cy + this.R * 1.38);
      ctx.shadowBlur   = 0;
      const ss = Math.round(this.R * 0.10);
      ctx.font      = `500 ${ss}px 'Inter','Roboto',sans-serif`;
      ctx.fillStyle = 'rgba(0,255,102,0.38)';
      ctx.fillText('INTRANET CORPORATIVA', this.cx, this.cy + this.R * 1.38 + fs + 5);
      ctx.shadowColor = 'transparent';
    }

    ctx.globalAlpha = this.masterAlpha;
    ctx.restore();
  }

  // ── Símbolo ───────────────────────────────────────────────────────────────

  private drawSymbol(ctx: CanvasRenderingContext2D, alpha: number, e: number, t0: number): void {
    const scale = this.phase === 'pulse' ? 1 + 0.022 * Math.sin((e - t0) * 2.1) : 1;
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(scale, scale);
    ctx.translate(-this.cx, -this.cy);

    for (const s of SYMBOL_STROKES) {
      const ang = (s.angle - 90) * (Math.PI / 180);
      const x1  = this.cx + Math.cos(ang) * s.inner * this.R;
      const y1  = this.cy + Math.sin(ang) * s.inner * this.R;
      const x2  = this.cx + Math.cos(ang) * s.outer * this.R;
      const y2  = this.cy + Math.sin(ang) * s.outer * this.R;

      const col = strokeColor(s.colorStop);
      const grd = ctx.createLinearGradient(x1, y1, x2, y2);
      grd.addColorStop(0,   this.ca(col, alpha * 0.5));
      grd.addColorStop(0.5, this.ca(col, alpha));
      grd.addColorStop(1,   this.ca(col, alpha * 0.7));

      ctx.shadowColor = this.ca(col, alpha * 0.65);
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = s.width * 2.8;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
    ctx.shadowBlur  = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private navigate(): void {
    this.zone.run(() => void this.router.navigate(['/login']));
  }
  private ca(c: string, a: number): string {
    return c.replace('rgb(', 'rgba(').replace(')', `,${Math.max(0, Math.min(1, a))})`);
  }
  private smoothStep(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }
  private easeOut(t: number): number { return 1 - (1 - Math.min(1, t)) ** 2; }
  private easeIn(t:  number): number { return Math.min(1, t) ** 2; }
}
