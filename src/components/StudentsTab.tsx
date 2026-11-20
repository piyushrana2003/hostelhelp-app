import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  ACQUISITION_CHANNELS,
  AcquisitionChannel,
  PilotStatus,
  StudentLead,
  VENTURE_BENCHMARKS,
} from '../types/venture';
import { ConfirmModal } from './ConfirmModal';

interface StudentsTabProps {
  students: StudentLead[];
  openFormTrigger: number;
  onSaveStudent: (student: StudentLead, isNew: boolean) => void;
  onToggleInterview: (id: string) => void;
  onUpdatePilotStatus: (id: string, status: PilotStatus) => void;
  onDeleteStudent: (id: string) => void;
}

const PILOT_STATUSES: PilotStatus[] = ['Lead', 'Signed Up', 'Active Pilot', 'Dropped'];

interface StudentFormState {
  studentName: string;
  courseYear: string;
  hostelLocation: string;
  phone: string;
  channel: AcquisitionChannel;
  interviewCompleted: boolean;
  pilotStatus: PilotStatus;
  subscriptionInterest: boolean;
  feedbackNotes: string;
}

function getDefaultStudentForm(): StudentFormState {
  return {
    studentName: '',
    courseYear: '1st Year MBA',
    hostelLocation: '',
    phone: '',
    channel: 'WhatsApp Communities',
    interviewCompleted: false,
    pilotStatus: 'Signed Up',
    subscriptionInterest: false,
    feedbackNotes: '',
  };
}

