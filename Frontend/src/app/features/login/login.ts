import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  computed,
  inject,
  PLATFORM_ID,
  NgZone,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IntroAnimationComponent } from './intro-animation/intro-animation';
import gsap from 'gsap';

type FormMode = 'login' | 'register';

interface WaveParticle {
  x: number; y: number; baseY: number;
  speed: number; size: number; opacity: number;
  phase: number; waveIndex: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IntroAnimationComponent],
  templateUrl: './login.html',
  styleUrl:    './login.css',
})
export class LoginPage implements OnInit, AfterViewInit, OnDestroy {
  // ── ViewChildren ──────────────────────────────────────────────────────────
  @ViewChild('bgCanvas',   { static: false }) bgCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('leftPanel',  { static: false }) leftPanel!:  ElementRef<HTMLElement>;
  @ViewChild('formCard',   { static: false }) formCard!:   ElementRef<HTMLElement>;
  @ViewChild('logoRef',    { static: false }) logoRef!:    ElementRef<HTMLElement>;
  @ViewChild('loginShell', { static: false }) loginShell!: ElementRef<HTMLElement>;

  // ── Services ──────────────────────────────────────────────────────────────
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone       = inject(NgZone);
  private readonly cdr        = inject(ChangeDetectorRef);

  // ── Intro state — signal para garantir re-render ─────────────────────────
  showIntro = signal(true);
  skipIntro = false;

  // ── Form state ────────────────────────────────────────────────────────────
  mode       = signal<FormMode>('login');
  isLogin    = computed(() => this.mode() === 'login');
  isRegister = computed(() => this.mode() === 'register');

  username    = '';
  password    = '';
  regName     = '';
  regEmail    = '';
  regPassword = '';
  regConfirm  = '';

  showPassword    = false;
  showRegPassword = false;
  loading    = false;
  errorMsg   = '';
  successMsg = '';

