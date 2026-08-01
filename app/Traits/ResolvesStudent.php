<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait ResolvesStudent
{
    /**
     * Resolves the student for the current user.
     * If the user is a student, returns the student record.
     * If the user is a parent, returns the requested child (or the first child by default),
     * and also returns the list of all children so the frontend can render a child selector.
     * 
     * @return array [Student|null $student, Collection|null $children]
     */
    protected function resolveStudent(Request $request)
    {
        $user = auth()->user();
        
        if ($user->role->name === 'طالب' && $user->student) {
            return [$user->student, null];
        }
        
        if ($user->role->name === 'ولي أمر') {
            $children = $user->children()->with('user')->get();
            if ($children->isEmpty()) {
                return [null, collect([])];
            }
            
            $childId = $request->query('child_id');
            $student = $childId ? $children->firstWhere('id', $childId) : $children->first();
            
            if (!$student) {
                $student = $children->first();
            }
            
            return [$student, $children];
        }
        
        abort(403);
    }
}
