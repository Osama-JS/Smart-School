import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    CheckSquare, Clock, UserX, UserCheck, AlertTriangle,
    Calendar, Search, Filter, MapPin, Building2, Edit2,
    X, Save, Users, TimerOff, ChevronDown, ChevronLeft, ChevronRight, Download, Printer, ArrowUp, ArrowDown, ArrowUpDown, PartyPopper
} from 'lucide-react';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import Swal from 'sweetalert2';

// ── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        present: { 
            label: 'حاضر',   
            bg: 'bg-[#f0f7eb] dark:bg-primary-950/20',   
            text: 'text-primary-700 dark:text-primary-400',   
            border: 'border-[#dcefd1] dark:border-primary-900/30',
            dot: 'bg-primary-500' 
        },
        late:    { 
            label: 'متأخر',  
            bg: 'bg-warning-50 dark:bg-warning-950/20',   
            text: 'text-warning-700 dark:text-warning-400',   
            border: 'border-warning-100 dark:border-warning-900/20',
            dot: 'bg-warning-500'  
        },
        absent:  { 
            label: 'غائب',   
            bg: 'bg-accent-50 dark:bg-accent-950/20',    
            text: 'text-accent-700 dark:text-accent-400',    
            border: 'border-accent-100 dark:border-accent-900/20',
            dot: 'bg-accent-500'   
        },
        excused: { 
            label: 'بعذر',   
            bg: 'bg-slate-50 dark:bg-slate-900/40',      
            text: 'text-slate-650 dark:text-slate-350',      
            border: 'border-slate-200 dark:border-slate-800',
            dot: 'bg-slate-400 dark:bg-slate-500'   
        },
        weekend: {
            label: 'غير مداوم',
            bg: 'bg-blue-50 dark:bg-blue-950/20',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-100 dark:border-blue-900/20',
            dot: 'bg-blue-400'
        },
        holiday: {
            label: 'إجازة رسمية',
            bg: 'bg-purple-50 dark:bg-purple-950/20',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-100 dark:border-purple-900/20',
            dot: 'bg-purple-400'
        },
        leave: {
            label: 'إجازة',
            bg: 'bg-indigo-50 dark:bg-indigo-950/20',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-100 dark:border-indigo-900/20',
            dot: 'bg-indigo-400'
        },
    };
    const s = map[status] || map.absent;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${s.bg} ${s.text} border ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg, idx }) => {
    let glowBg = 'bg-slate-500/5';
    if (color.includes('primary')) glowBg = 'bg-primary-500/5';
    else if (color.includes('emerald')) glowBg = 'bg-emerald-500/5';
    else if (color.includes('accent')) glowBg = 'bg-accent-500/5';
    else if (color.includes('dark')) glowBg = 'bg-dark-500/5';

    return (
        <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
            <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${
                idx === 0 ? 'from-primary-400 to-primary-600' :
                idx === 1 ? 'from-dark-400 to-dark-600' :
                idx === 2 ? 'from-accent-400 to-accent-600' :
                'from-emerald-400 to-emerald-600'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className={`absolute -left-6 -top-6 w-24 h-24 ${glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
            
            <div className="relative z-10 min-w-0">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{label}</p>
                <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">{value ?? 0}</h3>
            </div>
            <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${bg} ${color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
        </div>
    );
};

// ── Edit Modal ────────────────────────────────────────────────
const EditModal = ({ record, onClose }) => {
    const shiftStart = record.shift?.start_time ? record.shift.start_time.slice(0,5) : '';
    const shiftEnd = record.shift?.end_time ? record.shift.end_time.slice(0,5) : '';

    const [form, setForm] = useState({
        check_in:    record.check_in    ? record.check_in.slice(0,5)  : shiftStart,
        check_out:   record.check_out   ? record.check_out.slice(0,5) : shiftEnd,
    });
    const [saving, setSaving] = useState(false);

    const computeLateMinutes = (checkIn, start) => {
        if (!checkIn || !start) return 0;
        const [cH, cM] = checkIn.split(':').map(Number);
        const [sH, sM] = start.split(':').map(Number);
        const late = (cH * 60 + cM) - (sH * 60 + sM);
        return late > 0 ? late : 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let calculatedStatus = 'absent';
        let calculatedLateMinutes = 0;

        if (form.check_in) {
            const lateMins = computeLateMinutes(form.check_in, shiftStart);
            if (lateMins > 0) {
                calculatedStatus = 'late';
                calculatedLateMinutes = lateMins;
            } else {
                calculatedStatus = 'present';
            }
        }

        const payload = {
            ...form,
            status: calculatedStatus,
            late_minutes: calculatedLateMinutes
        };

        setSaving(true);
        router.put(route('hr.attendance.update', record.id), payload, {
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () =>   setSaving(false),
        });
    };

    const formattedDate = new Date(record.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#121820] rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800/80">
                    <h3 className="font-bold text-dark-900 dark:text-white text-lg">تفاصيل الحضور والانصراف</h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-400 transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                            {record.employee?.user?.name?.[0] ?? '؟'}
                        </div>
                        <div>
                            <p className="font-black text-dark-900 dark:text-white text-base">{record.employee?.user?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formattedDate}</p>
                            {record.shift && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[11px] text-primary-700 dark:text-primary-300 font-bold bg-primary-100/50 dark:bg-primary-900/30 px-2 py-1 rounded-lg">
                                        شفت: {record.shift.name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                        {shiftStart} - {shiftEnd}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">وقت تسجيل الدخول</label>
                            <FlatpickrInput type="time" value={form.check_in} onChange={time => setForm({...form, check_in: time})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">وقت الانصراف</label>
                            <FlatpickrInput type="time" value={form.check_out} onChange={time => setForm({...form, check_out: time})} />
                        </div>
                    </div>

                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-3 text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        سيتم احتساب حالة الدوام (حاضر، متأخر) تلقائياً بناءً على وقت الدخول.
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="submit" disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl text-sm font-bold disabled:opacity-60 transition-all shadow-md shadow-primary-500/20 hover:shadow-lg">
                            <Save size={16} />
                            <span>{saving ? 'جاري الحفظ...' : 'حفظ التوقيت'}</span>
                        </button>
                        <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold transition-colors">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Sparkline Widget ──────────────────────────────────────────
const SparklineWidget = ({ data = [], dataKey, title, strokeColor, fillColor, glowColor, icon: Icon, statsValue }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const getArabicDayName = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return '';
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[d.getDay()];
    };

    const width = 240;
    const height = 55;
    const pointsCount = data.length || 7;
    const maxVal = Math.max(...data.map(d => d[dataKey] || 0), 4);

    const points = data.map((d, i) => {
        const val = d[dataKey] || 0;
        const x = i * (width / (pointsCount - 1 || 1));
        const y = height - (val / maxVal) * (height - 12) - 6;
        return { x, y, value: val, date: d.date };
    });

    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const fillPath = points.length > 0 ? `${linePath} L ${width} ${height} L 0 ${height} Z` : '';

    return (
        <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/10 dark:to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 group-hover:scale-105 transition-transform">
                        <Icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{title}</span>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono">
                    اليوم: {statsValue ?? 0}
                </span>
            </div>

            <div className="relative flex justify-center py-2 h-[60px]" dir="ltr">
                <svg width={width} height={height} className="overflow-visible">
                    <defs>
                        <linearGradient id={`grad-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                        </linearGradient>
                        <filter id={`shadow-${dataKey}`}>
                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={strokeColor} floodOpacity={0.3} />
                        </filter>
                    </defs>

                    {fillPath && <path d={fillPath} fill={`url(#grad-${dataKey})`} />}

                    {linePath && (
                        <path
                            d={linePath}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: `url(#shadow-${dataKey})` }}
                        />
                    )}

                    {hoveredIdx !== null && points[hoveredIdx] && (
                        <line
                            x1={points[hoveredIdx].x}
                            y1={0}
                            x2={points[hoveredIdx].x}
                            y2={height}
                            stroke={strokeColor}
                            strokeWidth="1"
                            strokeDasharray="3,3"
                            opacity="0.5"
                        />
                    )}

                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={hoveredIdx === i ? 5 : 2.5}
                            fill={hoveredIdx === i ? 'white' : strokeColor}
                            stroke={hoveredIdx === i ? strokeColor : 'transparent'}
                            strokeWidth={hoveredIdx === i ? 2 : 0}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        />
                    ))}
                </svg>

                {hoveredIdx !== null && points[hoveredIdx] && (
                    <div 
                        className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-slate-900/90 dark:bg-slate-800/90 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md pointer-events-none flex items-center gap-1.5 backdrop-blur-sm transition-all"
                        dir="rtl"
                    >
                        <span>{getArabicDayName(points[hoveredIdx].date)}:</span>
                        <span className="font-mono">{points[hoveredIdx].value}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 px-1">
                <span>{data.length > 0 ? getArabicDayName(data[0].date) : ''}</span>
                <span>{data.length > 0 ? getArabicDayName(data[data.length - 1].date) : ''}</span>
            </div>
        </div>
    );
};