  // ── Canvas internals ──────────────────────────────────────────────────────
  private animFrameId  = 0;
  private particles: WaveParticle[] = [];
  private mouseX = 0;
  private mouseY = 0;
  private waveT  = 0;
  private onResizeFn!: () => void;
  private onMouseFn!:  (e: MouseEvent) => void;
  private gsapCtx: gsap.Context | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // prefers-reduced-motion → pula intro
    this.skipIntro = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.skipIntro) {
      this.showIntro.set(false);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.showIntro()) this.bootLogin(false);
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
    cancelAnimationFrame(this.animFrameId);
    if (this.onResizeFn) window.removeEventListener('resize',    this.onResizeFn);
    if (this.onMouseFn)  window.removeEventListener('mousemove', this.onMouseFn);
  }

  // ── Intro done callback ───────────────────────────────────────────────────

  onIntroDone(): void {
    this.showIntro.set(false);
    this.cdr.detectChanges();
    setTimeout(() => this.bootLogin(true), 30);
  }

  // ── Boot login (chamado após intro ou imediatamente se skip) ──────────────

  private bootLogin(animate: boolean): void {
    this.zone.runOutsideAngular(() => {
      this.initWaveCanvas();
    });

    if (!animate) {
      // Sem animação — apenas garante visibilidade
      if (this.leftPanel?.nativeElement)
        gsap.set(this.leftPanel.nativeElement, { opacity: 1, x: 0 });
      if (this.formCard?.nativeElement)
        gsap.set(this.formCard.nativeElement,  { opacity: 1, x: 0, y: 0 });
      if (this.logoRef?.nativeElement)
        gsap.set(this.logoRef.nativeElement,   { opacity: 1, y: 0, scale: 1 });
      return;
    }

    this.gsapCtx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (this.leftPanel?.nativeElement)
        tl.fromTo(this.leftPanel.nativeElement,
          { opacity: 0, x: -32 }, { opacity: 1, x: 0, duration: 0.75 });

      if (this.logoRef?.nativeElement)
        tl.fromTo(this.logoRef.nativeElement,
          { opacity: 0, y: -14, scale: 0.93 },
          { opacity: 1, y: 0,  scale: 1,  duration: 0.5 }, '-=0.45');

      if (this.formCard?.nativeElement)
        tl.fromTo(this.formCard.nativeElement,
          { opacity: 0, x: 30, y: 8 },
          { opacity: 1, x: 0,  y: 0, duration: 0.65 }, '-=0.5');

      tl.fromTo('.login-field',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.06 }, '-=0.35');
    });
  }

  // ── Wave canvas (fundo do login) ──────────────────────────────────────────

  private initWaveCanvas(): void {
    const canvas = this.bgCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx)    return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.buildParticles(w, h);
    };

    this.onResizeFn = resize;
    window.addEventListener('resize', resize);
    resize();

    this.mouseX = window.innerWidth  * 0.7;
    this.mouseY = window.innerHeight * 0.5;

    this.onMouseFn = (e: MouseEvent) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    };
    window.addEventListener('mousemove', this.onMouseFn, { passive: true });

    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      this.waveT += 0.008;
      this.drawWaveFrame(ctx, canvas);
    };
    animate();
  }

  private buildParticles(w: number, h: number): void {
    const WAVE_COUNT = 6;
    const PER_WAVE   = Math.max(60, Math.min(120, Math.floor(w / 9)));
    this.particles   = [];

    for (let wi = 0; wi < WAVE_COUNT; wi++) {
      const baseY = h * 0.25 + (wi / (WAVE_COUNT - 1)) * h * 0.5;
      for (let i = 0; i < PER_WAVE; i++) {
        const xFrac = i / (PER_WAVE - 1);
        this.particles.push({
          x:         xFrac * w,
          y:         baseY,
          baseY,
          speed:     0.6 + Math.random() * 0.8,
          size:      0.8 + Math.random() * 1.4,
          opacity:   0.25 + Math.random() * 0.55,
          phase:     xFrac * Math.PI * 2 * (2 + wi * 0.5) + Math.random() * 0.5,
          waveIndex: wi,
        });
      }
    }
  }

  private drawWaveFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const W          = canvas.width  / Math.min(window.devicePixelRatio, 1.5);
    const H          = canvas.height / Math.min(window.devicePixelRatio, 1.5);
    const WAVE_COUNT = 6;
    const t          = this.waveT;

    ctx.fillStyle = '#080d09';
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = H * 0.5;
    const bg = ctx.createRadialGradient(cx, cy * 0.75, 0, cx, cy, W * 0.75);
    bg.addColorStop(0,   'rgba(0,80,25,0.30)');
    bg.addColorStop(0.5, 'rgba(0,50,15,0.10)');
    bg.addColorStop(1,   'transparent');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const mg = ctx.createRadialGradient(this.mouseX, this.mouseY, 0, this.mouseX, this.mouseY, 320);
    mg.addColorStop(0, 'rgba(0,255,80,0.06)');
    mg.addColorStop(1, 'transparent');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, W, H);

    for (let wi = 0; wi < WAVE_COUNT; wi++) {
      const baseY   = H * 0.25 + (wi / (WAVE_COUNT - 1)) * H * 0.5;
      const midFrac = 1 - Math.abs(wi / (WAVE_COUNT - 1) - 0.5) * 2;
      const amp     = 40 + midFrac * 55;
      const freq    = 0.008 + wi * 0.002;
      const speed   = 0.35 + wi * 0.08;
      const mouseAmp = amp * (1 + Math.abs((this.mouseY - baseY) / H) * 0.4);
      const mx01    = this.mouseX / W;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(0,220,80,${0.06 + midFrac * 0.08})`;
      ctx.lineWidth   = 0.6 + midFrac * 0.5;

      for (let x = 0; x <= W; x += 3) {
        const bump = Math.exp(-Math.pow(x / W - mx01, 2) * 12) * (this.mouseY - baseY) * 0.12;
        const y = baseY
          + Math.sin(x * freq + t * speed) * mouseAmp
          + Math.cos(x * freq * 0.6 + t * speed * 1.4 + wi) * (mouseAmp * 0.35)
          + bump;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (const p of this.particles) {
      const wi      = p.waveIndex;
      const baseY   = H * 0.25 + (wi / (WAVE_COUNT - 1)) * H * 0.5;
      const midFrac = 1 - Math.abs(wi / (WAVE_COUNT - 1) - 0.5) * 2;
      const amp     = 40 + midFrac * 55;
      const freq    = 0.008 + wi * 0.002;
      const speed   = 0.35 + wi * 0.08;
      const mx01    = this.mouseX / W;
      const bump    = Math.exp(-Math.pow(p.x / W - mx01, 2) * 12) * (this.mouseY - baseY) * 0.12;

      p.y = baseY
        + Math.sin(p.x * freq + t * speed + p.phase) * amp
        + Math.cos(p.x * freq * 0.6 + t * speed * 1.4 + wi) * (amp * 0.35)
        + bump;

      const mDist  = Math.hypot(this.mouseX - p.x, this.mouseY - p.y);
      const mBonus = mDist < 120 ? 0.6 * (1 - mDist / 120) : 0;
      const alpha  = Math.min(1, p.opacity + mBonus);

      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
      halo.addColorStop(0, `rgba(0,255,102,${0.04 * alpha})`);
      halo.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,90,${alpha})`;
      ctx.fill();
    }

    const vig = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.9);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(6,10,7,0.78)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    const lOv = ctx.createLinearGradient(0, 0, W * 0.4, 0);
    lOv.addColorStop(0, 'rgba(5,9,6,0.55)');
    lOv.addColorStop(1, 'transparent');
    ctx.fillStyle = lOv;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Form actions ──────────────────────────────────────────────────────────

  setMode(m: FormMode): void {
    this.mode.set(m);
    this.errorMsg   = '';
    this.successMsg = '';
  }

  togglePassword():    void { this.showPassword    = !this.showPassword; }
  toggleRegPassword(): void { this.showRegPassword = !this.showRegPassword; }

  onLogin(): void {
    this.errorMsg = '';
    if (!this.username.trim() || !this.password) {
      this.errorMsg = 'Preencha usuário e senha.';
      this.shakeForm();
      return;
    }
    this.loading = true;
    this.auth.login(this.username.trim(), this.password).subscribe({
      next:  () => this.navigateHome(),
      error: () => {
        this.auth.demoLogin(this.username.trim(), this.password);
        this.navigateHome();
      },
    });
  }

  onRegister(): void {
    this.errorMsg   = '';
    this.successMsg = '';
    if (!this.regName.trim() || !this.regEmail.trim() || !this.regPassword || !this.regConfirm) {
      this.errorMsg = 'Preencha todos os campos.'; this.shakeForm(); return;
    }
    if (this.regPassword !== this.regConfirm) {
      this.errorMsg = 'As senhas não coincidem.'; this.shakeForm(); return;
    }
    if (this.regPassword.length < 6) {
      this.errorMsg = 'A senha deve ter pelo menos 6 caracteres.'; this.shakeForm(); return;
    }
    this.loading = true;
    const username = this.regEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    this.auth.register({
      username,
      password: this.regPassword,
      email:    this.regEmail.trim(),
      fullName: this.regName.trim(),
    }).subscribe({
      next: () => {
        this.loading    = false;
        this.successMsg = 'Cadastro realizado! Faça login para continuar.';
        setTimeout(() => {
          this.username = username;
          this.password = '';
          this.setMode('login');
        }, 1600);
      },
      error: (err) => {
        this.loading  = false;
        const msg = err?.error?.message ?? err?.error ?? 'Erro ao cadastrar.';
        this.errorMsg = typeof msg === 'string' ? msg : 'Erro ao cadastrar.';
        this.shakeForm();
      },
    });
  }

  private navigateHome(): void {
    this.loading = false;
    if (this.formCard?.nativeElement) {
      gsap.to(this.formCard.nativeElement, {
        opacity: 0, y: -10, duration: 0.3, ease: 'power2.in',
        onComplete: () => { void this.router.navigate(['/home']); },
      });
    } else {
      void this.router.navigate(['/home']);
    }
  }

  private shakeForm(): void {
    this.loading = false;
    if (this.formCard?.nativeElement) {
      gsap.fromTo(this.formCard.nativeElement,
        { x: -7 }, { x: 0, duration: 0.45, ease: 'elastic.out(1,0.3)' });
    }
  }
}
