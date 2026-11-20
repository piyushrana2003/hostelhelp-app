import { createSeedData } from '../data/seedData';
import { HostelHelpState } from '../types/venture';

const STORAGE_KEY = 'hostelhelp_venture_ops_v1';

export function loadVentureState(): HostelHelpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      saveVentureState(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<HostelHelpState>;
    const seed = createSeedData();
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : seed.orders,
      students: Array.isArray(parsed.students) ? parsed.students : seed.students,
      vendors: Array.isArray(parsed.vendors) ? parsed.vendors : seed.vendors,
      roadmap: Array.isArray(parsed.roadmap) && parsed.roadmap.length === 4 ? parsed.roadmap : seed.roadmap,
      financialConfig: parsed.financialConfig
        ? { ...seed.financialConfig, ...parsed.financialConfig }
        : seed.financialConfig,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : seed.expenses,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return createSeedData();
  }
}

export function saveVentureState(state: HostelHelpState): void {
  try {
    const payload: HostelHelpState = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function formatINR(amount: number, includeDecimals = false): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(abs);
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function exportStateAsJSON(state: HostelHelpState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hostelhelp-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: unknown): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersAsCSV(state: HostelHelpState): void {
  const sections: string[] = [];

  sections.push('=== HOSTELHELP SERVICE ORDERS ===');
  sections.push(
    [
      'Order ID',
      'Date',
      'Student Name',
      'Hostel/PG',
      'Phone',
      'Category',
      'Assigned Vendor',
      'Order Amount (INR)',
      'Platform Fee (INR)',
      'Variable Cost (INR)',
      'Contribution Margin (INR)',
      'Payment Status',
      'Order Status',
      'Repeat Customer',
      'Rating',
      'Notes',
    ].join(',')
  );

  for (const o of state.orders) {
    sections.push(
      [
        o.id,
        o.orderDate,
        o.studentName,
        o.hostelName,
        o.phone,
        o.category,
        o.vendorName,
        o.orderAmount,
        o.platformFee,
        o.variableCost,
        o.platformFee - o.variableCost,
        o.paymentStatus,
        o.orderStatus,
        o.isRepeatCustomer ? 'Yes' : 'No',
        o.rating ?? '',
        o.notes ?? '',
      ]
        .map(escapeCSV)
        .join(',')
    );
  }

  sections.push('');
  sections.push('=== STUDENT CRM & PILOT LEADS ===');
  sections.push(
    [
      'Student ID',
      'Date',
      'Student Name',
      'Course/Year',
      'Hostel/PG Location',
      'Phone',
      'Channel',
      'Interview Completed',
      'Pilot Status',
      'Pass Interest (299/mo)',
      'Feedback Notes',
    ].join(',')
  );

  for (const s of state.students) {
    sections.push(
      [
        s.id,
        s.createdAt,
        s.studentName,
        s.courseYear,
        s.hostelLocation,
        s.phone,
        s.channel,
        s.interviewCompleted ? 'Yes' : 'No',
        s.pilotStatus,
        s.subscriptionInterest ? 'Yes' : 'No',
        s.feedbackNotes,
      ]
        .map(escapeCSV)
        .join(',')
    );
  }

  sections.push('');
  sections.push('=== VERIFIED LOCAL VENDORS ===');
  sections.push(
    [
      'Vendor ID',
      'Onboarded Date',
      'Vendor Name',
      'Category',
      'Contact',
      'Distance (km)',
      'Base Student Price (INR)',
      'Verification Status',
      'Trial Orders',
      'Avg Rating',
      'Reliability Notes',
    ].join(',')
  );

  for (const v of state.vendors) {
    sections.push(
      [
        v.id,
        v.onboardedAt,
        v.vendorName,
        v.category,
        v.contactNumber,
        v.distanceKm,
        v.baseStudentPrice,
        v.verificationStatus,
        v.trialOrdersCompleted,
        v.averageRating,
        v.reliabilityNotes,
      ]
        .map(escapeCSV)
        .join(',')
    );
  }

  const blob = new Blob([sections.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hostelhelp-operations-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateImportedJSON(rawText: string): HostelHelpState | null {
  try {
    const parsed = JSON.parse(rawText) as Partial<HostelHelpState>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.orders) ||
      !Array.isArray(parsed.students) ||
      !Array.isArray(parsed.vendors)
    ) {
      return null;
    }
    const seed = createSeedData();
    return {
      orders: parsed.orders,
      students: parsed.students,
      vendors: parsed.vendors,
      roadmap: Array.isArray(parsed.roadmap) && parsed.roadmap.length > 0 ? parsed.roadmap : seed.roadmap,
      financialConfig: parsed.financialConfig
        ? { ...seed.financialConfig, ...parsed.financialConfig }
        : seed.financialConfig,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : seed.expenses,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
