import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Clock, Download, X, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api';

// ─── helpers ──────────────────────────────────────────────────────────────────
const isoDate = (d) => d.toISOString().split('T')[0];
const today   = () => isoDate(new Date());

const fmtDateShort = (iso) => {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Export modal ─────────────────────────────────────────────────────────────
const ExportModal = ({ dateFrom, dateTo, group, siteId, onClose }) => {
  const [whoIncluded, setWhoIncluded]   = useState('Everyone');
  const [includeSignedIn, setIncludeSignedIn] = useState(false);
  const [reportOn, setReportOn]         = useState('date_worked');
  const [startDate, setStartDate]       = useState(dateFrom);
  const [endDate, setEndDate]           = useState(dateTo);
  const [profileFields, setProfileFields] = useState({ fullName: false, email: false, phone: false, role: false });
  const [timeFormat, setTimeFormat]     = useState('decimal');
  const [exporting, setExporting]       = useState(false);

  const toggleField = (k) => setProfileFields(f => ({ ...f, [k]: !f[k] }));

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ date_from: startDate, date_to: endDate });
      if (group && group !== 'All') params.set('group', group);
      if (siteId && siteId !== 'all') params.set('site_id', siteId);

      const res = await api.get(`/attendance/timesheets?${params}`);
      const rows = res.data.rows || [];

      const exportData = [];
      rows.forEach(row => {
        const allDays = Object.entries(row.days || {});
        if (allDays.length === 0) {
          exportData.push({ Name: row.name, Date: '', 'Sign In': '', 'Sign Out': '', Hours: row.total_hours || 0 });
        } else {
          allDays.forEach(([date, entry]) => {
            const r = { Name: row.name, Date: date };
            if (profileFields.email)    r.Email    = row.email    || '';
            if (profileFields.phone)    r.Phone    = row.phone    || '';
            if (profileFields.role)     r.Role     = row.role     || '';
            r['Sign In']  = entry.sign_in  || '';
            r['Sign Out'] = entry.sign_out || '';
            r.Hours       = timeFormat === 'decimal'
              ? entry.hours || 0
              : (() => { const h = Math.floor(entry.hours||0); const m = Math.round(((entry.hours||0)-h)*60); return `${h}:${String(m).padStart(2,'0')}`; })();
            exportData.push(r);
          });
        }
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Timesheets');
      XLSX.writeFile(wb, `attendance-${startDate}-to-${endDate}.xlsx`);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Export timesheet</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Who */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Who should be included?</label>
            <select value={whoIncluded} onChange={e => setWhoIncluded(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option>Everyone</option>
              <option>Members only</option>
              <option>Visitors only</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">By default, hours for currently signed-in members are excluded</p>
          </div>

          {/* Include signed-in */}
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={includeSignedIn} onChange={e => setIncludeSignedIn(e.target.checked)}
              className="w-4 h-4 accent-[#2b4594] rounded" />
            Include currently signed in members
          </label>

          {/* Report hours on */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Report hours on</p>
            <label className="flex items-start gap-2 mb-2 cursor-pointer">
              <input type="radio" checked={reportOn === 'date_worked'} onChange={() => setReportOn('date_worked')}
                className="mt-0.5 w-4 h-4 accent-[#2b4594]" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Date worked</p>
                <p className="text-xs text-slate-500">Total hours worked on the selected date(s)</p>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" checked={reportOn === 'date_signin'} onChange={() => setReportOn('date_signin')}
                className="mt-0.5 w-4 h-4 accent-[#2b4594]" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Date of sign in</p>
                <p className="text-xs text-slate-500">Total hours based on sign-in date (ideal for night shifts)</p>
              </div>
            </label>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-3">Exports are limited to a maximum of 31 days</p>

          {/* Profile fields */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Include the following profile fields</p>
            <div className="grid grid-cols-2 gap-2">
              {[['fullName','Full name'],['email','Email'],['phone','Phone number'],['role','Role']].map(([k,label]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={profileFields[k]} onChange={() => toggleField(k)}
                    className="w-4 h-4 accent-[#2b4594] rounded" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Time format */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Time format</label>
            <select value={timeFormat} onChange={e => setTimeFormat(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option value="decimal">Decimal (h.hh)</option>
              <option value="hm">Hours and minutes (h:mm)</option>
            </select>
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="px-5 py-2 bg-[#76c043] hover:bg-[#5fa832] disabled:opacity-60 text-white rounded-lg text-sm font-semibold">
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AttendancePage = () => {
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [signedOnly, setSignedOnly] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [currentDate, setCurrentDate] = useState(today());

  const [sites, setSites]           = useState([]);
  const [siteId, setSiteId]         = useState('');
  const [siteName, setSiteName]     = useState('All sites');
  const [siteOpen, setSiteOpen]     = useState(false);
  const [groups, setGroups]         = useState([]);
  const [group, setGroup]           = useState('Employees');
  const siteRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (siteRef.current && !siteRef.current.contains(e.target)) setSiteOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    api.get('/projects').then(res => {
      const list = res.data || [];
      setSites(list);
      if (list.length > 0) { setSiteId(list[0].id); setSiteName(list[0].name); }
    }).catch(() => setSites([]));
  }, []);

  useEffect(() => {
    if (!siteId) return;
    api.get(`/visitor-groups?project_id=${siteId}`).then(res => {
      setGroups(res.data || []);
    }).catch(() => setGroups([]));
  }, [siteId]);

  const shiftDay = (n) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + n);
    setCurrentDate(isoDate(d));
  };

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date_from: currentDate, date_to: currentDate });
      if (group && group !== 'All') params.set('group', group);
      if (siteId && siteId !== 'all') params.set('site_id', siteId);
      if (signedOnly) params.set('signed_in_only', 'true');
      if (search) params.set('search', search);
      const res = await api.get(`/attendance/timesheets?${params}`);
      setRows(res.data.rows || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate, group, siteId, signedOnly, search]);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const hourCols = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  const getHourEntry = (row, hour) => {
    const entry = row.days?.[currentDate];
    if (!entry?.sign_in) return null;
    const [h] = entry.sign_in.split(':');
    if (h === hour) return entry;
    return null;
  };

  return (
    <div className="h-full flex flex-col overflow-auto bg-slate-50">
      <div className="max-w-[1400px] mx-auto w-full px-8 py-8 flex flex-col gap-6">

        <h1 className="text-2xl font-bold text-slate-800">Attendance reports</h1>

        {/* Tab — green underline only here */}
        <div className="flex border-b border-slate-200">
          <button className="flex items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-semibold border-b-2 border-[#76c043] text-slate-900">
            <Clock size={15} className="opacity-70" /> Timesheets
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3 flex items-center gap-3 flex-wrap border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm w-48 bg-white focus:outline-none focus:border-[#2b4594]" />
            </div>

            {/* Day nav */}
            <div className="flex items-center gap-0 border border-slate-300 rounded-md bg-white text-sm text-slate-700">
              <button onClick={() => shiftDay(-1)}
                className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-l-md transition-colors font-bold text-base">
                ‹
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold border-x border-slate-300 min-w-[100px] text-center">
                {fmtDateShort(currentDate)}
              </span>
              <button onClick={() => shiftDay(1)}
                className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-r-md transition-colors font-bold text-base">
                ›
              </button>
            </div>

            {/* Filters toggle — blue when active */}
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-sm transition-colors ${
                showFilters
                  ? 'border-[#2b4594] bg-blue-50 text-[#2b4594] font-semibold'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}>
              <Filter size={14} /> Filters
            </button>

            <div className="flex-1" />

            {/* Export button — neutral border style */}
            <button onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50">
              <Download size={14} /> Export
            </button>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="px-5 py-3 flex items-center gap-5 border-b border-slate-100 bg-white flex-wrap">
              {/* Site picker */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Site</label>
                <div className="relative" ref={siteRef}>
                  <button onClick={() => setSiteOpen(v => !v)}
                    className="flex items-center gap-1.5 border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 hover:bg-slate-50 min-w-[130px] justify-between">
                    {siteName}
                    <ChevronDown size={13} className="text-slate-400" />
                  </button>
                  {siteOpen && (
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-xl min-w-[180px] overflow-hidden">
                      <button onClick={() => { setSiteId('all'); setSiteName('All sites'); setSiteOpen(false); }}
                        className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${siteId === 'all' ? 'text-[#2b4594] font-semibold' : 'text-slate-700'}`}>
                        All sites
                      </button>
                      {sites.map(s => (
                        <button key={s.id} onClick={() => { setSiteId(s.id); setSiteName(s.name); setSiteOpen(false); }}
                          className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${siteId === s.id ? 'text-[#2b4594] font-semibold' : 'text-slate-700'}`}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Group picker */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Group</label>
                <select value={group} onChange={e => setGroup(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#2b4594] min-w-[120px]">
                  <option value="All">All</option>
                  {groups.length > 0
                    ? groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)
                    : ['Employees','Visitors','Contractors'].map(g => <option key={g}>{g}</option>)
                  }
                </select>
              </div>

              {/* Signed in only — blue checkbox */}
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={signedOnly} onChange={e => setSignedOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#2b4594] rounded" />
                Signed in only
              </label>
            </div>
          )}

          {/* Timesheet grid — hour columns */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
            ) : (
              <table className="text-left text-sm border-collapse" style={{ minWidth: '1200px' }}>
                <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs font-semibold">
                  <tr>
                    <th className="px-5 py-3 min-w-[180px] sticky left-0 bg-white z-10">Name</th>
                    {hourCols.map(h => (
                      <th key={h} className="px-1 py-3 text-center w-[38px] font-medium text-slate-400">{h}</th>
                    ))}
                    <th className="px-4 py-3 text-right min-w-[70px] sticky right-0 bg-white">Worked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.member_id || row.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 sticky left-0 bg-white z-10 border-r border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                            {row.initials}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{row.name}</span>
                        </div>
                      </td>
                      {hourCols.map(h => {
                        const entry = getHourEntry(row, h);
                        return (
                          <td key={h} className="px-0.5 py-2 text-center">
                            {entry ? (
                              // Green fill for the actual attendance bar — this is data visualization, green is correct
                              <div className="w-full h-5 rounded bg-[#2b4594]/20 border border-[#2b4594]/40 mx-auto" title={`Signed in ${entry.sign_in}`} />
                            ) : null}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right text-slate-600 text-xs font-semibold sticky right-0 bg-white border-l border-slate-100">
                        {row.total_hours > 0 ? `${row.total_hours}h` : '0m'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && rows.length === 0 && (
              <div className="py-14 flex flex-col items-center gap-3 text-slate-400">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p className="text-base font-semibold text-slate-600">No results found</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {showExport && (
        <ExportModal
          dateFrom={currentDate}
          dateTo={currentDate}
          group={group}
          siteId={siteId}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default AttendancePage;
