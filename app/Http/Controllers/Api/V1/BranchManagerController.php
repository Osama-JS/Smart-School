<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;

class BranchManagerController extends Controller
{
    /**
     * جلب قائمة مدراء الفروع
     */
    public function index()
    {
        $managers = User::with('branch')
            ->whereHas('role', function ($query) {
                $query->where('name', 'مدير فرع'); // أو استخدام الـ ID الخاص بالدور
            })
            ->get();

        return response()->json([
            'status' => true,
            'data' => $managers
        ]);
    }
}
