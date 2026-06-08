import React, { useState } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Select from "react-select";
import { Plus, Trash2, X, Users, Calendar, Clock, MapPin, Eye, FileText, CheckCircle, Search, Filter, PlusCircle } from "lucide-react";

export default function MeetingsIndex({ auth, meetings, users, stats, filters }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const form = useForm({
        title: '',
        date: '',
        time: '',
        type: 'in_person',
        agendas: [''],
        participants: []
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('meetings.index'), { search: searchQuery, status: statusFilter }, { preserveState: true });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        form.post(route('meetings.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                form.reset();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذا الاجتماع؟')) {
            router.delete(route('meetings.destroy', id));
        }
    };

    const userOptions = users.map(u => ({ value: u.id, label: `${u.name} ${u.employee?.job_grade?.name ? '- ' + u.employee.job_grade.name : ''}` }));

    const handleSelectChange = (selectedOptions) => {
        form.setData('participants', selectedOptions ? selectedOptions.map(opt => opt.value) : []);
    };

    const addAgenda = () => form.setData('agendas', [...form.data.agendas, '']);
    
    const updateAgenda = (index, value) => {
        const newAgendas = [...form.data.agendas];
        newAgendas[index] = value;
        form.setData('agendas', newAgendas);
    };

    const removeAgenda = (index) => {
        const newAgendas = [...form.data.agendas];
        newAgendas.splice(index, 1);
        form.setData('agendas', newAgendas);
    };

    const selectClassNames = {
        control: (state) => `bg-white dark:bg-slate-900 border ${state.isFocused ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg min-h-[42px] px-1 transition-all text-sm`,
        menu: () => "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl mt-1 overflow-hidden z-50",
        option: (state) => `px-4 py-2 text-sm cursor-pointer transition-colors ${state.isFocused ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`,
        multiValue: () => "bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-md m-1",
        multiValueLabel: () => "text-primary-700 dark:text-primary-400 text-xs py-1 px-2",
        multiValueRemove: () => "text-primary-500 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 hover:text-primary-700 px-1 rounded-r-md transition-colors",
        placeholder: () => "text-slate-400 text-sm px-2",
        input: () => "text-slate-700 dark:text-slate-300 text-sm px-2",
        valueContainer: () => "px-1",
        indicatorsContainer: () => "px-1 text-slate-400",
        indicatorSeparator: () => "hidden",
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="الإجتماعات" />
            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">الإجتماعات</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">إدارة الاجتماعات واللجان والتوصيات</p>
                        </div>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            اجتماع جديد
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">إجمالي الاجتماعات</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">المجدولة</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.scheduled}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">المكتملة</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.completed}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن اجتماع..."
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                            <div className="w-full md:w-48 relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                    <Filter size={18} />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none dark:text-white"
                                >
                                    <option value="">جميع الحالات</option>
                                    <option value="scheduled">مجدول</option>
                                    <option value="completed">مكتمل</option>
                                    <option value="cancelled">ملغي</option>
                                </select>
                            </div>
                            <button type="submit" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold transition-colors">
                                بحث
                            </button>
                        </form>
                    </div>

                    {/* Meetings List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {meetings.data.map(meeting => (
                            <div key={meeting.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                                            meeting.status === 'scheduled' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                            meeting.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                            'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                                            {meeting.status === 'scheduled' ? <Clock size={14} /> : 
                                             meeting.status === 'completed' ? <CheckCircle size={14} /> : <X size={14} />}
                                            {meeting.status === 'scheduled' ? 'مجدول' : 
                                             meeting.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                        </div>
                                        {meeting.supervisor_id === auth.user.id && (
                                            <button onClick={() => handleDelete(meeting.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{meeting.title}</h3>
                                    
                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Calendar size={16} className="text-slate-400" />
                                            <span>{new Date(meeting.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Clock size={16} className="text-slate-400" />
                                            <span>{meeting.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <MapPin size={16} className="text-slate-400" />
                                            <span>{meeting.type === 'in_person' ? 'حضوري' : 'عن بعد (Online)'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Users size={16} className="text-slate-400" />
                                            <span>{meeting.participants.length} مدعو</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                    <Link 
                                        href={route('meetings.show', meeting.id)} 
                                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Eye size={16} />
                                        عرض التفاصيل والإدارة
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {meetings.data.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لا توجد اجتماعات</h3>
                            <p className="text-slate-500 dark:text-slate-400">قم بإنشاء اجتماع جديد للبدء</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">جدولة اجتماع جديد</h2>
                                    <p className="text-sm text-slate-500">قم بتحديد تفاصيل الاجتماع والمشاركين</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="createForm" onSubmit={handleCreateSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الاجتماع <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={form.data.title}
                                        onChange={e => form.setData('title', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                        required
                                    />
                                    {form.errors.title && <p className="text-red-500 text-xs mt-1">{form.errors.title}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الاجتماع <span className="text-red-500">*</span></label>
                                        <input 
                                            type="date" 
                                            value={form.data.date}
                                            onChange={e => form.setData('date', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                            required
                                        />
                                        {form.errors.date && <p className="text-red-500 text-xs mt-1">{form.errors.date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">وقت الاجتماع <span className="text-red-500">*</span></label>
                                        <input 
                                            type="time" 
                                            value={form.data.time}
                                            onChange={e => form.setData('time', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                            required
                                        />
                                        {form.errors.time && <p className="text-red-500 text-xs mt-1">{form.errors.time}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع الاجتماع <span className="text-red-500">*</span></label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="type" value="in_person" checked={form.data.type === 'in_person'} onChange={e => form.setData('type', e.target.value)} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">حضوري</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="type" value="online" checked={form.data.type === 'online'} onChange={e => form.setData('type', e.target.value)} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">عن بعد (Online)</span>
                                        </label>
                                    </div>
                                    {form.errors.type && <p className="text-red-500 text-xs mt-1">{form.errors.type}</p>}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">محاور الاجتماع <span className="text-red-500">*</span></label>
                                        <button type="button" onClick={addAgenda} className="text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                                            <PlusCircle size={16} /> إضافة محور
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {form.data.agendas.map((agenda, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={agenda}
                                                    onChange={e => updateAgenda(idx, e.target.value)}
                                                    placeholder={`المحور ${idx + 1}`}
                                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                                    required
                                                />
                                                {form.data.agendas.length > 1 && (
                                                    <button type="button" onClick={() => removeAgenda(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 rounded-xl transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {form.errors.agendas && <p className="text-red-500 text-xs mt-1">{form.errors.agendas}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المدعوون (المشاركون) <span className="text-red-500">*</span></label>
                                    <Select
                                        isMulti
                                        options={userOptions}
                                        value={userOptions.filter(opt => form.data.participants.includes(opt.value))}
                                        onChange={handleSelectChange}
                                        placeholder="اختر الموظفين..."
                                        classNames={selectClassNames}
                                        unstyled
                                        noOptionsMessage={() => "لا يوجد موظفين"}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">سيتم إرسال بريد إلكتروني بدعوة الاجتماع إلى الموظفين المحددين.</p>
                                    {form.errors.participants && <p className="text-red-500 text-xs mt-1">{form.errors.participants}</p>}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button 
                                form="createForm" 
                                type="submit" 
                                disabled={form.processing}
                                className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors"
                            >
                                حفظ وإرسال الدعوات
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
