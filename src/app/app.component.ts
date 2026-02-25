import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// ── Simulator interfaces ──────────────────────────────────────────────────────

interface SimulatorAdult {
  id: string;
  name: string;
  birthDate: string;
  netSalary: number;
  status: 'employee' | 'retiree' | 'singleRetiree';
  alsoWorker: boolean;
}

interface SimulatorChild {
  id: string;
  name: string;
  birthDate: string;
  selectedInstitutions: string[];
}

interface EducationInstitution {
  key: string;
  name: string;
  cost: number;
  category: 'mandatory' | 'optional';
}

interface SimulationResult {
  adultIncomes: { name: string; pension: number; workSalary: number; status: 'employee' | 'retiree' | 'singleRetiree' }[];
  totalNetSalary: number;
  childAllowance: number;
  communityTaxTotal: number;
  netIncome: number;
  adultSafetyNets: { name: string; amount: number; reason: string }[];
  childSafetyNets: { name: string; type: string; amount: number }[];
  safetyNetTotal: number;
  safetyNetTopUp: number;
  taxableBase: number;
  taxBreakdown: { tier: string; base: number; tax: number }[];
  mutualSolidarityTax: number;
  disposableIncome: number;
  childEducationDetails: {
    name: string;
    institutions: { name: string; cost: number }[];
    totalCost: number;
  }[];
  grossEducationCost: number;
  familyPaymentCap: number;
  actualEducationCost: number;
  kibbutzSubsidy: number;
  finalDisposableIncome: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PENSION_SINGLE_RETIREE = 11049;
const PENSION_RETIREE        = 8140;

const EDUCATION_INSTITUTIONS: EducationInstitution[] = [
  { key: 'dekel',         name: 'דקל',           cost: 2248, category: 'mandatory' },
  { key: 'almogen',       name: 'אלמוגן',         cost: 1779, category: 'mandatory' },
  { key: 'brosh',         name: 'ברוש',           cost: 1850, category: 'mandatory' },
  { key: 'ganon',         name: 'גנון',           cost: 1700, category: 'mandatory' },
  { key: 'gan',           name: 'גן',             cost: 1300, category: 'mandatory' },
  { key: 'yesodi',        name: 'יסודי',          cost: 92,   category: 'mandatory' },
  { key: 'chativaBS',     name: 'חטיבה ביס',      cost: 208,  category: 'mandatory' },
  { key: 'tikhonBS',      name: 'תיכון ביס',      cost: 1667, category: 'mandatory' },
  { key: 'beytKolel',     name: 'בית כולל',       cost: 1200, category: 'optional'  },
  { key: 'moadon',        name: 'מועדון',         cost: 800,  category: 'optional'  },
  { key: 'chativaAlumim', name: 'חטיבה עלומים',   cost: 400,  category: 'optional'  },
  { key: 'tikhonAlumim',  name: 'תיכון עלומים',   cost: 200,  category: 'optional'  },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {

  readonly educationInstitutions  = EDUCATION_INSTITUTIONS;
  readonly mandatoryInstitutions  = EDUCATION_INSTITUTIONS.filter(i => i.category === 'mandatory');
  readonly optionalInstitutions   = EDUCATION_INSTITUTIONS.filter(i => i.category === 'optional');
  openDropdowns = new Set<string>();

  simulator: { adults: SimulatorAdult[]; children: SimulatorChild[] } = {
    adults: [{ id: 'a1', name: '', birthDate: '', netSalary: 0, status: 'employee', alsoWorker: false }],
    children: [],
  };

  // ── Retiree pension helpers ─────────────────────────────

  getRetireePension(adult: SimulatorAdult): number {
    if (adult.status === 'singleRetiree') return PENSION_SINGLE_RETIREE;
    if (adult.status === 'retiree')       return PENSION_RETIREE;
    return 0;
  }

  getAdultTotalIncome(adult: SimulatorAdult): number {
    const pension    = this.getRetireePension(adult);
    const workSalary = (adult.status === 'employee' || adult.alsoWorker) ? (adult.netSalary || 0) : 0;
    return pension + workSalary;
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
      }
    }
  }