export function StudentsTab({
  students,
  openFormTrigger,
  onSaveStudent,
  onToggleInterview,
  onUpdatePilotStatus,
  onDeleteStudent,
}: StudentsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentFormState>(getDefaultStudentForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'All' | AcquisitionChannel>('All');
  const [pilotFilter, setPilotFilter] = useState<'All' | PilotStatus>('All');
  const [deleteTarget, setDeleteTarget] = useState<StudentLead | null>(null);

  useEffect(() => {
    if (openFormTrigger > 0) {
      setEditingId(null);
      setForm(getDefaultStudentForm());
      setErrors({});
      setShowForm(true);
    }
  }, [openFormTrigger]);

  const metrics = useMemo(() => {
    const interviews = students.filter((s) => s.interviewCompleted).length;
    const pilotSignups = students.filter(
      (s) => s.pilotStatus === 'Signed Up' || s.pilotStatus === 'Active Pilot'
    ).length;
    const activePilot = students.filter((s) => s.pilotStatus === 'Active Pilot').length;
    const passInterest = students.filter((s) => s.subscriptionInterest).length;
    return {
      total: students.length,
      interviews,
      pilotSignups,
      activePilot,
      passInterest,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (channelFilter !== 'All' && s.channel !== channelFilter) return false;
      if (pilotFilter !== 'All' && s.pilotStatus !== pilotFilter) return false;
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.courseYear.toLowerCase().includes(q) ||
        s.hostelLocation.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.feedbackNotes.toLowerCase().includes(q)
      );
    });
  }, [students, channelFilter, pilotFilter, searchQuery]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(getDefaultStudentForm());
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (s: StudentLead) => {
    setEditingId(s.id);
    setForm({
      studentName: s.studentName,
      courseYear: s.courseYear,
      hostelLocation: s.hostelLocation,
      phone: s.phone,
      channel: s.channel,
      interviewCompleted: s.interviewCompleted,
      pilotStatus: s.pilotStatus,
      subscriptionInterest: s.subscriptionInterest,
      feedbackNotes: s.feedbackNotes,
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.studentName.trim()) nextErrors.studentName = 'Student name is required';
    if (!form.courseYear.trim()) nextErrors.courseYear = 'Course / year is required';
    if (!form.hostelLocation.trim()) nextErrors.hostelLocation = 'Hostel / PG location is required';
    if (!/^\d{10}$/.test(form.phone.replace(/\s+/g, ''))) {
      nextErrors.phone = 'Enter a valid 10-digit phone number';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const existing = editingId ? students.find((s) => s.id === editingId) : undefined;
    const newId =
      editingId ||
      `STU-${Math.max(200, ...students.map((s) => Number(s.id.replace(/\D/g, '')) || 200)) + 1}`;

    const record: StudentLead = {
      id: newId,
      createdAt: existing?.createdAt || new Date().toISOString().slice(0, 10),
      studentName: form.studentName.trim(),
      courseYear: form.courseYear.trim(),
      hostelLocation: form.hostelLocation.trim(),
      phone: form.phone.replace(/\s+/g, ''),
      channel: form.channel,
      interviewCompleted: form.interviewCompleted,
      pilotStatus: form.pilotStatus,
      subscriptionInterest: form.subscriptionInterest,
      feedbackNotes: form.feedbackNotes.trim(),
    };

    onSaveStudent(record, !editingId);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top CRM Header & Goal Trackers */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Student CRM & Interview / Pilot Tracker
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Track customer discovery interviews, 30-day pilot sign-ups, and ₹299/month pass
              demand across DGU Campus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Close Form' : 'Add Student Lead'}
          </button>
        </div>

        {/* Venture Target Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Customer Conversations</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {metrics.interviews} / {VENTURE_BENCHMARKS.interviewTarget}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (metrics.interviews / VENTURE_BENCHMARKS.interviewTarget) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">Week 1 discovery benchmark</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Pilot Sign-ups Locked</span>
              <span className="font-mono font-semibold tabular-nums text-emerald-700">
                {metrics.pilotSignups} / {VENTURE_BENCHMARKS.pilotSignupTarget}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (metrics.pilotSignups / VENTURE_BENCHMARKS.pilotSignupTarget) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {metrics.activePilot} currently Active Pilot · {metrics.passInterest} want ₹299/mo pass
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">SOM Student Target (10% SAM)</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {metrics.pilotSignups} / {VENTURE_BENCHMARKS.somTargetStudents}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-800 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (metrics.pilotSignups / VENTURE_BENCHMARKS.somTargetStudents) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {metrics.total} total CRM records logged
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-indigo-200 rounded-xl p-6 space-y-5"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              {editingId ? `Edit Student Record ${editingId}` : 'New Student Lead / Interview Entry'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Capture DGU hostel/PG segment details, acquisition channel, and pilot readiness
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                placeholder="e.g. Ananya Negi"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.studentName && (
                <p className="text-xs text-red-600 mt-1">{errors.studentName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Course / Year *
              </label>
              <input
                type="text"
                value={form.courseYear}
                onChange={(e) => setForm({ ...form, courseYear: e.target.value })}
                placeholder="e.g. 1st Year MBA / 2nd Year B.Tech"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.courseYear && (
                <p className="text-xs text-red-600 mt-1">{errors.courseYear}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hostel / PG Location *
              </label>
              <input
                type="text"
                value={form.hostelLocation}
                onChange={(e) => setForm({ ...form, hostelLocation: e.target.value })}
                placeholder="e.g. DGU Girls Hostel Wing 2 / Premnagar PG"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.hostelLocation && (
                <p className="text-xs text-red-600 mt-1">{errors.hostelLocation}</p>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Acquisition Channel
              </label>
              <select
                value={form.channel}
                onChange={(e) =>
                  setForm({ ...form, channel: e.target.value as AcquisitionChannel })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ACQUISITION_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pilot Sign-up Status
              </label>
              <select
                value={form.pilotStatus}
                onChange={(e) => setForm({ ...form, pilotStatus: e.target.value as PilotStatus })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PILOT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none px-3.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={form.interviewCompleted}
                onChange={(e) => setForm({ ...form, interviewCompleted: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Discovery Interview Completed (Yes/No)
              </span>
            </label>

            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none px-3.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={form.subscriptionInterest}
                onChange={(e) => setForm({ ...form, subscriptionInterest: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Subscription Pass Interest (₹299/mo)
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Interview Insights & Feedback Notes
            </label>
            <textarea
              rows={2}
              value={form.feedbackNotes}
              onChange={(e) => setForm({ ...form, feedbackNotes: e.target.value })}
              placeholder="Pain points mentioned, price sensitivity, preferred service timings..."
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
              {editingId ? 'Update Student' : 'Save Student Lead'}
            </button>
          </div>
        </form>
      )}

      {/* Search, Filters & CRM Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, course, hostel/PG, or feedback..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by acquisition channel"
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as 'All' | AcquisitionChannel)
              }
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Channels</option>
              {ACQUISITION_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(['All', ...PILOT_STATUSES] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPilotFilter(status)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    pilotFilter === status
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

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No student records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {students.length === 0
                ? 'Log your first DGU student discovery interview or pilot sign-up.'
                : 'No records match the active search or channel/status filters.'}
            </p>
            <div className="mt-4">
              {students.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Add First Student
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setChannelFilter('All');
                    setPilotFilter('All');
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
                  <th className="py-3 px-4">Student & Course</th>
                  <th className="py-3 px-4">Hostel / PG & Channel</th>
                  <th className="py-3 px-4 whitespace-nowrap">Interview</th>
                  <th className="py-3 px-4 whitespace-nowrap">Pilot Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">₹299 Pass</th>
                  <th className="py-3 px-4">Feedback Notes</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 align-top">
                      <div className="font-medium text-slate-900">{s.studentName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {s.courseYear} · <span className="font-mono">{s.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="text-slate-900">{s.hostelLocation}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.channel}</div>
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleInterview(s.id)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
                          s.interviewCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {s.interviewCompleted ? 'Completed' : 'Pending'}
                      </button>
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <select
                        aria-label={`Pilot status for ${s.studentName}`}
                        value={s.pilotStatus}
                        onChange={(e) =>
                          onUpdatePilotStatus(s.id, e.target.value as PilotStatus)
                        }
                        className={`text-xs font-medium px-2.5 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          s.pilotStatus === 'Active Pilot'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : s.pilotStatus === 'Signed Up'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : s.pilotStatus === 'Dropped'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {PILOT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      {s.subscriptionInterest ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Interested
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pay-per-use</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top max-w-xs">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {s.feedbackNotes || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(s)}
                          aria-label={`Edit ${s.studentName}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          aria-label={`Delete ${s.studentName}`}
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
        title="Delete Student Record?"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.studentName} (${deleteTarget.hostelLocation}) from the Student CRM?`
            : ''
        }
        confirmLabel="Delete Student"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteStudent(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
