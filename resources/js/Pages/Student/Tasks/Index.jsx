import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    CheckCircle2, Circle, Clock, AlertTriangle, 
    CalendarDays, Plus, ListTodo, MoreVertical, 
    Trash2, Check, X, ShieldAlert, Sparkles, Filter 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import ChildSelector from '@/Components/ChildSelector';

export default function StudentTasks({ auth, tasks, stats, children, activeChildId }) {
    const [filter, setFilter] = useState('all'); // all, pending, completed, overdue
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
    });

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (filter === 'pending') return ['todo', 'in_progress', 'review'].includes(task.status);
            if (filter === 'completed') return task.status === 'completed';
            if (filter === 'overdue') return task.is_overdue;
            return true;
        });
    }, [tasks, filter]);

    const handleStatusToggle = (task) => {
        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
        router.put(route('student.tasks.update-status', task.id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                if (newStatus === 'completed') toast.success('تم إنجاز المهمة بطل! 🚀');
            }
        });
    };

    const handleDelete = (taskId) => {
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            router.delete(route('student.tasks.destroy', taskId), {
                preserveScroll: true,
                onSuccess: () => toast.success('تم حذف المهمة')
            });
        }
    };

    const submitNewTask = (e) => {
        e.preventDefault();
        post(route('student.tasks.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                toast.success('تم إضافة المهمة بنجاح ✨');
            }
        });
    };

    const priorityColors = {
        high: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-200',
        medium: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200',
        low: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200'
    };

    const priorityLabels = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };

    return (
        <AdminLayout user={auth.user} activeMenu="المهام والواجبات">
            <Head title="المهام والواجبات" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                <ChildSelector children={children} activeChildId={activeChildId} />

                {/* Header Section */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/30 shadow-inner">
                                <ListTodo size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">مهامي وواجباتي</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    <Sparkles size={16} />
                                    نظم وقتك، أنجز مهامك، وحقق أهدافك
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 hover:-translate-y-1"
                        >
                            <Plus size={20} />
                            إضافة مهمة جديدة
                        </button>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                        <ListTodo className="text-blue-500 mb-2" size={28} />
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.total}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">إجمالي المهام</p>
                    </div>
                    
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-50 dark:bg-amber-900/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                        <Clock className="text-amber-500 mb-2" size={28} />
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.pending}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">قيد التنفيذ</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                        <CheckCircle2 className="text-emerald-500 mb-2" size={28} />
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.completed}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">المكتملة</p>
                    </div>

                    <div className={`bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border ${stats.overdue > 0 ? 'border-rose-200 dark:border-rose-800/50' : 'border-slate-100 dark:border-slate-800'} shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all`}>
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 dark:bg-rose-900/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                        <AlertTriangle className={stats.overdue > 0 ? 'text-rose-500 mb-2' : 'text-slate-400 mb-2'} size={28} />
                        <p className={`text-3xl font-black ${stats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>{stats.overdue}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">متأخرة</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button onClick={() => setFilter('all')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${filter === 'all' ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'}`}>
                        <Filter size={16} /> الكل
                    </button>
                    <button onClick={() => setFilter('pending')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'pending' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'}`}>
                        قيد التنفيذ ({stats.pending})
                    </button>
                    <button onClick={() => setFilter('completed')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'completed' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'}`}>
                        المكتملة ({stats.completed})
                    </button>
                    {stats.overdue > 0 && (
                        <button onClick={() => setFilter('overdue')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'overdue' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'}`}>
                            المتأخرة ({stats.overdue})
                        </button>
                    )}
                </div>

                {/* Task List */}
                <div className="space-y-4">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => {
                            const isCompleted = task.status === 'completed';
                            return (
                                <div key={task.id} className={`group bg-white dark:bg-[#1e293b] rounded-[2rem] p-5 shadow-sm border ${isCompleted ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30' : task.is_overdue ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-100 dark:border-slate-800'} transition-all hover:shadow-md flex flex-col sm:flex-row gap-5 items-start sm:items-center`}>
                                    
                                    {/* Checkbox */}
                                    <button 
                                        onClick={() => handleStatusToggle(task)}
                                        className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-primary-500'}`}
                                    >
                                        <Check size={16} strokeWidth={3} className={isCompleted ? 'opacity-100' : 'opacity-0'} />
                                    </button>

                                    {/* Content */}
                                    <div className={`flex-grow min-w-0 transition-opacity ${isCompleted ? 'opacity-50 line-through' : ''}`}>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate pr-2">{task.title}</h3>
                                        {task.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 pr-2">{task.description}</p>
                                        )}
                                        
                                        <div className="flex flex-wrap items-center gap-3 mt-3 pr-2 text-xs font-bold">
                                            {task.due_date && (
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${task.is_overdue && !isCompleted ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                                                    <CalendarDays size={14} />
                                                    {task.due_date}
                                                </span>
                                            )}
                                            
                                            {task.priority && !isCompleted && (
                                                <span className={`px-2.5 py-1 rounded-lg border ${priorityColors[task.priority]}`}>
                                                    أهمية {priorityLabels[task.priority]}
                                                </span>
                                            )}

                                            {!task.is_personal && (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                                                    <ShieldAlert size={14} />
                                                    من: {task.assigned_by}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 sm:self-center mr-auto sm:mr-0 pl-2">
                                        {task.is_personal && (
                                            <button 
                                                onClick={() => handleDelete(task.id)}
                                                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-20 h-20 mx-auto bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-5">
                                <CheckCircle2 size={36} className="text-primary-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {filter === 'completed' ? 'لا توجد مهام مكتملة' : filter === 'overdue' ? 'لا توجد مهام متأخرة' : 'لا توجد مهام حالياً'}
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                {filter === 'all' && 'أنت على أتم الاستعداد! يمكنك إضافة مهام جديدة لتنظيم وقتك بشكل أفضل.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Task Modal */}
            <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="md">
                <form onSubmit={submitNewTask} className="p-6">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Plus size={24} className="text-primary-600" />
                        إضافة مهمة شخصية
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <InputLabel htmlFor="title" value="عنوان المهمة" />
                            <TextInput
                                id="title"
                                type="text"
                                className="mt-1 block w-full bg-slate-50"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                required
                                placeholder="مثال: مراجعة درس الرياضيات"
                            />
                            <InputError message={errors.title} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value="التفاصيل (اختياري)" />
                            <textarea
                                id="description"
                                className="mt-1 block w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-primary-500 focus:ring-primary-500 rounded-xl shadow-sm bg-slate-50 min-h-[100px]"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="تفاصيل إضافية للمهمة..."
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="due_date" value="تاريخ الاستحقاق (اختياري)" />
                                <TextInput
                                    id="due_date"
                                    type="date"
                                    className="mt-1 block w-full bg-slate-50"
                                    value={data.due_date}
                                    onChange={e => setData('due_date', e.target.value)}
                                />
                                <InputError message={errors.due_date} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="priority" value="الأهمية" />
                                <select
                                    id="priority"
                                    className="mt-1 block w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-primary-500 focus:ring-primary-500 rounded-xl shadow-sm bg-slate-50"
                                    value={data.priority}
                                    onChange={e => setData('priority', e.target.value)}
                                >
                                    <option value="low">منخفضة</option>
                                    <option value="medium">متوسطة</option>
                                    <option value="high">عالية</option>
                                </select>
                                <InputError message={errors.priority} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsAddModalOpen(false)}>
                            إلغاء
                        </SecondaryButton>
                        <PrimaryButton className="px-8" disabled={processing}>
                            حفظ المهمة
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