  onRetireeTypeChange(adult: SimulatorAdult, value: string): void {
    adult.status = value as 'retiree' | 'singleRetiree';
    if (value === 'singleRetiree' && this.simulator.adults.length > 1) {
      this.simulator.adults.splice(1, 1);
    }
  }

  get hasSingleRetiree(): boolean {
    return this.simulator.adults.some(a => a.status === 'singleRetiree');
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

  // ── Helpers ────────────────────────────────────────────

  calcAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  currentYear(): number {
    return new Date().getFullYear();
  }

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

  getSelectedInstitutions(child: SimulatorChild): EducationInstitution[] {
    return EDUCATION_INSTITUTIONS.filter(inst =>
      child.selectedInstitutions.includes(inst.key)
    );
  }

  getChildEducationTotal(child: SimulatorChild): number {
    return this.getSelectedInstitutions(child).reduce((sum, inst) => sum + inst.cost, 0);
  }

  get totalEducationCost(): number {
    return this.simulator.children.reduce((sum, child) =>
      sum + this.getChildEducationTotal(child), 0
    );
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

  childTypeLabel(birthDate: string): string {
    if (!birthDate) return '';
    const age = this.calcAge(birthDate);
    if (age >= 0 && age < 4)   return 'פעוט (0–4)';
    if (age >= 4 && age <= 18) return 'ילד (4–18)';
    return '';
  }

  // ── Simulator methods ──────────────────────────────────

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

  isInstitutionSelected(childIndex: number, key: string): boolean {
    return this.simulator.children[childIndex]?.selectedInstitutions.includes(key) ?? false;
  }

  toggleInstitution(childIndex: number, key: string): void {
    const child = this.simulator.children[childIndex];
    if (!child) return;
    const idx = child.selectedInstitutions.indexOf(key);
    if (idx >= 0) {
      child.selectedInstitutions.splice(idx, 1);
    } else {
      child.selectedInstitutions.push(key);
    }
  }

  // ── Calculation ────────────────────────────────────────

  get simulatorResult(): SimulationResult | null {
    const adults = this.simulator.adults;
    if (!adults.some(a => this.getAdultTotalIncome(a) > 0)) return null;

    // ── Step A: Net Income ────────────────────────────────
    const adultIncomes = adults.map(a => ({
      name:       a.name || 'מבוגר',
      pension:    this.getRetireePension(a),
      workSalary: (a.status === 'employee' || a.alsoWorker) ? (a.netSalary || 0) : 0,
      status:     a.status,
    }));

    const totalNetSalary = adultIncomes.reduce((sum, a) => sum + a.pension + a.workSalary, 0);

    const childCount = this.simulator.children.length;
    let childAllowance = 0;
    if (childCount >= 1) childAllowance += 173;
    if (childCount >= 2) childAllowance += 219;
    if (childCount >= 3) childAllowance += 219;
    if (childCount >= 4) childAllowance += 219;
    if (childCount >= 5) childAllowance += 173;
    childAllowance = Math.min(childAllowance, 1003);

    const communityTaxTotal = adults.length * 910;  // 850 קהילה + 60 עזרה הדדית
    const netIncome = totalNetSalary + childAllowance - communityTaxTotal;

    // ── Step B: Safety Net ────────────────────────────────
    const adultSafetyNets: { name: string; amount: number; reason: string }[] = [];
    for (const adult of adults) {
      let amount: number;
      let reason: string;
      if (adult.status === 'singleRetiree') {
        amount = 11049; reason = 'גמלאי/ת יחיד/ה';
      } else if (adult.status === 'retiree') {
        amount = 8140;  reason = 'גמלאי/ת';
      } else {
        amount = 6248;  reason = 'חבר/ת עובד/ת';
      }
      adultSafetyNets.push({ name: adult.name || 'מבוגר', amount, reason });
    }

    const childSafetyNets: { name: string; type: string; amount: number }[] = [];
    for (const child of this.simulator.children) {
      if (!child.birthDate) continue;
      const age = this.calcAge(child.birthDate);
      if (age >= 0 && age < 4) {
        childSafetyNets.push({ name: child.name || 'ילד/ה', type: 'פעוט (0–4)', amount: 2066 });
      } else if (age >= 4 && age <= 18) {
        childSafetyNets.push({ name: child.name || 'ילד/ה', type: 'ילד (4–18)',  amount: 1562 });
      }
    }

    const safetyNetTotal =
      adultSafetyNets.reduce((s, a) => s + a.amount, 0) +
      childSafetyNets.reduce((s, c) => s + c.amount, 0);

    // Safety net top-up: if net income < safety net, add the gap
    const safetyNetTopUp = Math.max(0, safetyNetTotal - netIncome);

    // ── Progressive tax ────────────────────────────────────
    const taxableBase = Math.max(0, netIncome - safetyNetTotal);
    const taxBreakdown: { tier: string; base: number; tax: number }[] = [];
    let mutualSolidarityTax = 0;

    if (taxableBase > 0) {
      const b1 = Math.min(taxableBase, 4000);
      const t1 = b1 * 0.1;
      taxBreakdown.push({ tier: '10% על 4,000 ₪ הראשונים', base: b1, tax: t1 });
      mutualSolidarityTax += t1;
    }
    if (taxableBase > 4000) {
      const b2 = Math.min(taxableBase - 4000, 4000);
      const t2 = b2 * 0.2;
      taxBreakdown.push({ tier: '20% על 4,001–8,000 ₪', base: b2, tax: t2 });
      mutualSolidarityTax += t2;
    }
    if (taxableBase > 8000) {
      const b3 = taxableBase - 8000;
      const t3 = b3 * 0.3;
      taxBreakdown.push({ tier: '30% מעל 8,000 ₪', base: b3, tax: t3 });
      mutualSolidarityTax += t3;
    }
    mutualSolidarityTax = Math.min(mutualSolidarityTax, 4000);

    // disposableIncome includes safety net top-up
    const disposableIncome = netIncome - mutualSolidarityTax + safetyNetTopUp;

    // ── Step C: Education ──────────────────────────────────
    const childEducationDetails: {
      name: string;
      institutions: { name: string; cost: number }[];
      totalCost: number;
    }[] = [];
    let grossEducationCost = 0;

    for (const child of this.simulator.children) {
      const selected = EDUCATION_INSTITUTIONS.filter(inst =>
        child.selectedInstitutions.includes(inst.key)
      );
      const totalCost = selected.reduce((s, inst) => s + inst.cost, 0);
      grossEducationCost += totalCost;
      childEducationDetails.push({
        name: child.name || 'ילד/ה',
        institutions: selected.map(i => ({ name: i.name, cost: i.cost })),
        totalCost,
      });
    }

    const familyPaymentCap    = Math.max(0, disposableIncome * 0.25);
    const actualEducationCost = Math.min(grossEducationCost, familyPaymentCap);
    const kibbutzSubsidy      = Math.max(0, grossEducationCost - actualEducationCost);
    const finalDisposableIncome = disposableIncome - actualEducationCost;

    return {
      adultIncomes, totalNetSalary, childAllowance, communityTaxTotal, netIncome,
      adultSafetyNets, childSafetyNets, safetyNetTotal, safetyNetTopUp,
      taxableBase, taxBreakdown, mutualSolidarityTax, disposableIncome,
      childEducationDetails, grossEducationCost,
      familyPaymentCap, actualEducationCost, kibbutzSubsidy, finalDisposableIncome,
    };
  }
}
