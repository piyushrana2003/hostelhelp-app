import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Calculator,
  CalendarCheck2,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  RotateCcw,
  ShoppingBag,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { ConfirmModal } from './components/ConfirmModal';
import { FinancialsTab } from './components/FinancialsTab';
import { OrdersTab } from './components/OrdersTab';
import { OverviewTab } from './components/OverviewTab';
import { RoadmapTab } from './components/RoadmapTab';
import { StudentsTab } from './components/StudentsTab';
import { ToastContainer } from './components/ToastContainer';
import { VendorsTab } from './components/VendorsTab';
import { createSeedData } from './data/seedData';
import {
  ExpenseItem,
  FinancialConfig,
  HostelHelpState,
  OrderStatus,
  PilotStatus,
  ServiceOrder,
  ServiceVendor,
  StudentLead,
  TabId,
  ToastMessage,
  VENTURE_BENCHMARKS,
  VerificationStatus,
} from './types/venture';
import {
  exportOrdersAsCSV,
  exportStateAsJSON,
  loadVentureState,
  saveVentureState,
  validateImportedJSON,
} from './utils/storage';

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Executive Tracker', icon: LayoutDashboard },
  { id: 'orders', label: 'Service Orders', icon: ShoppingBag },
  { id: 'students', label: 'Student CRM', icon: Users },
  { id: 'vendors', label: 'Verified Vendors', icon: Building2 },
  { id: 'roadmap', label: '30-Day Roadmap', icon: CalendarCheck2 },
  { id: 'financials', label: 'Unit Economics', icon: Calculator },
];

