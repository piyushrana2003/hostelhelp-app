import { useMemo, useState } from 'react';
import { Calculator, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  ExpenseItem,
  FinancialConfig,
  ServiceOrder,
  VENTURE_BENCHMARKS,
} from '../types/venture';
import { formatINR } from '../utils/storage';

interface FinancialsTabProps {
  config: FinancialConfig;
  expenses: ExpenseItem[];
  orders: ServiceOrder[];
  onUpdateConfig: (next: FinancialConfig) => void;
  onResetConfig: () => void;
  onAddExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
}

const EXPENSE_CATEGORIES: ExpenseItem['category'][] = [
  'Fixed Ops',
  'WhatsApp & Marketing',
  'Vendor Support',
  'Campus Outreach',
];

export function FinancialsTab({
  config,
  expenses,
  orders,
  onUpdateConfig,
  onResetConfig,
  onAddExpense,
  onDeleteExpense,
}: FinancialsTabProps) {
  const [expTitle, setExpTitle] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expCategory, setExpCategory] = useState<ExpenseItem['category']>('Fixed Ops');
  const [expAmount, setExpAmount] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expError, setExpError] = useState('');

  const economics = useMemo(() => {
    const contributionMargin = config.sellingPricePerOrder - config.variableCostPerOrder;
    const marginPct =
      config.sellingPricePerOrder > 0
        ? (contributionMargin / config.sellingPricePerOrder) * 100
        : 0;

    const passRevenue = config.activeSubscribers * config.subscriptionPassPrice;
    const totalBurn = config.monthlyFixedCost + config.marketingSpend;
    const netFixedAfterPass = Math.max(0, totalBurn - passRevenue);

    // Base fixed break-even (matching ₹15,000 / ₹35 = 429 orders)
    const breakEvenOrdersFixedOnly =
      contributionMargin > 0 ? Math.ceil(config.monthlyFixedCost / contributionMargin) : Infinity;

    // Total burn break-even (Fixed + Marketing - Active Pass Revenue)
    const breakEvenOrdersTotal =
      contributionMargin > 0 ? Math.ceil(netFixedAfterPass / contributionMargin) : Infinity;

    const scenarios = [
      {
        name: 'Conservative',
        orders: VENTURE_BENCHMARKS.conservativeTarget,
        description: '100 orders/customers · Early campus validation',
      },
      {
        name: 'Base',
        orders: VENTURE_BENCHMARKS.baseTarget,
        description: '300 orders/customers · Core DGU hostel traction',
      },
      {
        name: 'Ambitious',
        orders: VENTURE_BENCHMARKS.ambitiousTarget,
        description: '600 orders/customers · Full 5–10 km Dehradun scale',
      },
    ].map((sc) => {
      const feeRevenue = sc.orders * config.sellingPricePerOrder;
      const totalRevenue = feeRevenue + passRevenue;
      const variableCosts = sc.orders * config.variableCostPerOrder;
      const netProfit = totalRevenue - variableCosts - totalBurn;
      const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      return {
        ...sc,
        feeRevenue,
        passRevenue,
        totalRevenue,
        variableCosts,
        totalBurn,
        netProfit,
        netMarginPct,
      };
    });

    // Actual logged performance
    const paidOrders = orders.filter(
      (o) => o.orderStatus !== 'Cancelled' && o.paymentStatus === 'Paid via UPI'
    );
    const actualFeeRev = paidOrders.reduce((s, o) => s + o.platformFee, 0);
    const actualVarCost = paidOrders.reduce((s, o) => s + o.variableCost, 0);
    const actualTotalRev = actualFeeRev + passRevenue;
    const actualNet = actualTotalRev - actualVarCost - totalBurn;

    return {
      contributionMargin,
      marginPct,
      passRevenue,
      totalBurn,
      breakEvenOrdersFixedOnly,
      breakEvenOrdersTotal,
      scenarios,
      actualOrdersCount: paidOrders.length,
      actualTotalRev,
      actualVarCost,
      actualNet,
    };
  }, [config, orders]);

  const loggedExpenseTotals = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const marketing = expenses
      .filter((e) => e.category === 'WhatsApp & Marketing')
      .reduce((s, e) => s + e.amount, 0);
    const fixed = total - marketing;
    return { total, marketing, fixed };
  }, [expenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount);
    if (!expTitle.trim()) {
      setExpError('Expense title is required');
      return;
    }
    if (!expAmount || Number.isNaN(amt) || amt <= 0) {
      setExpError('Enter a valid amount > ₹0');
      return;
    }
    setExpError('');
    const nextId = `EXP-${Math.max(400, ...expenses.map((x) => Number(x.id.replace(/\D/g, '')) || 400)) + 1}`;
    onAddExpense({
      id: nextId,
      date: expDate || new Date().toISOString().slice(0, 10),
      title: expTitle.trim(),
      category: expCategory,
      amount: amt,
      notes: expNotes.trim() || undefined,
    });
    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
  };

  const syncExpensesToModel = () => {
    onUpdateConfig({
      ...config,
      monthlyFixedCost: loggedExpenseTotals.fixed,
      marketingSpend: loggedExpenseTotals.marketing,
    });
  };

  const maxScenarioRev = Math.max(
    1,
    ...economics.scenarios.map((s) => Math.max(s.totalRevenue, s.totalBurn + s.variableCosts))
  );

  return (
    <div className="space-y-6">
      {/* Top Unit Economics Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Financials & Unit Economics Simulator
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Model contribution margin, break-even orders, ₹299/month subscription pass impact, and
              Conservative / Base / Ambitious scenarios.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetConfig}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline Assumptions
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Contribution Margin / Order</p>
            <p
              className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${
                economics.contributionMargin > 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatINR(economics.contributionMargin)}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {economics.marginPct.toFixed(1)}% of ₹{config.sellingPricePerOrder} fee
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Break-Even (Fixed Cost Only)</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {Number.isFinite(economics.breakEvenOrdersFixedOnly)
                ? `${economics.breakEvenOrdersFixedOnly} orders`
                : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              Covers {formatINR(config.monthlyFixedCost)} fixed/mo
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Break-Even (Incl. Marketing & Pass)</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 mt-0.5">
              {Number.isFinite(economics.breakEvenOrdersTotal)
                ? `${economics.breakEvenOrdersTotal} orders`
                : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              Pass rev: {formatINR(economics.passRevenue)}/mo
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Current Actual Logged P&L</p>
            <p
              className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${
                economics.actualNet >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatINR(economics.actualNet)}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              From {economics.actualOrdersCount} paid orders + {config.activeSubscribers} passes
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Controls + Scenario Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Levers (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">Unit Economics Levers</h3>
          </div>

          <div className="space-y-4">
            {/* Selling Price / Order */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700">
                  Selling Price / Platform Fee (₹)
                </label>
                <span className="font-mono font-semibold text-slate-900">
                  {formatINR(config.sellingPricePerOrder)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={config.sellingPricePerOrder}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, sellingPricePerOrder: Number(e.target.value) })
                  }
                  className="flex-1 accent-indigo-600"
                />
                <input
                  type="number"
                  min="0"
                  value={config.sellingPricePerOrder}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      sellingPricePerOrder: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-20 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md"
                />
              </div>
            </div>

            {/* Variable Cost / Order */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700">Variable Cost per Order (₹)</label>
                <span className="font-mono font-semibold text-slate-900">
                  {formatINR(config.variableCostPerOrder)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={config.variableCostPerOrder}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, variableCostPerOrder: Number(e.target.value) })
                  }
                  className="flex-1 accent-indigo-600"
                />
                <input
                  type="number"
                  min="0"
                  value={config.variableCostPerOrder}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      variableCostPerOrder: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-20 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md"
                />
              </div>
            </div>

            {/* Monthly Fixed Cost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700">Monthly Fixed Cost (₹)</label>
                <span className="font-mono font-semibold text-slate-900">
                  {formatINR(config.monthlyFixedCost)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="500"
                  value={config.monthlyFixedCost}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, monthlyFixedCost: Number(e.target.value) })
                  }
                  className="flex-1 accent-indigo-600"
                />
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={config.monthlyFixedCost}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      monthlyFixedCost: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-20 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md"
                />
              </div>
            </div>

            {/* Marketing Spend */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700">
                  Marketing Spend — WhatsApp Budget (₹)
                </label>
                <span className="font-mono font-semibold text-slate-900">
                  {formatINR(config.marketingSpend)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="250"
                  value={config.marketingSpend}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, marketingSpend: Number(e.target.value) })
                  }
                  className="flex-1 accent-indigo-600"
                />
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={config.marketingSpend}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      marketingSpend: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-20 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md"
                />
              </div>
            </div>

            {/* Subscription Pass Simulator */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pass Price (₹/mo)
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.subscriptionPassPrice}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      subscriptionPassPrice: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Active Pass Users
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.activeSubscribers}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      activeSubscribers: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Scenario Projections (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Monthly Scenario Projections (Conservative · Base · Ambitious)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Projected P&L across 100, 300, and 600 monthly orders including{' '}
              {formatINR(config.monthlyFixedCost + config.marketingSpend)} total overhead
            </p>
          </div>

          {/* Visual Bar Comparison */}
          <div className="space-y-4">
            {economics.scenarios.map((sc) => {
              const revWidth = Math.min(100, (sc.totalRevenue / maxScenarioRev) * 100);
              const costWidth = Math.min(
                100,
                ((sc.totalBurn + sc.variableCosts) / maxScenarioRev) * 100
              );
              return (
                <div key={sc.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{sc.name}</span>
                      <span className="text-slate-500 ml-2">({sc.orders} orders/mo)</span>
                    </div>
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        sc.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      Net: {formatINR(sc.netProfit)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="w-16 shrink-0">Revenue</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${revWidth}%` }}
                        />
                      </div>
                      <span className="w-20 text-right font-mono tabular-nums text-slate-800">
                        {formatINR(sc.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="w-16 shrink-0">Total Cost</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 rounded-full transition-all duration-300"
                          style={{ width: `${costWidth}%` }}
                        />
                      </div>
                      <span className="w-20 text-right font-mono tabular-nums text-slate-700">
                        {formatINR(sc.totalBurn + sc.variableCosts)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scenario Breakdown Table */}
          <div className="overflow-x-auto pt-2 border-t border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 pr-3">Scenario</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Total Rev</th>
                  <th className="py-2.5 px-3 text-right">Var. Cost</th>
                  <th className="py-2.5 px-3 text-right">Fixed+Mktg</th>
                  <th className="py-2.5 pl-3 text-right">Net Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {economics.scenarios.map((sc) => (
                  <tr key={sc.name}>
                    <td className="py-2.5 pr-3 font-sans font-semibold text-slate-900">
                      {sc.name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{sc.orders}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900">
                      {formatINR(sc.totalRevenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatINR(sc.variableCosts)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatINR(sc.totalBurn)}
                    </td>
                    <td
                      className={`py-2.5 pl-3 text-right font-semibold ${
                        sc.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {formatINR(sc.netProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Expense Logger */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Monthly Operating & Marketing Expense Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged Total:{' '}
              <strong className="font-mono text-slate-900">
                {formatINR(loggedExpenseTotals.total)}
              </strong>{' '}
              (Fixed Ops: {formatINR(loggedExpenseTotals.fixed)} · Marketing:{' '}
              {formatINR(loggedExpenseTotals.marketing)})
            </p>
          </div>
          <button
            type="button"
            onClick={syncExpensesToModel}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Sync Ledger Totals to Simulator
          </button>
        </div>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">Expense Item *</label>
            <input
              type="text"
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="e.g. Campus QR Standees"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value as ExpenseItem['category'])}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="1"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </form>
        {expError && <p className="text-xs text-red-600">{expError}</p>}

        {expenses.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No monthly expenses logged yet. Add fixed or WhatsApp marketing costs above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                  <th className="py-2.5 px-3">Expense Item</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Amount</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{exp.title}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                      {exp.category}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">{exp.notes || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        aria-label={`Delete expense ${exp.title}`}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
