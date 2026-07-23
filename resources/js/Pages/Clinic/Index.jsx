import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Search, Plus, HeartPulse, Activity, Clock, ChevronLeft, ShieldAlert, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { Transition } from '@headlessui/react';

export default function Index({ recentVisits, todayVisitsCount }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    // Calculate emergencies from recent visits
    const emergenciesCount = recentVisits.filter(v => v.status === 'emergency').length;
    const sentHomeCount = recentVisits.filter(v => v.status === 'sent_home').length;

    // Handle clicking outside of search dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = debounce(async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            const response = await axios.get(route('clinic.search-students'), { params: { query } });
            setSearchResults(response.data);
            setShowDropdown(true);
        } catch (error) {
            console.error('Error searching students', error);
        } finally {
            setIsSearching(false);
        }
    }, 500);

    const onSearchChange = (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value.length < 2) setShowDropdown(false);
        handleSearch(e.target.value);
    };

    const getInitials = (name) => {
        if (!name) return 'ط';
        const parts = name.split(' ');
        if (parts.length >= 2) return parts[0][0] + ' ' + parts[1][0];
        return name.substring(0, 2);
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'returned_to_class':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>عاد للفصل</span>;
            case 'sent_home':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>غادر للمنزل</span>;
            case 'emergency':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>حالة طارئة</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-full">غير محدد</span>;
        }
    };

    return (
        <AdminLayout activeMenu="العيادة المدرسية">
            <Head title="العيادة المدرسية | النظام الإداري" />

            <div className="p-6 space-y-6">
                
                {/* Header Section with Brand Colors and Geometric Accent (Shifts Style) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/70 via-white to-white dark:from-rose-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-rose-100 dark:border-rose-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                    {/* Brand Line Accent */}
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-rose-600" />
                    
                    {/* Fine abstract geometric background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-rose-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-rose-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-rose-500" />
                            <circle cx="500" cy="160" r="6" className="fill-rose-400" />
                            <circle cx="750" cy="60" r="3" className="fill-rose-300" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-rose-500 text-white rounded-2xl shadow-md shadow-rose-500/20 shrink-0">
                                <HeartPulse size={32} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">العيادة المدرسية</h1>
                                <p className="text-rose-700/80 dark:text-rose-300/80 mt-1 text-sm font-semibold">إدارة السجلات الطبية للطلاب ومتابعة الزيارات اليومية والحالات الطارئة</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <Link
                                href={route('clinic.visits.create')}
                                className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-2xl hover:from-rose-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-rose-500/20 text-sm font-bold transition-all active:scale-95 shadow-md"
                            >
                                <Plus size={20} strokeWidth={2.5} /> 
                                <span>تسجيل زيارة جديدة</span>
                            </Link>
                        </div>
                    </div>
                </div>
                    
                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200/60 p-6 flex items-center gap-5 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
                            <div className="relative p-4 bg-blue-100/50 text-blue-600 rounded-2xl border border-blue-100/80 backdrop-blur-sm">
                                <Activity size={28} strokeWidth={2} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-500 mb-1">إجمالي زيارات اليوم</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{todayVisitsCount}</h3>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200/60 p-6 flex items-center gap-5 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
                            <div className="relative p-4 bg-rose-100/50 text-rose-600 rounded-2xl border border-rose-100/80 backdrop-blur-sm">
                                <ShieldAlert size={28} strokeWidth={2} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-500 mb-1">حالات طارئة (حديثة)</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{emergenciesCount}</h3>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200/60 p-6 flex items-center gap-5 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
                            <div className="relative p-4 bg-amber-100/50 text-amber-600 rounded-2xl border border-amber-100/80 backdrop-blur-sm">
                                <ChevronLeft size={28} strokeWidth={2} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-500 mb-1">غادر للمنزل (حديثة)</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{sentHomeCount}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Search & Recent Visits Main Content Grid */}
                    <div className="grid grid-cols-1 gap-8">
                        
                        {/* Search Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 relative z-50">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Search size={20} className="text-indigo-500" />
                                البحث السريع عن السجل الطبي
                            </h3>
                            <div className="relative" ref={searchRef}>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-4 pr-12 py-3.5 border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 hover:bg-slate-50 transition-colors text-slate-700 placeholder-slate-400 shadow-sm text-base font-medium"
                                    placeholder="ابحث باسم الطالب، رقم الهوية..."
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                    onFocus={() => { if(searchQuery.length >= 2) setShowDropdown(true) }}
                                />
                                {isSearching && (
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                                    </div>
                                )}
                                
                                {/* Floating Dropdown */}
                                <Transition
                                    show={showDropdown}
                                    enter="transition ease-out duration-200"
                                    enterFrom="opacity-0 translate-y-1 scale-95"
                                    enterTo="opacity-100 translate-y-0 scale-100"
                                    leave="transition ease-in duration-150"
                                    leaveFrom="opacity-100 translate-y-0 scale-100"
                                    leaveTo="opacity-0 translate-y-1 scale-95"
                                >
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 ring-1 ring-black ring-opacity-5">
                                        {searchResults.length > 0 ? (
                                            <ul className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                                                {searchResults.map((student) => (
                                                    <li key={student.id} className="p-3 hover:bg-slate-50 transition-colors group">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-inner border border-indigo-50">
                                                                    {getInitials(student.name)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{student.name}</p>
                                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                                                                        <span>{student.grade?.name} - {student.division?.name}</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                        <span className="font-mono text-slate-400">{student.national_id}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Link
                                                                    href={route('clinic.records.show', student.id)}
                                                                    className="px-4 py-2 text-sm bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 font-bold transition-all shadow-sm"
                                                                >
                                                                    <FileText size={16} />
                                                                    السجل
                                                                </Link>
                                                                <Link
                                                                    href={route('clinic.visits.create', { student_id: student.id })}
                                                                    className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 flex items-center gap-2 font-bold transition-all shadow-sm"
                                                                >
                                                                    <Plus size={16} />
                                                                    زيارة
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            !isSearching && (
                                                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 bg-slate-50/50">
                                                    <AlertCircle size={36} className="text-slate-300 mb-3" />
                                                    <p className="font-bold text-slate-600 text-lg">لا توجد نتائج مطابقة لبحثك</p>
                                                    <p className="text-sm mt-1">تأكد من كتابة الاسم أو رقم الهوية بشكل صحيح.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </Transition>
                            </div>
                        </div>

                        {/* Recent Visits */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Clock size={20} className="text-slate-400" />
                                    أحدث الزيارات
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-50/50 border-b border-slate-200/80">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الطالب</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">التاريخ والوقت</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الأعراض</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الإجراء المتخذ</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {recentVisits.length > 0 ? (
                                            recentVisits.map((visit) => (
                                                <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shadow-inner border border-slate-200/50">
                                                                {getInitials(visit.student?.name)}
                                                            </div>
                                                            <Link href={route('clinic.records.show', visit.student_id)} className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                                {visit.student?.name}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">
                                                        <div className="flex flex-col">
                                                            <span>{new Date(visit.visited_at).toLocaleDateString('ar-SA')}</span>
                                                            <span className="text-xs text-slate-400 mt-0.5">{new Date(visit.visited_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 max-w-xs truncate" title={visit.symptoms}>
                                                        {visit.symptoms}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 max-w-xs truncate" title={visit.action_taken}>
                                                        {visit.action_taken}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(visit.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                            <Activity size={32} className="text-slate-300" />
                                                        </div>
                                                        <p className="font-bold text-lg text-slate-600">لا توجد زيارات مسجلة مؤخراً</p>
                                                        <p className="text-sm mt-1 text-slate-400 font-medium">الزيارات الجديدة ستظهر هنا.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
        </AdminLayout>
    );
}

