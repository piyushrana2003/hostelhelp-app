import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  OrderStatus,
  PaymentStatus,
  SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceOrder,
  ServiceVendor,
  VENTURE_BENCHMARKS,
} from '../types/venture';
import { formatINR } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

interface OrdersTabProps {
  orders: ServiceOrder[];
  vendors: ServiceVendor[];
  openFormTrigger: number;
  onSaveOrder: (order: ServiceOrder, isNew: boolean) => void;
  onUpdateOrderStatus: (id: string, orderStatus: OrderStatus) => void;
  onTogglePaymentStatus: (id: string) => void;
  onDeleteOrder: (id: string) => void;
}

const ORDER_STATUSES: OrderStatus[] = ['Requested', 'In Progress', 'Completed', 'Cancelled'];

interface OrderFormState {
  id: string;
  orderDate: string;
  studentName: string;
  hostelName: string;
  phone: string;
  category: ServiceCategory;
  vendorName: string;
  orderAmount: string;
  platformFee: string;
  variableCost: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  isRepeatCustomer: boolean;
  rating: string;
  notes: string;
}

function getDefaultForm(vendors: ServiceVendor[]): OrderFormState {
  const defaultVendor = vendors.find((v) => v.category === 'Laundry')?.vendorName || vendors[0]?.vendorName || '';
  return {
    id: '',
    orderDate: new Date().toISOString().slice(0, 10),
    studentName: '',
    hostelName: '',
    phone: '',
    category: 'Laundry',
    vendorName: defaultVendor,
    orderAmount: '',
    platformFee: String(VENTURE_BENCHMARKS.defaultFee),
    variableCost: String(VENTURE_BENCHMARKS.defaultVariableCost),
    paymentStatus: 'Paid via UPI',
    orderStatus: 'Requested',
    isRepeatCustomer: false,
    rating: '',
    notes: '',
  };
}

