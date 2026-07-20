import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Save, Plus, X, Calendar as CalendarIcon, ChevronRight, Trash2, Edit3, BookOpen, Clock, AlertCircle, MapPin, Users, Download, Wand, FileText, Printer, ToggleLeft, ToggleRight, Search, Loader2 } from 'lucide-react';
import ToastNotification from '@/Components/ToastNotification';
import { Transition, Dialog } from '@headlessui/react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import Swal from 'sweetalert2';
import TimelineView from './TimelineView';

// Dynamic color generator based on subject ID for a premium, brand-aligned look
const getSubjectColor = (id) => {
    const colors = [
        'bg-primary-500 text-white', 
        'bg-indigo-500 text-white', 
        'bg-purple-500 text-white',
        'bg-violet-500 text-white',
        'bg-sky-500 text-white',
        'bg-slate-600 text-white'
    ];
    return colors[id % colors.length];
};

const getSubjectLightColor = (id) => {
    const colors = [
        // Primary
        'bg-primary-50/80 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700/50 dark:text-primary-300',
        // Indigo
        'bg-indigo-50/80 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-300',
        // Violet
        'bg-violet-50/80 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700/50 dark:text-violet-300',
        // Sky
        'bg-sky-50/80 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700/50 dark:text-sky-300',
        // Purple
        'bg-purple-50/80 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700/50 dark:text-purple-300',
        // Slate
        'bg-slate-100/80 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-300'
    ];
    return colors[id % colors.length];
};

