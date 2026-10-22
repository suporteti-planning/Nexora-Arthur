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
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Notebook } from '../../../core/models/notebook';
import { NotebookService } from '../../../core/services/notebook';
import gsap from 'gsap';

interface InventoryStat {
  key: string;
  label: string;
  value: number;
  icon: string;
}

interface AttentionItem {
  id: number;
  name: string;
  description: string;
  statusLabel: string;
  statusClass: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly auth        = inject(AuthService);
  private readonly nbService   = inject(NotebookService);
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly zone        = inject(NgZone);
  private readonly cdr         = inject(ChangeDetectorRef);

  readonly user = this.auth.sessionUser;

  // ── Helpers de visibilidade (ESTÁTICOS - não dependem de rota) ──────────
  readonly isGlobal = computed(() => {
    const r = this.user()?.teamRoles ?? [];
    return r.includes('ROLE_ADMIN') || r.includes('ROLE_TI');
  });

  readonly isExternalUser = computed(() => {
    const r = this.user()?.teamRoles ?? [];
    if (r.length === 0) return true;
    const hasInternalRole = r.some(role =>
      role === 'ROLE_ADMIN' || 
      role === 'ROLE_TI' || 
      role.startsWith('ROLE_ADMIN_') || 
      role === 'ROLE_DOC' ||
      role === 'ROLE_RH' ||
      role === 'ROLE_DP' ||
      role === 'ROLE_FINANCEIRO' ||
      role === 'ROLE_RISCO'
    );
    return !hasInternalRole;
  });

  readonly canManageUsers = computed(() => {
    const r = this.user()?.teamRoles ?? [];
    return this.isGlobal() || r.some(x => x.startsWith('ROLE_ADMIN_'));
  });

  // Retorna o primeiro departamento do usuário (IMUTÁVEL após login)
  readonly userDepartment = computed<string | null>(() => {
    if (this.isGlobal()) return null; // TI/Admin não tem depto único
    if (this.isExternalUser()) return null; // Externo não tem depto
    
    const r = this.user()?.teamRoles ?? [];
    const deptOrder = ['DOC', 'RH', 'DP', 'FINANCEIRO', 'RISCO'];
    
    for (const dept of deptOrder) {
      if (r.includes(`ROLE_${dept}`) || r.includes(`ROLE_ADMIN_${dept}`)) {
        return dept;
      }
    }
    return null;
  });

  // Nome do painel para exibição (ESTÁTICO)
  readonly departmentPanelName = computed<string>(() => {
    const dept = this.userDepartment();
    const labels: Record<string, string> = {
      DOC: 'DOC',
      RH: 'Gente e Gestão',
      DP: 'Departamento Pessoal',
      FINANCEIRO: 'Financeiro',
      RISCO: 'Gestão de Risco',
    };
    return labels[dept ?? ''] ?? dept ?? '';
  });

  // Rota do painel departamental (ESTÁTICA)
  readonly departmentPanelRoute = computed<string>(() => {
    const dept = this.userDepartment();
    const routes: Record<string, string> = {
      DOC: '/doc/doc',
      RH: '/rh',
      DP: '/dp',
      FINANCEIRO: '/financeiro',
      RISCO: '/risco',
    };
    return routes[dept ?? ''] ?? '/home';
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  accountMenuOpen  = signal(false);
  sidebarCollapsed = signal(false);
  searchQuery      = signal('');
  activeSection    = signal<'dashboard' | 'ti'>('dashboard');

  showTicketModal  = signal(false);
  ticketCreated    = signal<string | null>(null);

  loading   = signal(true);
  loadError = signal(false);
  notebooks = signal<Notebook[]>([]);

  stats = computed<InventoryStat[]>(() => {
    const nb = this.notebooks();
    const count = (s: Notebook['status']) => nb.filter(n => n.status === s).length;
    return [
      { key: 'ACTIVE',      label: 'Em uso',     value: count('ACTIVE'),      icon: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18' },
      { key: 'INACTIVE',    label: 'Em estoque', value: count('INACTIVE'),    icon: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' },
      { key: 'MAINTENANCE', label: 'Manutenção', value: count('MAINTENANCE'), icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
      { key: 'BACKUP',      label: 'Backup',     value: count('BACKUP'),      icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
      { key: 'REVERSE',     label: 'Em coleta',  value: count('REVERSE'),     icon: 'M3 7h18M3 12h18M3 17h18' },
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
  private mouseX = 0;
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

    this.mouseX = window.innerWidth  / 2;
    this.mouseY = window.innerHeight / 2;

    cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;

    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.initCanvas());
      });
    });

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
  toggleSidebar():      void { this.sidebarCollapsed.update(v => !v); }
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