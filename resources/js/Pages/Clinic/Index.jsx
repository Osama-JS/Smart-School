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
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-3xl border border-white/40 dark:border-slate-800/60 rounded-[2.5rem] p-6 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-indigo-500" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary-500/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                        <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <HeartPulse size={36} className="text-primary-500" />
                                العيادة المدرسية
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-bold max-w-xl leading-relaxed">
                                إدارة السجلات الطبية للطلاب ومتابعة الزيارات اليومية والحالات الطارئة.
                            </p>
                        </div>

                        <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shrink-0">
                            <Link href={route('clinic.visits.create')} className="flex items-center gap-2 px-8 py-3 rounded-xl font-black bg-white dark:bg-slate-800 text-primary-600 shadow-md scale-105 transition-all duration-300">
                                <Plus size={18} /> تسجيل زيارة
                            </Link>
                        </div>
                    </div>
                </div>
                    
                    {/* Hyper-Modern Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Stat 1: Today Visits */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 group hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 ease-out" />
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                                        <Activity size={24} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black mb-1">{todayVisitsCount}</h3>
                                    <p className="text-indigo-100 font-medium text-sm">إجمالي زيارات اليوم</p>
                                </div>
                            </div>
                        </div>

                        {/* Stat 2: Emergencies */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-500/20 group hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 ease-out" />
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                                        <ShieldAlert size={24} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black mb-1">{emergenciesCount}</h3>
                                    <p className="text-rose-100 font-medium text-sm">حالات طارئة (حديثة)</p>
                                </div>
                            </div>
                        </div>

                        {/* Stat 3: Sent Home */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/20 group hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 ease-out" />
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                                        <ChevronLeft size={24} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black mb-1">{sentHomeCount}</h3>
                                    <p className="text-amber-100 font-medium text-sm">غادر للمنزل (حديثة)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Recent Visits Main Content Grid */}
                    <div className="grid grid-cols-1 gap-8">
                        
                        {/* Search Section */}
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-3xl rounded-[2rem] shadow-sm border border-white/40 dark:border-slate-800/60 p-6 md:p-8 relative z-50 mb-4">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl shadow-sm border border-primary-100/50">
                                    <Search size={20} strokeWidth={2.5} />
                                </div>
                                البحث السريع عن السجل الطبي
                            </h3>
                            <div className="relative" ref={searchRef}>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-6 pr-14 py-4 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white hover:bg-slate-50 transition-all text-slate-700 placeholder-slate-400 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-lg font-bold"
                                    placeholder="ابحث باسم الطالب، رقم الهوية..."
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                    onFocus={() => { if(searchQuery.length >= 2) setShowDropdown(true) }}
                                />
                                {isSearching && (
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent"></div>
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
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-200/60 overflow-hidden z-50">
                                        {searchResults.length > 0 ? (
                                            <ul className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                                                {searchResults.map((student) => (
                                                    <li key={student.id} className="p-4 hover:bg-primary-50/50 transition-colors group">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shadow-sm border border-primary-200/50">
                                                                    {getInitials(student.name)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-extrabold text-slate-900 text-base group-hover:text-primary-700 transition-colors">{student.name}</p>
                                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mt-1">
                                                                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">{student.grade?.name} - {student.division?.name}</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                        <span className="font-mono text-slate-400 tracking-wider">{student.national_id}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Link
                                                                    href={route('clinic.records.show', student.id)}
                                                                    className="px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 font-bold transition-all shadow-sm hover:shadow"
                                                                >
                                                                    <FileText size={16} />
                                                                    السجل
                                                                </Link>
                                                                <Link
                                                                    href={route('clinic.visits.create', { student_id: student.id })}
                                                                    className="px-4 py-2.5 text-sm bg-primary-50 text-primary-700 border border-primary-200 rounded-xl hover:bg-primary-100 flex items-center gap-2 font-bold transition-all shadow-sm hover:shadow"
                                                                >
                                                                    <Plus size={16} strokeWidth={2.5} />
                                                                    زيارة
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            !isSearching && (
                                                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500 bg-slate-50/30">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                        <AlertCircle size={32} className="text-slate-400" />
                                                    </div>
                                                    <p className="font-black text-slate-700 text-xl mb-1">لا توجد نتائج مطابقة لبحثك</p>
                                                    <p className="text-sm font-medium text-slate-500">تأكد من كتابة الاسم أو رقم الهوية بشكل صحيح.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </Transition>
                            </div>
                        </div>

                        {/* Recent Visits */}
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-3xl rounded-[2rem] shadow-sm border border-white/40 dark:border-slate-800/60 overflow-hidden z-10 mb-8">
                            <div className="p-6 md:p-8 border-b border-white/40 dark:border-slate-800/60 flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                        <Clock size={20} strokeWidth={2.5} />
                                    </div>
                                    أحدث الزيارات
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-right divide-y divide-slate-200/60 dark:divide-slate-700/60">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">الطالب</th>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">التاريخ والوقت</th>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">الأعراض</th>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">الإجراء المتخذ</th>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/40 dark:bg-slate-900/40 divide-y divide-slate-100/80 dark:divide-slate-800/80">
                                        {recentVisits.length > 0 ? (
                                            recentVisits.map((visit) => (
                                                <tr key={visit.id} className="hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors group">
                                                    <td className="px-6 py-5 whitespace-nowrap align-top">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shadow-inner border border-slate-200/50">
                                                                {getInitials(visit.student?.name)}
                                                            </div>
                                                            <Link href={route('clinic.records.show', visit.student_id)} className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                                                                {visit.student?.name}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 font-bold align-top">
                                                        <div className="flex flex-col">
                                                            <span>{new Date(visit.visited_at).toLocaleDateString('ar-SA')}</span>
                                                            <span className="text-xs text-slate-400 mt-0.5">{new Date(visit.visited_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-semibold text-gray-700 max-w-xs truncate align-top" title={visit.symptoms}>
                                                        {visit.symptoms}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-semibold text-gray-700 max-w-xs truncate align-top" title={visit.action_taken}>
                                                        {visit.action_taken}
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap align-top">
                                                        {getStatusBadge(visit.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-20 text-center text-slate-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center mb-5">
                                                            <Activity size={36} className="text-slate-300 dark:text-slate-500" strokeWidth={2} />
                                                        </div>
                                                        <p className="font-black text-xl text-slate-700 dark:text-slate-300 mb-1">لا توجد زيارات مسجلة مؤخراً</p>
                                                        <p className="text-sm font-medium text-slate-400">الزيارات الجديدة ستظهر هنا فور تسجيلها.</p>
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