export default function Builder({ examSchedule, grades, subjects, holidays = [], teachers = [] }) {
    const [toast, setToast] = useState(null);
    const [dates, setDates] = useState([]);
    const [localItems, setLocalItems] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [autoSave, setAutoSave] = useState(false);
    const [activeSection, setActiveSection] = useState('all');
    const skipAutoSave = useRef(true);

    const sections = React.useMemo(() => {
        const uniqueSections = {};
        grades.forEach(grade => {
            if (grade.section) {
                uniqueSections[grade.section.id] = grade.section;
            }
        });
        return Object.values(uniqueSections).sort((a, b) => a.id - b.id);
    }, [grades]);

    useEffect(() => {
        if (sections.length > 0 && activeSection === 'all') {
            // Keep 'all' as default if preferred, or change to sections[0].id
            setActiveSection('all');
        }
    }, [sections]);

    const filteredGrades = grades.filter(g => {
        if (activeSection === 'all') return true;
        return g.section?.id === activeSection;
    });
    
    // Slide-over state
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [activeCell, setActiveCell] = useState(null); 
    const [editingItemGroup, setEditingItemGroup] = useState(null); 
    const [isSaving, setIsSaving] = useState(false);
    
    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportSettings, setExportSettings] = useState({
        showProctors: true,
        showRooms: true,
        showSyllabus: false,
        showTimes: true
    });
    
    const handleExport = () => {
        let query = `?proctors=${exportSettings.showProctors?1:0}&rooms=${exportSettings.showRooms?1:0}&syllabus=${exportSettings.showSyllabus?1:0}&times=${exportSettings.showTimes?1:0}`;
        if (activeSection && activeSection !== 'all') {
            query += `&section_id=${activeSection}`;
        }
        window.open(route('academic.exam-schedules.print', examSchedule.id) + query, '_blank');
        setIsExportModalOpen(false);
    };
    
    const [formData, setFormData] = useState({
        subject_id: '',
        start_time: '',
        end_time: '',
        room: '',
        proctor_ids: [],
        syllabus: '',
        division_ids: []
    });

    const [newDateValue, setNewDateValue] = useState('');

    useEffect(() => {
        if (examSchedule.items?.length > 0) {
            const initialItems = examSchedule.items.map(item => ({
                id: item.id || Math.random().toString(36).substr(2, 9),
                division_id: item.division_id,
                subject_id: item.subject_id,
                exam_date: dayjs(item.exam_date).format('YYYY-MM-DD'),
                start_time: item.start_time ? item.start_time.substring(0, 5) : '',
                end_time: item.end_time ? item.end_time.substring(0, 5) : '',
                room: item.room || '',
                syllabus: item.syllabus || '',
                proctor_ids: item.proctors ? item.proctors.map(p => p.id) : [],
                proctors: item.proctors || [],
                subject_name: item.subject?.name,
                division_name: item.division?.name,
                grade_id: item.division?.grade_id
            }));
            
            skipAutoSave.current = true;
            setLocalItems(initialItems);
            const uniqueDates = [...new Set(initialItems.map(i => dayjs(i.exam_date).format('YYYY-MM-DD')))].sort();
            setDates(uniqueDates);
        }
    }, [examSchedule]);

    // Auto-save logic
    useEffect(() => {
        if (skipAutoSave.current) {
            skipAutoSave.current = false;
            return;
        }
        
        if (autoSave) {
            const timer = setTimeout(() => {
                router.post(route('academic.exam-schedules.items.update', examSchedule.id), {
                    items: localItems.map(i => ({
                        division_id: i.division_id,
                        subject_id: i.subject_id,
                        exam_date: i.exam_date,
                        start_time: i.start_time,
                        end_time: i.end_time,
                        room: i.room,
                        proctor_ids: i.proctor_ids,
                        syllabus: i.syllabus
                    }))
                }, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        // Silent background save successful
                    }
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [localItems, autoSave]);

    const handleDateInput = (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            // Check holidays
            const isHoliday = holidays.find(h => {
                const start = dayjs(h.start_date).startOf('day');
                const end = dayjs(h.end_date).endOf('day');
                const current = dayjs(selectedDate).startOf('day');
                return current.isSame(start, 'day') || current.isSame(end, 'day') || (current.isAfter(start) && current.isBefore(end));
            });

            if (isHoliday) {
                Swal.fire({
                    icon: 'warning',
                    title: 'تنبيه: إجازة رسمية',
                    text: `هذا التاريخ يوافق إجازة رسمية (${isHoliday.name}). هل أنت متأكد من رغبتك في إضافة يوم لاختبارات فيه؟`,
                    showCancelButton: true,
                    confirmButtonText: 'نعم، أضف اليوم',
                    cancelButtonText: 'تراجع',
                    confirmButtonColor: '#eab308'
                }).then((result) => {
                    if (result.isConfirmed) {
                        addSelectedDate(selectedDate);
                    }
                });
            } else {
                addSelectedDate(selectedDate);
            }
        }
        e.target.value = ''; // Reset for next time
    };

    const handleAutoSchedule = () => {
        if (dates.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'لا يوجد أيام',
                text: 'يرجى إضافة الأيام/التواريخ المخصصة للاختبارات أولاً قبل التوزيع التلقائي.',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }

        Swal.fire({
            icon: 'question',
            title: 'التوزيع التلقائي العادل ✨',
            text: 'هل أنت متأكد أنك تريد توزيع المواد تلقائياً؟ سيتم مسح أي جدول حالي غير محفوظ في هذه الشاشة.',
            showCancelButton: true,
            confirmButtonText: 'نعم، قم بالتوزيع',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#8b5cf6'
        }).then((result) => {
            if (result.isConfirmed) {
                runAutoScheduleMagic();
            }
        });
    };

    const runAutoScheduleMagic = () => {
        const newLocalItems = [];
        const highWeightKeywords = ['رياضيات', 'علوم', 'فيزياء', 'كيمياء', 'أحياء', 'إنجليزي', 'لغة إنجليزية', 'لغتي'];

        grades.forEach(grade => {
            if (!grade.subjects || grade.subjects.length === 0) return;
            
            // Separate subjects
            const highWeightSubjects = [];
            const normalSubjects = [];
            
            grade.subjects.forEach(subject => {
                const isHigh = highWeightKeywords.some(kw => subject.name.includes(kw));
                if (isHigh) highWeightSubjects.push(subject);
                else normalSubjects.push(subject);
            });
            
            // Shuffle arrays for randomness (so it's not always the exact same order)
            const shuffle = (array) => array.sort(() => Math.random() - 0.5);
            shuffle(highWeightSubjects);
            shuffle(normalSubjects);
            
            // Map subjects to dates (strictly max 1 per day as requested)
            const dateAssignments = dates.map(() => []);
            
            const allSubjects = [...highWeightSubjects, ...normalSubjects];
            let dateIdx = 0;
            
            allSubjects.forEach(subject => {
                if (dateIdx < dates.length) {
                    dateAssignments[dateIdx].push(subject);
                    dateIdx++;
                }
            });
            
            // Create items for each division
            grade.divisions.forEach(division => {
                dates.forEach((date, dateIdx) => {
                    const subjectsOnThisDay = dateAssignments[dateIdx];
                    subjectsOnThisDay.forEach((subject, subjIdx) => {
                        
                        // Assign dummy times based on how many subjects are on this day
                        let start_time = '08:00';
                        let end_time = '09:30';
                        if (subjIdx === 1) {
                            start_time = '10:00';
                            end_time = '11:30';
                        } else if (subjIdx > 1) {
                            start_time = `1${subjIdx}:00`;
                            end_time = `1${subjIdx}:30`;
                        }
                        
                        newLocalItems.push({
                            id: Math.random().toString(36).substr(2, 9),
                            division_id: division.id,
                            subject_id: subject.id,
                            exam_date: date,
                            start_time: start_time,
                            end_time: end_time,
                            room: '',
                            syllabus: '',
                            proctor_ids: [],
                            proctors: [],
                            subject_name: subject.name,
                            division_name: division.name,
                            grade_id: grade.id
                        });
                    });
                });
            });
        });
        
        setLocalItems(newLocalItems);
        setToast({ message: 'تم التوزيع التلقائي العادل للمواد بنجاح! راجع الجدول ثم اضغط اعتماد ونشر.', type: 'success' });
    };

    const addSelectedDate = (selectedDate) => {
        if (!dates.includes(selectedDate)) {
            setDates([...dates, selectedDate].sort());
        } else {
            setToast({ message: 'التاريخ موجود مسبقاً', type: 'error' });
        }
    };

    const removeDate = (dateToRemove) => {
        if(confirm('هل أنت متأكد من إزالة هذا اليوم؟ سيتم حذف جميع الاختبارات المجدولة فيه.')) {
            setDates(dates.filter(d => d !== dateToRemove));
            setLocalItems(localItems.filter(item => item.exam_date !== dateToRemove));
        }
    };

    const openDrawer = (date, grade, existingGroup = null) => {
        setActiveCell({ date, grade });
        if (existingGroup) {
            setEditingItemGroup(existingGroup);
            setFormData({
                subject_id: existingGroup.subject_id,
                start_time: existingGroup.start_time || '',
                end_time: existingGroup.end_time || '',
                room: existingGroup.room || '',
                proctor_ids: existingGroup.proctor_ids || [],
                syllabus: existingGroup.syllabus,
                division_ids: existingGroup.items.map(i => i.division_id)
            });
        } else {
            setEditingItemGroup(null);
            setFormData({
                subject_id: '',
                start_time: '',
                end_time: '',
                room: '',
                proctor_ids: [],
                syllabus: '',
                division_ids: grade.divisions.map(d => d.id)
            });
        }
        setIsSlideOverOpen(true);
    };

    const saveCellData = (e) => {
        e.preventDefault();
        if (!formData.subject_id || formData.division_ids.length === 0) {
            setToast({ message: 'يرجى تحديد المادة والشعب.', type: 'error' });
            return;
        }

        // Check overload
        const divisionsOverload = [];
        formData.division_ids.forEach(divId => {
            const examsForDivOnDate = localItems.filter(i => 
                i.exam_date === activeCell.date && 
                i.division_id === divId && 
                (!editingItemGroup || !editingItemGroup.items.map(ei => ei.id).includes(i.id))
            );
            if (examsForDivOnDate.length >= 2) {
                const divName = activeCell.grade.divisions.find(d => d.id == divId)?.name;
                divisionsOverload.push(divName);
            }
        });

        if (divisionsOverload.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه: ضغط اختبارات',
                text: `الشعب التالية لديها بالفعل اختبارين أو أكثر في هذا اليوم: ${divisionsOverload.join('، ')}. هل أنت متأكد من إضافة اختبار إضافي؟`,
                showCancelButton: true,
                confirmButtonText: 'نعم، أضف الاختبار',
                cancelButtonText: 'تراجع',
                confirmButtonColor: '#ef4444'
            }).then((result) => {
                if (result.isConfirmed) {
                    processSaveCell();
                }
            });
        } else {
            processSaveCell();
        }
    };

    const processSaveCell = () => {
        const subject = subjects.find(s => s.id == formData.subject_id);
        
        let newItems = [...localItems];
        if (editingItemGroup) {
            const idsToRemove = editingItemGroup.items.map(i => i.id);
            newItems = newItems.filter(i => !idsToRemove.includes(i.id));
        }

        const itemsToAdd = formData.division_ids.map(divId => {
            const division = activeCell.grade.divisions.find(d => d.id == divId);
            return {
                id: Math.random().toString(36).substr(2, 9),
                division_id: divId,
                subject_id: formData.subject_id,
                exam_date: activeCell.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                room: formData.room,
                proctor_ids: formData.proctor_ids,
                proctors: teachers.filter(t => formData.proctor_ids.includes(t.id)),
                syllabus: formData.syllabus,
                subject_name: subject?.name,
                division_name: division?.name,
                grade_id: activeCell.grade.id
            };
        });

        setLocalItems([...newItems, ...itemsToAdd]);
        setIsSlideOverOpen(false);
    };

    const deleteGroup = (group) => {
        if(confirm('حذف هذا الاختبار؟')) {
            const idsToRemove = group.items.map(i => i.id);
            setLocalItems(localItems.filter(i => !idsToRemove.includes(i.id)));
        }
    };

    const saveScheduleToDatabase = () => {
        setIsSaving(true);
        router.post(route('academic.exam-schedules.items.update', examSchedule.id), {
            items: localItems.map(i => ({
                division_id: i.division_id,
                subject_id: i.subject_id,
                exam_date: i.exam_date,
                start_time: i.start_time,
                end_time: i.end_time,
                room: i.room,
                proctor_ids: i.proctor_ids,
                syllabus: i.syllabus
            }))
        }, {
            onSuccess: () => {
                setToast({ message: 'تم حفظ وتحديث الجدول بنجاح!', type: 'success' });
                setIsSaving(false);
            },
            onError: () => setIsSaving(false)
        });
    };

    const groupedItemsCache = React.useMemo(() => {
        const cache = {};
        
        localItems.forEach(item => {
            const date = item.exam_date;
            const gradeId = item.grade_id;
            
            if (!cache[date]) cache[date] = {};
            if (!cache[date][gradeId]) cache[date][gradeId] = {};
            
            const groupKey = `${item.subject_id}_${item.start_time}_${item.end_time}_${item.room}_${item.proctor_ids?.join(',')}_${item.syllabus}`;
            
            if (!cache[date][gradeId][groupKey]) {
                cache[date][gradeId][groupKey] = {
                    subject_id: item.subject_id,
                    subject_name: item.subject_name,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    room: item.room,
                    proctor_ids: item.proctor_ids,
                    proctors: item.proctors,
                    syllabus: item.syllabus,
                    items: []
                };
            }
            cache[date][gradeId][groupKey].items.push(item);
        });
        
        return cache;
    }, [localItems]);

    const getGroupedItemsForCell = React.useCallback((date, gradeId) => {
        if (!groupedItemsCache[date] || !groupedItemsCache[date][gradeId]) return [];
        return Object.values(groupedItemsCache[date][gradeId]);
    }, [groupedItemsCache]);

    const toggleDivisionSelection = (divId) => {
        setFormData(prev => {
            const isSelected = prev.division_ids.includes(divId);
            return {
                ...prev,
                division_ids: isSelected 
                    ? prev.division_ids.filter(id => id !== divId)
                    : [...prev.division_ids, divId]
            };
        });
    };

    const toggleProctorSelection = (proctorId) => {
        setFormData(prev => {
            const isSelected = prev.proctor_ids.includes(proctorId);
            return {
                ...prev,
                proctor_ids: isSelected 
                    ? prev.proctor_ids.filter(id => id !== proctorId)
                    : [...prev.proctor_ids, proctorId]
            };
        });
    };

    // Live Dimming Filter Logic
    const checkMatch = (group) => {
        if (!searchQuery.trim()) return true;
        
        const q = searchQuery.toLowerCase().trim();
        const subjectMatch = group.subject_name.toLowerCase().includes(q);
        const roomMatch = group.room ? group.room.toLowerCase().includes(q) : false;
        const proctorsMatch = group.proctors && group.proctors.some(p => p.name.toLowerCase().includes(q));
        
        return subjectMatch || roomMatch || proctorsMatch;
    };

    return (
        <AdminLayout activeMenu="جداول الاختبارات">
            <Head title={`بناء الجدول - ${examSchedule.title}`} />
            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Premium Top Bar */}
            <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-700/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] py-4 px-6 mb-8 transition-all">
                <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row justify-between items-center gap-5">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto text-center sm:text-right">
                        <Link href={route('academic.exam-schedules.index')} className="group flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 shadow-inner border border-slate-200/60 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300">
                            <ChevronRight size={24} className="text-slate-400 group-hover:text-primary-600 dark:text-slate-500 dark:group-hover:text-primary-400 transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-primary-700 to-primary-500 dark:from-primary-400 dark:to-primary-300 tracking-tight">
                                {examSchedule.title}
                            </h1>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                                <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm mt-1">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" className="sr-only" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
                                        <div className={`block w-8 h-4.5 rounded-full transition-colors duration-300 ease-in-out ${autoSave ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                        <div className={`absolute left-0.5 top-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${autoSave ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className={`text-xs font-bold flex items-center gap-1 transition-colors ${autoSave ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        <Clock size={12} className={autoSave ? 'animate-pulse' : ''} /> حفظ تلقائي
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center xl:justify-end gap-3 w-full xl:w-auto">
                        <div className="relative flex items-center justify-center gap-2 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 px-5 py-2.5 rounded-xl font-bold hover:border-primary-400 hover:shadow-md focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/20 shadow-sm transition-all duration-300 group overflow-hidden cursor-pointer">
                            <Plus size={18} className="text-primary-500 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">إضافة يوم جديد</span>
                            <input 
                                type="date" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                                value={newDateValue} 
                                onChange={handleDateInput} 
                                title="إضافة يوم للاختبارات"
                            />
                        </div>
                        <button 
                            onClick={handleAutoSchedule}
                            className="flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 dark:border-primary-800/50 dark:text-primary-300 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95 group"
                            title="التوزيع التلقائي العادل للمواد"
                        >
                            <Wand size={18} className="text-primary-500 dark:text-primary-400 group-hover:rotate-12 transition-transform" />
                            توزيع تلقائي
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                        >
                            <Printer size={18} className="text-slate-500 dark:text-slate-400" />
                            تصدير ذكي
                        </button>
                        <button 
                            type="button"
                            onClick={saveScheduleToDatabase}
                            disabled={isSaving || autoSave}
                            className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-black transition-all duration-300 active:scale-95 ${
                                autoSave
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 shadow-none'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white border border-primary-700 shadow-[0_4px_15px_rgba(var(--color-primary-600),0.3)] hover:shadow-[0_6px_20px_rgba(var(--color-primary-600),0.4)]'
                            }`}
                            title={autoSave ? "تم تعطيل الزر لأن الحفظ التلقائي يعمل" : ""}
                        >
                            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className={autoSave ? 'opacity-50' : ''} />}
                            {isSaving ? 'جاري الاعتماد...' : 'الاعتماد والنشر'}
                        </button>
                    </div>
                </div>

                {examSchedule.details && (
                    <div className="max-w-[1600px] mx-auto mt-4 mb-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="text-primary-500">📌</span> تعليمات وتفاصيل الاختبار
                        </h2>
                        <div 
                            className="prose prose-sm dark:prose-invert max-w-none prose-slate"
                            dangerouslySetInnerHTML={{ __html: examSchedule.details }}
                        />
                    </div>
                )}
                
                {/* View Mode Toggle and Search Bar */}
                <div className="max-w-[1600px] mx-auto mt-6 mb-6 flex flex-col xl:flex-row items-center justify-between gap-6">
                    
                    {/* Floating Stage Tabs (Glassmorphism) */}
                    {sections.length > 0 && (
                        <div className="flex bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md overflow-x-auto custom-scrollbar w-full xl:w-auto">
                            <button
                                onClick={() => setActiveSection('all')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                                    activeSection === 'all'
                                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                🏫 كل المراحل
                            </button>
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                                        activeSection === section.id
                                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    🏫 {section.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto ml-auto">
                        <div className="relative w-full sm:w-80">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="search"
                                className="block w-full p-3 pr-11 text-sm font-bold text-slate-800 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-slate-800/50 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white dark:focus:bg-slate-800 dark:focus:ring-primary-500/20 dark:focus:border-primary-500 transition-all shadow-sm"
                                placeholder="ابحث عن مادة، قاعة، أو مراقب..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/50 dark:border-slate-700/50 shadow-inner backdrop-blur-sm shrink-0">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <CalendarIcon size={18} />
                                شبكي
                            </button>
                            <button 
                                onClick={() => setViewMode('timeline')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <Clock size={18} />
                                زمني
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="relative rounded-[2rem] bg-white dark:bg-slate-900 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900/80 pointer-events-none"></div>
                    <div className="relative overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-right border-collapse min-w-max bg-transparent">
                            <thead>
                                <tr>
                                    <th className="p-6 font-black text-slate-500 dark:text-slate-400 border-b-2 border-l border-slate-200/80 dark:border-slate-700/80 w-[180px] sticky right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl z-20 shadow-[8px_0_20px_-5px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400 mb-1">
                                                <CalendarIcon size={22} />
                                            </div>
                                            <span className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2 font-bold">التاريخ / الصف</span>
                                        </div>
                                    </th>
                                    {filteredGrades.map(grade => (
                                        <th key={grade.id} className="p-6 border-b-2 border-l border-slate-200/80 dark:border-slate-700/80 align-top bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm min-w-[320px]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-400 border border-white/20 dark:border-slate-700/50 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary-500/25">
                                                    {grade.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 dark:text-white text-xl tracking-tight">{grade.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-300 font-bold mt-1.5 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm inline-flex items-center gap-1.5">
                                                        <Users size={12} className="text-primary-500 dark:text-primary-400" /> {grade.divisions.length} شعب
                                                    </div>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dates.length === 0 ? (
                                    <tr>
                                        <td colSpan={filteredGrades.length + 1} className="p-20 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-40"></div>
                                            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                                                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                                                    <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-2xl opacity-60"></div>
                                                    <div className="relative w-28 h-28 bg-gradient-to-br from-white to-primary-50 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] rotate-3 flex items-center justify-center border border-white dark:border-slate-700 shadow-2xl shadow-primary-500/10 transition-transform hover:rotate-6 hover:scale-105 duration-500">
                                                        <CalendarIcon size={48} className="text-primary-400 dark:text-primary-500 -rotate-3" />
                                                    </div>
                                                </div>
                                                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 mb-3 tracking-tight">الجدول فارغ تماماً</h3>
                                                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-base font-medium leading-relaxed">ابدأ بإضافة اليوم الأول لتوزيع المواد الدراسية على الفصول وإدارة اللجان بكل احترافية وسهولة.</p>
                                                <div className="relative bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(var(--color-primary-600),0.3)] hover:shadow-[0_6px_25px_rgba(var(--color-primary-600),0.4)] hover:-translate-y-1 transition-all duration-300 mx-auto group cursor-pointer overflow-hidden">
                                                    <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                                                    <span className="text-lg tracking-tight">إضافة اليوم الأول للجدول</span>
                                                    <input 
                                                        type="date" 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10" 
                                                        value={newDateValue} 
                                                        onChange={handleDateInput} 
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : dates.map((date) => (
                                    <tr key={date} className="group/row border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                                        <td className="p-6 border-l border-slate-200/80 dark:border-slate-700/80 sticky right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl z-10 align-top shadow-[8px_0_20px_-5px_rgba(0,0,0,0.03)]">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-black text-slate-800 dark:text-white text-2xl tracking-tight">{dayjs(date).locale('ar').format('dddd')}</span>
                                                <span className="text-primary-600 dark:text-primary-400 font-bold text-sm bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg w-fit mt-1 border border-primary-100 dark:border-primary-800/30 shadow-sm">{date}</span>
                                                <button onClick={() => removeDate(date)} className="mt-6 text-xs font-bold text-red-500/70 hover:text-red-600 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/40 px-3 py-2 rounded-xl transition-all w-fit opacity-0 group-hover/row:opacity-100 shadow-sm">
                                                    <Trash2 size={14} /> إزالة اليوم
                                                </button>
                                            </div>
                                        </td>
                                        
                                        {filteredGrades.map(grade => {
                                            const groups = getGroupedItemsForCell(date, grade.id);
                                            
                                            const scheduledDivisions = new Set();
                                            groups.forEach(g => {
                                                g.items.forEach(item => scheduledDivisions.add(item.division_id));
                                            });
                                            const allDivisionsScheduled = grade.divisions && scheduledDivisions.size >= grade.divisions.length;
                                            
                                            return (
                                                <td key={grade.id} className="p-5 border-l border-slate-100 dark:border-slate-700/50 align-top">
                                                    <div className="flex flex-col gap-4 h-full min-h-[160px]">
                                                        {groups.map((group, idx) => {
                                                            const colorClass = getSubjectLightColor(group.subject_id);
                                                            const badgeColor = getSubjectColor(group.subject_id);
                                                            const isMatch = checkMatch(group);
                                                            const dimmingClasses = !isMatch && searchQuery ? 'opacity-20 grayscale scale-95 z-0' : (searchQuery ? 'ring-2 ring-primary-500 shadow-lg scale-105 z-10 bg-white dark:bg-slate-800' : '');
                                                            
                                                            return (
                                                                <div key={idx} className={`relative group/card rounded-3xl p-5 border-2 transition-all duration-500 ${searchQuery && !isMatch ? '' : 'hover:-translate-y-1.5 hover:shadow-xl'} ${colorClass} ${dimmingClasses}`}>
                                                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-3.5 h-3.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${badgeColor.split(' ')[0]}`}></div>
                                                                            <h4 className="font-black text-xl tracking-tight text-slate-800 dark:text-white drop-shadow-sm">{group.subject_name}</h4>
                                                                        </div>
                                                                        
                                                                        <div className="flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-all duration-300 scale-90 group-hover/card:scale-100 z-10 -translate-y-2 group-hover/card:translate-y-0">
                                                                            <button onClick={() => openDrawer(date, grade, group)} className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg transition-all hover:scale-110" title="تعديل">
                                                                                <Edit3 size={16} />
                                                                            </button>
                                                                            <button onClick={() => deleteGroup(group)} className="text-red-500 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg transition-all hover:scale-110" title="حذف">
                                                                                <X size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {((group.start_time || group.end_time) || group.room || group.proctors?.length > 0) && (
                                                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                                                            {(group.start_time || group.end_time) && (
                                                                                <div className="col-span-1 flex items-center gap-2.5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-2.5 rounded-2xl border border-white/40 dark:border-slate-700/30 shadow-sm">
                                                                                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"><Clock size={16} /></div>
                                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.start_time?.substring(0,5) || '?'} - {group.end_time?.substring(0,5) || '?'}</span>
                                                                                </div>
                                                                            )}
                                                                            {group.room && (
                                                                                <div className="col-span-1 flex items-center gap-2.5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-2.5 rounded-2xl border border-white/40 dark:border-slate-700/30 shadow-sm">
                                                                                    <div className="w-8 h-8 rounded-xl bg-purple-100/80 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0"><MapPin size={16} /></div>
                                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{group.room}</span>
                                                                                </div>
                                                                            )}
                                                                            {group.proctors?.length > 0 && (
                                                                                <div className="col-span-full flex items-center gap-2.5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-2.5 rounded-2xl border border-white/40 dark:border-slate-700/30 shadow-sm">
                                                                                    <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0"><Users size={16} /></div>
                                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed truncate">
                                                                                        {group.proctors.map(p => p.name.split(' ')[0]).join('، ')}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-current/5">
                                                                        {group.items.map(i => (
                                                                            <span key={i.id} className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 transition-transform hover:scale-105 cursor-default">
                                                                                {i.division_name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    
                                                                    {group.syllabus && (
                                                                        <div className="mt-3 text-xs font-medium opacity-90 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-current/5 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-help shadow-inner" title={group.syllabus}>
                                                                            <span className="font-bold flex items-center gap-1.5 mb-1.5 opacity-80"><BookOpen size={12}/> المقرر المطلوب:</span>
                                                                            {group.syllabus}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        {!allDivisionsScheduled && (
                                                            <button 
                                                                onClick={() => openDrawer(date, grade)}
                                                                className="flex-1 min-h-[120px] flex flex-col items-center justify-center gap-3 text-sm font-bold text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 rounded-3xl p-4 transition-all duration-300 hover:shadow-inner group/addbtn"
                                                            >
                                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover/addbtn:bg-primary-100 dark:group-hover/addbtn:bg-primary-900/50 group-hover/addbtn:scale-110 transition-transform">
                                                                    <Plus size={20} />
                                                                </div>
                                                                إضافة مادة
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <TimelineView 
                    dates={dates} 
                    grades={filteredGrades} 
                    getGroupedItemsForCell={getGroupedItemsForCell}
                    getSubjectLightColor={getSubjectLightColor}
                    searchQuery={searchQuery}
                    checkMatch={checkMatch}
                />
            )}

            {/* Slide-over Drawer for Adding/Editing */}
                <Transition show={isSlideOverOpen} as={React.Fragment}>
                    <Dialog as="div" className="relative z-50" onClose={() => setIsSlideOverOpen(false)}>
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-10 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                                <Transition.Child
                                    as={React.Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                >
                                    <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl text-right shadow-2xl transition-all sm:my-8 w-full max-w-5xl border border-slate-200/60 dark:border-slate-700/60">
                                        
                                        <div className="px-8 py-6 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                                            <div>
                                                <Dialog.Title className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 tracking-tight">
                                                    {editingItemGroup ? 'تعديل الاختبار' : 'إضافة اختبار جديد'}
                                                </Dialog.Title>
                                                {activeCell && (
                                                    <div className="flex items-center gap-2 mt-2 font-bold">
                                                        <span className="bg-primary-50 text-primary-600 border border-primary-100 dark:border-primary-800/30 dark:bg-primary-900/30 dark:text-primary-400 px-3 py-1 rounded-lg text-sm">{activeCell.date}</span>
                                                        <span className="bg-slate-100 text-slate-600 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-lg text-sm">{activeCell.grade?.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="rounded-full w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:border-red-800/50 dark:hover:text-red-400 transition-all shadow-sm focus:outline-none"
                                                onClick={() => setIsSlideOverOpen(false)}
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                        
                                        <div className="relative px-8 py-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                            <form id="drawer-form" onSubmit={saveCellData} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                
                                                {/* Column 1: Subject & Syllabus */}
                                                <div className="space-y-6">
                                                    {/* Subject Selection Card */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
                                                        <label className="flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-200 mb-5">
                                                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 shadow-inner"><BookOpen size={20} /></div>
                                                            المادة الدراسية
                                                        </label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                                            {subjects.map(s => {
                                                                const isSelected = formData.subject_id == s.id;
                                                                return (
                                                                <div 
                                                                    key={s.id}
                                                                    onClick={() => setFormData({...formData, subject_id: s.id})}
                                                                    className={`cursor-pointer rounded-2xl border-2 p-3 text-center transition-all duration-300 flex items-center justify-center min-h-[4rem] ${isSelected ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 text-primary-700 dark:from-primary-900/60 dark:to-primary-800/30 dark:border-primary-500 dark:text-primary-200 font-black shadow-lg shadow-primary-500/10 transform scale-[1.02]' : 'border-white dark:border-slate-700/40 hover:border-slate-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 font-bold bg-white/50 dark:bg-slate-800/40 shadow-sm'}`}
                                                                >
                                                                    {s.name}
                                                                </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Syllabus */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
                                                        <label className="flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-200 mb-4">
                                                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 shadow-inner"><FileText size={20} /></div>
                                                            المقرر المطلوب (اختياري)
                                                        </label>
                                                        <textarea 
                                                            className="w-full bg-white dark:bg-slate-900/50 border-2 border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all resize-none h-32 text-slate-800 dark:text-slate-200 font-bold placeholder-slate-400 shadow-sm custom-scrollbar" 
                                                            placeholder="مثال: الوحدات من 1 إلى 3، والصفحات 10 إلى 50..."
                                                            value={formData.syllabus}
                                                            onChange={e => setFormData({...formData, syllabus: e.target.value})}
                                                        ></textarea>
                                                    </div>
                                                </div>

                                                {/* Column 2: Time, Divisions, Rooms */}
                                                <div className="space-y-6">
                                                    {/* Time Selection Card */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                                                                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shadow-inner"><Clock size={16} /></div> 
                                                                    وقت البدء
                                                                </label>
                                                                <input 
                                                                    type="time" 
                                                                    className="w-full bg-white dark:bg-slate-900/50 border-2 border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3.5 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-slate-800 dark:text-slate-200 font-bold transition-all shadow-sm text-lg text-center"
                                                                    value={formData.start_time}
                                                                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                                                                    <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shadow-inner"><Clock size={16} /></div>
                                                                    وقت الانتهاء
                                                                </label>
                                                                <input 
                                                                    type="time" 
                                                                    className="w-full bg-white dark:bg-slate-900/50 border-2 border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3.5 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-slate-800 dark:text-slate-200 font-bold transition-all shadow-sm text-lg text-center"
                                                                    value={formData.end_time}
                                                                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Divisions Selection */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl p-6 border-2 border-slate-200/60 dark:border-slate-700/50 relative overflow-hidden shadow-sm">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                                        <div className="relative z-10 flex justify-between items-center mb-5">
                                                            <label className="text-base font-black text-slate-800 dark:text-slate-200">الشعب (الفصول) المستهدفة</label>
                                                            <button 
                                                                type="button" 
                                                                className="text-xs font-bold text-primary-600 hover:text-white dark:text-primary-300 bg-white border border-primary-200 dark:border-primary-800 shadow-sm hover:bg-primary-600 dark:bg-slate-800 dark:hover:bg-primary-600 px-4 py-2 rounded-xl transition-all active:scale-95"
                                                                onClick={() => setFormData({...formData, division_ids: activeCell?.grade?.divisions.map(d=>d.id) || []})}
                                                            >
                                                                تحديد الكل
                                                            </button>
                                                        </div>
                                                        <div className="relative z-10 flex flex-wrap gap-2">
                                                            {activeCell?.grade?.divisions.map(div => {
                                                                const isSelected = formData.division_ids.includes(div.id);
                                                                return (
                                                                    <label key={div.id} className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${isSelected ? 'border-primary-500 bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-md shadow-primary-500/20 transform scale-[1.02]' : 'border-white dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm text-slate-700 dark:text-slate-300 hover:border-primary-300 font-bold'}`}>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="hidden"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleDivisionSelection(div.id)}
                                                                        />
                                                                        <span className={isSelected ? 'font-black' : ''}>{div.name}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                        {formData.division_ids.length === 0 && (
                                                            <div className="relative z-10 mt-5 flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-400 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                                                                <AlertCircle size={20} /> يرجى تحديد شعبة واحدة على الأقل للاختبار
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Room & Proctors Card */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-6">
                                                        <div>
                                                            <label className="flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-200 mb-4">
                                                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-inner"><MapPin size={20} /></div>
                                                                قاعة الاختبار (اختياري)
                                                            </label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="مثال: القاعة الكبرى، قاعة 101..."
                                                                className="w-full bg-white dark:bg-slate-900/50 border-2 border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 font-bold transition-all shadow-sm text-lg"
                                                                value={formData.room}
                                                                onChange={e => setFormData({...formData, room: e.target.value})}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-200 mb-4">
                                                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shadow-inner"><Users size={20} /></div>
                                                                المعلمون المراقبون (اختياري)
                                                            </label>
                                                            <div className="border-2 border-slate-200/60 dark:border-slate-700/60 rounded-2xl bg-white dark:bg-slate-900/30 p-4 max-h-40 overflow-y-auto flex flex-wrap gap-2.5 shadow-inner custom-scrollbar">
                                                                {teachers.map(t => {
                                                                    const isSelected = formData.proctor_ids.includes(t.id);
                                                                    return (
                                                                        <label key={t.id} className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 hover:-translate-y-0.5 ${isSelected ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:border-amber-500/70 dark:text-amber-200 font-black shadow-sm' : 'border-slate-100 dark:border-slate-700/80 hover:border-amber-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold'}`}>
                                                                            <input 
                                                                                type="checkbox" 
                                                                                className="hidden"
                                                                                checked={isSelected}
                                                                                onChange={() => toggleProctorSelection(t.id)}
                                                                            />
                                                                            {t.name}
                                                                        </label>
                                                                    );
                                                                })}
                                                                {teachers.length === 0 && <div className="text-base text-slate-500 p-2 font-bold w-full text-center">لا يوجد معلمون في هذا الفرع</div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="p-6 border-t border-slate-200/60 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl sticky bottom-0 z-20 flex gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                                            <button type="button" onClick={() => setIsSlideOverOpen(false)} className="flex-1 max-w-[200px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black transition-colors shadow-sm text-lg">إلغاء</button>
                                            <button type="submit" form="drawer-form" className="flex-1 bg-gradient-to-l from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 shadow-xl shadow-primary-500/30 text-white py-4 rounded-2xl font-black transition-all active:scale-[0.98] text-lg">
                                                {editingItemGroup ? 'حفظ التعديلات' : 'اعتماد الاختبار'}
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>

                {/* Print Settings Modal - Smart Export Studio */}
                <Transition appear show={isExportModalOpen} as={React.Fragment}>
                    <Dialog as="div" className="relative z-[100]" onClose={() => setIsExportModalOpen(false)}>
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={React.Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95 translate-y-4"
                                    enterTo="opacity-100 scale-100 translate-y-0"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100 translate-y-0"
                                    leaveTo="opacity-0 scale-95 translate-y-4"
                                >
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-right align-middle shadow-2xl transition-all border border-slate-200 dark:border-slate-800">
                                        <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-800/50 px-6 py-8 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mt-10 -mr-10 pointer-events-none"></div>
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-primary-200 dark:border-primary-800/50">
                                                <Printer size={32} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <Dialog.Title as="h3" className="text-2xl font-black text-slate-800 dark:text-white">
                                                مركز التصدير الذكي
                                            </Dialog.Title>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                                خصص مخرجات الجدول قبل الطباعة أو الحفظ كـ PDF
                                            </p>
                                        </div>

                                        <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
                                            {/* Proctors Toggle */}
                                            <div 
                                                className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors cursor-pointer"
                                                onClick={() => setExportSettings(s => ({...s, showProctors: !s.showProctors}))}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                                                        <Users size={20} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200">أسماء المراقبين</div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5">إظهار اللجان والمعلمين</div>
                                                    </div>
                                                </div>
                                                <div className={`text-3xl transition-colors ${exportSettings.showProctors ? 'text-primary-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                    {exportSettings.showProctors ? <ToggleRight size={36} className="fill-primary-500 text-white" /> : <ToggleLeft size={36} />}
                                                </div>
                                            </div>

                                            {/* Rooms Toggle */}
                                            <div 
                                                className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors cursor-pointer"
                                                onClick={() => setExportSettings(s => ({...s, showRooms: !s.showRooms}))}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200">أرقام القاعات</div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5">إظهار أماكن انعقاد الاختبار</div>
                                                    </div>
                                                </div>
                                                <div className={`text-3xl transition-colors ${exportSettings.showRooms ? 'text-primary-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                    {exportSettings.showRooms ? <ToggleRight size={36} className="fill-primary-500 text-white" /> : <ToggleLeft size={36} />}
                                                </div>
                                            </div>

                                            {/* Times Toggle */}
                                            <div 
                                                className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors cursor-pointer"
                                                onClick={() => setExportSettings(s => ({...s, showTimes: !s.showTimes}))}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                                        <Clock size={20} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200">الأوقات والفترات</div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5">إظهار وقت البدء والانتهاء</div>
                                                    </div>
                                                </div>
                                                <div className={`text-3xl transition-colors ${exportSettings.showTimes ? 'text-primary-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                    {exportSettings.showTimes ? <ToggleRight size={36} className="fill-primary-500 text-white" /> : <ToggleLeft size={36} />}
                                                </div>
                                            </div>

                                            {/* Syllabus Toggle */}
                                            <div 
                                                className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors cursor-pointer"
                                                onClick={() => setExportSettings(s => ({...s, showSyllabus: !s.showSyllabus}))}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200">المقرر المطلوب</div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5">إظهار تفاصيل المنهج والصفحات</div>
                                                    </div>
                                                </div>
                                                <div className={`text-3xl transition-colors ${exportSettings.showSyllabus ? 'text-primary-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                    {exportSettings.showSyllabus ? <ToggleRight size={36} className="fill-primary-500 text-white" /> : <ToggleLeft size={36} />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsExportModalOpen(false)} 
                                                className="flex-1 py-3.5 rounded-2xl font-black text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                إلغاء
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={handleExport} 
                                                className="flex-[2] py-3.5 rounded-2xl font-black text-white bg-gradient-to-l from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Download size={20} /> تصدير الآن
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>

        </AdminLayout>
    );
}
