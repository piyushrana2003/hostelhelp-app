import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceVendor,
  VENTURE_BENCHMARKS,
  VerificationStatus,
} from '../types/venture';
import { formatINR } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

interface VendorsTabProps {
  vendors: ServiceVendor[];
  openFormTrigger: number;
  onSaveVendor: (vendor: ServiceVendor, isNew: boolean) => void;
  onUpdateVendorStatus: (id: string, status: VerificationStatus) => void;
  onIncrementTrialOrders: (id: string) => void;
  onDeleteVendor: (id: string) => void;
}

const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Pending Check',
  'Trial Order Phase',
  'Verified',
];

interface VendorFormState {
  vendorName: string;
  category: ServiceCategory;
  contactNumber: string;
  distanceKm: string;
  baseStudentPrice: string;
  verificationStatus: VerificationStatus;
  trialOrdersCompleted: string;
  averageRating: string;
  reliabilityNotes: string;
}

function getDefaultVendorForm(): VendorFormState {
  return {
    vendorName: '',
    category: 'Laundry',
    contactNumber: '',
    distanceKm: '2.0',
    baseStudentPrice: '100',
    verificationStatus: 'Pending Check',
    trialOrdersCompleted: '0',
    averageRating: '4.5',
    reliabilityNotes: '',
  };
}

