import { Injectable } from '@angular/core';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface SimulatorAdult {
  id: string;
  name: string;
  birthDate: string;
  netSalary: number;
  status: 'employee' | 'retiree' | 'singleRetiree';
  alsoWorker: boolean;
  btlMonthly?: number;
}

export interface SimulatorChild {
  id: string;
  name: string;
  birthDate: string;
  selectedInstitutions: string[];
}

export interface ComparisonExpense {
  name: string;
  pastAmount: number;
  newAmount: number;
}

export interface EducationInstitution {
  key: string;
  name: string;
  cost: number;
  category: 'mandatory' | 'optional';
}

export interface SimulationResult {
  adultIncomes: { name: string; pension: number; workSalary: number; status: 'employee' | 'retiree' | 'singleRetiree' }[];
  totalNetSalary: number;
  childAllowance: number;
  btlAllowance: number;
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
  partDTotal: number;
  finalDisposableIncome: number;
}

export interface PartDState {
  communication: number;
  water: number;
  electricity: number;
  arnonaArea: number;
  arnonaRate: number;
  extraExpenses: { name: string; amount: number }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const PENSION_SINGLE_RETIREE = 11396;
const PENSION_RETIREE        = 8140;

export const EDUCATION_INSTITUTIONS: EducationInstitution[] = [
  { key: 'dekel',         name: 'פעוטון דקל',        cost: 2248, category: 'mandatory' },
  { key: 'almogen',       name: 'פעוטון אלמוגן',      cost: 1779, category: 'mandatory' },
  { key: 'brosh',         name: 'פעוטון ברוש',        cost: 1850, category: 'mandatory' },
  { key: 'ganon',         name: 'גנון צאלון',         cost: 1700, category: 'mandatory' },
  { key: 'gan',           name: 'גן ארזים',           cost: 1300, category: 'mandatory' },
  { key: 'yesodi',        name: 'בי"ס יסודי א-ו',    cost: 92,   category: 'mandatory' },
  { key: 'chativaBS',     name: 'בי"ס חטיבה',        cost: 208,  category: 'mandatory' },
  { key: 'tikhonBS',      name: 'בי"ס תיכון',        cost: 1667, category: 'mandatory' },
  { key: 'beytKolel',     name: 'בית כולל א-ג',      cost: 1200, category: 'optional'  },
  { key: 'moadon',        name: 'מועדון אורן ד-ו',   cost: 800,  category: 'optional'  },
  { key: 'chativaAlumim', name: 'מועדון חטיבה',       cost: 400,  category: 'optional'  },
  { key: 'tikhonAlumim',  name: 'מועדון תיכון',       cost: 200,  category: 'optional'  },
];

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  readonly educationInstitutions = EDUCATION_INSTITUTIONS;
  readonly mandatoryInstitutions = EDUCATION_INSTITUTIONS.filter(i => i.category === 'mandatory');
  readonly optionalInstitutions  = EDUCATION_INSTITUTIONS.filter(i => i.category === 'optional');

  calcAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

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

  getBtlAllowance(adults: SimulatorAdult[]): number {
    return adults
      .filter(a => a.status === 'retiree' || a.status === 'singleRetiree')
      .reduce((sum, a) => sum + (a.btlMonthly ?? 2700), 0);
  }

  getSelectedInstitutions(child: SimulatorChild): EducationInstitution[] {
    return EDUCATION_INSTITUTIONS.filter(inst =>
      child.selectedInstitutions.includes(inst.key)
    );
  }

  getChildEducationTotal(child: SimulatorChild): number {
    return this.getSelectedInstitutions(child).reduce((sum, inst) => sum + inst.cost, 0);
  }

  getPartDNursingInsurance(adultsCount: number): number {
    return adultsCount * 50;
  }

  getPartDPhoenixInsurance(adults: SimulatorAdult[], children: SimulatorChild[]): number {
    let total = 0;
    for (const adult of adults) {
      if (!adult.birthDate) continue;
      const age = this.calcAge(adult.birthDate);
      if (age >= 70)      total += 141.82;
      else if (age >= 51) total += 80.63;
      else                total += 63.27;
    }
    let kidCount = 0;
    for (const child of children) {
      if (kidCount >= 2) break;
      if (!child.birthDate) continue;
      if (this.calcAge(child.birthDate) < 21) { total += 22.98; kidCount++; }
    }
    return Math.round(total * 100) / 100;
  }

  getPartDPhoenixBreakdown(adults: SimulatorAdult[], children: SimulatorChild[]): { name: string; amount: number }[] {
    const items: { name: string; amount: number }[] = [];
    for (const adult of adults) {
      if (!adult.birthDate) continue;
      const age = this.calcAge(adult.birthDate);
      const amount = age >= 70 ? 141.82 : age >= 51 ? 80.63 : 63.27;
      items.push({ name: adult.name || 'מבוגר', amount });
    }
    let kidCount = 0;
    for (const child of children) {
      if (kidCount >= 2) break;
      if (!child.birthDate) continue;
      if (this.calcAge(child.birthDate) < 21) {
        items.push({ name: child.name || 'ילד/ה', amount: 22.98 });
        kidCount++;
      }
    }
    return items;
  }

