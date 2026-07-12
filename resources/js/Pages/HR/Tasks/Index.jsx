import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, GripVertical, Calendar, Clock, AlertCircle, CheckCircle2, MoreVertical, X } from 'lucide-react';

export default function TasksIndex({ auth, tasks, employees, currentUser }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        assigned_to: '',
    });

    const openModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            setData({
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.status,
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
                assigned_to: task.assigned_to,
            });
        } else {
            setEditingTask(null);
            reset();
            setData('status', 'todo');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingTask) {
            put(route('hr.tasks.update', editingTask.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.tasks.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteTask = (taskId) => {
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            destroy(route('hr.tasks.destroy', taskId));
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // necessary to allow dropping
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const task = tasks.find(t => t.id === parseInt(taskId));
        if (task && task.status !== newStatus) {
            // Optimistic update locally? (Handled by Inertia reload)
            router.patch(route('hr.tasks.update-status', taskId), { status: newStatus }, {
                preserveScroll: true,
            });
        }
    };

    const columns = [
        { id: 'todo', title: 'مهام جديدة', color: 'bg-slate-100 border-slate-200', headerColor: 'text-slate-700' },
        { id: 'in_progress', title: 'قيد التنفيذ', color: 'bg-blue-50 border-blue-100', headerColor: 'text-blue-700' },
        { id: 'review', title: 'للمراجعة', color: 'bg-purple-50 border-purple-100', headerColor: 'text-purple-700' },
        { id: 'completed', title: 'مكتملة', color: 'bg-green-50 border-green-100', headerColor: 'text-green-700' },
    ];

    const priorityColors = {
        low: 'bg-slate-100 text-slate-600',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-red-100 text-red-700'
    };
    
    const priorityLabels = {
        low: 'عادية',
        medium: 'متوسطة',
        high: 'عاجلة'
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">إدارة المهام (Kanban)</h2>}
        >
            <Head title="إدارة المهام" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Actions */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">لوحة المهام</h3>
                            <p className="text-sm text-gray-500">قم بسحب وإفلات المهام لتغيير حالتها</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            مهمة جديدة
                        </button>
                    </div>

                    {/* Kanban Board */}
                    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
                        {columns.map(column => (
                            <div 
                                key={column.id}
                                className={`flex-1 min-w-[300px] rounded-xl border ${column.color} flex flex-col`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                <div className={`p-4 font-bold border-b border-white/50 ${column.headerColor} flex justify-between items-center`}>
                                    <span>{column.title}</span>
                                    <span className="bg-white/60 px-2 py-1 rounded-full text-xs">
                                        {tasks.filter(t => t.status === column.id).length}
                                    </span>
                                </div>
                                
                                <div className="p-3 flex-1 flex flex-col gap-3">
                                    {tasks.filter(t => t.status === column.id).map(task => (
                                        <div 
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-grab hover:shadow-md transition-shadow group relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-md font-medium ${priorityColors[task.priority]}`}>
                                                    {priorityLabels[task.priority]}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal(task)} className="text-gray-400 hover:text-indigo-600 p-1">
                                                        تعديل
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <h4 className="font-bold text-gray-800 mb-1 leading-tight">{task.title}</h4>
                                            {task.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                                            )}
                                            
                                            <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-1" title="تاريخ الاستحقاق">
                                                    <Calendar className="w-3 h-3" />
                                                    {task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                                                </div>
                                                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md" title="المسؤول عن التنفيذ">
                                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                                        {task.assigned_to_user?.name?.charAt(0) || task.assigned_to}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {tasks.filter(t => t.status === column.id).length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-gray-300/50 rounded-lg flex items-center justify-center text-sm text-gray-400">
                                            اسحب مهمة هنا
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">
                                {editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المهمة <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
                                        required
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                                    <textarea 
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                                        <select 
                                            value={data.priority}
                                            onChange={e => setData('priority', e.target.value)}
                                            className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
                                        >
                                            <option value="low">عادية</option>
                                            <option value="medium">متوسطة</option>
                                            <option value="high">عاجلة</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                                        <input 
                                            type="date" 
                                            value={data.due_date}
                                            onChange={e => setData('due_date', e.target.value)}
                                            className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">تعيين إلى <span className="text-red-500">*</span></label>
                                    <select 
                                        value={data.assigned_to}
                                        onChange={e => setData('assigned_to', e.target.value)}
                                        className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
                                        required
                                    >
                                        <option value="">-- اختر الموظف --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                    {errors.assigned_to && <p className="text-red-500 text-xs mt-1">{errors.assigned_to}</p>}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-100">
                                {editingTask ? (
                                    <button 
                                        type="button"
                                        onClick={() => deleteTask(editingTask.id)}
                                        className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        حذف المهمة
                                    </button>
                                ) : <div></div>}
                                
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {processing ? 'جاري الحفظ...' : 'حفظ'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
