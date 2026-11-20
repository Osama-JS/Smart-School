<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Services\TimetableImportService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class TimetableImportController extends Controller implements HasMiddleware
{
    public function __construct(private readonly TimetableImportService $importService)
    {
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:إسناد المعلمين'),
        ];
    }

    public function context(Request $request)
    {
        $validated = $request->validate([
            'semester_id' => 'nullable|integer|exists:semesters,id',
        ]);

        $branchId = $this->importService->resolveBranchId($request->user());
        $semesterId = isset($validated['semester_id']) ? (int) $validated['semester_id'] : null;

        return response()->json(
            $this->importService->getImportContext($branchId, $semesterId)
        );
    }

    public function cloneSource(Request $request)
    {
        $validated = $request->validate([
            'source_semester_id' => 'required|integer|exists:semesters,id',
            'division_ids'       => 'nullable|array',
            'division_ids.*'     => 'integer',
        ]);

        $branchId = $this->importService->resolveBranchId($request->user());
        $slots = $this->importService->getCloneSourceSlots(
            $branchId,
            (int) $validated['source_semester_id'],
            $validated['division_ids'] ?? []
        );

        return response()->json(['slots' => $slots]);
    }

    public function validateImport(Request $request)
    {
        $validated = $this->validatePayload($request);
        $branchId = $this->importService->resolveBranchId($request->user());

        $result = $this->importService->validateAndPrepare(
            $validated['items'],
            (int) $validated['semester_id'],
            $validated['mode'],
            $validated['scope'],
            isset($validated['scope_id']) ? (int) $validated['scope_id'] : null,
            $branchId
        );

        return response()->json([
            'valid'      => $result['valid'],
            'summary'    => $result['summary'],
            'row_errors' => $result['row_errors'],
            'warnings'   => $result['warnings'],
        ]);
    }

    public function import(Request $request)
    {
        $validated = $this->validatePayload($request);
        $branchId = $this->importService->resolveBranchId($request->user());

        $summary = $this->importService->executeImport(
            $validated['items'],
            (int) $validated['semester_id'],
            $validated['mode'],
            $validated['scope'],
            isset($validated['scope_id']) ? (int) $validated['scope_id'] : null,
            $branchId,
            (int) $request->user()->id
        );

        $message = "تم استيراد {$summary['total']} حصة بنجاح في {$summary['divisions_count']} شعبة.";

        if ($request->expectsJson() && !$request->header('X-Inertia')) {
            return response()->json([
                'status'  => true,
                'summary' => $summary,
                'message' => $message,
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'semester_id'          => 'required|integer|exists:semesters,id',
            'mode'                 => 'required|in:merge,replace',
            'scope'                => 'required|in:file_divisions,division,grade,section,branch',
            'scope_id'             => 'nullable|integer',
            'items'                => 'required|array|min:1|max:5000',
            'items.*.row_number'   => 'nullable|integer',
            'items.*.division_id'  => 'required|integer',
            'items.*.day_of_week'  => 'required|string|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'items.*.period_id'    => 'required|integer',
            'items.*.subject_id'   => 'required|integer',
            'items.*.teacher_id'   => 'required|integer',
        ]);
    }
}
