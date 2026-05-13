<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'branch_id', 'role_id', 'name', 'username', 'password', 'is_active'
    ];

    protected $hidden = ['password', 'remember_token'];

    // العلاقات الأساسية
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function role(): BelongsTo { return $this->belongsTo(Role::class); }

    // الرقابة والنشاطات
    public function activityLogs(): HasMany { return $this->hasMany(ActivityLog::class); }
    public function notifications(): HasMany { return $this->hasMany(Notification::class); }

    // جلب الأبناء المرتبطين بولي الأمر هذا
    public function children()
    {
        return $this->belongsToMany(Student::class, 'parent_student', 'parent_id', 'student_id')
                    ->withPivot('relationship_type') // لجلب نوع القرابة (أب، أم)
                    ->withTimestamps();
    }

    // العلاقات الأكاديمية (حسب الدور)
    public function student(): HasOne { return $this->hasOne(Student::class); }
    public function lessonPreparations(): HasMany { return $this->hasMany(LessonPreparation::class, 'teacher_id'); }
    public function classroomVisits(): HasMany { return $this->hasMany(ClassroomVisit::class, 'teacher_id'); }

    /**
     * دالة برمجية للتحقق من امتلاك المستخدم لصلاحية معينة
     */
    public function hasPermission($permissionName): bool
    {
        return $this->role->permissions()->where('name', $permissionName)->exists();
    }
}
