<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Traits\ResolvesStudent;

class MyStudyPlanController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);

        return Inertia::render('Student/StudyPlans/Index', [
            'plans' => [],
            'children' => $children,
            'activeChildId' => $student ? $student->id : null,
        ]);
    }
}