// ── Attendance Analytics Widget ────────────────────────────────
const AttendanceAnalyticsWidget = ({ stats, weeklyTrend = [] }) => {
    const total = (stats?.present || 0) + (stats?.late || 0) + (stats?.absent || 0) + (stats?.excused || 0);
    const attended = (stats?.present || 0) + (stats?.late || 0);
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

    const radius = 35;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 no-print">
            {/* Circular Gauge Card */}
            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-5 relative overflow-hidden group">
                <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                <div className="relative z-10 space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500">معدل حضور اليوم</p>
                    <h4 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono">{attendanceRate}%</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                        تم حضور <span className="font-bold font-mono text-primary-600 dark:text-primary-400">{attended}</span> من أصل <span className="font-bold font-mono">{total}</span>
                    </p>
                </div>
                <div className="relative flex items-center justify-center shrink-0" dir="ltr">
                    <svg className="w-20 h-20 transform -rotate-90 overflow-visible">
                        <defs>
                            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#5b8a2d" />
                                <stop offset="100%" stopColor="#84cc16" />
                            </linearGradient>
                            <filter id="gaugeShadow">
                                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#84cc16" floodOpacity="0.4" />
                            </filter>
                        </defs>
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="stroke-slate-100 dark:stroke-slate-800"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="url(#gaugeGrad)"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{
                                transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: 'url(#gaugeShadow)'
                            }}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <UserCheck size={16} className="text-primary-500 dark:text-primary-400" />
                    </div>
                </div>
            </div>

            {/* Lateness Sparkline Card */}
            <SparklineWidget
                data={weeklyTrend}
                dataKey="late"
                title="تأخير الموظفين هذا الأسبوع"
                strokeColor="#475569"
                icon={Clock}
                statsValue={stats?.late}
            />

            {/* Absence Sparkline Card */}
            <SparklineWidget
                data={weeklyTrend}
                dataKey="absent"
                title="غياب الموظفين هذا الأسبوع"
                strokeColor="#e11d48"
                icon={UserX}
                statsValue={stats?.absent}
            />
        </div>
    );
};

