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
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import gsap from 'gsap';

type FormMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl:    './login.css',
})
export class LoginPage implements OnInit, AfterViewInit, OnDestroy {
  // ── ViewChildren (só os que a animação GSAP usa) ──────────────────────────
  @ViewChild('leftPanel',  { static: false }) leftPanel!:  ElementRef<HTMLElement>;
  @ViewChild('formCard',   { static: false }) formCard!:   ElementRef<HTMLElement>;
  @ViewChild('logoRef',    { static: false }) logoRef!:    ElementRef<HTMLElement>;
  @ViewChild('loginShell', { static: false }) loginShell!: ElementRef<HTMLElement>;

  // ── Services ──────────────────────────────────────────────────────────────
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr        = inject(ChangeDetectorRef);

  // ── Intro state ───────────────────────────────────────────────────────────
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

  // ── GSAP ──────────────────────────────────────────────────────────────────
  private gsapCtx: gsap.Context | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
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
  }

  // ── Intro done callback ───────────────────────────────────────────────────

  onIntroDone(): void {
    this.showIntro.set(false);
    this.cdr.detectChanges();
    setTimeout(() => this.bootLogin(true), 30);
  }

  // ── Boot login ────────────────────────────────────────────────────────────

  private bootLogin(animate: boolean): void {
    if (!animate) {
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
      next: () => this.navigateHome(),
      error: (err) => {
        this.loading = false;

        const status = err?.status;
        if (status === 0) {
          // network / backend offline
          this.errorMsg = 'Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.';
        } else if (status === 401 || status === 403) {
          this.errorMsg = 'Usuário ou senha inválidos.';
        } else {
          this.errorMsg = err?.error?.error
            ?? err?.error?.message
            ?? 'Erro ao autenticar. Tente novamente.';
        }

        this.shakeForm();
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
    const user = this.auth.sessionUser();
    const roles = user?.teamRoles ?? [];

    let target = '/home';  // fallback padrão agora é Home (para usuários externos também)

    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_TI')) {
      target = '/home';
    } else if (roles.includes('ROLE_ADMIN_DOC') || roles.includes('ROLE_DOC')) {
      target = '/doc/doc';
    } else if (roles.includes('ROLE_ADMIN_RH') || roles.includes('ROLE_RH')) {
      target = '/rh';
    } else if (roles.includes('ROLE_ADMIN_DP') || roles.includes('ROLE_DP')) {
      target = '/dp';
    } else if (roles.includes('ROLE_ADMIN_FINANCEIRO') || roles.includes('ROLE_FINANCEIRO')) {
      target = '/financeiro';
    } else if (roles.includes('ROLE_COLABORADOR') || roles.length === 0) {
      target = '/home'; // colaborador/externo vai para Home onde verá o portal
    }

    if (this.formCard?.nativeElement) {
      gsap.to(this.formCard.nativeElement, {
        opacity: 0, y: -10, duration: 0.3, ease: 'power2.in',
        onComplete: () => { void this.router.navigate([target]); },
      });
    } else {
      void this.router.navigate([target]);
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