export default function App() {
  const [state, setState] = useState<HostelHelpState>(() => loadVentureState());
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Trigger counters to open entry forms directly from Overview Quick Actions
  const [orderFormSignal, setOrderFormSignal] = useState(0);
  const [studentFormSignal, setStudentFormSignal] = useState(0);
  const [vendorFormSignal, setVendorFormSignal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveVentureState(state);
  }, [state]);

  const pushToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleQuickAction = (action: 'new-order' | 'new-student' | 'new-vendor') => {
    if (action === 'new-order') {
      setActiveTab('orders');
      setOrderFormSignal((c) => c + 1);
    } else if (action === 'new-student') {
      setActiveTab('students');
      setStudentFormSignal((c) => c + 1);
    } else {
      setActiveTab('vendors');
      setVendorFormSignal((c) => c + 1);
    }
  };

  // Orders handlers
  const handleSaveOrder = (order: ServiceOrder, isNew: boolean) => {
    setState((prev) => ({
      ...prev,
      orders: isNew
        ? [order, ...prev.orders]
        : prev.orders.map((o) => (o.id === order.id ? order : o)),
    }));
    pushToast(
      'success',
      isNew ? `Order ${order.id} logged` : `Order ${order.id} updated`,
      `${order.studentName} · ${order.category} (${order.vendorName})`
    );
  };

  const handleUpdateOrderStatus = (id: string, orderStatus: OrderStatus) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, orderStatus } : o)),
    }));
    pushToast('info', `Order ${id} set to ${orderStatus}`);
  };

  const handleTogglePaymentStatus = (id: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              paymentStatus: o.paymentStatus === 'Paid via UPI' ? 'Pending' : 'Paid via UPI',
            }
          : o
      ),
    }));
    pushToast('success', `Updated UPI payment status for ${id}`);
  };

  const handleDeleteOrder = (id: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== id),
    }));
    pushToast('info', `Deleted order ${id}`);
  };

  // Student CRM handlers
  const handleSaveStudent = (student: StudentLead, isNew: boolean) => {
    setState((prev) => ({
      ...prev,
      students: isNew
        ? [student, ...prev.students]
        : prev.students.map((s) => (s.id === student.id ? student : s)),
    }));
    pushToast(
      'success',
      isNew ? `Added ${student.studentName} to Student CRM` : `Updated ${student.studentName}`,
      `${student.courseYear} · ${student.hostelLocation}`
    );
  };

  const handleToggleInterview = (id: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === id ? { ...s, interviewCompleted: !s.interviewCompleted } : s
      ),
    }));
    pushToast('info', 'Updated interview completion status');
  };

  const handleUpdatePilotStatus = (id: string, pilotStatus: PilotStatus) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, pilotStatus } : s)),
    }));
    pushToast('info', `Student pilot status updated to ${pilotStatus}`);
  };

  const handleDeleteStudent = (id: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
    pushToast('info', 'Removed student record');
  };

  // Vendor handlers
  const handleSaveVendor = (vendor: ServiceVendor, isNew: boolean) => {
    setState((prev) => ({
      ...prev,
      vendors: isNew
        ? [vendor, ...prev.vendors]
        : prev.vendors.map((v) => (v.id === vendor.id ? vendor : v)),
    }));
    pushToast(
      'success',
      isNew ? `Onboarded ${vendor.vendorName}` : `Updated ${vendor.vendorName}`,
      `${vendor.category} · ${vendor.distanceKm.toFixed(1)} km from DGU`
    );
  };

  const handleUpdateVendorStatus = (id: string, verificationStatus: VerificationStatus) => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) => (v.id === id ? { ...v, verificationStatus } : v)),
    }));
    pushToast('info', `Vendor status updated to ${verificationStatus}`);
  };

  const handleIncrementTrialOrders = (id: string) => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) =>
        v.id === id ? { ...v, trialOrdersCompleted: v.trialOrdersCompleted + 1 } : v
      ),
    }));
    pushToast('success', 'Logged +1 trial order for vendor');
  };

  const handleDeleteVendor = (id: string) => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== id),
    }));
    pushToast('info', 'Removed vendor from directory');
  };

  // Roadmap handlers
  const handleToggleDeliverable = (weekNumber: 1 | 2 | 3 | 4, deliverableId: string) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((w) =>
        w.weekNumber === weekNumber
          ? {
              ...w,
              deliverables: w.deliverables.map((d) =>
                d.id === deliverableId ? { ...d, completed: !d.completed } : d
              ),
            }
          : w
      ),
    }));
  };

  const handleAddDeliverable = (weekNumber: 1 | 2 | 3 | 4, label: string) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((w) =>
        w.weekNumber === weekNumber
          ? {
              ...w,
              deliverables: [
                ...w.deliverables,
                { id: `W${weekNumber}-${Date.now()}`, label, completed: false },
              ],
            }
          : w
      ),
    }));
    pushToast('success', `Added deliverable to Week ${weekNumber}`);
  };

  const handleDeleteDeliverable = (weekNumber: 1 | 2 | 3 | 4, deliverableId: string) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((w) =>
        w.weekNumber === weekNumber
          ? {
              ...w,
              deliverables: w.deliverables.filter((d) => d.id !== deliverableId),
            }
          : w
      ),
    }));
  };

  const handleUpdateWeekActuals = (
    weekNumber: 1 | 2 | 3 | 4,
    actualMetricValue: number,
    learningAnswer: string
  ) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((w) =>
        w.weekNumber === weekNumber
          ? { ...w, actualMetricValue, learningAnswer }
          : w
      ),
    }));
    pushToast('success', `Saved Week ${weekNumber} KPI & learning log`);
  };

  // Financial simulator handlers
  const handleUpdateFinancialConfig = (next: FinancialConfig) => {
    setState((prev) => ({ ...prev, financialConfig: next }));
  };

  const handleResetFinancialConfig = () => {
    setState((prev) => ({
      ...prev,
      financialConfig: {
        sellingPricePerOrder: VENTURE_BENCHMARKS.defaultFee,
        subscriptionPassPrice: VENTURE_BENCHMARKS.defaultSubscriptionPass,
        activeSubscribers: 4,
        variableCostPerOrder: VENTURE_BENCHMARKS.defaultVariableCost,
        monthlyFixedCost: VENTURE_BENCHMARKS.defaultFixedCost,
        marketingSpend: VENTURE_BENCHMARKS.defaultMarketingBudget,
      },
    }));
    pushToast('info', 'Reset unit economics to baseline assumptions (₹50 / ₹15 / ₹15,000)');
  };

  const handleAddExpense = (expense: ExpenseItem) => {
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
    pushToast('success', `Logged expense: ${expense.title}`);
  };

  const handleDeleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
    pushToast('info', 'Removed expense entry');
  };

  // Backup Export / Import handlers
  const handleExportJSON = () => {
    exportStateAsJSON(state);
    pushToast('success', 'JSON backup downloaded', 'All HostelHelp operational records exported.');
  };

  const handleExportCSV = () => {
    exportOrdersAsCSV(state);
    pushToast('success', 'CSV report downloaded', 'Orders, Student CRM, and Vendors exported.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const imported = validateImportedJSON(text);
      if (!imported) {
        pushToast(
          'error',
          'Invalid JSON backup file',
          'Ensure the file was exported from HostelHelp Operations.'
        );
        return;
      }
      setState(imported);
      pushToast(
        'success',
        'Backup restored successfully',
        `Loaded ${imported.orders.length} orders, ${imported.students.length} students, ${imported.vendors.length} vendors.`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetSeedData = () => {
    const fresh = createSeedData();
    setState(fresh);
    setResetConfirmOpen(false);
    pushToast('info', 'Restored sample venture dataset', 'Pre-loaded DGU Campus sample records.');
  };

  const tabCounts: Partial<Record<TabId, number>> = {
    orders: state.orders.length,
    students: state.students.length,
    vendors: state.vendors.length,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 shrink-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Block */}
          <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold tracking-tight text-white">HostelHelp</span>
              <p className="text-xs text-slate-400 mt-0.5">DGU Campus · Dehradun</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Modules */}
          <nav aria-label="Workspace modules" className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const count = tabCounts[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof count === 'number' && (
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isActive ? 'text-indigo-100' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Venture Baseline & Data Reset */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-200">Venture Economics Baseline</p>
            <p className="font-mono tabular-nums">
              Fee ₹{state.financialConfig.sellingPricePerOrder} · Var ₹
              {state.financialConfig.variableCostPerOrder} · Pass ₹
              {state.financialConfig.subscriptionPassPrice}
            </p>
            <p className="font-mono tabular-nums">
              Fixed ₹{state.financialConfig.monthlyFixedCost.toLocaleString('en-IN')}/mo
            </p>
          </div>

          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Sample Data
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                HostelHelp — Venture Operations & Target Tracker (DGU Campus)
              </h1>
            </div>

            {/* Data Backup Controls */}
            <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
                aria-label="Import JSON backup"
              />
            </div>
          </div>
        </header>

        {/* Active Module Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-[1360px] mx-auto">
            {activeTab === 'overview' && (
              <OverviewTab
                state={state}
                onNavigate={setActiveTab}
                onQuickAction={handleQuickAction}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab
                orders={state.orders}
                vendors={state.vendors}
                openFormTrigger={orderFormSignal}
                onSaveOrder={handleSaveOrder}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onTogglePaymentStatus={handleTogglePaymentStatus}
                onDeleteOrder={handleDeleteOrder}
              />
            )}

            {activeTab === 'students' && (
              <StudentsTab
                students={state.students}
                openFormTrigger={studentFormSignal}
                onSaveStudent={handleSaveStudent}
                onToggleInterview={handleToggleInterview}
                onUpdatePilotStatus={handleUpdatePilotStatus}
                onDeleteStudent={handleDeleteStudent}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorsTab
                vendors={state.vendors}
                openFormTrigger={vendorFormSignal}
                onSaveVendor={handleSaveVendor}
                onUpdateVendorStatus={handleUpdateVendorStatus}
                onIncrementTrialOrders={handleIncrementTrialOrders}
                onDeleteVendor={handleDeleteVendor}
              />
            )}

            {activeTab === 'roadmap' && (
              <RoadmapTab
                roadmap={state.roadmap}
                orders={state.orders}
                students={state.students}
                onToggleDeliverable={handleToggleDeliverable}
                onAddDeliverable={handleAddDeliverable}
                onDeleteDeliverable={handleDeleteDeliverable}
                onUpdateWeekActuals={handleUpdateWeekActuals}
              />
            )}

            {activeTab === 'financials' && (
              <FinancialsTab
                config={state.financialConfig}
                expenses={state.expenses}
                orders={state.orders}
                onUpdateConfig={handleUpdateFinancialConfig}
                onResetConfig={handleResetFinancialConfig}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}
          </div>
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <ConfirmModal
        open={resetConfirmOpen}
        title="Reset to Sample Venture Data?"
        description="This replaces your current localStorage entries with the default DGU Campus sample dataset. Export JSON first if you want to keep a backup."
        confirmLabel="Reset Sample Data"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={handleResetSeedData}
      />
    </div>
  );
}
