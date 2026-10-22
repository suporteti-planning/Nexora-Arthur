import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, concatMap, finalize, from, map, of, toArray } from 'rxjs';
import { MicrosoftLicenseApi, MicrosoftLicenseInventory, MicrosoftTenantLicense, MicrosoftTenantUser } from '../../../core/services/microsoft-license-api';

type LicenseAction = 'assign' | 'revoke' | 'list';
interface LicenseOperationResult {
  user: MicrosoftTenantUser;
  error?: string;
}

@Component({
  selector: 'app-microsoft-license-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './microsoft-license-management.html',
  styleUrl: './microsoft-license-management.css'
})
export class MicrosoftLicenseManagement implements OnInit {
  inventory: MicrosoftLicenseInventory | null = null;
  searchTerm = '';
  loading = true;
  errorMessage = '';
  selectedLicense: MicrosoftTenantLicense | null = null;
  action: LicenseAction = 'assign';
  userSearch = '';
  selectedUserIds: string[] = [];
  saving = false;
  modalError = '';

  constructor(
    private licenseApi: MicrosoftLicenseApi,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.errorMessage = '';
    this.licenseApi.getInventory().subscribe({
      next: inventory => {
        this.inventory = inventory;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.errorText(error, 'Não foi possível consultar o inventário do Microsoft 365.');
        this.cdr.markForCheck();
      }
    });
  }

  get licenses(): MicrosoftTenantLicense[] {
    return this.inventory?.licenses ?? [];
  }

  get users(): MicrosoftTenantUser[] {
    return this.inventory?.users ?? [];
  }

  get filteredLicenses(): MicrosoftTenantLicense[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.licenses.filter(license => `${license.displayName} ${license.skuPartNumber}`.toLocaleLowerCase('pt-BR').includes(search));
  }

  get totalUsed(): number {
    return this.licenses.reduce((total, license) => total + license.consumed, 0);
  }

  get totalAvailable(): number {
    return this.licenses.reduce((total, license) => total + license.available, 0);
  }

  usedCount(license: MicrosoftTenantLicense): number {
    return license.consumed;
  }

  capacity(license: MicrosoftTenantLicense): number {
    return license.purchasedEnabled;
  }

  availableCount(license: MicrosoftTenantLicense): number {
    return license.available;
  }

  assignedUsers(license: MicrosoftTenantLicense): number {
    return this.users.filter(user => this.hasSku(user, license.skuId)).length;
  }

  openLicenseUsers(license: MicrosoftTenantLicense, action: LicenseAction): void {
    this.selectedLicense = license;
    this.action = action;
    this.userSearch = '';
    this.selectedUserIds = [];
    this.modalError = '';
  }

  closeLicenseUsers(): void {
    if (this.saving) return;
    this.selectedLicense = null;
    this.selectedUserIds = [];
    this.modalError = '';
  }

  get eligibleUsers(): MicrosoftTenantUser[] {
    if (!this.selectedLicense) return [];
    const search = this.userSearch.trim().toLocaleLowerCase('pt-BR');
    return this.users.filter(user => {
      const hasLicense = this.hasSku(user, this.selectedLicense!.skuId);
      const eligible = this.action === 'assign'
        ? !hasLicense && user.active
        : this.action === 'list' ? hasLicense : hasLicense && !this.isGroupAssigned(user, this.selectedLicense!.skuId);
      const matchesSearch = [user.displayName, user.email]
        .some(value => value?.toLocaleLowerCase('pt-BR').includes(search));
      return eligible && matchesSearch;
    }).sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'));
  }

  toggleUser(user: MicrosoftTenantUser): void {
    this.selectedUserIds = this.selectedUserIds.includes(user.id)
      ? this.selectedUserIds.filter(id => id !== user.id)
      : [...this.selectedUserIds, user.id];
  }

  isSelected(user: MicrosoftTenantUser): boolean {
    return this.selectedUserIds.includes(user.id);
  }

  hasSku(user: MicrosoftTenantUser, skuId: string): boolean {
    return user.assignedSkuIds.some(assignedSku => assignedSku.toLowerCase() === skuId.toLowerCase());
  }

  isGroupAssigned(user: MicrosoftTenantUser, skuId: string): boolean {
    return (user.assignments[skuId.toLowerCase()]?.assignedByGroups.length ?? 0) > 0;
  }

  assignmentDescription(user: MicrosoftTenantUser): string {
    if (!this.selectedLicense) return '';
    const assignment = user.assignments[this.selectedLicense.skuId.toLowerCase()];
    if (assignment?.assignedByGroups.length) return 'Atribuída por grupo';
    if (assignment?.directlyAssigned) return 'Atribuída diretamente';
    return 'Atribuição sincronizada';
  }

  saveLicenseChanges(): void {
    if (!this.selectedLicense || this.selectedUserIds.length === 0 || this.saving) return;
    const license = this.selectedLicense;
    if (this.action === 'assign' && this.selectedUserIds.length > license.available) {
      this.modalError = `Há somente ${license.available} licença(s) disponível(is) neste tenant.`;
      return;
    }

    this.saving = true;
    this.modalError = '';
    const selectedUsers = this.users.filter(user => this.selectedUserIds.includes(user.id));
    from(selectedUsers).pipe(
      concatMap(user => {
        const request = this.action === 'assign'
          ? this.licenseApi.assign(user.id, license.skuId)
          : this.licenseApi.revoke(user.id, license.skuId);
        return request.pipe(
          map((): LicenseOperationResult => ({ user })),
          catchError(error => of({ user, error: this.errorText(error, 'Falha na operação.') }))
        );
      }),
      toArray(),
      finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      })
    ).subscribe(results => {
      const failures = results.filter(result => result.error);
      this.loadInventory();
      if (failures.length) {
        this.modalError = failures.map(result => `${result.user.displayName}: ${result.error}`).join(' ');
      } else {
        this.selectedLicense = null;
        this.selectedUserIds = [];
      }
      this.cdr.markForCheck();
    });
  }

  get assignedUserCount(): number {
    return this.selectedLicense ? this.assignedUsers(this.selectedLicense) : 0;
  }

  private errorText(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.error?.detail ?? error.message ?? fallback;
    }
    return fallback;
  }
}
