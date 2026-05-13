<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    protected $fillable = ['user_id', 'transport_subscription'];

    // بيانات المستخدم الأساسية للطالب (الاسم، كلمة المرور)
    public function user(): BelongsTo { 
        return $this->belongsTo(User::class); 
    }

    // السجل الأكاديمي التاريخي (كل سنوات دراسته)
    public function enrollments(): HasMany { 
        return $this->hasMany(Enrollment::class); 
    }

    // الرصيد المالي وحالة الحساب
    public function financialMapping(): HasOne {
        return $this->hasOne(FinancialMapping::class);
    }

    // جلب أولياء أمور هذا الطالب
    public function parents()
    {
        return $this->belongsToMany(User::class, 'parent_student', 'student_id', 'parent_id')
                    ->withPivot('relationship_type')
                    ->withTimestamps();
    }

    /**
     * دالة مساعدة متقدمة: تجلب "التسجيل الحالي" للطالب فقط
     * بدلاً من جلب كل تاريخه الدراسي
     */
    public function currentEnrollment(): HasOne {
        return $this->hasOne(Enrollment::class)->latestOfMany();
    }
}
