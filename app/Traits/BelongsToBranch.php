<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToBranch
{
    // علم برمجى لمنع التكرار اللانهائي (Infinite Recursion) عند جلب بيانات المستخدم المسجل
    protected static $resolvingBranchScope = false;

    protected static function bootBelongsToBranch()
    {
        static::addGlobalScope('branch_isolation', function (Builder $builder) {
            // إذا كنا نقوم حالياً بحل الصلاحية أو جلب المستخدم المسجل، نتخطى الفلترة لتجنب الدوران اللانهائي
            if (static::$resolvingBranchScope) {
                return;
            }

            static::$resolvingBranchScope = true;

            try {
                if (auth()->check()) {
                    $user = auth()->user();
                    
                    // إذا كان مدير نظام أو مدير الفرع وقام باختيار محاكاة فرع معين عبر الجلسة (Session)
                    if ($user->role && $user->role->name === 'مدير الفرع' && request()->hasSession() && session()->has('active_branch_id')) {
                        $builder->where($builder->getQuery()->from . '.branch_id', session('active_branch_id'));
                    } 
                    // إذا لم يكن مديراً عاماً (مثل معلم، موظف، طالب)، نقصر البيانات على فرعه الخاص به فقط
                    elseif ($user->role && $user->role->name !== 'مدير الفرع' && $user->role->name !== 'مدير النظام') {
                        $builder->where($builder->getQuery()->from . '.branch_id', $user->branch_id);
                    }
                }
            } finally {
                static::$resolvingBranchScope = false;
            }
        });

        // عند إنشاء أي سجل جديد، يتم ربطه تلقائياً بفرع المستخدم
        static::creating(function ($model) {
            if (static::$resolvingBranchScope) {
                return;
            }

            static::$resolvingBranchScope = true;

            try {
                if (auth()->check() && !$model->branch_id) {
                    $model->branch_id = auth()->user()->branch_id;
                }
            } finally {
                static::$resolvingBranchScope = false;
            }
        });
    }

    /**
     * العلاقة مع الفرع التابع له هذا النموذج
     */
    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class, 'branch_id');
    }
}
