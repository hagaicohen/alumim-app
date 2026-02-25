import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

// Helper: date string N years ago
function yearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

describe('AppComponent', () => {

  let app: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  describe('Initial state', () => {
    it('creates the component', () => expect(app).toBeTruthy());

    it('starts with one adult (employee)', () => {
      expect(app.simulator.adults.length).toBe(1);
      expect(app.simulator.adults[0].status).toBe('employee');
    });

    it('starts with no children', () => {
      expect(app.simulator.children.length).toBe(0);
    });

    it('hasSingleRetiree is false by default', () => {
      expect(app.hasSingleRetiree).toBeFalse();
    });

    it('simulatorResult is null with no income', () => {
      expect(app.simulatorResult).toBeNull();
    });
  });

  // ── Adult management ────────────────────────────────────────────────────────

  describe('addSimulatorAdult', () => {
    it('adds a second adult', () => {
      app.addSimulatorAdult();
      expect(app.simulator.adults.length).toBe(2);
    });

    it('does not add beyond 2 adults', () => {
      app.addSimulatorAdult();
      app.addSimulatorAdult();
      expect(app.simulator.adults.length).toBe(2);
    });

    it('new adult defaults to employee', () => {
      app.addSimulatorAdult();
      expect(app.simulator.adults[1].status).toBe('employee');
    });
  });

  describe('removeSimulatorAdult', () => {
    it('removes the second adult', () => {
      app.addSimulatorAdult();
      app.removeSimulatorAdult();
      expect(app.simulator.adults.length).toBe(1);
    });

    it('does not remove if only one adult', () => {
      app.removeSimulatorAdult();
      expect(app.simulator.adults.length).toBe(1);
    });
  });

  // ── singleRetiree constraint ─────────────────────────────────────────────────

  describe('hasSingleRetiree', () => {
    it('is false when adult is employee', () => {
      app.simulator.adults[0].status = 'employee';
      expect(app.hasSingleRetiree).toBeFalse();
    });

    it('is false when adult is retiree', () => {
      app.simulator.adults[0].status = 'retiree';
      expect(app.hasSingleRetiree).toBeFalse();
    });

    it('is true when adult is singleRetiree', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      expect(app.hasSingleRetiree).toBeTrue();
    });

    it('is true when second adult is singleRetiree', () => {
      app.addSimulatorAdult();
      app.simulator.adults[1].status = 'singleRetiree';
      expect(app.hasSingleRetiree).toBeTrue();
    });
  });

  describe('onRetireeTypeChange', () => {
    it('sets adult status to retiree', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      app.onRetireeTypeChange(app.simulator.adults[0], 'retiree');
      expect(app.simulator.adults[0].status).toBe('retiree');
    });

    it('sets adult status to singleRetiree', () => {
      app.simulator.adults[0].status = 'retiree';
      app.onRetireeTypeChange(app.simulator.adults[0], 'singleRetiree');
      expect(app.simulator.adults[0].status).toBe('singleRetiree');
    });

    it('removes second adult when switching to singleRetiree', () => {
      app.addSimulatorAdult();
      expect(app.simulator.adults.length).toBe(2);
      app.onRetireeTypeChange(app.simulator.adults[0], 'singleRetiree');
      expect(app.simulator.adults.length).toBe(1);
    });

    it('does not remove second adult when switching to retiree', () => {
      app.addSimulatorAdult();
      app.simulator.adults[0].status = 'singleRetiree';
      app.onRetireeTypeChange(app.simulator.adults[0], 'retiree');
      expect(app.simulator.adults.length).toBe(2);
    });
  });

  // ── onPrimaryStatusChange ───────────────────────────────────────────────────

  describe('onPrimaryStatusChange', () => {
    it('switches from retiree to employee and clears alsoWorker', () => {
      app.simulator.adults[0].status = 'retiree';
      app.simulator.adults[0].alsoWorker = true;
      app.onPrimaryStatusChange(app.simulator.adults[0], 'employee');
      expect(app.simulator.adults[0].status).toBe('employee');
      expect(app.simulator.adults[0].alsoWorker).toBeFalse();
    });

    it('switches from employee to retiree', () => {
      app.onPrimaryStatusChange(app.simulator.adults[0], 'retiree');
      expect(app.simulator.adults[0].status).toBe('retiree');
    });

    it('keeps singleRetiree subtype when primary stays retiree', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      app.onPrimaryStatusChange(app.simulator.adults[0], 'retiree');
      expect(app.simulator.adults[0].status).toBe('singleRetiree');
    });
  });

  // ── getPrimaryStatus ────────────────────────────────────────────────────────

  describe('getPrimaryStatus', () => {
    it('returns employee for employee', () => {
      app.simulator.adults[0].status = 'employee';
      expect(app.getPrimaryStatus(app.simulator.adults[0])).toBe('employee');
    });

    it('returns retiree for retiree', () => {
      app.simulator.adults[0].status = 'retiree';
      expect(app.getPrimaryStatus(app.simulator.adults[0])).toBe('retiree');
    });

    it('returns retiree for singleRetiree', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      expect(app.getPrimaryStatus(app.simulator.adults[0])).toBe('retiree');
    });
  });

  // ── Pension calculation ─────────────────────────────────────────────────────

  describe('getRetireePension', () => {
    it('returns 11049 for singleRetiree', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      expect(app.getRetireePension(app.simulator.adults[0])).toBe(11049);
    });

    it('returns 8140 for retiree', () => {
      app.simulator.adults[0].status = 'retiree';
      expect(app.getRetireePension(app.simulator.adults[0])).toBe(8140);
    });

    it('returns 0 for employee', () => {
      app.simulator.adults[0].status = 'employee';
      expect(app.getRetireePension(app.simulator.adults[0])).toBe(0);
    });
  });

  // ── getAdultTotalIncome ─────────────────────────────────────────────────────

  describe('getAdultTotalIncome', () => {
    it('employee: returns netSalary', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 5000;
      expect(app.getAdultTotalIncome(app.simulator.adults[0])).toBe(5000);
    });

    it('retiree (no alsoWorker): returns pension only', () => {
      app.simulator.adults[0].status = 'retiree';
      app.simulator.adults[0].alsoWorker = false;
      app.simulator.adults[0].netSalary = 3000;
      expect(app.getAdultTotalIncome(app.simulator.adults[0])).toBe(8140);
    });

    it('retiree + alsoWorker: returns pension + salary', () => {
      app.simulator.adults[0].status = 'retiree';
      app.simulator.adults[0].alsoWorker = true;
      app.simulator.adults[0].netSalary = 2000;
      expect(app.getAdultTotalIncome(app.simulator.adults[0])).toBe(10140);
    });

    it('singleRetiree + alsoWorker: returns 11049 + salary', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      app.simulator.adults[0].alsoWorker = true;
      app.simulator.adults[0].netSalary = 1000;
      expect(app.getAdultTotalIncome(app.simulator.adults[0])).toBe(12049);
    });
  });

  // ── Child management ────────────────────────────────────────────────────────

  describe('addSimulatorChild / removeSimulatorChild', () => {
    it('adds a child', () => {
      app.addSimulatorChild();
      expect(app.simulator.children.length).toBe(1);
    });

    it('adds multiple children', () => {
      app.addSimulatorChild();
      app.addSimulatorChild();
      app.addSimulatorChild();
      expect(app.simulator.children.length).toBe(3);
    });

    it('removes child by index', () => {
      app.addSimulatorChild();
      app.addSimulatorChild();
      app.simulator.children[0].name = 'ראשון';
      app.simulator.children[1].name = 'שני';
      app.removeSimulatorChild(0);
      expect(app.simulator.children.length).toBe(1);
      expect(app.simulator.children[0].name).toBe('שני');
    });
  });

  // ── childAgeError ───────────────────────────────────────────────────────────

  describe('childAgeError', () => {
    it('returns empty string when no dates', () => {
      app.simulator.adults[0].birthDate = '';
      app.addSimulatorChild();
      app.simulator.children[0].birthDate = '';
      expect(app.childAgeError(app.simulator.children[0])).toBe('');
    });

    it('returns empty string when child is younger than adult', () => {
      app.simulator.adults[0].birthDate = yearsAgo(40);
      app.addSimulatorChild();
      app.simulator.children[0].birthDate = yearsAgo(10);
      expect(app.childAgeError(app.simulator.children[0])).toBe('');
    });

    it('returns error when child is older than adult', () => {
      app.simulator.adults[0].birthDate = yearsAgo(30);
      app.addSimulatorChild();
      app.simulator.children[0].birthDate = yearsAgo(35);
      app.simulator.children[0].name = 'דן';
      const err = app.childAgeError(app.simulator.children[0]);
      expect(err).toContain('דן');
    });

    it('returns error when child same birth date as adult', () => {
      const date = yearsAgo(30);
      app.simulator.adults[0].birthDate = date;
      app.addSimulatorChild();
      app.simulator.children[0].birthDate = date;
      expect(app.childAgeError(app.simulator.children[0])).toBeTruthy();
    });
  });

  describe('hasAgeErrors', () => {
    it('false when no children', () => expect(app.hasAgeErrors).toBeFalse());

    it('true when a child has an age error', () => {
      app.simulator.adults[0].birthDate = yearsAgo(30);
      app.addSimulatorChild();
      app.simulator.children[0].birthDate = yearsAgo(35);
      expect(app.hasAgeErrors).toBeTrue();
    });
  });

  // ── childTypeLabel ──────────────────────────────────────────────────────────

  describe('childTypeLabel', () => {
    it('returns empty for no date', () => expect(app.childTypeLabel('')).toBe(''));

    it('labels infant (age 0)', () => {
      expect(app.childTypeLabel(yearsAgo(0))).toBe('פעוט (0–4)');
    });

    it('labels infant (age 3)', () => {
      expect(app.childTypeLabel(yearsAgo(3))).toBe('פעוט (0–4)');
    });

    it('labels child (age 4)', () => {
      expect(app.childTypeLabel(yearsAgo(4))).toBe('ילד (4–18)');
    });

    it('labels child (age 18)', () => {
      expect(app.childTypeLabel(yearsAgo(18))).toBe('ילד (4–18)');
    });

    it('returns empty for age 19+', () => {
      expect(app.childTypeLabel(yearsAgo(19))).toBe('');
    });
  });

  // ── Institution selection ───────────────────────────────────────────────────

  describe('Institution management', () => {
    beforeEach(() => app.addSimulatorChild());

    it('isInstitutionSelected returns false for unselected', () => {
      expect(app.isInstitutionSelected(0, 'dekel')).toBeFalse();
    });

    it('toggleInstitution adds institution', () => {
      app.toggleInstitution(0, 'dekel');
      expect(app.isInstitutionSelected(0, 'dekel')).toBeTrue();
    });

    it('toggleInstitution removes already-selected institution', () => {
      app.toggleInstitution(0, 'dekel');
      app.toggleInstitution(0, 'dekel');
      expect(app.isInstitutionSelected(0, 'dekel')).toBeFalse();
    });

    it('getSelectedInstitutions returns correct list', () => {
      app.toggleInstitution(0, 'dekel');
      app.toggleInstitution(0, 'gan');
      const selected = app.getSelectedInstitutions(app.simulator.children[0]);
      expect(selected.length).toBe(2);
      expect(selected.map(i => i.key)).toContain('dekel');
      expect(selected.map(i => i.key)).toContain('gan');
    });

    it('getChildEducationTotal sums costs correctly', () => {
      app.toggleInstitution(0, 'dekel');  // 2248
      app.toggleInstitution(0, 'gan');    // 1300
      expect(app.getChildEducationTotal(app.simulator.children[0])).toBe(3548);
    });
  });

  describe('totalEducationCost', () => {
    it('is 0 with no children', () => expect(app.totalEducationCost).toBe(0));

    it('sums costs across multiple children', () => {
      app.addSimulatorChild();
      app.addSimulatorChild();
      app.toggleInstitution(0, 'yesodi');   // 92
      app.toggleInstitution(1, 'moadon');   // 800
      expect(app.totalEducationCost).toBe(892);
    });
  });

  // ── Dropdown ────────────────────────────────────────────────────────────────

  describe('Dropdown', () => {
    beforeEach(() => app.addSimulatorChild());

    it('isDropdownOpen is false initially', () => {
      expect(app.isDropdownOpen(app.simulator.children[0].id)).toBeFalse();
    });

    it('toggleDropdown opens dropdown', () => {
      const id = app.simulator.children[0].id;
      app.toggleDropdown(id, new MouseEvent('click'));
      expect(app.isDropdownOpen(id)).toBeTrue();
    });

    it('toggleDropdown closes open dropdown', () => {
      const id = app.simulator.children[0].id;
      app.toggleDropdown(id, new MouseEvent('click'));
      app.toggleDropdown(id, new MouseEvent('click'));
      expect(app.isDropdownOpen(id)).toBeFalse();
    });

    it('closeAllDropdowns closes all', () => {
      const id = app.simulator.children[0].id;
      app.toggleDropdown(id, new MouseEvent('click'));
      app.closeAllDropdowns();
      expect(app.isDropdownOpen(id)).toBeFalse();
    });
  });

  // ── simulatorResult — net income (Step A) ───────────────────────────────────

  describe('simulatorResult — Step A: Net Income', () => {
    it('returns null when all incomes are 0', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 0;
      expect(app.simulatorResult).toBeNull();
    });

    it('single employee: netIncome = salary - 910', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      const r = app.simulatorResult!;
      expect(r.netIncome).toBe(10000 - 910);
    });

    it('single retiree: netIncome = pension - 910', () => {
      app.simulator.adults[0].status = 'retiree';
      const r = app.simulatorResult!;
      expect(r.netIncome).toBe(8140 - 910);
    });

    it('single singleRetiree: netIncome = 11049 - 910', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      const r = app.simulatorResult!;
      expect(r.netIncome).toBe(11049 - 910);
    });

    it('two adults: community tax = 1820', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 8000;
      app.addSimulatorAdult();
      app.simulator.adults[1].status = 'employee';
      app.simulator.adults[1].netSalary = 5000;
      const r = app.simulatorResult!;
      expect(r.communityTaxTotal).toBe(1820);
      expect(r.netIncome).toBe(13000 - 1820);
    });

    it('retiree + alsoWorker: income includes both', () => {
      app.simulator.adults[0].status = 'retiree';
      app.simulator.adults[0].alsoWorker = true;
      app.simulator.adults[0].netSalary = 2000;
      const r = app.simulatorResult!;
      const adultIncome = r.adultIncomes[0];
      expect(adultIncome.pension).toBe(8140);
      expect(adultIncome.workSalary).toBe(2000);
    });

    // Child allowance tiers
    it('child allowance: 1 child = 173', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.childAllowance).toBe(173);
    });

    it('child allowance: 2 children = 392', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      app.addSimulatorChild();
      app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.childAllowance).toBe(392);
    });

    it('child allowance: 3 children = 611', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      for (let i = 0; i < 3; i++) app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.childAllowance).toBe(611);
    });

    it('child allowance: 4 children = 830', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      for (let i = 0; i < 4; i++) app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.childAllowance).toBe(830);
    });

    it('child allowance: 5 children = 1003', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      for (let i = 0; i < 5; i++) app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.childAllowance).toBe(1003);
    });

    it('child allowance: 6 children = 1176 (no cap)', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      for (let i = 0; i < 6; i++) app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.childAllowance).toBe(1176);
    });

    it('child allowance: 7 children = 1349 (no cap)', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      for (let i = 0; i < 7; i++) app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.childAllowance).toBe(1349);
    });
  });

  // ── simulatorResult — safety net (Step B) ──────────────────────────────────

  describe('simulatorResult — Step B: Safety Net', () => {
    it('singleRetiree adult safety net = 11049', () => {
      app.simulator.adults[0].status = 'singleRetiree';
      const r = app.simulatorResult!;
      expect(r.adultSafetyNets[0].amount).toBe(11049);
      expect(r.adultSafetyNets[0].reason).toContain('יחיד');
    });

    it('retiree adult safety net = 8140', () => {
      app.simulator.adults[0].status = 'retiree';
      const r = app.simulatorResult!;
      expect(r.adultSafetyNets[0].amount).toBe(8140);
    });

    it('employee adult safety net = 6248', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      const r = app.simulatorResult!;
      expect(r.adultSafetyNets[0].amount).toBe(6248);
    });

    it('infant child (age 2) safety net = 2066', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      app.addSimulatorChild();
      app.simulator.children[0].birthDate = yearsAgo(2);
      const r = app.simulatorResult!;
      expect(r.childSafetyNets[0].amount).toBe(2066);
      expect(r.childSafetyNets[0].type).toContain('פעוט');
    });

    it('child (age 8) safety net = 1562', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      app.addSimulatorChild();
      app.simulator.children[0].birthDate = yearsAgo(8);
      const r = app.simulatorResult!;
      expect(r.childSafetyNets[0].amount).toBe(1562);
    });

    it('child without birthDate is not in safety net', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 10000;
      app.addSimulatorChild();
      // no birthDate set
      const r = app.simulatorResult!;
      expect(r.childSafetyNets.length).toBe(0);
    });

    it('safetyNetTopUp fills gap when netIncome < safetyNet', () => {
      // retiree income = 8140 - 910 = 7230, safety net = 8140 → gap = 910
      app.simulator.adults[0].status = 'retiree';
      const r = app.simulatorResult!;
      const expectedTopUp = Math.max(0, r.safetyNetTotal - r.netIncome);
      expect(r.safetyNetTopUp).toBe(expectedTopUp);
    });

    it('safetyNetTopUp is 0 when netIncome >= safetyNet', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 20000;
      const r = app.simulatorResult!;
      expect(r.safetyNetTopUp).toBe(0);
    });
  });

  // ── simulatorResult — progressive tax ──────────────────────────────────────

  describe('simulatorResult — Progressive Tax', () => {
    it('no tax when netIncome <= safetyNet', () => {
      app.simulator.adults[0].status = 'retiree'; // income ≈ safety net
      const r = app.simulatorResult!;
      expect(r.taxableBase).toBe(0);
      expect(r.mutualSolidarityTax).toBe(0);
      expect(r.taxBreakdown.length).toBe(0);
    });

    it('only 10% tier when taxableBase <= 4000', () => {
      // netIncome - safetyNet = 2000
      // employee safety net = 6248; so salary needed: 6248 + 2000 + 910 = 9158
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 6248 + 910 + 2000;
      const r = app.simulatorResult!;
      expect(r.taxableBase).toBe(2000);
      expect(r.taxBreakdown.length).toBe(1);
      expect(r.mutualSolidarityTax).toBeCloseTo(200, 0);
    });

    it('10% + 20% tiers when 4000 < taxableBase <= 8000', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 6248 + 910 + 6000; // taxableBase = 6000
      const r = app.simulatorResult!;
      expect(r.taxableBase).toBe(6000);
      expect(r.taxBreakdown.length).toBe(2);
      // 400 (10%) + 400 (20%) = 800
      expect(r.mutualSolidarityTax).toBeCloseTo(800, 0);
    });

    it('all three tiers when taxableBase > 8000', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 6248 + 910 + 10000; // taxableBase = 10000
      const r = app.simulatorResult!;
      expect(r.taxableBase).toBe(10000);
      expect(r.taxBreakdown.length).toBe(3);
      // 400 + 800 + 600 = 1800
      expect(r.mutualSolidarityTax).toBeCloseTo(1800, 0);
    });

    it('tax is capped at 4000', () => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 6248 + 910 + 50000; // huge taxableBase
      const r = app.simulatorResult!;
      expect(r.mutualSolidarityTax).toBeLessThanOrEqual(4000);
    });
  });

  // ── simulatorResult — Education (Step C) ───────────────────────────────────

  describe('simulatorResult — Step C: Education', () => {
    beforeEach(() => {
      app.simulator.adults[0].status = 'employee';
      app.simulator.adults[0].netSalary = 20000;
    });

    it('grossEducationCost is 0 with no institutions selected', () => {
      app.addSimulatorChild();
      const r = app.simulatorResult!;
      expect(r.grossEducationCost).toBe(0);
    });

    it('grossEducationCost sums all selected institutions', () => {
      app.addSimulatorChild();
      app.toggleInstitution(0, 'dekel');   // 2248
      app.toggleInstitution(0, 'yesodi');  // 92
      const r = app.simulatorResult!;
      expect(r.grossEducationCost).toBe(2340);
    });

    it('familyPaymentCap is 25% of disposableIncome', () => {
      app.addSimulatorChild();
      app.toggleInstitution(0, 'dekel');
      const r = app.simulatorResult!;
      expect(r.familyPaymentCap).toBeCloseTo(r.disposableIncome * 0.25, 1);
    });

    it('actualEducationCost = min(gross, cap)', () => {
      app.addSimulatorChild();
      app.toggleInstitution(0, 'dekel');
      const r = app.simulatorResult!;
      expect(r.actualEducationCost).toBe(Math.min(r.grossEducationCost, r.familyPaymentCap));
    });

    it('kibbutzSubsidy covers excess education cost beyond cap', () => {
      // Use a very low salary to make the cap small
      app.simulator.adults[0].netSalary = 7500; // low disposable income
      app.addSimulatorChild();
      // Add expensive institutions
      app.toggleInstitution(0, 'dekel');      // 2248
      app.toggleInstitution(0, 'almogen');    // 1779
      app.toggleInstitution(0, 'brosh');      // 1850
      const r = app.simulatorResult!;
      expect(r.kibbutzSubsidy).toBe(Math.max(0, r.grossEducationCost - r.actualEducationCost));
    });

    it('finalDisposableIncome = disposableIncome - actualEducationCost', () => {
      app.addSimulatorChild();
      app.toggleInstitution(0, 'dekel');
      const r = app.simulatorResult!;
      expect(r.finalDisposableIncome).toBeCloseTo(r.disposableIncome - r.actualEducationCost, 1);
    });

    it('childEducationDetails includes institution names and costs', () => {
      app.addSimulatorChild();
      app.simulator.children[0].name = 'יוסי';
      app.toggleInstitution(0, 'dekel');
      const r = app.simulatorResult!;
      expect(r.childEducationDetails[0].name).toBe('יוסי');
      expect(r.childEducationDetails[0].institutions[0].name).toBe('דקל');
      expect(r.childEducationDetails[0].institutions[0].cost).toBe(2248);
    });
  });

  // ── todayStr ────────────────────────────────────────────────────────────────

  describe('todayStr', () => {
    it('returns a valid ISO date string', () => {
      expect(app.todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('is not in the future', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(app.todayStr <= today).toBeTrue();
    });
  });

  // ── currentYear ─────────────────────────────────────────────────────────────

  describe('currentYear', () => {
    it('returns the current year', () => {
      expect(app.currentYear()).toBe(new Date().getFullYear());
    });
  });

});