  private getHealthInsuranceRate(age: number): number {
    if (age >= 1  && age <= 17) return 10.47;
    if (age === 18)              return 21.6;
    if (age >= 19 && age <= 38) return 38.99;
    if (age === 39)              return 55.47;
    if (age >= 40 && age <= 49) return 62.81;
    if (age >= 50 && age <= 64) return 69.91;
    if (age >= 65)               return 74.98;
    return 0;
  }

  getHealthInsuranceTotal(adults: SimulatorAdult[], children: SimulatorChild[]): number {
    let total = 0;
    for (const adult of adults) {
      if (!adult.birthDate) continue;
      total += this.getHealthInsuranceRate(this.calcAge(adult.birthDate));
    }
    for (const child of children) {
      if (!child.birthDate) continue;
      total += this.getHealthInsuranceRate(this.calcAge(child.birthDate));
    }
    return Math.round(total * 100) / 100;
  }

  getHealthInsuranceBreakdown(adults: SimulatorAdult[], children: SimulatorChild[]): { name: string; amount: number }[] {
    const items: { name: string; amount: number }[] = [];
    for (const adult of adults) {
      if (!adult.birthDate) continue;
      const amount = this.getHealthInsuranceRate(this.calcAge(adult.birthDate));
      if (amount > 0) items.push({ name: adult.name || 'מבוגר', amount });
    }
    for (const child of children) {
      if (!child.birthDate) continue;
      const amount = this.getHealthInsuranceRate(this.calcAge(child.birthDate));
      if (amount > 0) items.push({ name: child.name || 'ילד/ה', amount });
    }
    return items;
  }

  getPartDTotal(adults: SimulatorAdult[], children: SimulatorChild[], partD: PartDState): number {
    return this.getPartDNursingInsurance(adults.length)
      + this.getPartDPhoenixInsurance(adults, children)
      + this.getHealthInsuranceTotal(adults, children)
      + (partD.communication || 0)
      + (partD.water || 0)
      + (partD.electricity || 0)
      + (partD.arnonaArea || 0) * (partD.arnonaRate || 0)
      + partD.extraExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  }

  calculate(adults: SimulatorAdult[], children: SimulatorChild[], partD: PartDState): SimulationResult | null {
    if (!adults.some(a => this.getAdultTotalIncome(a) > 0)) return null;

    // ── Step A: Net Income ────────────────────────────────
    const adultIncomes = adults.map(a => ({
      name:       a.name || 'מבוגר',
      pension:    this.getRetireePension(a),
      workSalary: (a.status === 'employee' || a.alsoWorker) ? (a.netSalary || 0) : 0,
      status:     a.status,
    }));

    const totalNetSalary = adultIncomes.reduce((sum, a) => sum + a.pension + a.workSalary, 0);

    const childCount = children.length;
    let childAllowance = 0;
    if (childCount >= 1) childAllowance += 173;
    if (childCount >= 2) childAllowance += 219;
    if (childCount >= 3) childAllowance += 219;
    if (childCount >= 4) childAllowance += 219;
    if (childCount >= 5) childAllowance += 173 * (childCount - 4);

    const btlAllowance      = this.getBtlAllowance(adults);
    const communityTaxTotal = adults.length * 910;
    const grossIncome       = totalNetSalary + childAllowance + btlAllowance;
    const netIncome         = grossIncome - communityTaxTotal;

    // ── Step B: Safety Net ────────────────────────────────
    const adultSafetyNets: { name: string; amount: number; reason: string }[] = [];
    for (const adult of adults) {
      let amount: number;
      let reason: string;
      if (adult.status === 'singleRetiree') {
        amount = 5427; reason = 'גמלאי/ת יחיד/ה';
      } else if (adult.status === 'retiree') {
        amount = 5427; reason = 'גמלאי/ת';
      } else {
        amount = 6248;  reason = 'חבר/ת עובד/ת';
      }
      adultSafetyNets.push({ name: adult.name || 'מבוגר', amount, reason });
    }

    const childSafetyNets: { name: string; type: string; amount: number }[] = [];
    for (const child of children) {
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

    const safetyNetTopUp = Math.max(0, safetyNetTotal - grossIncome);

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

    const disposableIncome = netIncome - mutualSolidarityTax + safetyNetTopUp;

    // ── Step C: Education ──────────────────────────────────
    const childEducationDetails: {
      name: string;
      institutions: { name: string; cost: number }[];
      totalCost: number;
    }[] = [];
    let grossEducationCost = 0;

    for (const child of children) {
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
    const partDTotal          = this.getPartDTotal(adults, children, partD);
    const finalDisposableIncome = disposableIncome - actualEducationCost - partDTotal;

    return {
      adultIncomes, totalNetSalary, childAllowance, btlAllowance, communityTaxTotal, netIncome,
      adultSafetyNets, childSafetyNets, safetyNetTotal, safetyNetTopUp,
      taxableBase, taxBreakdown, mutualSolidarityTax, disposableIncome,
      childEducationDetails, grossEducationCost,
      familyPaymentCap, actualEducationCost, kibbutzSubsidy, partDTotal, finalDisposableIncome,
    };
  }
}
