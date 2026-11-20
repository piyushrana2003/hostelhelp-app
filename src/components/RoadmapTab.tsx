import { useState } from 'react';
import {
  CheckSquare,
  Plus,
  RefreshCw,
  Save,
  Square,
  Trash2,
} from 'lucide-react';
import { ServiceOrder, StudentLead, WeeklyRoadmap } from '../types/venture';

interface RoadmapTabProps {
  roadmap: WeeklyRoadmap[];
  orders: ServiceOrder[];
  students: StudentLead[];
  onToggleDeliverable: (weekNumber: 1 | 2 | 3 | 4, deliverableId: string) => void;
  onAddDeliverable: (weekNumber: 1 | 2 | 3 | 4, label: string) => void;
  onDeleteDeliverable: (weekNumber: 1 | 2 | 3 | 4, deliverableId: string) => void;
  onUpdateWeekActuals: (
    weekNumber: 1 | 2 | 3 | 4,
    actualMetricValue: number,
    learningAnswer: string
  ) => void;
}

export function RoadmapTab({
  roadmap,
  orders,
  students,
  onToggleDeliverable,
  onAddDeliverable,
  onDeleteDeliverable,
  onUpdateWeekActuals,
}: RoadmapTabProps) {
  const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    roadmap.forEach((w) => {
      initial[w.weekNumber] = w.learningAnswer;
    });
    return initial;
  });

  const [draftActuals, setDraftActuals] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    roadmap.forEach((w) => {
      initial[w.weekNumber] = String(w.actualMetricValue);
    });
    return initial;
  });

  const [newTaskInputs, setNewTaskInputs] = useState<Record<number, string>>({});

  // Live synced reference metrics from Orders & CRM
  const liveInterviews = students.filter((s) => s.interviewCompleted).length;
  const liveActiveUsers = new Set(
    orders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .map((o) => `${o.studentName.trim().toLowerCase()}-${o.phone.trim()}`)
  ).size;
  const ratedOrders = orders.filter((o) => typeof o.rating === 'number' && o.rating > 0);
  const liveSatisfactionPct =
    ratedOrders.length > 0
      ? Math.round(
          (ratedOrders.reduce((s, o) => s + (o.rating || 0), 0) / ratedOrders.length / 5) * 100
        )
      : 0;
  const livePayingStudents = new Set(
    orders
      .filter((o) => o.orderStatus !== 'Cancelled' && o.paymentStatus === 'Paid via UPI')
      .map((o) => `${o.studentName.trim().toLowerCase()}-${o.phone.trim()}`)
  ).size;

  const getLiveSuggestion = (weekNumber: 1 | 2 | 3 | 4): { value: number; hint: string } => {
    switch (weekNumber) {
      case 1:
        return { value: liveInterviews, hint: `${liveInterviews} interviews in Student CRM` };
      case 2:
        return { value: liveActiveUsers, hint: `${liveActiveUsers} unique ordering students` };
      case 3:
        return {
          value: liveSatisfactionPct,
          hint: `${liveSatisfactionPct}% avg rating across ${ratedOrders.length} orders`,
        };
      case 4:
        return { value: livePayingStudents, hint: `${livePayingStudents} UPI paying students` };
    }
  };

  const totalDeliverables = roadmap.reduce((acc, w) => acc + w.deliverables.length, 0);
  const completedDeliverables = roadmap.reduce(
    (acc, w) => acc + w.deliverables.filter((d) => d.completed).length,
    0
  );

  const handleSaveWeek = (weekNumber: 1 | 2 | 3 | 4) => {
    const val = Math.max(0, Number(draftActuals[weekNumber]) || 0);
    const answer = (draftAnswers[weekNumber] ?? '').trim();
    onUpdateWeekActuals(weekNumber, val, answer);
  };

  const handleSyncLive = (weekNumber: 1 | 2 | 3 | 4) => {
    const { value } = getLiveSuggestion(weekNumber);
    setDraftActuals((prev) => ({ ...prev, [weekNumber]: String(value) }));
    const answer = (draftAnswers[weekNumber] ?? '').trim();
    onUpdateWeekActuals(weekNumber, value, answer);
  };

  const handleAddTask = (e: React.FormEvent, weekNumber: 1 | 2 | 3 | 4) => {
    e.preventDefault();
    const text = (newTaskInputs[weekNumber] || '').trim();
    if (!text) return;
    onAddDeliverable(weekNumber, text);
    setNewTaskInputs((prev) => ({ ...prev, [weekNumber]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            30-Day Launch Roadmap & Weekly Experiment Tracker
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Execute the 4-week DGU Campus MVP plan, check off deliverables, log weekly actuals, and
            document validated learning.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Deliverables Done</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {completedDeliverables}{' '}
              <span className="text-sm font-normal text-slate-500">/ {totalDeliverables}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">30-Day Progress</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600">
              {Math.round((completedDeliverables / Math.max(1, totalDeliverables)) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* 4-Week Execution Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {roadmap.map((week) => {
          const doneCount = week.deliverables.filter((d) => d.completed).length;
          const pct = Math.min(
            100,
            Math.round((week.actualMetricValue / Math.max(1, week.targetMetricValue)) * 100)
          );
          const liveHint = getLiveSuggestion(week.weekNumber);

          return (
            <div
              key={week.weekNumber}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Week Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-semibold text-indigo-600">
                      Week 0{week.weekNumber} · {doneCount}/{week.deliverables.length} tasks done
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{week.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{week.objective}</p>
                  </div>
                </div>

                {/* Weekly KPI Progress & Sync */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{week.targetMetricLabel}</span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {week.actualMetricValue} / {week.targetMetricValue} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`actual-w${week.weekNumber}`}
                        className="text-xs text-slate-600"
                      >
                        Log Actual:
                      </label>
                      <input
                        id={`actual-w${week.weekNumber}`}
                        type="number"
                        min="0"
                        value={draftActuals[week.weekNumber] ?? String(week.actualMetricValue)}
                        onChange={(e) =>
                          setDraftActuals((prev) => ({
                            ...prev,
                            [week.weekNumber]: e.target.value,
                          }))
                        }
                        className="w-20 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncLive(week.weekNumber)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                      title={`Sync from live tracker (${liveHint.hint})`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Sync Live ({liveHint.value})
                    </button>
                  </div>
                </div>

                {/* Deliverables Checklist */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Deliverables Checklist</p>
                  <div className="divide-y divide-slate-100">
                    {week.deliverables.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-start justify-between gap-3 group"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleDeliverable(week.weekNumber, item.id)}
                          className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm leading-snug ${
                              item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {item.label}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDeliverable(week.weekNumber, item.id)}
                          aria-label="Remove deliverable"
                          className="p-1 text-slate-300 hover:text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Quick Add Task */}
                  <form
                    onSubmit={(e) => handleAddTask(e, week.weekNumber)}
                    className="flex items-center gap-2 pt-2"
                  >
                    <input
                      type="text"
                      value={newTaskInputs[week.weekNumber] || ''}
                      onChange={(e) =>
                        setNewTaskInputs((prev) => ({
                          ...prev,
                          [week.weekNumber]: e.target.value,
                        }))
                      }
                      placeholder="Add new deliverable..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                </div>
              </div>

              {/* Core Learning Question */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  Core Learning Question: <span className="font-normal text-slate-600">{week.coreLearningQuestion}</span>
                </p>
                <textarea
                  rows={2}
                  value={draftAnswers[week.weekNumber] ?? week.learningAnswer}
                  onChange={(e) =>
                    setDraftAnswers((prev) => ({ ...prev, [week.weekNumber]: e.target.value }))
                  }
                  placeholder="Document verified customer insight or experiment outcome..."
                  className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveWeek(week.weekNumber)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Week {week.weekNumber} Log
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
