<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermissionModule extends Model
{
    protected $fillable = ['key', 'label', 'is_system'];

    protected $casts = ['is_system' => 'boolean'];

    /** عدد الصلاحيات المرتبطة بهذا القسم */
    public function permissionsCount(): int
    {
        return Permission::where('module', $this->key)->count();
    }

    /** هل القسم فارغ (لا توجد به صلاحيات) */
    public function isEmpty(): bool
    {
        return $this->permissionsCount() === 0;
    }
}
