import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild,
  signal, computed, inject, PLATFORM_ID, NgZone, HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  TicketService, TicketResponse, TicketStatus, DestDepartment,
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS,
} from '../../core/services/ticket.service';
import { OpenTicketModal } from '../tickets/open-ticket-modal/open-ticket-modal';
import gsap from 'gsap';

interface StatusFilter {
  value: TicketStatus | '';
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-doc-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, OpenTicketModal],
  templateUrl: './doc-home.html',
  styleUrl: './doc-home.css',
})
export class DocHomePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly auth        = inject(AuthService);
  private readonly ticketSvc   = inject(TicketService);
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly zone        = inject(NgZone);
  private readonly cdr         = inject(ChangeDetectorRef);

  readonly user = this.auth.sessionUser;

  // ── Tickets ───────────────────────────────────────────────────────────────
  allTickets   = signal<TicketResponse[]>([]);
  loading      = signal(true);
  loadError    = signal(false);
  searchQuery  = '';

  // ── Status filters ────────────────────────────────────────────────────────
  statusFilters: StatusFilter[] = [
    { value: 'NOVO',         label: 'Novos',         active: true  },
    { value: 'EM_ANDAMENTO', label: 'Em andamento',  active: true  },
    { value: 'RESOLVIDO',    label: 'Resolvidos',    active: false },
    { value: 'AGUARDANDO',   label: 'Aguardando',    active: false },
  ];

  // ── UI state ──────────────────────────────────────────────────────────────
  showTicketModal  = signal(false);
  ticketCreated    = signal<string | null>(null);
  accountMenuOpen  = signal(false);

  // ── Canvas ────────────────────────────────────────────────────────────────
  private animFrameId = 0;
  private mouseX = 0;
  private mouseY = 0;
  private nodes: { x:number; y:number; vx:number; vy:number; r:number; pulse:number; pspd:number; br:number }[] = [];
  private onResizeFn!: () => void;
  private onMouseFn!:  (e: MouseEvent) => void;
  private gsapCtx: gsap.Context | null = null;

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly activeStatuses = computed(() =>
    this.statusFilters.filter(f => f.active).map(f => f.value).filter(Boolean) as TicketStatus[]
  );

  get filteredTickets(): TicketResponse[] {
    const q   = this.searchQuery.trim().toLowerCase();
    const sts = this.statusFilters.filter(f => f.active).map(f => f.value);

    return this.allTickets().filter(t => {
      const matchStatus = sts.length === 0 || sts.includes(t.status);
      const matchSearch = !q ||
        t.title.toLowerCase().includes(q) ||
        t.number.toLowerCase().includes(q) ||
        t.requester?.fullName?.toLowerCase().includes(q) ||
        t.docDetail?.companyName?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }

  get countByStatus(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const t of this.allTickets()) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }

  readonly statusLabels   = TICKET_STATUS_LABELS;
  readonly priorityLabels = TICKET_PRIORITY_LABELS;

  get todayDate(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadTickets(); }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.zone.runOutsideAngular(() => this.initCanvas(reduced));
    if (!reduced) {
      this.gsapCtx = gsap.context(() => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('.doc-topbar',  { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5 })
          .fromTo('.doc-content', { opacity: 0, y: 16  }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
      });
    }
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
    cancelAnimationFrame(this.animFrameId);
    if (this.onResizeFn) window.removeEventListener('resize',    this.onResizeFn);
    if (this.onMouseFn)  window.removeEventListener('mousemove', this.onMouseFn);
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  loadTickets(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.ticketSvc.getByDept('DOC', 0, 100).subscribe({
      next: (pg) => {
        this.allTickets.set(pg.content);
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

  retryLoad(): void { this.loadTickets(); }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openModal():  void { this.ticketCreated.set(null); this.showTicketModal.set(true); }
  closeModal(): void { this.showTicketModal.set(false); }
  onCreated(number: string): void {
    this.ticketCreated.set(number);
    this.showTicketModal.set(false);
    this.loadTickets();
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  toggleFilter(f: StatusFilter): void { f.active = !f.active; }

  // ── Account menu ──────────────────────────────────────────────────────────
  toggleAccountMenu(): void { this.accountMenuOpen.update(v => !v); }
  logout():            void { this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.doc-acct-anchor')) this.accountMenuOpen.set(false);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getStatusClass(s: TicketStatus): string {
    return ({
      NOVO:         'ds-novo',
      EM_ANDAMENTO: 'ds-andamento',
      AGUARDANDO:   'ds-aguardando',
      RESOLVIDO:    'ds-resolvido',
      CANCELADO:    'ds-cancelado',
    })[s] ?? '';
  }

  getPriorityClass(p: string): string {
    return ({ BAIXA:'dp-baixa', MEDIA:'dp-media', ALTA:'dp-alta', URGENTE:'dp-urgente' })[p] ?? '';
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit',
    }).format(new Date(iso));
  }

  trackById(_: number, t: TicketResponse): number { return t.id; }

  // ── Canvas ────────────────────────────────────────────────────────────────
  private initCanvas(reduced: boolean): void {
    const cv  = this.canvasRef?.nativeElement;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      cv.width  = w * dpr; cv.height = h * dpr;
      cv.style.width = `${w}px`; cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(40, Math.min(110, Math.floor(w * h / 14000)));
      this.nodes = Array.from({ length: n }, () => ({
        x:Math.random()*w, y:Math.random()*h,
        vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28,
        r:1.2+Math.random()*1.8, pulse:Math.random()*Math.PI*2,
        pspd:.012+Math.random()*.018, br:.35+Math.random()*.65,
      }));
    };
    this.onResizeFn = resize;
    window.addEventListener('resize', resize);
    resize();

    if (!window.matchMedia('(hover:none)').matches) {
      this.onMouseFn = (e: MouseEvent) => { this.mouseX = e.clientX; this.mouseY = e.clientY; };
      window.addEventListener('mousemove', this.onMouseFn, { passive: true });
    }

    if (reduced) { this.drawFrame(ctx, cv, dpr); return; }

    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      const W = cv.width/dpr, H = cv.height/dpr;
      for (const n of this.nodes) {
        const dx=this.mouseX-n.x, dy=this.mouseY-n.y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<200&&d>1){n.vx+=dx*.00018;n.vy+=dy*.00018;}
        n.vx*=.992;n.vy*=.992;n.x+=n.vx;n.y+=n.vy;
        if(n.x<0){n.x=0;n.vx*=-1;}if(n.x>W){n.x=W;n.vx*=-1;}
        if(n.y<0){n.y=0;n.vy*=-1;}if(n.y>H){n.y=H;n.vy*=-1;}
        n.pulse+=n.pspd;
      }
      this.drawFrame(ctx, cv, dpr);
    };
    loop();
  }

  private drawFrame(ctx: CanvasRenderingContext2D, cv: HTMLCanvasElement, dpr: number): void {
    const W=cv.width/dpr, H=cv.height/dpr, cx=W*.5, cy=H*.5;
    ctx.fillStyle='#0B0F0D'; ctx.fillRect(0,0,W,H);
    const bg=ctx.createRadialGradient(cx,cy*.6,0,cx,cy*.6,W*.65);
    bg.addColorStop(0,'rgba(0,80,30,.22)'); bg.addColorStop(1,'transparent');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const mg=ctx.createRadialGradient(this.mouseX,this.mouseY,0,this.mouseX,this.mouseY,260);
    mg.addColorStop(0,'rgba(0,255,102,.05)'); mg.addColorStop(1,'transparent');
    ctx.fillStyle=mg; ctx.fillRect(0,0,W,H);
    const MD=160,MD2=MD*MD;
    for(let i=0;i<this.nodes.length;i++){
      const a=this.nodes[i];
      for(let j=i+1;j<this.nodes.length;j++){
        const b=this.nodes[j];
        const dx=a.x-b.x,dy=a.y-b.y,dSq=dx*dx+dy*dy;
        if(dSq>MD2)continue;
        const r=1-Math.sqrt(dSq)/MD, alpha=(0.055+r*.18)*Math.min(a.br,b.br);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(0,220,90,${alpha})`;ctx.lineWidth=.55+r*.6;ctx.stroke();
      }
    }
    for(const n of this.nodes){
      const pf=.85+.15*Math.sin(n.pulse),r=n.r*pf;
      const md=Math.sqrt((this.mouseX-n.x)**2+(this.mouseY-n.y)**2);
      const br=Math.min(1,n.br+(md<140?.5*(1-md/140):0));
      const halo=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*5);
      halo.addColorStop(0,`rgba(0,255,102,${.06*br})`);halo.addColorStop(1,'transparent');
      ctx.beginPath();ctx.arc(n.x,n.y,r*5,0,Math.PI*2);ctx.fillStyle=halo;ctx.fill();
      const core=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r);
      core.addColorStop(0,`rgba(180,255,200,${br})`);
      core.addColorStop(.5,`rgba(0,255,90,${br*.85})`);
      core.addColorStop(1,`rgba(0,180,60,${br*.3})`);
      ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle=core;ctx.fill();
    }
    const vig=ctx.createRadialGradient(cx,cy,H*.35,cx,cy,H*.85);
    vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(11,15,13,.72)');
    ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
  }
}
