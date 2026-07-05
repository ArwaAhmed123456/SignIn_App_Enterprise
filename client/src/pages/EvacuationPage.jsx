import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Search, Filter, AlertTriangle, BellRing, X, FileText, CheckCircle2, Download } from 'lucide-react';
import api from '../api';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
    ' GMT' + (-(d.getTimezoneOffset()/60) >= 0 ? '+' : '') + (-(d.getTimezoneOffset()/60));
};

const fmtDuration = (seconds) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const EvacuationPage = () => {
  const [sites, setSites]           = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteOpen, setSiteOpen]     = useState(false);
  const [reports, setReports]       = useState([]);
  const [active, setActive]         = useState(null);
  const [search, setSearch]         = useState('');
  const [elapsed, setElapsed]       = useState(0);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [leaving, setLeaving]       = useState(false);
  const [showLeaveReport, setShowLeaveReport] = useState(false);
  const [leaveReportDraft, setLeaveReportDraft] = useState('');
  const [savingLeaveReport, setSavingLeaveReport] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const siteRef = useRef(null);
  const actionsRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadSites();
    const h = (e) => {
      if (siteRef.current && !siteRef.current.contains(e.target)) setSiteOpen(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (selectedSite) { loadReports(); loadActive(); }
  }, [selectedSite]);

  // Timer for active evacuation
  useEffect(() => {
    if (active) {
      const start = new Date(active.started_at).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [active]);

  const loadSites = async () => {
    try {
      const res = await api.get('/projects');
      const list = res.data || [];
      setSites(list);
      if (list.length > 0) setSelectedSite(list[0]);
    } catch { setSites([]); }
  };

  const loadReports = async () => {
    try {
      const res = await api.get(`/evacuation/reports?site_id=${selectedSite?.id || ''}`);
      setReports(res.data || []);
    } catch { setReports([]); }
  };

  const loadActive = async () => {
    try {
      const res = await api.get(`/evacuation/active?site_id=${selectedSite?.id || ''}`);
      setActive(res.data?.active || null);
    } catch { setActive(null); }
  };

  const handleStart = async () => {
    try {
      const res = await api.post('/evacuation/start', { site_id: selectedSite?.id });
      setActive(res.data.evacuation);
      setLeaveReportDraft('');
      toast.success('Evacuation started');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start evacuation');
      if (err.response?.data?.evacuation) setActive(err.response.data.evacuation);
    }
  };

  const handleEnd = async () => {
    setLeaving(true);
    try {
      await api.post('/evacuation/end', { site_id: selectedSite?.id });
      setActive(null);
      await loadReports();
      toast.success('Evacuation ended');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to end evacuation');
    }
    finally { setLeaving(false); }
  };

  const handleMarkSafe = async (logId, safe) => {
    try {
      const res = await api.post('/evacuation/mark-safe', {
        site_id: selectedSite?.id,
        participant_id: logId,
        safe,
      });
      setActive(res.data.evacuation);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update participant');
    }
  };

  const handleSendNotification = async () => {
    setSendingNotif(true);
    try {
      const res = await api.post('/evacuation/notify', {
        site_id: selectedSite?.id,
        message: `Evacuation update for ${selectedSite?.name || 'the selected site'}`,
      });
      setActive(res.data.evacuation);
      toast.success('Notification logged');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleSaveLeaveReport = async () => {
    setSavingLeaveReport(true);
    try {
      const res = await api.put('/evacuation/leave-report', {
        site_id: selectedSite?.id,
        leave_report: leaveReportDraft,
      });
      setActive(res.data.evacuation);
      setShowLeaveReport(false);
      toast.success('Leave report saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save leave report');
    } finally {
      setSavingLeaveReport(false);
    }
  };

  const handleMarkAllSafe = async () => {
    if (!active?.participants?.length) return;

    try {
      await Promise.all(
        active.participants.map((participant) =>
          api.post('/evacuation/mark-safe', {
            site_id: selectedSite?.id,
            participant_id: participant.log_id,
            safe: true,
          })
        )
      );
      await loadActive();
      setActionsOpen(false);
      toast.success('All participants marked safe');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update all participants');
    }
  };

  const handleExportActive = () => {
    if (!active?.participants?.length) {
      toast.error('There is no active evacuation data to export');
      return;
    }

    const rows = active.participants.map((participant) => ({
      Name: participant.name,
      Group: participant.group,
      Safe: participant.safe ? 'Yes' : 'No',
      'Marked by': participant.marked_by || '',
      'Marked at': participant.marked_at ? fmtDate(participant.marked_at) : '',
    }));

    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(selectedSite?.name || 'site').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}-evacuation.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setActionsOpen(false);
  };

  const safeCount   = active?.participants?.filter(p => p.safe).length ?? 0;
  const totalCount  = active?.participants?.length ?? 0;
  const pct         = totalCount > 0 ? Math.round((safeCount / totalCount) * 100) : 0;
  const participants = useMemo(() => (active?.participants || []).filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  ), [active, search]);

  useEffect(() => {
    setLeaveReportDraft(active?.leave_report || '');
  }, [active]);

  const adminName = (() => {
    const fn = localStorage.getItem('adminFirstName') || '';
    const ln = localStorage.getItem('adminLastName')  || '';
    return `${fn} ${ln}`.trim() || 'Admin';
  })();

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">
              {active ? 'Evacuation at' : 'Evacuation reports at'}
            </h1>
            {/* Site picker */}
            <div className="relative" ref={siteRef}>
              <button onClick={() => setSiteOpen(o => !o)}
                className="flex items-center gap-1 text-2xl font-bold text-[#2b4594] hover:text-[#1e326e] transition-colors border-b border-dashed border-[#2b4594]">
                {selectedSite?.name || 'Select site'}
                <ChevronDown size={18} />
              </button>
              {siteOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 w-56">
                  {sites.map(s => (
                    <button key={s.id} onClick={() => { setSelectedSite(s); setSiteOpen(false); }}
                      className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${selectedSite?.id === s.id ? 'text-[#2b4594] font-semibold' : 'text-slate-700'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!active ? (
            <button onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-semibold transition-colors shadow-sm">
              <span>▶</span> Start evacuation
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={handleSendNotification} disabled={sendingNotif}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-sm font-semibold transition-colors">
                <BellRing size={15} /> {sendingNotif ? 'Sent!' : 'Send notification'}
              </button>
              <button onClick={() => setShowLeaveReport(true)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-sm font-semibold transition-colors">
                Leave report
              </button>
              <button onClick={handleEnd} disabled={leaving}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-semibold transition-colors">
                <X size={15} /> End evacuation {fmtDuration(elapsed)}
              </button>
            </div>
          )}
        </div>

        {/* Active evacuation view */}
        {active && (
          <div className="flex flex-col gap-4">
            {/* Participants + admin */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">Participants</span>
              <div className="w-6 h-6 rounded-full bg-[#2b4594] flex items-center justify-center text-[10px] font-bold text-white">
                {adminName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
              </div>
            </div>

            {/* Progress card */}
            <div className="flex gap-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-6 py-4 flex items-center gap-4">
                {/* Donut */}
                <div className="relative w-14 h-14">
                  <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.2" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2b4594" strokeWidth="3.2"
                      strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{pct}%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Show all</p>
                  <p className="text-xs text-slate-500">{safeCount} of {totalCount}</p>
                </div>
              </div>
            </div>

            {/* All section */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-slate-700">All</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
                    className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm w-52 bg-white focus:outline-none focus:border-[#2b4594]" />
                </div>
                <button className="flex items-center gap-1.5 border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-600 hover:bg-slate-50">
                  <Filter size={13} /> Filters
                </button>
                <span className="text-sm text-slate-500">Comments {active?.notifications?.length ?? 0}</span>
                <div className="flex-1" />
                <div className="relative" ref={actionsRef}>
                  <button
                    type="button"
                    onClick={() => setActionsOpen((current) => !current)}
                    className="flex items-center gap-1.5 border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-600 hover:bg-slate-50"
                  >
                    Actions <ChevronDown size={13} />
                  </button>
                  {actionsOpen && (
                    <div className="absolute right-0 top-full z-20 mt-2 min-w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={handleMarkAllSafe}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <CheckCircle2 size={14} />
                        Mark all safe
                      </button>
                      <button
                        type="button"
                        onClick={handleExportActive}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Download size={14} />
                        Export CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Sign in state</th>
                      <th className="px-4 py-3">Marked by</th>
                      <th className="px-4 py-3">Marked at</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participants.map(p => (
                      <tr key={p.log_id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.group}</td>
                        <td className="px-4 py-3 text-slate-500">{p.marked_by || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{p.marked_at ? fmtDate(p.marked_at) : '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleMarkSafe(p.log_id, !p.safe)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              p.safe
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}>
                            {p.safe ? 'Safe ✓' : 'Mark safe'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {participants.length === 0 && (
                  <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                    <span className="text-2xl">→</span>
                    <p className="font-semibold text-slate-500">There is currently no-one signed in at this site</p>
                    <p className="text-sm">Quickly and easily mark your visitors and employees as safe</p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BellRing size={16} className="text-[#2b4594]" />
                    <h4 className="font-semibold text-slate-800">Notifications</h4>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    {(active?.notifications || []).length > 0 ? active.notifications.map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-slate-200 px-4 py-3">
                        <p className="font-medium text-slate-800">{notification.message}</p>
                        <p className="mt-1 text-slate-500">
                          {notification.sent_by} at {fmtDate(notification.sent_at)}
                        </p>
                      </div>
                    )) : (
                      <p className="text-slate-500">No notifications have been sent yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#2b4594]" />
                    <h4 className="font-semibold text-slate-800">Leave report</h4>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {active?.leave_report || 'No leave report has been added yet.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports list (no active evacuation) */}
        {!active && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-slate-500 font-semibold text-xs">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Accounted for</th>
                  <th className="px-6 py-3">Started by</th>
                  <th className="px-6 py-3">Completed by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 text-slate-700">{fmtDate(r.started_at)}</td>
                    <td className="px-6 py-4 text-slate-600">{fmtDuration(r.duration_s)}</td>
                    <td className="px-6 py-4 text-slate-600">{r.accounted_for}</td>
                    <td className="px-6 py-4 text-slate-600">{r.started_by}</td>
                    <td className="px-6 py-4 text-slate-600">{r.ended_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                <AlertTriangle size={40} strokeWidth={1.2} />
                <p className="font-semibold text-slate-600">There are currently no evacuation reports for this site</p>
                <p className="text-sm text-center max-w-sm">Quickly and easily mark your visitors and employees as safe. Export and print logs for auditing purposes.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showLeaveReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-semibold text-slate-800">Leave report</h3>
              <button type="button" onClick={() => setShowLeaveReport(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-slate-500">
                Save a short summary for this evacuation so it is included in the final report history.
              </p>
              <textarea
                rows={7}
                value={leaveReportDraft}
                onChange={(event) => setLeaveReportDraft(event.target.value)}
                placeholder="Add incident notes, timing, actions taken, or follow-up information..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2b4594] focus:ring-2 focus:ring-[#2b4594]/20"
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLeaveReport(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLeaveReport}
                disabled={savingLeaveReport}
                className="rounded-lg bg-[#2b4594] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e326e] disabled:opacity-60"
              >
                {savingLeaveReport ? 'Saving...' : 'Save report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvacuationPage;
