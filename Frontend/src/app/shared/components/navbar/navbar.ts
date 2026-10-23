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
  HostListener,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { Notebook } from '../../../core/models/notebook';
import { NotebookService } from '../../../core/services/notebook';
import gsap from 'gsap';

interface InventoryStat {
  key: string;
  label: string;
  value: number;
  icon: string; // SVG path d attr
}

interface AttentionItem {
  id: number;
  name: string;
  description: string;
  statusLabel: string;
  statusClass: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly auth        = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly nbService   = inject(NotebookService);
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly zone        = inject(NgZone);
  private readonly cdr         = inject(ChangeDetectorRef);
  private readonly sidebarState = inject(SidebarStateService);

  readonly user = this.auth.sessionUser;
  readonly sidebarCollapsed = this.sidebarState.sidebarCollapsed;

  // ── Static dept nav items ─────────────────────────────────────────────────
  readonly deptNavItems: { label: string; icon: string; route?: string }[] = [
    { label: 'Fiscal',        icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    { label: 'Contábil',      icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Departamento Pessoal Interno', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', route: '/dp' },
    { label: 'Gente e Gestão', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z', route: '/rh' },
    { label: 'DOC',           icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', route: '/doc' },
    { label: 'Financeiro/Compras', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', route: '/financeiro' },
    { label: 'Gestão de Risco',    icon: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
    { label: 'Desenvolvimento',    icon: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25z' },
  ];

  // ── UI state ──────────────────────────────────────────────────────────────
  accountMenuOpen  = signal(false);
  searchQuery      = signal('');
  activeSection    = signal<'dashboard' | 'ti'>('dashboard');

  // ── Ticket modal ──────────────────────────────────────────────────────────
  showTicketModal  = signal(false);
  ticketCreated    = signal<string | null>(null);

  // ── Inventory state ───────────────────────────────────────────────────────
  loading          = signal(true);
  loadError        = signal(false);
  notebooks        = signal<Notebook[]>([]);

  stats = computed<InventoryStat[]>(() => {
    const nb = this.notebooks();
    const count = (s: Notebook['status']) => nb.filter(n => n.status === s).length;
    return [
      { key: 'ACTIVE',      label: 'Em uso',       value: count('ACTIVE'),      icon: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18' },
      { key: 'INACTIVE',    label: 'Em estoque',   value: count('INACTIVE'),    icon: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' },
      { key: 'MAINTENANCE', label: 'Manutenção',   value: count('MAINTENANCE'), icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
      { key: 'BACKUP',      label: 'Backup',       value: count('BACKUP'),      icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
      { key: 'REVERSE',     label: 'Em coleta',    value: count('REVERSE'),     icon: 'M3 7h18M3 12h18M3 17h18' },
    ];
  });

  attentionItems = computed<AttentionItem[]>(() =>
    this.notebooks()
      .filter(n =>
        n.status === 'MAINTENANCE' ||
        n.status === 'REVERSE' ||
        (n.status === 'ACTIVE' && !n.employee?.id)
      )
      .map(n => ({
        id:          n.id ?? 0,
        name:        n.name ?? n.serialNumber ?? '—',
        description: [n.brand, n.model].filter(Boolean).join(' ') || n.serialNumber || '—',
        statusLabel: n.status === 'MAINTENANCE' ? 'Manutenção'
                   : n.status === 'REVERSE'     ? 'Em coleta'
                   : 'Sem responsável',
        statusClass: n.status === 'MAINTENANCE' ? 'stat-maintenance'
                   : n.status === 'REVERSE'     ? 'stat-reverse'
                   : 'stat-unassigned',
      }))
  );

  // ── Canvas internals ──────────────────────────────────────────────────────
  private animFrameId = 0;
  private mouseX = 0;   // inicializado em ngAfterViewInit — não usar window no construtor
  private mouseY = 0;
  private nodes: { x:number; y:number; vx:number; vy:number; r:number; pulse:number; pspd:number; br:number }[] = [];
  private onResizeFn!: () => void;
  private onMouseFn!:  (e: MouseEvent) => void;
  private gsapCtx: gsap.Context | null = null;

  // ── Getters ───────────────────────────────────────────────────────────────
  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }
  get firstName(): string { return (this.user()?.displayName ?? '').split(' ')[0]; }
  get todayDate(): string {
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadInventory(); }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Inicializa coordenadas do mouse no centro da tela
    this.mouseX = window.innerWidth  / 2;
    this.mouseY = window.innerHeight / 2;

    // Cancela qualquer loop anterior (SPA re-mount)
    cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;

    // Canvas roda SEMPRE — prefers-reduced-motion afeta só as animações GSAP
    // Delay duplo garante que o canvas está no DOM após lazy routing
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.initCanvas());
      });
    });

    // GSAP — só se o usuário não preferir movimento reduzido
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      this.gsapCtx = gsap.context(() => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('.hm-topbar',  { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5 })
          .fromTo('.hm-sidebar', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5 }, '-=0.3')
          .fromTo('.hm-content', { opacity: 0, y: 16  }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
      });
    }
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize',    this.onResizeFn);
    window.removeEventListener('mousemove', this.onMouseFn);
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  loadInventory(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.nbService.getNotebooks().subscribe({
      next: (nb) => {
        this.notebooks.set(nb);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  retryLoad(): void {
    this.nbService.clearCache();
    this.loadInventory();
  }

  // ── UI actions ────────────────────────────────────────────────────────────
  toggleAccountMenu():  void { this.accountMenuOpen.update(v => !v); }
  toggleSidebar():      void { this.sidebarState.toggleSidebar(); }
  logout():             void { this.auth.logout(); }

  openTicketModal(): void {
    this.ticketCreated.set(null);
    this.showTicketModal.set(true);
  }
  closeTicketModal(): void { this.showTicketModal.set(false); }
  onTicketCreated(number: string): void {
    this.ticketCreated.set(number);
    this.showTicketModal.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.acct-anchor')) this.accountMenuOpen.set(false);
  }

  // ── Canvas background — network graph animado ────────────────────────────
  private initCanvas(): void {
    const cv = this.canvasRef?.nativeElement;
    if (!cv) {
      // Canvas ainda não disponível — reagenda no próximo frame
      this.zone.runOutsideAngular(() =>
        requestAnimationFrame(() => this.initCanvas())
      );
      return;
    }

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      cv.width  = w * dpr; cv.height = h * dpr;
      cv.style.width  = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(40, Math.min(110, Math.floor(w * h / 14000)));
      this.nodes = Array.from({ length: n }, () => ({
        x:    Math.random() * w,
        y:    Math.random() * h,
        vx:   (Math.random() - 0.5) * 0.28,
        vy:   (Math.random() - 0.5) * 0.28,
        r:    1.2 + Math.random() * 1.8,
        pulse: Math.random() * Math.PI * 2,
        pspd: 0.012 + Math.random() * 0.018,
        br:   0.35 + Math.random() * 0.65,
      }));
    };

    // Remove listener anterior se existir (re-mount SPA)
    if (this.onResizeFn) window.removeEventListener('resize', this.onResizeFn);
    this.onResizeFn = resize;
    window.addEventListener('resize', resize);
    resize();

    if (this.onMouseFn) window.removeEventListener('mousemove', this.onMouseFn);
    if (!window.matchMedia('(hover: none)').matches) {
      this.onMouseFn = (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      };
      window.addEventListener('mousemove', this.onMouseFn, { passive: true });
    }

    // Garante que não há loop duplo
    cancelAnimationFrame(this.animFrameId);

    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      const W = cv.width / dpr, H = cv.height / dpr;

      for (const n of this.nodes) {
        const dx = this.mouseX - n.x;
        const dy = this.mouseY - n.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 200 && d > 1) { n.vx += dx * 0.00018; n.vy += dy * 0.00018; }
        n.vx *= 0.992; n.vy *= 0.992;
        n.x  += n.vx;  n.y  += n.vy;
        if (n.x < 0)  { n.x = 0;  n.vx *= -1; }
        if (n.x > W)  { n.x = W;  n.vx *= -1; }
        if (n.y < 0)  { n.y = 0;  n.vy *= -1; }
        if (n.y > H)  { n.y = H;  n.vy *= -1; }
        n.pulse += n.pspd;
      }
      this.drawFrame(ctx, cv);
    };
    loop();
  }

  private drawFrame(ctx: CanvasRenderingContext2D, cv: HTMLCanvasElement): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = cv.width / dpr, H = cv.height / dpr;
    const cx = W * 0.5, cy = H * 0.5;

    ctx.fillStyle = '#0B0F0D'; ctx.fillRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy * 0.6, W * 0.65);
    bg.addColorStop(0, 'rgba(0,80,30,0.22)'); bg.addColorStop(1, 'transparent');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const mg = ctx.createRadialGradient(this.mouseX, this.mouseY, 0, this.mouseX, this.mouseY, 260);
    mg.addColorStop(0, 'rgba(0,255,102,0.05)'); mg.addColorStop(1, 'transparent');
    ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);

    const MD = 160, MD2 = MD * MD;
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, dSq = dx * dx + dy * dy;
        if (dSq > MD2) continue;
        const ratio = 1 - Math.sqrt(dSq) / MD;
        const alpha = (0.055 + ratio * 0.18) * Math.min(a.br, b.br);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(0,220,90,${alpha})`; ctx.lineWidth = 0.55 + ratio * 0.6; ctx.stroke();
      }
    }
    for (const n of this.nodes) {
      const pf = 0.85 + 0.15 * Math.sin(n.pulse), r = n.r * pf;
      const md = Math.sqrt((this.mouseX - n.x) ** 2 + (this.mouseY - n.y) ** 2);
      const br = Math.min(1, n.br + (md < 140 ? 0.5 * (1 - md / 140) : 0));
      const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5);
      halo.addColorStop(0, `rgba(0,255,102,${0.06 * br})`); halo.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
      const core = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
      core.addColorStop(0, `rgba(180,255,200,${br})`); core.addColorStop(0.5, `rgba(0,255,90,${br * 0.85})`); core.addColorStop(1, `rgba(0,180,60,${br * 0.3})`);
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fillStyle = core; ctx.fill();
    }
    const vig = ctx.createRadialGradient(cx, cy, H * 0.35, cx, cy, H * 0.85);
    vig.addColorStop(0, 'transparent'); vig.addColorStop(1, 'rgba(11,15,13,0.72)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }
}
