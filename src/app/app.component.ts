import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SimulatorService } from './simulator.service';
import { NumberFormatDirective } from './number-format.directive';
import type { SimulatorAdult, SimulatorChild, ComparisonExpense, PartDState } from './simulator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule, NumberFormatDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private svc = inject(SimulatorService);

  // ── UI state ───────────────────────────────────────────
  stepAOpen  = false;
  stepB1Open = false;
  stepB2Open = false;
  stepCOpen  = false;
  stepDOpen  = false;
  phoenixOpen        = false;
  healthInsuranceOpen = false;
  openDropdowns = new Set<string>();

  simulator: { adults: SimulatorAdult[]; children: SimulatorChild[] } = {
    adults: [{ id: 'a1', name: '', birthDate: '', netSalary: 0, status: 'employee', alsoWorker: false }],
    children: [],
  };

  partD: PartDState = {
    communication: 100,
    water:         0,
    electricity:   0,
    arnonaArea:    0,
    arnonaRate:    2,
    extraExpenses: [],
  };

  comparison = {
    show: false,
    personalBudget: 0,
    expenses: [
      { name: 'חדר אוכל',                              pastAmount: 0, newAmount: 0 },
      { name: 'כלבו',                                  pastAmount: 0, newAmount: 0 },
      { name: 'רכב',                                   pastAmount: 0, newAmount: 0 },
      { name: 'הוצאות בריאות מעבר לביטוחים (עד 15%)', pastAmount: 0, newAmount: 0 },
      { name: 'אשראי',                                 pastAmount: 0, newAmount: 0 },
    ] as ComparisonExpense[],
  };

  // ── Service delegates ─────────────────────────────────────────────────────
  get educationInstitutions() { return this.svc.educationInstitutions; }
  get mandatoryInstitutions() { return this.svc.mandatoryInstitutions; }
  get optionalInstitutions()  { return this.svc.optionalInstitutions; }
  get partDNursingInsurance() { return this.svc.getPartDNursingInsurance(this.simulator.adults.length); }
  get partDPhoenixInsurance() { return this.svc.getPartDPhoenixInsurance(this.simulator.adults, this.simulator.children); }
  get partDTotal()              { return this.svc.getPartDTotal(this.simulator.adults, this.simulator.children, this.partD); }
  get partDPhoenixBreakdown()         { return this.svc.getPartDPhoenixBreakdown(this.simulator.adults, this.simulator.children); }
  get partDHealthInsurance()          { return this.svc.getHealthInsuranceTotal(this.simulator.adults, this.simulator.children); }
  get partDHealthInsuranceBreakdown() { return this.svc.getHealthInsuranceBreakdown(this.simulator.adults, this.simulator.children); }
  get simulatorResult()       { return this.svc.calculate(this.simulator.adults, this.simulator.children, this.partD); }

  getRetireePension(adult: SimulatorAdult): number     { return this.svc.getRetireePension(adult); }
  getChildEducationTotal(child: SimulatorChild): number { return this.svc.getChildEducationTotal(child); }

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadFromUrl();
  }

  private loadFromUrl(): void {
    const p = new URLSearchParams(window.location.search);
    if (!p.toString()) return;

    const adults: SimulatorAdult[] = [];
    for (let n = 1; n <= 2; n++) {
      const prefix = `a${n}_`;
      if (!p.has(`${prefix}salary`) && !p.has(`${prefix}status`) && !p.has(`${prefix}name`)) continue;
      adults.push({
        id:         `a${n}`,
        name:       p.get(`${prefix}name`)   ?? '',
        birthDate:  p.get(`${prefix}birth`)  ?? '',
        netSalary:  Number(p.get(`${prefix}salary`) ?? 0),
        status:     (p.get(`${prefix}status`) as SimulatorAdult['status']) ?? 'employee',
        alsoWorker: p.get(`${prefix}worker`) === '1',
      });
    }

    const children: SimulatorChild[] = [];
    for (let n = 1; n <= 10; n++) {
      const prefix = `c${n}_`;
      if (!p.has(`${prefix}birth`) && !p.has(`${prefix}name`)) break;
      children.push({
        id:                   `sc${n}`,
        name:                 p.get(`${prefix}name`)  ?? '',
        birthDate:            p.get(`${prefix}birth`) ?? '',
        selectedInstitutions: p.get(`${prefix}inst`)?.split(',').filter(Boolean) ?? [],
      });
    }

    if (adults.length > 0) this.simulator.adults = adults;
    if (children.length > 0) this.simulator.children = children;
  }

  // ── Status helpers ─────────────────────────────────────
  get hasRetiree(): boolean {
    return this.simulator.adults.some(a => a.status === 'retiree' || a.status === 'singleRetiree');
  }

  get hasSingleRetiree(): boolean {
    return this.simulator.adults.some(a => a.status === 'singleRetiree');
  }

  getPrimaryStatus(adult: SimulatorAdult): 'employee' | 'retiree' {
    return adult.status === 'employee' ? 'employee' : 'retiree';
  }

  onPrimaryStatusChange(adult: SimulatorAdult, value: string): void {
    if (value === 'employee') {
      adult.status = 'employee';
      adult.alsoWorker = false;
    } else {
      if (adult.status === 'employee') {
        adult.status = 'retiree';
        adult.btlMonthly = adult.btlMonthly ?? 2700;
      }
    }
  }

  onRetireeTypeChange(adult: SimulatorAdult, value: string): void {
    adult.status = value as 'retiree' | 'singleRetiree';
    adult.kibbutzPension = undefined;
    adult.btlMonthly = adult.btlMonthly ?? 2700;
    if (value === 'singleRetiree' && this.simulator.adults.length > 1) {
      this.simulator.adults.splice(1, 1);
    }
  }

  // ── Validation ─────────────────────────────────────────
  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  childAgeError(child: SimulatorChild): string {
    if (!child.birthDate) return '';
    for (const adult of this.simulator.adults) {
      if (!adult.birthDate) continue;
      if (child.birthDate <= adult.birthDate) {
        return `${child.name || 'הילד/ה'} חייב/ת להיות צעיר/ה מ-${adult.name || 'המבוגר'}`;
      }
    }
    return '';
  }

  get hasAgeErrors(): boolean {
    return this.simulator.children.some(c => !!this.childAgeError(c));
  }

  // ── Child helpers ──────────────────────────────────────
  childTypeLabel(birthDate: string): string {
    if (!birthDate) return '';
    const age = this.svc.calcAge(birthDate);
    if (age >= 0 && age < 4)   return 'פעוט (0–4)';
    if (age >= 4 && age <= 18) return 'ילד (4–18)';
    return '';
  }

  onDateInput(event: Event, target: any, field: string): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (!val) return;
    const parts = val.split('-');
    if (parts[0] && parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4);
      const corrected = parts.join('-');
      input.value = corrected;
      target[field] = corrected;
    }
  }

  // ── Dropdown helpers ───────────────────────────────────
  @HostListener('document:click')
  closeAllDropdowns(): void {
    this.openDropdowns.clear();
  }

  toggleDropdown(childId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openDropdowns.has(childId)) {
      this.openDropdowns.delete(childId);
    } else {
      this.openDropdowns.clear();
      this.openDropdowns.add(childId);
    }
  }

  isDropdownOpen(childId: string): boolean {
    return this.openDropdowns.has(childId);
  }

  // ── Institution UI ─────────────────────────────────────
  getMandatorySelectedCount(childIndex: number): number {
    const keys = this.svc.mandatoryInstitutions.map(i => i.key);
    return (this.simulator.children[childIndex]?.selectedInstitutions ?? []).filter(k => keys.includes(k)).length;
  }

  getOptionalSelectedCount(childIndex: number): number {
    const keys = this.svc.optionalInstitutions.map(i => i.key);
    return (this.simulator.children[childIndex]?.selectedInstitutions ?? []).filter(k => keys.includes(k)).length;
  }

  isInstitutionSelected(childIndex: number, key: string): boolean {
    return this.simulator.children[childIndex]?.selectedInstitutions.includes(key) ?? false;
  }

  toggleInstitution(childIndex: number, key: string): void {
    const child = this.simulator.children[childIndex];
    if (!child) return;
    const inst = this.svc.educationInstitutions.find(i => i.key === key);
    if (!inst) return;
    const wasSelected = child.selectedInstitutions.includes(key);
    const categoryKeys = this.svc.educationInstitutions.filter(i => i.category === inst.category).map(i => i.key);
    child.selectedInstitutions = child.selectedInstitutions.filter(k => !categoryKeys.includes(k));
    if (!wasSelected) {
      child.selectedInstitutions.push(key);
    }
    this.openDropdowns.delete(child.id + '-' + inst.category);
  }

  get totalEducationCost(): number {
    return this.simulator.children.reduce((sum, child) =>
      sum + this.svc.getChildEducationTotal(child), 0
    );
  }

  // ── CRUD ───────────────────────────────────────────────
  resetSimulator(): void {
    this.simulator = {
      adults: [{ id: 'a1', name: '', birthDate: '', netSalary: 0, status: 'employee', alsoWorker: false }],
      children: [],
    };
    this.openDropdowns.clear();
    this.partD = { communication: 100, water: 0, electricity: 0, arnonaArea: 0, arnonaRate: 2, extraExpenses: [] };
  }

  addSimulatorAdult(): void {
    if (this.simulator.adults.length >= 2) return;
    this.simulator.adults.push({
      id: 'a' + Date.now(),
      name: '',
      birthDate: '',
      netSalary: 0,
      status: 'employee',
      alsoWorker: false,
    });
  }

  removeSimulatorAdult(): void {
    if (this.simulator.adults.length > 1) this.simulator.adults.pop();
  }

  addSimulatorChild(): void {
    this.simulator.children.push({
      id: 'sc' + Date.now(),
      name: '',
      birthDate: '',
      selectedInstitutions: [],
    });
  }

  removeSimulatorChild(index: number): void {
    this.simulator.children.splice(index, 1);
  }

  // ── Part D ─────────────────────────────────────────────
  addPartDExpense(): void {
    this.partD.extraExpenses.push({ name: '', amount: 0 });
  }

  removePartDExpense(i: number): void {
    this.partD.extraExpenses.splice(i, 1);
  }

  // ── Comparison ─────────────────────────────────────────
  get comparisonPastTotal(): number {
    return this.comparison.expenses.reduce((s, e) => s + (e.pastAmount || 0), 0);
  }

  get comparisonNewTotal(): number {
    return this.comparison.expenses.reduce((s, e) => s + (e.newAmount || 0), 0);
  }

  addComparisonExpense(): void {
    this.comparison.expenses.push({ name: '', pastAmount: 0, newAmount: 0 });
  }

  removeComparisonExpense(index: number): void {
    this.comparison.expenses.splice(index, 1);
  }

  // ── Misc ───────────────────────────────────────────────
  getNewHealthCap(finalDisposableIncome: number): number {
    return Math.floor((finalDisposableIncome || 0) * 0.15);
  }

  onHealthAmountInput(event: Event, exp: ComparisonExpense, finalDisposableIncome: number): void {
    const input = event.target as HTMLInputElement;
    const cap = this.getNewHealthCap(finalDisposableIncome);
    let val = parseFloat(input.value) || 0;
    if (cap > 0 && val > cap) {
      val = cap;
      input.value = cap.toString();
    }
    exp.newAmount = val;
  }

  stepBadge(n: number): string {
    return ['א', 'ב', 'ג', 'ד', 'ה'][n - 1] ?? '';
  }

  currentYear(): number {
    return new Date().getFullYear();
  }
}
