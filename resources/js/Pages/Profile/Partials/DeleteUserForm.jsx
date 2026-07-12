import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { AlertTriangle, Trash2, X, Lock } from 'lucide-react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
                    <AlertTriangle size={24} strokeWidth={2} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">
                        حذف الحساب
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        بمجرد حذف حسابك، سيتم مسح جميع بياناتك نهائياً ولن تتمكن من استعادتها.
                    </p>
                </div>
            </header>

            <button 
                onClick={confirmUserDeletion}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-100 dark:bg-rose-500/10 hover:bg-rose-200 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl font-bold transition-all duration-300"
            >
                <Trash2 size={18} />
                حذف الحساب نهائياً
            </button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 shrink-0">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                                هل أنت متأكد من رغبتك في حذف الحساب؟
                            </h2>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                بمجرد حذف الحساب، سيتم إزالة جميع بياناتك ومواردك بشكل دائم. 
                                يرجى إدخال كلمة المرور الخاصة بك لتأكيد رغبتك في الحذف.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 relative group">
                        <InputLabel
                            htmlFor="password"
                            value="كلمة المرور"
                            className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"
                        >
                            <Lock size={16} className="text-rose-500" />
                            كلمة المرور
                        </InputLabel>

                        <div className="relative flex items-center">
                            <div className="absolute right-3 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                                <Lock size={20} strokeWidth={2} />
                            </div>
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="block w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-rose-500 focus:border-rose-500 transition-all duration-300 pr-11 py-2.5"
                                isFocused
                                placeholder="أدخل كلمة المرور لتأكيد الحذف"
                            />
                        </div>

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={closeModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X size={18} />
                            إلغاء
                        </button>

                        <button 
                            type="submit" 
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all duration-300 disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                            تأكيد الحذف
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