export function OrdersTab({
  orders,
  vendors,
  openFormTrigger,
  onSaveOrder,
  onUpdateOrderStatus,
  onTogglePaymentStatus,
  onDeleteOrder,
}: OrdersTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrderFormState>(() => getDefaultForm(vendors));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ServiceCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    if (openFormTrigger > 0) {
      setEditingId(null);
      setForm(getDefaultForm(vendors));
      setErrors({});
      setShowForm(true);
    }
  }, [openFormTrigger, vendors]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (categoryFilter !== 'All' && order.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && order.orderStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.studentName.toLowerCase().includes(q) ||
        order.hostelName.toLowerCase().includes(q) ||
        order.vendorName.toLowerCase().includes(q) ||
        order.phone.includes(q)
      );
    });
  }, [orders, categoryFilter, statusFilter, searchQuery]);

  const summary = useMemo(() => {
    const active = orders.filter((o) => o.orderStatus !== 'Cancelled');
    const completed = active.filter((o) => o.orderStatus === 'Completed');
    const paid = active.filter((o) => o.paymentStatus === 'Paid via UPI');
    const totalFees = paid.reduce((sum, o) => sum + o.platformFee, 0);
    const totalMargin = paid.reduce((sum, o) => sum + (o.platformFee - o.variableCost), 0);
    return {
      total: orders.length,
      completed: completed.length,
      paidCount: paid.length,
      totalFees,
      totalMargin,
    };
  }, [orders]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(getDefaultForm(vendors));
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (order: ServiceOrder) => {
    setEditingId(order.id);
    setForm({
      id: order.id,
      orderDate: order.orderDate,
      studentName: order.studentName,
      hostelName: order.hostelName,
      phone: order.phone,
      category: order.category,
      vendorName: order.vendorName,
      orderAmount: String(order.orderAmount),
      platformFee: String(order.platformFee),
      variableCost: String(order.variableCost),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      isRepeatCustomer: order.isRepeatCustomer,
      rating: order.rating ? String(order.rating) : '',
      notes: order.notes || '',
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.studentName.trim()) nextErrors.studentName = 'Student name is required';
    if (!form.hostelName.trim()) nextErrors.hostelName = 'Hostel/PG name is required';
    if (!/^\d{10}$/.test(form.phone.replace(/\s+/g, ''))) {
      nextErrors.phone = 'Enter a valid 10-digit WhatsApp/phone number';
    }
    if (!form.vendorName.trim()) nextErrors.vendorName = 'Assigned vendor is required';

    const orderAmt = Number(form.orderAmount);
    if (form.orderAmount === '' || Number.isNaN(orderAmt) || orderAmt <= 0) {
      nextErrors.orderAmount = 'Enter order amount > ₹0';
    }
    const fee = Number(form.platformFee);
    if (form.platformFee === '' || Number.isNaN(fee) || fee < 0) {
      nextErrors.platformFee = 'Enter valid fee ≥ ₹0';
    }
    const varCost = Number(form.variableCost);
    if (form.variableCost === '' || Number.isNaN(varCost) || varCost < 0) {
      nextErrors.variableCost = 'Enter valid cost ≥ ₹0';
    }
    if (form.rating !== '') {
      const r = Number(form.rating);
      if (Number.isNaN(r) || r < 1 || r > 5) {
        nextErrors.rating = 'Rating must be 1–5';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newId =
      editingId ||
      `ORD-${Math.max(100, ...orders.map((o) => Number(o.id.replace(/\D/g, '')) || 100)) + 1}`;

    const record: ServiceOrder = {
      id: newId,
      orderDate: form.orderDate || new Date().toISOString().slice(0, 10),
      studentName: form.studentName.trim(),
      hostelName: form.hostelName.trim(),
      phone: form.phone.replace(/\s+/g, ''),
      category: form.category,
      vendorName: form.vendorName.trim(),
      orderAmount: Number(form.orderAmount),
      platformFee: Number(form.platformFee),
      variableCost: Number(form.variableCost),
      paymentStatus: form.paymentStatus,
      orderStatus: form.orderStatus,
      isRepeatCustomer: form.isRepeatCustomer,
      rating: form.rating !== '' ? Number(form.rating) : undefined,
      notes: form.notes.trim() || undefined,
    };

    onSaveOrder(record, !editingId);
    setShowForm(false);
    setEditingId(null);
  };

  const renderStatusBadge = (status: OrderStatus) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    }
    if (status === 'In Progress') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3" /> In Progress
        </span>
      );
    }
    if (status === 'Cancelled') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
          <XCircle className="w-3 h-3" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3" /> Requested
      </span>
    );
  };

  const categoryVendors = vendors.filter((v) => v.category === form.category);

  return (
    <div className="space-y-6">
      {/* Top Header & Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Service Orders & Transaction Ledger
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Log student requests, track UPI fee collection (₹50 default), and monitor contribution
              margin per order.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Close Entry Form' : 'Log Service Order'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Total Logged Orders</p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {summary.total}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Completed Orders</p>
            <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
              {summary.completed}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Platform Fees Collected</p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {formatINR(summary.totalFees)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Net Contribution Margin</p>
            <p className="text-xl font-bold font-mono tabular-nums text-indigo-600 mt-0.5">
              {formatINR(summary.totalMargin)}
            </p>
          </div>
        </div>
      </div>

      {/* Data Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-indigo-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? `Edit Order ${editingId}` : 'New Service Order Entry'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-computes contribution margin: Platform Fee − Variable Cost
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-indigo-600 tabular-nums">
              Est. Margin: {formatINR((Number(form.platformFee) || 0) - (Number(form.variableCost) || 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                placeholder="e.g. Aarav Rawat"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.studentName && (
                <p className="text-xs text-red-600 mt-1">{errors.studentName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hostel / PG Name *
              </label>
              <input
                type="text"
                value={form.hostelName}
                onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
                placeholder="e.g. DGU Boys Hostel Block A"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.hostelName && (
                <p className="text-xs text-red-600 mt-1">{errors.hostelName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone / WhatsApp *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Order Date</label>
              <input
                type="date"
                value={form.orderDate}
                onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Service Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => {
                  const cat = e.target.value as ServiceCategory;
                  const matchingVendor = vendors.find((v) => v.category === cat)?.vendorName;
                  setForm({
                    ...form,
                    category: cat,
                    vendorName: matchingVendor || form.vendorName,
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned Vendor *
              </label>
              <input
                type="text"
                list="vendor-suggestions"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                placeholder="Select or type vendor"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="vendor-suggestions">
                {(categoryVendors.length > 0 ? categoryVendors : vendors).map((v) => (
                  <option key={v.id} value={v.vendorName} />
                ))}
              </datalist>
              {errors.vendorName && (
                <p className="text-xs text-red-600 mt-1">{errors.vendorName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Order Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                value={form.orderAmount}
                onChange={(e) => setForm({ ...form, orderAmount: e.target.value })}
                placeholder="e.g. 240"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.orderAmount && (
                <p className="text-xs text-red-600 mt-1">{errors.orderAmount}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Platform Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.platformFee}
                  onChange={(e) => setForm({ ...form, platformFee: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.platformFee && (
                  <p className="text-xs text-red-600 mt-1">{errors.platformFee}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Var. Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.variableCost}
                  onChange={(e) => setForm({ ...form, variableCost: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.variableCost && (
                  <p className="text-xs text-red-600 mt-1">{errors.variableCost}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Status</label>
              <select
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Paid via UPI">Paid via UPI</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Order Status</label>
              <select
                value={form.orderStatus}
                onChange={(e) => setForm({ ...form, orderStatus: e.target.value as OrderStatus })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Satisfaction Rating (1–5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                placeholder="Optional (e.g. 5)"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.rating && <p className="text-xs text-red-600 mt-1">{errors.rating}</p>}
            </div>

            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none px-3 py-2 border border-slate-200 rounded-lg w-full bg-slate-50 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isRepeatCustomer}
                  onChange={(e) => setForm({ ...form, isRepeatCustomer: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-800">Repeat Customer</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dispatch / Delivery Notes
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Pickup time, room/block details, or special instructions"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              {editingId ? 'Save Changes' : 'Save Service Order'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, hostel/PG, vendor, phone, or ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'All' | ServiceCategory)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(['All', ...ORDER_STATUSES] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No service orders match</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {orders.length === 0
                ? 'Start tracking HostelHelp transactions across DGU Campus by logging your first student order.'
                : 'Adjust your search query or clear category/status filters to view orders.'}
            </p>
            <div className="mt-4">
              {orders.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Log First Order
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('All');
                    setStatusFilter('All');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Order / Date</th>
                  <th className="py-3 px-4">Student & Hostel</th>
                  <th className="py-3 px-4">Category & Vendor</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Order Amt</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Fee / Margin</th>
                  <th className="py-3 px-4 whitespace-nowrap">Payment</th>
                  <th className="py-3 px-4 whitespace-nowrap">Order Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order) => {
                  const margin = order.platformFee - order.variableCost;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-900">
                          {order.id}
                        </div>
                        <div className="font-mono text-xs text-slate-500 mt-0.5">
                          {order.orderDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <span>{order.studentName}</span>
                          {order.isRepeatCustomer && (
                            <span className="text-[11px] font-medium text-indigo-700">
                              · Repeat
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {order.hostelName} · <span className="font-mono">{order.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-slate-900">{order.category}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{order.vendorName}</div>
                      </td>
                      <td className="py-3 px-4 align-top text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                        {formatINR(order.orderAmount)}
                      </td>
                      <td className="py-3 px-4 align-top text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="text-slate-900 font-medium">
                          {formatINR(order.platformFee)} fee
                        </div>
                        <div
                          className={`text-xs ${
                            margin >= 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {formatINR(margin)} margin
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onTogglePaymentStatus(order.id)}
                          title="Click to toggle UPI payment status"
                          className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
                            order.paymentStatus === 'Paid via UPI'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {order.paymentStatus}
                        </button>
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="space-y-1">
                          {renderStatusBadge(order.orderStatus)}
                          <div>
                            <select
                              aria-label={`Change status for ${order.id}`}
                              value={order.orderStatus}
                              onChange={(e) =>
                                onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className="text-xs text-slate-600 bg-transparent border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  Set: {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(order)}
                            aria-label={`Edit ${order.id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(order)}
                            aria-label={`Delete ${order.id}`}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Service Order?"
        description={
          deleteTarget
            ? `Remove order ${deleteTarget.id} for ${deleteTarget.studentName} (${deleteTarget.category})? This updates live revenue and KPIs immediately.`
            : ''
        }
        confirmLabel="Delete Order"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteOrder(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
