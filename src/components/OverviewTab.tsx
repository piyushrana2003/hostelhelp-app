import {
  ArrowRight,
  Building2,
  Plus,
  ShoppingBag,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import {
  HostelHelpState,
  SERVICE_CATEGORIES,
  TabId,
  VENTURE_BENCHMARKS,
} from '../types/venture';
import { formatINR } from '../utils/storage';

interface OverviewTabProps {
  state: HostelHelpState;
  onNavigate: (tab: TabId) => void;
  onQuickAction: (action: 'new-order' | 'new-student' | 'new-vendor') => void;
}

export function OverviewTab({ state, onNavigate, onQuickAction }: OverviewTabProps) {
  const { orders, students, vendors, financialConfig } = state;

  // Student & Funnel Metrics
  const activeOrSignedStudents = students.filter(
    (s) => s.pilotStatus === 'Active Pilot' || s.pilotStatus === 'Signed Up'
  ).length;
  const completedInterviews = students.filter((s) => s.interviewCompleted).length;
  const passInterestedCount = students.filter((s) => s.subscriptionInterest).length;

  // Orders & Satisfaction Metrics
  const nonCancelledOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
  const completedOrders = orders.filter((o) => o.orderStatus === 'Completed');
  const paidOrders = nonCancelledOrders.filter((o) => o.paymentStatus === 'Paid via UPI');

  const repeatOrdersCount = nonCancelledOrders.filter((o) => o.isRepeatCustomer).length;
  const repeatRatePct =
    nonCancelledOrders.length > 0
      ? Math.round((repeatOrdersCount / nonCancelledOrders.length) * 100)
      : 0;

  const ratedOrders = orders.filter((o) => typeof o.rating === 'number' && o.rating > 0);
  const avgRating =
    ratedOrders.length > 0
      ? ratedOrders.reduce((acc, o) => acc + (o.rating || 0), 0) / ratedOrders.length
      : 0;
  const satisfactionPct = ratedOrders.length > 0 ? Math.round((avgRating / 5) * 100) : 0;

  // Revenue & P&L Metrics
  const feeRevenue = paidOrders.reduce((sum, o) => sum + o.platformFee, 0);
  const subscriptionRevenue =
    financialConfig.activeSubscribers * financialConfig.subscriptionPassPrice;
  const totalRevenue = feeRevenue + subscriptionRevenue;
  const totalVariableCost = paidOrders.reduce((sum, o) => sum + o.variableCost, 0);
  const contributionProfit = totalRevenue - totalVariableCost;
  const netProfitLoss = contributionProfit - financialConfig.monthlyFixedCost;

  // Break-even dynamic calculation
  const unitMargin = Math.max(
    1,
    financialConfig.sellingPricePerOrder - financialConfig.variableCostPerOrder
  );
  const breakEvenOrders = Math.ceil(financialConfig.monthlyFixedCost / unitMargin);

  // Vendor Metrics
  const verifiedVendors = vendors.filter((v) => v.verificationStatus === 'Verified').length;
  const totalTrialOrders = vendors.reduce((sum, v) => sum + v.trialOrdersCompleted, 0);

  // Unique paying students from orders
  const uniquePayingStudents = new Set(
    paidOrders.map((o) => `${o.studentName.trim().toLowerCase()}-${o.phone.trim()}`)
  ).size;

  // Milestones
  const milestones = [
    {
      label: 'Conservative Target',
      target: VENTURE_BENCHMARKS.conservativeTarget,
      current: completedOrders.length,
      unit: 'orders / cust',
      note: 'Early beachhead validation',
    },
    {
      label: 'Base Target',
      target: VENTURE_BENCHMARKS.baseTarget,
      current: completedOrders.length,
      unit: 'orders / cust',
      note: 'Monthly sustainable traction',
    },
    {
      label: 'Ambitious Target',
      target: VENTURE_BENCHMARKS.ambitiousTarget,
      current: completedOrders.length,
      unit: 'orders / cust',
      note: 'Full DGU + 10km Dehradun expansion',
    },
  ];

  // Category Breakdown
  const categoryStats = SERVICE_CATEGORIES.map((category) => {
    const catOrders = nonCancelledOrders.filter((o) => o.category === category);
    const catFee = catOrders.reduce((sum, o) => sum + o.platformFee, 0);
    const catGmv = catOrders.reduce((sum, o) => sum + o.orderAmount, 0);
    const catVendors = vendors.filter((v) => v.category === category).length;
    return {
      category,
      count: catOrders.length,
      fee: catFee,
      gmv: catGmv,
      vendors: catVendors,
    };
  });

  const maxCategoryCount = Math.max(1, ...categoryStats.map((c) => c.count));

  return (
    <div className="space-y-6">
      {/* Top Hero Strip & Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-indigo-600">
            Executive Target Tracker · {VENTURE_BENCHMARKS.campusScope}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Venture Pulse & 30-Day MVP Scorecard
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Beachhead: {VENTURE_BENCHMARKS.beachheadSegment}. Connecting students with verified local
            vendors at ₹{financialConfig.sellingPricePerOrder}/order (₹
            {financialConfig.subscriptionPassPrice}/mo pass) against ₹
            {financialConfig.monthlyFixedCost.toLocaleString('en-IN')} monthly fixed overhead.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onQuickAction('new-order')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Log New Order
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('new-student')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            Add Student Lead
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('new-vendor')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            Onboard Vendor
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Active Student Sign-ups */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Active Student Sign-ups</span>
              <span className="text-xs font-mono text-indigo-600 font-medium">
                MVP {uniquePayingStudents}/{VENTURE_BENCHMARKS.mvpPayingStudentsTarget}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {activeOrSignedStudents}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                / {VENTURE_BENCHMARKS.somTargetStudents} SOM Target
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (activeOrSignedStudents / VENTURE_BENCHMARKS.somTargetStudents) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600 flex items-center justify-between">
              <span>Interviews: {completedInterviews}/{VENTURE_BENCHMARKS.interviewTarget}</span>
              <span className="font-mono tabular-nums">Pass Int: {passInterestedCount}</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Completed Service Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Completed Service Orders</span>
              <span className="text-xs font-mono text-slate-600 font-medium">
                {nonCancelledOrders.length} active/total
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {completedOrders.length}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                / {VENTURE_BENCHMARKS.baseTarget} Base · {breakEvenOrders} BEP
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (completedOrders.length / breakEvenOrders) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600 flex items-center justify-between">
              <span>Break-even Progress</span>
              <span className="font-mono tabular-nums">
                {Math.round((completedOrders.length / breakEvenOrders) * 100)}%
              </span>
            </p>
          </div>
        </div>

        {/* KPI 3: Total Revenue & Net P/L */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Revenue & Monthly Net P/L</span>
              <span
                className={`text-xs font-medium ${
                  netProfitLoss >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {netProfitLoss >= 0 ? 'Profitable' : 'Pre-Break-even'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {formatINR(totalRevenue)}
              </span>
              <span className="text-xs text-slate-500">collected</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Net P/L vs {formatINR(financialConfig.monthlyFixedCost)} Fixed</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  netProfitLoss >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatINR(netProfitLoss)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Fees: {formatINR(feeRevenue)}</span>
              <span className="font-mono tabular-nums">Pass: {formatINR(subscriptionRevenue)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Repeat Customer Rate & Avg Rating */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Repeat Rate & Satisfaction</span>
              <span
                className={`text-xs font-medium ${
                  satisfactionPct >= VENTURE_BENCHMARKS.satisfactionTargetPct
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {satisfactionPct >= VENTURE_BENCHMARKS.satisfactionTargetPct
                  ? 'Above 80% Goal'
                  : 'Below 80% Goal'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {repeatRatePct}%
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Target {VENTURE_BENCHMARKS.repeatRateTargetPct}%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Avg Order Rating</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0 (${satisfactionPct}%)` : 'No ratings yet'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Verified Vendors: {verifiedVendors}/10</span>
              <span className="font-mono tabular-nums">Trials: {totalTrialOrders}/30+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Scenario Milestones & Market Funnel (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Scenario Customer & Order Milestones
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live completed orders & active customers against monthly venture scenarios
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('financials')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap shrink-0"
              >
                Open Simulator <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-5">
              {milestones.map((m) => {
                const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div key={m.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-slate-900">{m.label}</span>
                        <span className="text-xs text-slate-500 ml-2">· {m.note}</span>
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                        {m.current} / {m.target} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, m.current > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Funnel Summary Strip */}
          <div className="pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500">TAM (Dehradun Area)</p>
              <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {VENTURE_BENCHMARKS.tamStudents.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500">Hostel & PG students</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">SAM (DGU 5–10 km)</p>
              <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {VENTURE_BENCHMARKS.samStudents.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500">Target campus radius</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">SOM (10% of SAM)</p>
              <p className="text-lg font-bold font-mono tabular-nums text-indigo-600 mt-0.5">
                {activeOrSignedStudents} / {VENTURE_BENCHMARKS.somTargetStudents}
              </p>
              <p className="text-xs text-slate-500">Current capture</p>
            </div>
          </div>
        </div>

        {/* Right: Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Service Category Traction
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order volume, platform fees & onboarded vendors per category
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap shrink-0"
              >
                All Orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-slate-900 truncate">{cat.category}</span>
                      <span className="text-xs text-slate-500 shrink-0">
                        · {cat.vendors} {cat.vendors === 1 ? 'vendor' : 'vendors'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums shrink-0">
                      <span className="text-slate-600">{cat.count} orders</span>
                      <span className="font-semibold text-slate-900">{formatINR(cat.fee)} fee</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all duration-300"
                      style={{
                        width: `${cat.count > 0 ? Math.max(8, (cat.count / maxCategoryCount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              Total GMV Handled:{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {formatINR(nonCancelledOrders.reduce((s, o) => s + o.orderAmount, 0))}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Margin/Order:{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {formatINR(unitMargin)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Vendor & 30-Day Pilot Readiness Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Supply & Launch Execution Readiness
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live snapshot across Vendor Verification, Student Discovery, and 4-Week Pilot Deliverables
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('vendors')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              Manage Vendors →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              30-Day Roadmap →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Verified Local Providers</p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
              {verifiedVendors}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {VENTURE_BENCHMARKS.verifiedVendorsMin}–{VENTURE_BENCHMARKS.verifiedVendorsMax} target
              </span>
            </p>
            <p className="text-xs text-slate-600">
              {totalTrialOrders} trial orders completed (target: 30+)
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Pilot Funnel (Week 1–2)</p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
              {completedInterviews}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {VENTURE_BENCHMARKS.interviewTarget} interviews
              </span>
            </p>
            <p className="text-xs text-slate-600">
              {activeOrSignedStudents} / {VENTURE_BENCHMARKS.pilotSignupTarget} pilot sign-ups locked
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">4-Week Checklist Progress</p>
            {(() => {
              const allTasks = state.roadmap.flatMap((w) => w.deliverables);
              const doneTasks = allTasks.filter((t) => t.completed).length;
              return (
                <>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    {doneTasks}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / {allTasks.length} deliverables
                    </span>
                  </p>
                  <p className="text-xs text-slate-600">
                    {Math.round((doneTasks / Math.max(1, allTasks.length)) * 100)}% of 30-day execution plan
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
