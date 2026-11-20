export type TabId =
  | 'overview'
  | 'orders'
  | 'students'
  | 'vendors'
  | 'roadmap'
  | 'financials';

export type ServiceCategory =
  | 'Laundry'
  | 'Food/Tiffin'
  | 'Room Cleaning'
  | 'Repairs'
  | 'Stationery'
  | 'Groceries';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Laundry',
  'Food/Tiffin',
  'Room Cleaning',
  'Repairs',
  'Stationery',
  'Groceries',
];

export type PaymentStatus = 'Paid via UPI' | 'Pending';
export type OrderStatus = 'Requested' | 'In Progress' | 'Completed' | 'Cancelled';

export type AcquisitionChannel =
  | 'WhatsApp Communities'
  | 'Hostel Notice Board'
  | 'Campus Ambassador'
  | 'Referral';

export const ACQUISITION_CHANNELS: AcquisitionChannel[] = [
  'WhatsApp Communities',
  'Hostel Notice Board',
  'Campus Ambassador',
  'Referral',
];

export type PilotStatus = 'Lead' | 'Signed Up' | 'Active Pilot' | 'Dropped';
export type VerificationStatus = 'Pending Check' | 'Trial Order Phase' | 'Verified';

export interface ServiceOrder {
  id: string;
  orderDate: string; // YYYY-MM-DD
  studentName: string;
  hostelName: string;
  phone: string;
  category: ServiceCategory;
  vendorName: string;
  orderAmount: number;
  platformFee: number;
  variableCost: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  isRepeatCustomer: boolean;
  rating?: number; // 1-5
  notes?: string;
}

export interface StudentLead {
  id: string;
  createdAt: string; // YYYY-MM-DD
  studentName: string;
  courseYear: string;
  hostelLocation: string;
  phone: string;
  channel: AcquisitionChannel;
  interviewCompleted: boolean;
  pilotStatus: PilotStatus;
  subscriptionInterest: boolean; // ₹299/mo pass
  feedbackNotes: string;
}

export interface ServiceVendor {
  id: string;
  onboardedAt: string; // YYYY-MM-DD
  vendorName: string;
  category: ServiceCategory;
  contactNumber: string;
  distanceKm: number;
  baseStudentPrice: number;
  verificationStatus: VerificationStatus;
  trialOrdersCompleted: number;
  averageRating: number; // 1-5
  reliabilityNotes: string;
}

export interface RoadmapDeliverable {
  id: string;
  label: string;
  completed: boolean;
}

export interface WeeklyRoadmap {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  objective: string;
  targetMetricLabel: string;
  targetMetricValue: number;
  actualMetricValue: number;
  coreLearningQuestion: string;
  learningAnswer: string;
  deliverables: RoadmapDeliverable[];
}

export interface ExpenseItem {
  id: string;
  date: string;
  title: string;
  category: 'Fixed Ops' | 'WhatsApp & Marketing' | 'Vendor Support' | 'Campus Outreach';
  amount: number;
  notes?: string;
}

export interface FinancialConfig {
  sellingPricePerOrder: number; // Default ₹50
  subscriptionPassPrice: number; // Default ₹299
  activeSubscribers: number; // Monthly pass users
  variableCostPerOrder: number; // Default ₹15
  monthlyFixedCost: number; // Default ₹15,000
  marketingSpend: number; // Default ₹1,500 WhatsApp budget
}

export interface HostelHelpState {
  orders: ServiceOrder[];
  students: StudentLead[];
  vendors: ServiceVendor[];
  roadmap: WeeklyRoadmap[];
  financialConfig: FinancialConfig;
  expenses: ExpenseItem[];
  lastUpdated: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export const VENTURE_BENCHMARKS = {
  ventureName: 'HostelHelp',
  campusScope: 'DGU Campus & Nearby Hostels/PGs, Dehradun (5–10 km radius)',
  beachheadSegment: '1st-year MBA & UG/PG hostel students (aged 18–25)',
  tamStudents: 5000,
  samStudents: 1200,
  somTargetStudents: 120, // 10% of SAM
  mvpPayingStudentsTarget: 30, // within 30 days
  interviewTarget: 25,
  pilotSignupTarget: 15,
  repeatRateTargetPct: 60,
  satisfactionTargetPct: 80,
  verifiedVendorsMin: 5,
  verifiedVendorsMax: 10,
  trialOrdersVendorTarget: 30,
  conservativeTarget: 100,
  baseTarget: 300,
  ambitiousTarget: 600,
  defaultFee: 50,
  defaultSubscriptionPass: 299,
  defaultVariableCost: 15,
  defaultFixedCost: 15000,
  defaultMarketingBudget: 1500,
  breakEvenOrdersBase: 429, // ceil(15000 / 35)
} as const;
