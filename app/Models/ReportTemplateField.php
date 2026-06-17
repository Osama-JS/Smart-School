<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportTemplateField extends Model
{
    use \App\Traits\LogsActivity;

    use HasFactory;

    protected $fillable = [
        'report_template_id', 'name', 'type', 'options', 'is_required', 'order'
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
    ];

    public function template()
    {
        return $this->belongsTo(ReportTemplate::class, 'report_template_id');
    }
}
