<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeRequest extends Model
{
    use HasFactory;
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'employee_id',
        'branch_id',
        'type',
        'status',
        'details',
        'employee_notes',
        'employee_signature',
        'manager_id',
        'manager_signature',
        'manager_notes',
        'reviewed_at',
    ];

    protected $casts = [
        'details'     => 'array',
        'reviewed_at' => 'datetime',
    ];

    protected $appends = [
        'employee_signature_url',
        'manager_signature_url',
        'type_label',
        'status_label',
    ];

    const TYPES = [
        'leave'       => 'طلب إجازة',
        'permission'  => 'طلب استئذان',
        'loan'        => 'طلب سلفة',
        'maintenance' => 'طلب صيانة',
        'supplies'    => 'طلب مستلزمات',
        'certificate' => 'طلب شهادة راتب / إفادة',
    ];

    const STATUSES = [
        'pending'  => 'معلق',
        'approved' => 'معتمد',
        'rejected' => 'مرفوض',
    ];

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getEmployeeSignatureUrlAttribute(): ?string
    {
        return $this->employee_signature ? asset('storage/' . $this->employee_signature) : null;
    }

    public function getManagerSignatureUrlAttribute(): ?string
    {
        return $this->manager_signature ? asset('storage/' . $this->manager_signature) : null;
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }
}