// ── Bulk Edit Modal ───────────────────────────────────────────
const BulkEditModal = ({ selectedCount, onClose, onSubmit }) => {
    const [form, setForm] = useState({
        check_in:    '08:00',
        check_out:   '14:00',
        status:      'present',
        late_minutes: 0,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        onSubmit(form, setSaving);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#121820] rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800/80">
                    <h3 className="font-bold text-dark-900 dark:text-white text-lg">تعديل حضور جماعي</h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-400 transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-primary-50 dark:bg-primary-950/20 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                            {selectedCount}
                        </div>
                        <div>
                            <p className="font-bold text-dark-900 dark:text-white text-xs">تعديل حضور جماعي للموظفين</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">عدد الموظفين المحددين: {selectedCount} موظف</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-650 dark:text-slate-400 mb-1">وقت الدخول</label>
                            <FlatpickrInput type="time" value={form.check_in} onChange={time => setForm({...form, check_in: time})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-650 dark:text-slate-400 mb-1">وقت الخروج</label>
                            <FlatpickrInput type="time" value={form.check_out} onChange={time => setForm({...form, check_out: time})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-650 dark:text-slate-400 mb-1">الحالة</label>
                        <SelectInput value={form.status} onChange={val => setForm({...form, status: val})}
                            options={[
                                { value: 'present', label: 'حاضر' },
                                { value: 'late', label: 'متأخر' },
                                { value: 'absent', label: 'غائب' },
                                { value: 'excused', label: 'غياب بعذر' }
                            ]}
                        />
                    </div>

                    {(form.status === 'late') && (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-650 dark:text-slate-400 mb-1">دقائق التأخير</label>
                            <input type="number" min="0" value={form.late_minutes}
                                onChange={e => setForm({...form, late_minutes: +e.target.value})}
                                className="w-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all" />
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={saving}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-xs font-bold disabled:opacity-60 transition-all shadow-sm">
                            <Save size={14} />
                            <span>{saving ? 'جاري الحفظ...' : 'تطبيق الإجراء'}</span>
                        </button>
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-305 rounded-xl text-xs font-bold transition-colors">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Register Leave Modal ──────────────────────────────────────
const RegisterLeaveModal = ({ record, leaveTypes, leaveBalances, academicYears, onClose }) => {
    const defaultAcademicYear = academicYears.find(ay => ay.is_active) || academicYears[0];
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_id: record.employee_id,
        academic_year_id: record.academic_year_id || (defaultAcademicYear ? defaultAcademicYear.id : ''),
        semester_id: record.semester_id || '',
        leave_type_id: '',
        start_date: record.date,
        end_date: record.date,
        status: 'approved',
        reason: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('hr.leaves.store'), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#121820] rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800/80 shrink-0">
                    <div>
                        <h3 className="font-black text-dark-900 dark:text-white text-lg">تسجيل إجازة للموظف</h3>
                        <p className="text-slate-500 text-sm mt-1 font-bold">الموظف: <span className="text-primary-600 dark:text-primary-400">{record.employee?.user?.name || 'غير معروف'}</span></p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-400 transition-colors">✕</button>
                </div>
                <div className="overflow-y-auto p-6">
                    <form id="register-leave-form" onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-400 mb-1">نوع الإجازة <span className="text-accent-500">*</span></label>
                            <SelectInput
                                value={data.leave_type_id}
                                onChange={val => setData('leave_type_id', val)}
                                options={leaveTypes.map(lt => {
                                    const balance = leaveBalances.find(lb => lb.employee_id === record.employee_id && lb.leave_type_id === lt.id);
                                    const remaining = balance ? Math.max(0, balance.total_days - (balance.used_days || 0)) : 0;
                                    return { value: lt.id, label: `${lt.name} (الرصيد المتبقي: ${remaining} يوم)` };
                                })}
                                placeholder="اختر نوع الإجازة"
                            />
                            {errors.leave_type_id && <p className="text-accent-500 text-xs mt-1">{errors.leave_type_id}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-400 mb-1">من تاريخ <span className="text-accent-500">*</span></label>
                                <FlatpickrInput type="date" value={data.start_date} onChange={date => setData('start_date', date)} />
                                {errors.start_date && <p className="text-accent-500 text-xs mt-1">{errors.start_date}</p>}
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-400 mb-1">إلى تاريخ <span className="text-accent-500">*</span></label>
                                <FlatpickrInput type="date" value={data.end_date} onChange={date => setData('end_date', date)} />
                                {errors.end_date && <p className="text-accent-500 text-xs mt-1">{errors.end_date}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-400 mb-1">السبب (اختياري)</label>
                            <textarea
                                value={data.reason}
                                onChange={e => setData('reason', e.target.value)}
                                rows={2}
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121820]/60 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white"
                                placeholder="اكتب سبب الإجازة هنا..."
                            ></textarea>
                            {errors.reason && <p className="text-accent-500 text-xs mt-1">{errors.reason}</p>}
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-slate-50 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex gap-3">
                        <button type="submit" form="register-leave-form" disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-all shadow-sm">
                            <Save size={16} />
                            <span>{processing ? 'جاري الحفظ...' : 'حفظ الإجازة واعتمادها'}</span>
                        </button>
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-xl text-sm font-bold transition-all">
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────
export default function AttendanceIndex({ records, stats, weeklyTrend = [], branches, shifts, departments = [], academicYears = [], filters, today, startDate, endDate, isSystemAdmin, activeHolidays = [], leaveTypes = [], leaveBalances = [] }) {
    const { flash } = usePage().props;
    const [editRecord, setEditRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [leaveRecord, setLeaveRecord] = useState(null);

    const handleBulkSubmit = (form, setSaving) => {
        router.post(route('hr.attendance.bulk-update'), {
            ids: selectedIds,
            ...form
        }, {
            onSuccess: () => {
                setSaving(false);
                setShowBulkModal(false);
                setSelectedIds([]);
            },
            onError: () => {
                setSaving(false);
            }
        });
    };

    const [search, setSearch]         = useState(filters.search ?? '');
    const [customStartDate, setCustomStartDate] = useState(filters.start_date ?? startDate);
    const [customEndDate, setCustomEndDate] = useState(filters.end_date ?? endDate);
    
    const getFormattedDateRange = () => {
        const formatSingle = (dateStr) => {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length !== 3) return dateStr;
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        };
        if (customStartDate === customEndDate) {
            return formatSingle(customStartDate);
        }
        return `من ${formatSingle(customStartDate)} إلى ${formatSingle(customEndDate)}`;
    };

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [expandedRows, setExpandedRows] = useState([]);
    const [activeStatusSwitcherId, setActiveStatusSwitcherId] = useState(null);
    const [branchId, setBranchId]     = useState(filters.branch_id ?? '');
    const [shiftId, setShiftId]       = useState(filters.shift_id  ?? '');
    const [departmentId, setDepartmentId] = useState(filters.department_id ?? '');
    const [academicYearId, setAcademicYearId] = useState(filters.academic_year_id ?? '');
    const [semesterId, setSemesterId] = useState(filters.semester_id ?? '');
    const [status, setStatus]         = useState(filters.status ?? '');
    
    // Advanced features states
    const [showFilter, setShowFilter] = useState(false);
    const [sortBy, setSortBy] = useState(filters.sort_by ?? 'created_at');
    const [sortDir, setSortDir] = useState(filters.sort_dir ?? 'desc');

    const [visibleColumns, setVisibleColumns] = useState({
        branch: true,
        shift: true,
        check_in: true,
        check_out: true,
        status: true,
        delay: true,
        location: true,
    });
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const columnToggleRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (columnToggleRef.current && !columnToggleRef.current.contains(e.target)) {
                setShowColumnToggle(false);
            }
            if (!e.target.closest('.status-switcher-btn') && !e.target.closest('.status-switcher-popover')) {
                setActiveStatusSwitcherId(null);
            }
            if (!e.target.closest('.date-picker-btn') && !e.target.closest('.date-picker-popover') && !e.target.closest('.flatpickr-calendar')) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchTimeout = useRef(null);

    const applyFilter = (overrides = {}) => {
        router.get(route('hr.attendance'), { 
            start_date: customStartDate,
            end_date: customEndDate,
            branch_id: branchId,
            shift_id: shiftId, 
            department_id: departmentId,
            academic_year_id: academicYearId,
            semester_id: semesterId,
            status,
            search,
            sort_by: sortBy,
            sort_dir: sortDir,
            ...overrides
        }, {
            preserveState: true, preserveScroll: true,
        });
    };

    const applyDatePreset = (startVal, endVal) => {
        setCustomStartDate(startVal);
        setCustomEndDate(endVal);
        setShowDatePicker(false);
        applyFilter({ start_date: startVal, end_date: endVal });
    };

    const getPresetDates = () => {
        const todayObj = new Date(today);
        
        const formatDate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const todayStr = formatDate(todayObj);

        const yesterdayObj = new Date(todayObj);
        yesterdayObj.setDate(todayObj.getDate() - 1);
        const yesterdayStr = formatDate(yesterdayObj);

        const last7DaysObj = new Date(todayObj);
        last7DaysObj.setDate(todayObj.getDate() - 6);
        const last7DaysStr = formatDate(last7DaysObj);

        const firstOfThisMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
        const thisMonthStr = formatDate(firstOfThisMonth);

        const firstOfLastMonth = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 0);
        const lastMonthStart = formatDate(firstOfLastMonth);
        const lastMonthEnd = formatDate(lastOfLastMonth);

        return {
            today: { start: todayStr, end: todayStr },
            yesterday: { start: yesterdayStr, end: yesterdayStr },
            last7: { start: last7DaysStr, end: todayStr },
            thisMonth: { start: thisMonthStr, end: todayStr },
            lastMonth: { start: lastMonthStart, end: lastMonthEnd }
        };
    };

    const isRangeFiltered = customStartDate !== customEndDate;

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            applyFilter({ search: val });
        }, 400);
    };

    const confirmAbsence = (rec) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'تأكيد تسجيل الغياب',
            html: `هل أنت متأكد من تسجيل الموظف <b class="text-primary-600 dark:text-primary-400">${rec.employee?.user?.name}</b> كغائب لهذا اليوم؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، سجل غياب',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: isDarkMode ? '#334155' : '#94a3b8',
            background: isDarkMode ? '#1e293b' : '#fff',
            color: isDarkMode ? '#f8fafc' : '#0f172a',
            customClass: {
                popup: 'rounded-3xl border border-slate-100 dark:border-slate-800',
                confirmButton: 'rounded-xl font-bold px-6',
                cancelButton: 'rounded-xl font-bold px-6'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('hr.attendance.update', rec.id), {
                    status: 'absent',
                    check_in: '',
                    check_out: '',
                    late_minutes: 0,
                }, { preserveScroll: true });
            }
        });
    };

    const handleInlineStatusChange = (record, newStatus) => {
        router.put(route('hr.attendance.update', record.id), {
            check_in: record.check_in ? record.check_in.slice(0,5) : '',
            check_out: record.check_out ? record.check_out.slice(0,5) : '',
            status: newStatus,
            late_minutes: newStatus === 'late' ? (record.late_minutes || 15) : 0,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setActiveStatusSwitcherId(null);
            }
        });
    };

    const handleSort = (field) => {
        const nextDir = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortDir(nextDir);
        applyFilter({ sort_by: field, sort_dir: nextDir });
    };

    const exportToCSV = () => {
        const recordsToExport = records?.data ?? [];
        if (recordsToExport.length === 0) return;

        const headers = [
            "الموظف", 
            ...(isRangeFiltered ? ["التاريخ"] : []),
            "القسم", 
            "الفرع", 
            "الشفت", 
            "وقت الدخول", 
            "وقت الخروج", 
            "الحالة", 
            "التأخير"
        ];
        const rows = recordsToExport.map(r => [
            r.employee?.name || "",
            ...(isRangeFiltered ? [r.date || ""] : []),
            r.employee?.department?.name || "",
            r.branch?.name || "",
            r.shift?.name || "",
            r.check_in || "",
            r.check_out || "",
            r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : r.status === 'absent' ? 'غائب' : 'بعذر',
            r.late_minutes || 0
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows]
            .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_report_${customStartDate}_to_${customEndDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const activeFiltersCount = (branchId ? 1 : 0) + (shiftId ? 1 : 0) + (departmentId ? 1 : 0) + (status ? 1 : 0) + (academicYearId ? 1 : 0) + (semesterId ? 1 : 0);

    const renderSortHeader = (label, field) => {
        const isSorted = sortBy === field;
        return (
            <th onClick={() => handleSort(field)} className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider cursor-pointer hover:bg-primary-100/35 dark:hover:bg-primary-950/40 select-none transition-colors no-print">
                <div className="flex items-center gap-1.5 justify-start">
                    <span>{label}</span>
                    {isSorted ? (
                        sortDir === 'asc' ? <ArrowUp size={12} className="text-primary-500" /> : <ArrowDown size={12} className="text-primary-500" />
                    ) : (
                        <ArrowUpDown size={12} className="text-slate-400 dark:text-slate-500 opacity-65" />
                    )}
                </div>
            </th>
        );
    };

    return (
        <AdminLayout activeMenu="سجل الحضور">
            <Head title="سجل الحضور والانصراف | النظام الإداري" />

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    aside, nav, header, .no-print, button, a, [type="checkbox"], select, input, .print\\:hidden {
                        display: none !important;
                    }
                    main, .print\\:w-full {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    .print\\:block { display: block !important; }
                }
            `}} />

            {/* Print Only Header Banner */}
            <div className="hidden print:block mb-8 text-right font-sans" dir="rtl">
                <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-black text-dark-900">مدارس القيم الأهلية</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">كشف الدوام اليومي - الحضور والانصراف</p>
                    </div>
                    <div className="text-left font-semibold">
                        <p className="text-xs text-slate-500">تاريخ الكشف: {getFormattedDateRange()}</p>
                        <p className="text-xs text-slate-500 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Page Header - Branded */}
                <div className="relative bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none no-print">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-3xl">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">سجل الحضور والانصراف اليومي</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 text-sm mt-2 font-semibold">متابعة حضور الموظفين وتفاصيل الدوام المدرسي اليومي</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => {
                                        const d = new Date(customStartDate);
                                        d.setDate(d.getDate() - 1);
                                        const dateStr = d.toISOString().split('T')[0];
                                        applyDatePreset(dateStr, dateStr);
                                    }}
                                    className="p-2.5 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 hover:border-primary-400 rounded-2xl shadow-sm text-slate-500 hover:text-primary-600 transition-colors"
                                    title="اليوم السابق"
                                >
                                    <ChevronRight size={18} />
                                </button>

                                <div className="relative date-picker-popover">
                                    <button onClick={() => setShowDatePicker(!showDatePicker)}
                                        className="flex items-center gap-2 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 hover:border-primary-400 rounded-2xl px-4 py-2.5 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors date-picker-btn">
                                        <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                                        <span>
                                            {customStartDate === customEndDate 
                                                ? new Date(customStartDate).toLocaleDateString('ar-EG', {month: 'long', day: 'numeric'})
                                                : `${new Date(customStartDate).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'})} - ${new Date(customEndDate).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'})}`
                                            }
                                        </span>
                                        <ChevronDown size={14} className="text-slate-400" />
                                    </button>

                                    {showDatePicker && (
                                    <div className="fixed z-[200] mt-2 w-72 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 flex flex-col gap-3 animate-scale-in date-picker-popover"
                                        style={{
                                            top: (() => { const btn = document.querySelector('.date-picker-btn'); if (!btn) return 80; const r = btn.getBoundingClientRect(); return r.bottom + 8; })(),
                                            left: (() => { const btn = document.querySelector('.date-picker-btn'); if (!btn) return 'auto'; const r = btn.getBoundingClientRect(); return Math.max(8, r.left); })(),
                                        }}
                                    >
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400">اختر اليوم:</span>
                                        
                                        {/* Quick shortcuts */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => { const p = getPresetDates(); applyDatePreset(p.today.start, p.today.end); }}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                                                    customStartDate === today
                                                        ? 'bg-primary-500 text-white shadow-sm'
                                                        : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-700 dark:text-slate-200 hover:text-primary-600'
                                                }`}>
                                                اليوم
                                            </button>
                                            <button onClick={() => { const p = getPresetDates(); applyDatePreset(p.yesterday.start, p.yesterday.end); }}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                                                    customStartDate === (() => { const d = new Date(today); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })()
                                                        ? 'bg-primary-500 text-white shadow-sm'
                                                        : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-700 dark:text-slate-200 hover:text-primary-600'
                                                }`}>
                                                أمس
                                            </button>
                                        </div>

                                        {/* Single date input */}
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">أو اختر تاريخاً محدداً:</span>
                                            <FlatpickrInput
                                                type="date"
                                                value={customStartDate}
                                                onChange={date => {
                                                    if (date) {
                                                        setCustomStartDate(date);
                                                        setCustomEndDate(date);
                                                    }
                                                }}
                                            />
                                            <button onClick={() => { setShowDatePicker(false); applyFilter({ start_date: customStartDate, end_date: customStartDate }); }}
                                                className="w-full mt-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl py-2 text-xs font-bold hover:shadow-md transition-all">
                                                تطبيق وعرض السجلات
                                            </button>
                                        </div>
                                    </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => {
                                        const d = new Date(customStartDate);
                                        d.setDate(d.getDate() + 1);
                                        const dateStr = d.toISOString().split('T')[0];
                                        applyDatePreset(dateStr, dateStr);
                                    }}
                                    className="p-2.5 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 hover:border-primary-400 rounded-2xl shadow-sm text-slate-500 hover:text-primary-600 transition-colors"
                                    title="اليوم التالي"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            </div>

                            <button onClick={exportToCSV}
                                className="flex items-center justify-center p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121820] text-slate-550 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300 shadow-sm transition-all"
                                title="تصدير كملف Excel (CSV)">
                                <Download size={18} />
                            </button>

                            <button onClick={() => window.print()}
                                className="flex items-center justify-center p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121820] text-slate-550 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300 shadow-sm transition-all"
                                title="طباعة أو تصدير PDF">
                                <Printer size={18} />
                            </button>

                            <div className="relative" ref={columnToggleRef}>
                                <button onClick={() => setShowColumnToggle(!showColumnToggle)}
                                    className={`flex items-center justify-center p-2.5 rounded-2xl border transition-all shadow-sm ${
                                        showColumnToggle
                                            ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30 text-primary-700 dark:text-primary-400'
                                            : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300'
                                    }`} title="تخصيص الأعمدة">
                                    <Filter size={18} />
                                </button>
                                {showColumnToggle && (
                                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">الأعمدة الظاهرة:</span>
                                        {Object.keys(visibleColumns).map(col => (
                                            <label key={col} className="flex items-center gap-2.5 px-2 py-1 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg">
                                                <input type="checkbox" checked={visibleColumns[col]}
                                                    onChange={() => setVisibleColumns({...visibleColumns, [col]: !visibleColumns[col]})}
                                                    className="rounded text-primary-500 focus:ring-primary-500/10" />
                                                <span>
                                                    {col === 'branch' ? 'الفرع' : 
                                                     col === 'shift' ? 'الشفت' : 
                                                     col === 'check_in' ? 'وقت الدخول' : 
                                                     col === 'check_out' ? 'وقت الخروج' : 
                                                     col === 'status' ? 'الحالة' : 
                                                     col === 'delay' ? 'التأخير' : 'الموقع'}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Holidays Banner */}
                {activeHolidays && activeHolidays.length > 0 && (
                    <div className="flex flex-col gap-2 mb-6 no-print">
                        {activeHolidays.map((holiday, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-4 rounded-2xl text-sm shadow-md animate-slide-down">
                                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
                                    <PartyPopper size={20} className="text-white drop-shadow-md" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-lg drop-shadow-sm">إجازة رسمية: {holiday.name}</span>
                                    {holiday.notes && <span className="text-purple-100 text-xs mt-0.5 font-semibold">{holiday.notes}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Visual Analytics Widget */}
                <AttendanceAnalyticsWidget stats={stats} weeklyTrend={weeklyTrend} />

                {/* Flash Success */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 text-primary-700 px-5 py-4 rounded-2xl text-sm font-bold shadow-sm animate-slide-down no-print">
                        <div className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center shrink-0">
                            <CheckSquare size={14} />
                        </div>
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Quick Presets Bar */}
                <div className="flex flex-wrap items-center gap-2 no-print">
                    <button onClick={() => { setStatus(''); applyFilter({ status: '' }); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            status === '' 
                            ? 'bg-dark-900 text-white border-dark-900 dark:bg-white dark:text-dark-900 shadow-md' 
                            : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}>
                        الكل
                    </button>
                    <button onClick={() => { setStatus('present'); applyFilter({ status: 'present' }); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            status === 'present' 
                            ? 'bg-primary-500 text-white border-primary-500 shadow-md' 
                            : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                        }`}>
                        الحاضرون
                    </button>
                    <button onClick={() => { setStatus('late'); applyFilter({ status: 'late' }); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            status === 'late' 
                            ? 'bg-warning-500 text-white border-warning-500 shadow-md' 
                            : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-warning-50 dark:hover:bg-warning-900/20'
                        }`}>
                        المتأخرون
                    </button>
                    <button onClick={() => { setStatus('absent'); applyFilter({ status: 'absent' }); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            status === 'absent' 
                            ? 'bg-accent-500 text-white border-accent-500 shadow-md' 
                            : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-accent-50 dark:hover:bg-accent-900/20'
                        }`}>
                        الغائبون
                    </button>
                    <button onClick={() => { setStatus('excused'); applyFilter({ status: 'excused' }); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            status === 'excused' 
                            ? 'bg-slate-600 text-white border-slate-600 shadow-md' 
                            : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}>
                        بعذر
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={UserCheck}   label="حاضرون"  value={stats?.present} color="text-primary-600 dark:text-primary-400" bg="bg-primary-50 dark:bg-primary-950/20" idx={0} />
                    <StatCard icon={AlertTriangle} label="متأخرون" value={stats?.late}    color="text-dark-700 dark:text-dark-300" bg="bg-dark-100 dark:bg-dark-900/40" idx={1} />
                    <StatCard icon={UserX}        label="غائبون"  value={stats?.absent}  color="text-accent-600 dark:text-accent-400"  bg="bg-accent-50 dark:bg-accent-950/20" idx={2} />
                    <StatCard icon={TimerOff}     label="بعذر"    value={stats?.excused} color="text-emerald-600 dark:text-emerald-400"   bg="bg-emerald-50 dark:bg-emerald-950/20" idx={3} />
                </div>

                {/* Records Table Card */}
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-md dark:shadow-none overflow-hidden">
                    {/* Integrated Search and Filter toggle */}
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/30 dark:from-transparent dark:to-transparent no-print">
                        <div className="relative max-w-sm w-full flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                            <div className="flex-1 relative flex items-center">
                                <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                                <input type="text" placeholder="بحث باسم الموظف أو الرقم الوظيفي..."
                                    className="w-full bg-transparent border-none pr-10 pl-3 py-2 text-sm outline-none text-dark-900 dark:text-slate-100 font-medium"
                                    value={search} 
                                    onChange={e => handleSearch(e.target.value)} 
                                    onKeyDown={e => { if (e.key === 'Enter') applyFilter({ search }); }}
                                />
                            </div>
                        </div>

                        <button onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-bold shadow-sm transition-all shrink-0 ${
                                showFilter 
                                    ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30 text-primary-700 dark:text-primary-400' 
                                    : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 text-dark-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300'
                            }`}>
                            <Filter size={16} className={showFilter ? 'text-primary-500 dark:text-primary-450' : 'text-slate-500 dark:text-slate-400'} /> 
                            <span>فلاتر متقدمة</span>
                            {activeFiltersCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Expandable Advanced Filters Panel */}
                    {showFilter && (
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/10 relative no-print">
                            <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                                {/* Department Filter */}
                                <div className="group/select flex flex-col">
                                    <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">القسم</label>
                                    <SelectInput value={departmentId} onChange={val => { setDepartmentId(val); applyFilter({ department_id: val }); }}
                                        options={[
                                            { value: '', label: 'كل الأقسام' },
                                            ...(departments?.map(d => ({ value: d.id, label: d.name })) || [])
                                        ]}
                                    />
                                </div>
                                {/* Branch Filter */}
                                {isSystemAdmin && (
                                <div className="group/select flex flex-col">
                                    <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الفرع</label>
                                    <SelectInput value={branchId} onChange={val => { setBranchId(val); applyFilter({ branch_id: val }); }}
                                        options={[
                                            { value: '', label: 'كل الفروع' },
                                            ...(branches?.map(b => ({ value: b.id, label: b.name })) || [])
                                        ]}
                                    />
                                </div>
                                )}
                                {/* Shift Filter */}
                                <div className="group/select flex flex-col">
                                    <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الشفت</label>
                                    <SelectInput value={shiftId} onChange={val => { setShiftId(val); applyFilter({ shift_id: val }); }}
                                        options={[
                                            { value: '', label: 'كل الشفتات' },
                                            ...(shifts?.map(s => ({ value: s.id, label: `${s.name} (${s.start_time?.slice(0,5)} - ${s.end_time?.slice(0,5)})` })) || [])
                                        ]}
                                    />
                                </div>
                                {/* Academic Year Filter */}
                                <div className="group/select flex flex-col">
                                    <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">السنة الدراسية</label>
                                    <SelectInput value={academicYearId} onChange={val => { setAcademicYearId(val); setSemesterId(''); applyFilter({ academic_year_id: val, semester_id: '' }); }}
                                        options={[
                                            { value: '', label: 'كل السنوات' },
                                            ...(academicYears?.map(y => ({ value: y.id, label: y.name })) || [])
                                        ]}
                                    />
                                </div>
                                {/* Semester Filter */}
                                <div className="group/select flex flex-col">
                                    <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الفصل الدراسي</label>
                                    <SelectInput value={semesterId} onChange={val => { setSemesterId(val); applyFilter({ semester_id: val }); }}
                                        options={[
                                            { value: '', label: 'كل الفصول' },
                                            ...(academicYears?.find(y => y.id == academicYearId)?.semesters?.map(s => ({ value: s.id, label: s.name })) || [])
                                        ]}
                                        disabled={!academicYearId}
                                    />
                                </div>
                                
                                <div className="flex gap-2 justify-end items-end h-full mt-4 lg:mt-0 lg:col-span-2">
                                    <button onClick={() => {
                                        setSearch(''); setBranchId(''); setShiftId(''); setDepartmentId(''); setAcademicYearId(''); setSemesterId(''); setStatus('');
                                        applyFilter({ search: '', branch_id: '', shift_id: '', department_id: '', academic_year_id: '', semester_id: '', status: '' });
                                    }}
                                    className="flex items-center justify-center px-4 py-3 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-2xl text-xs font-bold transition-all shadow-sm">
                                        إعادة ضبط
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {records.data.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <CheckSquare size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700 opacity-80 animate-pulse" />
                            <p className="font-bold text-slate-500 text-sm">لا توجد سجلات حضور مطابقة لمعايير البحث</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">جرّب تغيير التاريخ أو معايير التصفية</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 dark:from-primary-950/40 dark:via-primary-900/20 dark:to-primary-950/40 border-b border-primary-200/60 dark:border-primary-900/30">
                                            <th className="px-4 py-4 text-center w-12 no-print">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-primary-500 focus:ring-primary-500/10 cursor-pointer"
                                                    checked={records.data.length > 0 && selectedIds.length === records.data.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedIds(records.data.map(r => r.id));
                                                        } else {
                                                            setSelectedIds([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            {renderSortHeader('الموظف', 'name')}
                                            {isRangeFiltered && renderSortHeader('التاريخ', 'date')}
                                            {visibleColumns.branch && renderSortHeader('الفرع', 'branch_id')}
                                            {visibleColumns.shift && renderSortHeader('الشفت', 'shift_id')}
                                            {visibleColumns.check_in && renderSortHeader('وقت الدخول', 'check_in')}
                                            {visibleColumns.check_out && renderSortHeader('وقت الخروج', 'check_out')}
                                            {visibleColumns.status && renderSortHeader('الحالة', 'status')}
                                            {visibleColumns.delay && renderSortHeader('التأخير', 'late_minutes')}
                                            {visibleColumns.location && <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider no-print">الموقع</th>}
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider text-center no-print">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                        {records.data.map(rec => (
                                            <React.Fragment key={rec.id}>
                                                <tr className={`group border-r-4 hover:border-r-primary-500 hover:bg-primary-50/20 dark:hover:bg-gradient-to-l dark:hover:from-primary-950/20 dark:hover:to-transparent transition-all duration-300 ${
                                                    selectedIds.includes(rec.id)
                                                        ? 'border-r-primary-500 bg-primary-50/10 dark:bg-primary-950/10'
                                                        : 'border-r-transparent'
                                                }`}>
                                                <td className="px-4 py-4 text-center w-12 no-print">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded text-primary-500 focus:ring-primary-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                        checked={selectedIds.includes(rec.id)}
                                                        disabled={['weekend', 'holiday', 'leave'].includes(rec.status)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedIds(prev => [...prev, rec.id]);
                                                            } else {
                                                                setSelectedIds(prev => prev.filter(id => id !== rec.id));
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            const isExpanded = expandedRows.includes(rec.id);
                                                            setExpandedRows(isExpanded ? expandedRows.filter(id => id !== rec.id) : [...expandedRows, rec.id]);
                                                        }} className="text-slate-400 hover:text-slate-600 transition-colors no-print">
                                                            <ChevronDown size={14} className={`transform transition-transform ${expandedRows.includes(rec.id) ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-850 dark:to-slate-950 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                                                            {rec.employee?.user?.profile_photo_url ? (
                                                                <img src={rec.employee.user.profile_photo_url.startsWith('http') ? rec.employee.user.profile_photo_url : asset_url + rec.employee.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span>{rec.employee?.user?.name?.[0] ?? '؟'}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-dark-900 dark:text-white text-[14px] leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{rec.employee?.user?.name}</p>
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{rec.employee?.department?.name ?? '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {isRangeFiltered && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                                                            {rec.date}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.branch && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                            <Building2 size={14} className="text-slate-400 dark:text-slate-500 shrink-0 no-print" />
                                                            <span>{rec.branch?.name ?? '—'}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.shift && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                            <Clock size={14} className="text-slate-400 dark:text-slate-500 shrink-0 no-print" />
                                                            <span>{rec.shift?.name ?? '—'}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.check_in && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                                                            {rec.check_in ? rec.check_in.slice(0,5) : <span className="text-slate-350 dark:text-slate-600 font-normal">--:--</span>}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.check_out && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                                                            {rec.check_out ? rec.check_out.slice(0,5) : <span className="text-slate-350 dark:text-slate-600 font-normal">--:--</span>}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="px-6 py-4 whitespace-nowrap relative">
                                                        {['weekend', 'holiday', 'leave'].includes(rec.status) ? (
                                                            <div className="no-print opacity-80 cursor-not-allowed inline-block">
                                                                <StatusBadge status={rec.status} />
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveStatusSwitcherId(activeStatusSwitcherId === rec.id ? null : rec.id);
                                                                }}
                                                                className="status-switcher-btn focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded-xl transition-all cursor-pointer hover:opacity-80 active:scale-95 no-print"
                                                            >
                                                                <StatusBadge status={rec.status} />
                                                            </button>
                                                        )}
                                                        <span className="hidden print:block">
                                                            <StatusBadge status={rec.status} />
                                                        </span>
                                                        
                                                        {activeStatusSwitcherId === rec.id && (
                                                            <div className="status-switcher-popover absolute z-40 mt-1 right-0 bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-2 min-w-[120px] flex flex-col gap-1 no-print animate-scale-in">
                                                                {[
                                                                    { val: 'present', label: 'حاضر', color: 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20' },
                                                                    { val: 'late', label: 'متأخر', color: 'text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-950/20' },
                                                                    { val: 'absent', label: 'غائب', color: 'text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-950/20' },
                                                                    { val: 'excused', label: 'بعذر', color: 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/60' }
                                                                ].map(opt => (
                                                                    <button
                                                                        key={opt.val}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleInlineStatusChange(rec, opt.val);
                                                                        }}
                                                                        className={`w-full text-right px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${opt.color} ${rec.status === opt.val ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.delay && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {rec.late_minutes > 0 ? (
                                                            <span className="text-xs font-bold text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/20 px-2 py-1 rounded-lg border border-warning-100 dark:border-warning-900/20 font-mono">{rec.late_minutes} د</span>
                                                        ) : (
                                                            <span className="text-slate-350 dark:text-slate-600 text-xs font-semibold">—</span>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.location && (
                                                    <td className="px-6 py-4 whitespace-nowrap no-print">
                                                        {rec.check_in_lat && rec.check_in_lng ? (
                                                            <a
                                                                href={`https://maps.google.com/?q=${rec.check_in_lat},${rec.check_in_lng}`}
                                                                target="_blank" rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline font-extrabold"
                                                            >
                                                                <MapPin size={13} /> 
                                                                <span>عرض</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-350 dark:text-slate-600 text-xs font-semibold">—</span>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-center no-print">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* زر تسجيل الحضور السريع — يعمل مع كل الحالات */}
                                                        {!['present', 'late'].includes(rec.status) && (
                                                            <button
                                                                title="تسجيل حاضر"
                                                                onClick={() => {
                                                                    router.put(route('hr.attendance.update', rec.id), {
                                                                        status: 'present',
                                                                        check_in: rec.check_in ? rec.check_in.slice(0,5) : (rec.shift?.start_time ? rec.shift.start_time.slice(0,5) : new Date().toTimeString().slice(0,5)),
                                                                        check_out: rec.check_out ? rec.check_out.slice(0,5) : '',
                                                                        late_minutes: 0,
                                                                    }, { preserveScroll: true });
                                                                }}
                                                                className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-400 inline-flex items-center justify-center transition-all border border-primary-100 dark:border-primary-900/40 hover:shadow-sm"
                                                            >
                                                                <UserCheck size={14} />
                                                            </button>
                                                        )}
                                                        {/* زر تسجيل غياب السريع */}
                                                        {!['absent', 'weekend', 'holiday', 'leave'].includes(rec.status) && (
                                                            <button
                                                                title="تسجيل غائب"
                                                                onClick={() => confirmAbsence(rec)}
                                                                className="h-8 px-2.5 rounded-xl bg-accent-50 dark:bg-accent-950/30 hover:bg-accent-500 text-accent-600 dark:text-accent-400 hover:text-white inline-flex items-center justify-center gap-1.5 transition-all border border-accent-100 dark:border-accent-900/40 hover:border-accent-500 hover:shadow-md hover:shadow-accent-500/20 group"
                                                            >
                                                                <UserX size={14} className="group-hover:scale-110 transition-transform" />
                                                                <span className="text-[10px] font-black">غياب</span>
                                                            </button>
                                                        )}
                                                        {/* زر تسجيل إجازة */}
                                                        {!['weekend', 'holiday', 'leave'].includes(rec.status) && (
                                                            <button
                                                                title="تسجيل إجازة للموظف"
                                                                onClick={() => setLeaveRecord(rec)}
                                                                className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center transition-all border border-indigo-100 dark:border-indigo-900/40 hover:shadow-sm"
                                                            >
                                                                <Calendar size={14} />
                                                            </button>
                                                        )}
                                                        {/* زر التعديل التفصيلي */}
                                                        <button
                                                            title="تعديل تفصيلي"
                                                            onClick={() => setEditRecord(rec)}
                                                            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 text-slate-400 dark:text-slate-500 inline-flex items-center justify-center transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Expanded 30-Day Attendance Grid Row */}
                                            {expandedRows.includes(rec.id) && (
                                                <tr className="bg-slate-50/40 dark:bg-slate-900/10">
                                                    <td colSpan={12} className="px-6 py-4 border-b border-slate-100 dark:border-slate-850">
                                                        <div className="flex flex-col gap-2 animate-scale-in">
                                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400">سجل التزام الموظف آخر 30 يوماً:</span>
                                                            <div className="flex items-center gap-1.5 flex-wrap py-2" dir="ltr">
                                                                {rec.employee_history?.map((day, idx) => {
                                                                    const statusColors = {
                                                                        present: 'bg-primary-500 dark:bg-primary-600 ring-primary-500/30',
                                                                        late: 'bg-warning-500 dark:bg-warning-600 ring-warning-500/30',
                                                                        absent: 'bg-accent-500 dark:bg-accent-600 ring-accent-500/30',
                                                                        excused: 'bg-slate-400 dark:bg-slate-500 ring-slate-500/30',
                                                                        weekend: 'bg-blue-300 dark:bg-blue-700 ring-blue-300/30',
                                                                        holiday: 'bg-purple-400 dark:bg-purple-600 ring-purple-400/30',
                                                                        leave: 'bg-indigo-400 dark:bg-indigo-600 ring-indigo-400/30',
                                                                        none: 'bg-slate-100 dark:bg-slate-800 ring-slate-200/20'
                                                                    };
                                                                    const statusLabels = {
                                                                        present: 'حاضر',
                                                                        late: 'متأخر',
                                                                        absent: 'غائب',
                                                                        excused: 'بعذر',
                                                                        weekend: 'غير مداوم',
                                                                        holiday: 'إجازة رسمية',
                                                                        leave: 'إجازة خاصة',
                                                                        none: 'لا يوجد سجل'
                                                                    };
                                                                    const formatHistoryDate = (dateStr) => {
                                                                        const parts = dateStr.split('-');
                                                                        if (parts.length !== 3) return dateStr;
                                                                        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                                                                        return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                                                                    };
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className={`w-3.5 h-3.5 rounded-sm ${statusColors[day.status]} hover:ring-2 transition-all cursor-pointer relative group/square`}
                                                                        >
                                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover/square:flex bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 flex-col items-center select-none" dir="rtl">
                                                                                <span>{formatHistoryDate(day.date)}</span>
                                                                                <span className="text-[8px] opacity-75">{statusLabels[day.status]}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {records.last_page > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 flex-wrap gap-3 no-print">
                                    <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">
                                        عرض <span className="font-extrabold text-slate-700 dark:text-slate-300">{records.from}</span> - <span className="font-extrabold text-slate-700 dark:text-slate-300">{records.to}</span> من <span className="font-extrabold text-slate-700 dark:text-slate-300">{records.total}</span>
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap font-sans" dir="ltr">
                                        {records.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                                    link.active
                                                        ? 'bg-primary-500 text-white border-primary-500 dark:bg-primary-600 dark:border-primary-600 shadow-sm'
                                                        : !link.url
                                                        ? 'text-slate-300 dark:text-slate-650 border-slate-100 dark:border-slate-850/50 cursor-not-allowed'
                                                        : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-primary-600 dark:hover:text-primary-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editRecord && (
                <EditModal
                    record={editRecord}
                    onClose={() => setEditRecord(null)}
                />
            )}

            {/* Floating Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl flex items-center justify-between gap-6 w-full max-w-xl animate-scale-in no-print">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white font-mono">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm text-slate-200 font-bold">موظف محدد للتعديل</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95"
                        >
                            إجراء جماعي
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                        >
                            إلغاء التحديد
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Edit Modal */}
            {showBulkModal && (
                <BulkEditModal
                    selectedCount={selectedIds.length}
                    onClose={() => setShowBulkModal(false)}
                    onSubmit={handleBulkSubmit}
                />
            )}
            {/* Add Leave Modal */}
            {leaveRecord && (
                <RegisterLeaveModal 
                    record={leaveRecord}
                    leaveTypes={leaveTypes}
                    leaveBalances={leaveBalances}
                    academicYears={academicYears}
                    onClose={() => setLeaveRecord(null)}
                />
            )}
        </AdminLayout>
    );
}