export function VendorsTab({
  vendors,
  openFormTrigger,
  onSaveVendor,
  onUpdateVendorStatus,
  onIncrementTrialOrders,
  onDeleteVendor,
}: VendorsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorFormState>(getDefaultVendorForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ServiceCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | VerificationStatus>('All');
  const [deleteTarget, setDeleteTarget] = useState<ServiceVendor | null>(null);

  useEffect(() => {
    if (openFormTrigger > 0) {
      setEditingId(null);
      setForm(getDefaultVendorForm());
      setErrors({});
      setShowForm(true);
    }
  }, [openFormTrigger]);

  const metrics = useMemo(() => {
    const verifiedCount = vendors.filter((v) => v.verificationStatus === 'Verified').length;
    const trialCount = vendors.reduce((sum, v) => sum + v.trialOrdersCompleted, 0);
    const avgRating =
      vendors.length > 0
        ? vendors.reduce((sum, v) => sum + v.averageRating, 0) / vendors.length
        : 0;
    return {
      total: vendors.length,
      verifiedCount,
      trialCount,
      avgRating,
    };
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vendors.filter((v) => {
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && v.verificationStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        v.vendorName.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.contactNumber.includes(q) ||
        v.reliabilityNotes.toLowerCase().includes(q)
      );
    });
  }, [vendors, categoryFilter, statusFilter, searchQuery]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(getDefaultVendorForm());
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (v: ServiceVendor) => {
    setEditingId(v.id);
    setForm({
      vendorName: v.vendorName,
      category: v.category,
      contactNumber: v.contactNumber,
      distanceKm: String(v.distanceKm),
      baseStudentPrice: String(v.baseStudentPrice),
      verificationStatus: v.verificationStatus,
      trialOrdersCompleted: String(v.trialOrdersCompleted),
      averageRating: String(v.averageRating),
      reliabilityNotes: v.reliabilityNotes,
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.vendorName.trim()) nextErrors.vendorName = 'Vendor / shop name is required';
    if (!/^\d{10}$/.test(form.contactNumber.replace(/\s+/g, ''))) {
      nextErrors.contactNumber = 'Enter a valid 10-digit contact number';
    }
    const dist = Number(form.distanceKm);
    if (form.distanceKm === '' || Number.isNaN(dist) || dist < 0 || dist > 25) {
      nextErrors.distanceKm = 'Enter distance between 0 and 25 km';
    }
    const price = Number(form.baseStudentPrice);
    if (form.baseStudentPrice === '' || Number.isNaN(price) || price <= 0) {
      nextErrors.baseStudentPrice = 'Enter base student price > ₹0';
    }
    const rating = Number(form.averageRating);
    if (form.averageRating === '' || Number.isNaN(rating) || rating < 1 || rating > 5) {
      nextErrors.averageRating = 'Rating must be between 1.0 and 5.0';
    }
    const trials = Number(form.trialOrdersCompleted);
    if (form.trialOrdersCompleted === '' || Number.isNaN(trials) || trials < 0) {
      nextErrors.trialOrdersCompleted = 'Enter valid trial order count ≥ 0';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const existing = editingId ? vendors.find((v) => v.id === editingId) : undefined;
    const newId =
      editingId ||
      `VEN-${Math.max(300, ...vendors.map((v) => Number(v.id.replace(/\D/g, '')) || 300)) + 1}`;

    const record: ServiceVendor = {
      id: newId,
      onboardedAt: existing?.onboardedAt || new Date().toISOString().slice(0, 10),
      vendorName: form.vendorName.trim(),
      category: form.category,
      contactNumber: form.contactNumber.replace(/\s+/g, ''),
      distanceKm: Number(form.distanceKm),
      baseStudentPrice: Number(form.baseStudentPrice),
      verificationStatus: form.verificationStatus,
      trialOrdersCompleted: Number(form.trialOrdersCompleted),
      averageRating: Number(form.averageRating),
      reliabilityNotes: form.reliabilityNotes.trim(),
    };

    onSaveVendor(record, !editingId);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Supply Target Tracker */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Verified Local Service Providers (Vendor Directory)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage local Dehradun shops within 5–10 km of DGU Campus. Target: 5–10 verified vendors
              completing 30+ trial orders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Close Form' : 'Onboard Vendor'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Verified Local Providers</span>
              <span className="font-mono font-semibold tabular-nums text-emerald-700">
                {metrics.verifiedCount} / {VENTURE_BENCHMARKS.verifiedVendorsMin}–
                {VENTURE_BENCHMARKS.verifiedVendorsMax}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (metrics.verifiedCount / VENTURE_BENCHMARKS.verifiedVendorsMax) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">{metrics.total} total vendors in pipeline</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Trial Orders Completed</span>
              <span className="font-mono font-semibold tabular-nums text-indigo-600">
                {metrics.trialCount} / {VENTURE_BENCHMARKS.trialOrdersVendorTarget}+
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (metrics.trialCount / VENTURE_BENCHMARKS.trialOrdersVendorTarget) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">Quality & SLA validation orders</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-700">Average Vendor Rating</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 flex items-center gap-1.5">
              <span>{metrics.avgRating.toFixed(1)}</span>
              <span className="text-xs font-normal text-slate-500">/ 5.0</span>
            </p>
            <p className="text-xs text-slate-500">
              {Math.round((metrics.avgRating / 5) * 100)}% partner quality score (Target: 80%+)
            </p>
          </div>
        </div>
      </div>

      {/* Onboard / Edit Vendor Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-indigo-200 rounded-xl p-6 space-y-5"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              {editingId ? `Edit Vendor ${editingId}` : 'Onboard Local Service Provider'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify distance from DGU Campus, base student pricing, and trial performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Vendor / Shop Name *
              </label>
              <input
                type="text"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                placeholder="e.g. Doon Express Wash & Iron"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.vendorName && (
                <p className="text-xs text-red-600 mt-1">{errors.vendorName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Service Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
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
                Contact Number *
              </label>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="10-digit phone"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.contactNumber && (
                <p className="text-xs text-red-600 mt-1">{errors.contactNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Distance from DGU (km) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.distanceKm && (
                <p className="text-xs text-red-600 mt-1">{errors.distanceKm}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Base Student Price (₹) *
              </label>
              <input
                type="number"
                min="1"
                value={form.baseStudentPrice}
                onChange={(e) => setForm({ ...form, baseStudentPrice: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.baseStudentPrice && (
                <p className="text-xs text-red-600 mt-1">{errors.baseStudentPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Verification Status
              </label>
              <select
                value={form.verificationStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    verificationStatus: e.target.value as VerificationStatus,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {VERIFICATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Trial Orders Completed
              </label>
              <input
                type="number"
                min="0"
                value={form.trialOrdersCompleted}
                onChange={(e) => setForm({ ...form, trialOrdersCompleted: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.trialOrdersCompleted && (
                <p className="text-xs text-red-600 mt-1">{errors.trialOrdersCompleted}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Average Rating (1–5)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={form.averageRating}
                onChange={(e) => setForm({ ...form, averageRating: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.averageRating && (
                <p className="text-xs text-red-600 mt-1">{errors.averageRating}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reliability & SLA Notes
            </label>
            <input
              type="text"
              value={form.reliabilityNotes}
              onChange={(e) => setForm({ ...form, reliabilityNotes: e.target.value })}
              placeholder="Turnaround time, hygiene checks, rate-card agreement..."
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
              {editingId ? 'Save Vendor' : 'Add Vendor'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Directory */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shop name, category, phone, or notes..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter vendors by category"
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
              {(['All', ...VERIFICATION_STATUSES] as const).map((status) => (
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

        {filteredVendors.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No vendors found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {vendors.length === 0
                ? 'Onboard your first local service provider within 5–10 km of DGU Campus.'
                : 'No vendors match the selected filters.'}
            </p>
            <div className="mt-4">
              {vendors.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Onboard First Vendor
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
                  <th className="py-3 px-4">Vendor & Category</th>
                  <th className="py-3 px-4 whitespace-nowrap">Distance</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Base Price</th>
                  <th className="py-3 px-4 whitespace-nowrap">Verification</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Trial Orders</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Rating</th>
                  <th className="py-3 px-4">Reliability Notes</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 align-top">
                      <div className="font-medium text-slate-900">{v.vendorName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {v.category} · <span className="font-mono">{v.contactNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap font-mono text-xs text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {v.distanceKm.toFixed(1)} km
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      {formatINR(v.baseStudentPrice)}
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <select
                        aria-label={`Verification status for ${v.vendorName}`}
                        value={v.verificationStatus}
                        onChange={(e) =>
                          onUpdateVendorStatus(v.id, e.target.value as VerificationStatus)
                        }
                        className={`text-xs font-medium px-2.5 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          v.verificationStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.verificationStatus === 'Trial Order Phase'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {VERIFICATION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {v.trialOrdersCompleted}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncrementTrialOrders(v.id)}
                          className="text-xs font-mono font-medium px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded transition-colors"
                          title="Log +1 completed trial order"
                        >
                          +1
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1 text-slate-900 font-medium">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {v.averageRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top max-w-xs">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {v.reliabilityNotes || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {v.verificationStatus !== 'Verified' && (
                          <button
                            type="button"
                            onClick={() => onUpdateVendorStatus(v.id, 'Verified')}
                            title="Mark Verified"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditForm(v)}
                          aria-label={`Edit ${v.vendorName}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(v)}
                          aria-label={`Delete ${v.vendorName}`}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove Service Vendor?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.vendorName} (${deleteTarget.category}) from the Vendor Directory?`
            : ''
        }
        confirmLabel="Remove Vendor"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteVendor(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
