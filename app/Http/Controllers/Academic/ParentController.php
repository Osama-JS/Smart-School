<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\LaravelPdf\Facades\Pdf;

class ParentController extends Controller
{
    protected function getFilteredParentsQuery(Request $request)
    {
        $query = User::whereHas('role', function ($q) {
            $q->where('name', 'ولي أمر');
        })
            ->with([
                'children.user',
                'children.currentEnrollment.division.grade.section',
            ])
            ->withCount('children');

        // 1. البحث الذكي المجمّع (اسم ولي الأمر، اسم المستخدم، الهوية، الجوال، البريد، أو اسم الابن)
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('national_id', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('children.user', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        // 2. الفلترة الهرمية حسب القسم والصف والشعبة للأبناء
        if ($request->filled('section_id')) {
            $query->whereHas('children.currentEnrollment.division.grade.section', function ($q) use ($request) {
                $q->where('id', $request->section_id);
            });
        }

        if ($request->filled('grade_id')) {
            $query->whereHas('children.currentEnrollment.division.grade', function ($q) use ($request) {
                $q->where('id', $request->grade_id);
            });
        }

        if ($request->filled('division_id')) {
            $query->whereHas('children.currentEnrollment', function ($q) use ($request) {
                $q->where('division_id', $request->division_id);
            });
        }

        // 3. فلتر حالة ارتباط الأبناء
        if ($request->filled('children_filter')) {
            if ($request->children_filter === 'has_children') {
                $query->has('children');
            } elseif ($request->children_filter === 'no_children') {
                $query->doesntHave('children');
            } elseif ($request->children_filter === 'multiple_children') {
                $query->has('children', '>=', 2);
            }
        }

        // 4. فلتر صلة القرابة
        if ($request->filled('relationship_type')) {
            $query->whereHas('children', function ($q) use ($request) {
                $q->where('parent_student.relationship_type', $request->relationship_type);
            });
        }

        // 5. فلتر حالة الحساب
        if ($request->filled('account_status')) {
            if ($request->account_status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->account_status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // 6. فلتر توفر رقم الجوال
        if ($request->filled('phone_status')) {
            if ($request->phone_status === 'with_phone') {
                $query->whereNotNull('phone')->where('phone', '!=', '');
            } elseif ($request->phone_status === 'without_phone') {
                $query->where(function ($q) {
                    $q->whereNull('phone')->orWhere('phone', '');
                });
            }
        }

        // 7. الترتيب
        $sortBy = $request->input('sort_by', 'latest');
        if ($sortBy === 'name_asc') {
            $query->orderBy('name', 'asc');
        } elseif ($sortBy === 'children_desc') {
            $query->orderBy('children_count', 'desc')->orderBy('name', 'asc');
        } elseif ($sortBy === 'oldest') {
            $query->orderBy('id', 'asc');
        } else {
            $query->orderBy('id', 'desc');
        }

        return $query;
    }

    public function index(Request $request)
    {
        $perPage = in_array((int) $request->per_page, [12, 24, 48, 100]) ? (int) $request->per_page : 12;

        $parents = $this->getFilteredParentsQuery($request)
            ->paginate($perPage)
            ->withQueryString();
        $parents->getCollection()->transform(function ($parent) {
            $parent->login_password = $parent->getDecryptedVisiblePassword();
            return $parent;
        });

        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id'))
            ? session('active_branch_id')
            : auth()->user()->branch_id;

        $sections = Section::forBranch($branchId)->with('grades.divisions')->get();

        $baseParentsQuery = User::whereHas('role', function ($q) {
            $q->where('name', 'ولي أمر');
        });

        $stats = [
            'total' => (clone $baseParentsQuery)->count(),
            'active' => (clone $baseParentsQuery)->where('is_active', true)->count(),
            'inactive' => (clone $baseParentsQuery)->where('is_active', false)->count(),
            'has_children' => (clone $baseParentsQuery)->has('children')->count(),
            'no_children' => (clone $baseParentsQuery)->doesntHave('children')->count(),
            'without_phone' => (clone $baseParentsQuery)->where(function ($q) {
                $q->whereNull('phone')->orWhere('phone', '');
            })->count(),
        ];

        $filters = [
            'search' => $request->search ?? '',
            'section_id' => $request->section_id ?? '',
            'grade_id' => $request->grade_id ?? '',
            'division_id' => $request->division_id ?? '',
            'children_filter' => $request->children_filter ?? '',
            'relationship_type' => $request->relationship_type ?? '',
            'account_status' => $request->account_status ?? '',
            'phone_status' => $request->phone_status ?? '',
            'sort_by' => $request->input('sort_by', 'latest'),
            'per_page' => $perPage,
        ];

        return Inertia::render('Academic/Parents/Index', compact('parents', 'sections', 'filters', 'stats'));
    }

    public function create()
    {
        return Inertia::render('Academic/Parents/Create');
    }

    public function store(Request $request)
    {
        $autoGenerate = filter_var($request->input('auto_generate_credentials'), FILTER_VALIDATE_BOOLEAN);

        $rules = [
            'name'        => 'required|string|max:255',
            'email'       => 'nullable|email|unique:users',
            'phone'       => [$autoGenerate ? 'required' : 'nullable', 'string', 'max:20'],
            'national_id' => 'nullable|string|max:50',
            'address'     => 'nullable|string',
            'is_active'   => 'boolean',
        ];

        if (!$autoGenerate) {
            $rules['username'] = 'required|string|max:255|unique:users';
            $rules['password'] = 'required|string|min:8';
        }

        $validated = $request->validate($rules);

        if ($autoGenerate) {
            $existingUser = User::where('username', $validated['phone'])->first();
            if ($existingUser) {
                return redirect()->back()->withErrors(['phone' => 'رقم الجوال هذا مسجل كاسم مستخدم سابقاً. يرجى استخدام رقم آخر أو إدخال بيانات الدخول يدوياً.'])->withInput();
            }
        }

        $parentRole = Role::where('name', 'ولي أمر')->firstOrFail();

        $username = $autoGenerate ? $validated['phone'] : $validated['username'];
        $plainPassword = $autoGenerate ? \Illuminate\Support\Str::password(8, true, true, true, false) : $validated['password'];

        $user = User::create([
            'name'             => $validated['name'],
            'username'         => $username,
            'password'         => Hash::make($plainPassword),
            'visible_password' => $plainPassword,
            'email'            => $validated['email'] ?? null,
            'phone'       => $validated['phone'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'address'     => $validated['address'] ?? null,
            'role_id'     => $parentRole->id,
            'branch_id'   => auth()->user()->branch_id,
            'is_active'   => $validated['is_active'] ?? 1,
        ]);

        if ($autoGenerate) {
            \Illuminate\Support\Facades\Session::flash('generated_credentials', [
                'action'               => 'create',
                'issued_at'            => now()->toIso8601String(),
                'parent_id'            => $user->id,
                'name'                 => $user->name,
                'username'             => $username,
                'password'             => $plainPassword,
                'phone'                => $user->phone ?: '',
                'children_summary'     => '',
                'children_count'       => 0,
                'must_change_password' => false,
                'revoked_tokens'       => false,
            ]);
        }

        return redirect()->route('academic.parents')->with('success', 'تم إضافة حساب ولي الأمر بنجاح.');
    }

    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'username'    => 'required|string|max:255|unique:users',
            'password'    => 'required|string|min:8',
            'phone'       => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
        ]);

        $parentRole = Role::where('name', 'ولي أمر')->firstOrFail();

        $user = User::create([
            'name'             => $validated['name'],
            'username'         => $validated['username'],
            'password'         => Hash::make($validated['password']),
            'visible_password' => $validated['password'],
            'phone'            => $validated['phone'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'role_id'     => $parentRole->id,
            'branch_id'   => auth()->user()->branch_id,
            'is_active'   => 1,
        ]);

        return response()->json([
            'success' => true,
            'parent' => [
                'id' => $user->id,
                'name' => $user->name,
                'national_id' => $user->national_id
            ]
        ]);
    }

    public function edit(User $parent)
    {
        // التأكد من أن المستخدم هو ولي أمر فعلاً
        abort_if($parent->role->name !== 'ولي أمر', 403);
        
        $parent->load('children.user', 'children.currentEnrollment.division.grade');

        return Inertia::render('Academic/Parents/Edit', compact('parent'));
    }

    public function update(Request $request, User $parent)
    {
        abort_if($parent->role->name !== 'ولي أمر', 403);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'username'    => ['required', 'string', 'max:255', Rule::unique('users')->ignore($parent->id)],
            'password'    => 'nullable|string|min:8',
            'email'       => ['nullable', 'email', Rule::unique('users')->ignore($parent->id)],
            'phone'       => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
            'address'     => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $parent->name = $validated['name'];
        $parent->username = $validated['username'];
        $parent->email = $validated['email'] ?? null;
        $parent->phone = $validated['phone'] ?? null;
        $parent->national_id = $validated['national_id'] ?? null;
        $parent->address = $validated['address'] ?? null;
        $parent->is_active = $validated['is_active'] ?? 1;

        if (!empty($validated['password'])) {
            $parent->password = Hash::make($validated['password']);
            $parent->visible_password = $validated['password'];
        }

        $parent->save();

        return redirect()->route('academic.parents')->with('success', 'تم تحديث بيانات ولي الأمر بنجاح.');
    }

    public function resetPassword(Request $request, User $parent)
    {
        abort_if($parent->role->name !== 'ولي أمر', 403);

        $validated = $request->validate([
            'mode'                 => ['nullable', 'in:auto,manual'],
            'style'                => ['nullable', 'in:digits,alnum'],
            'password'             => ['required_if:mode,manual', 'nullable', 'string', 'min:4', 'max:50', 'confirmed'],
            'must_change_password' => ['nullable', 'boolean'],
            'revoke_tokens'        => ['nullable', 'boolean'],
            'open_print_modal'     => ['nullable', 'boolean'],
        ], [
            'password.required_if' => 'يرجى إدخال كلمة المرور الجديدة.',
            'password.min'         => 'كلمة المرور يجب أن تكون 4 خانات على الأقل.',
            'password.max'         => 'كلمة المرور يجب ألا تتجاوز 50 خانة.',
            'password.confirmed'   => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        $mode = $validated['mode'] ?? 'auto';
        $style = $validated['style'] ?? 'digits';
        $mustChange = (bool) ($validated['must_change_password'] ?? false);
        $revokeTokens = (bool) ($validated['revoke_tokens'] ?? false);
        $openPrintModal = array_key_exists('open_print_modal', $validated) ? (bool) $validated['open_print_modal'] : true;

        if ($mode === 'manual') {
            $plainPassword = $validated['password'];
        } elseif ($style === 'alnum') {
            $letters = 'abcdefghjkmnpqrstuvwxyz';
            $plainPassword = $letters[random_int(0, strlen($letters) - 1)]
                . $letters[random_int(0, strlen($letters) - 1)]
                . random_int(1000, 9999);
        } else {
            $plainPassword = (string) random_int(100000, 999999);
        }

        $parent->update([
            'password'             => Hash::make($plainPassword),
            'visible_password'     => $plainPassword,
            'must_change_password' => $mustChange,
        ]);

        if ($revokeTokens) {
            $parent->tokens()->delete();
        }

        $parent->loadMissing(['children.user', 'children.currentEnrollment.division.grade']);
        $childrenSummary = $parent->children->map(function ($child) {
            $childName = $child->user?->name ?? 'طالب';
            $gradeName = $child->currentEnrollment?->division?->grade?->name;
            $divisionName = $child->currentEnrollment?->division?->name;
            if ($gradeName && $divisionName) {
                return "{$childName} ({$gradeName} - {$divisionName})";
            }
            if ($gradeName) {
                return "{$childName} ({$gradeName})";
            }
            return $childName;
        })->implode(' ، ');

        if ($openPrintModal) {
            \Illuminate\Support\Facades\Session::flash('generated_credentials', [
                'action'               => 'reset',
                'issued_at'            => now()->toIso8601String(),
                'parent_id'            => $parent->id,
                'name'                 => $parent->name,
                'username'             => $parent->username ?: ($parent->national_id ?: ''),
                'password'             => $plainPassword,
                'phone'                => $parent->phone ?: '',
                'children_summary'     => $childrenSummary,
                'children_count'       => $parent->children->count(),
                'must_change_password' => $mustChange,
                'revoked_tokens'       => $revokeTokens,
            ]);
        }

        return redirect()->back()->with('success', 'تم إعادة تعيين كلمة المرور بنجاح.');
    }

    public function bulkResetPassword(Request $request)
    {
        set_time_limit(300);

        $validated = $request->validate([
            'target_scope'    => ['nullable', 'in:all_filtered,missing_only'],
            'password_mode'   => ['nullable', 'in:digits_6,alnum_8,manual'],
            'manual_password' => ['required_if:password_mode,manual', 'nullable', 'string', 'min:4', 'max:50'],
        ], [
            'manual_password.required_if' => 'يرجى إدخال كلمة المرور الموحدة.',
            'manual_password.min'         => 'كلمة المرور يجب ألا تقل عن 4 خانات.',
        ]);

        $targetScope = $validated['target_scope'] ?? 'all_filtered';
        $passwordMode = $validated['password_mode'] ?? 'digits_6';
        $manualPassword = $validated['manual_password'] ?? null;

        $parents = $this->getFilteredParentsQuery($request)->get();

        if ($targetScope === 'missing_only') {
            $parents = $parents->filter(function (User $parent) {
                return empty($parent->getDecryptedVisiblePassword());
            })->values();
        }

        if ($parents->isEmpty()) {
            return redirect()->back()->with('success', 'لا توجد حسابات أولياء أمور تحتاج إلى إعادة تعيين كلمة المرور ضمن النطاق المحدد.');
        }

        $updatedCount = 0;

        DB::transaction(function () use ($parents, $passwordMode, $manualPassword, &$updatedCount) {
            foreach ($parents as $parent) {
                if ($passwordMode === 'manual') {
                    $plainPassword = $manualPassword;
                } elseif ($passwordMode === 'alnum_8') {
                    $plainPassword = \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(3))
                        . str_pad((string) random_int(10000, 99999), 5, '0', STR_PAD_LEFT);
                } else {
                    // digits_6 (default, e.g. 347559)
                    $plainPassword = (string) random_int(100000, 999999);
                }

                $parent->update([
                    'password'         => Hash::make($plainPassword),
                    'visible_password' => $plainPassword,
                ]);

                $updatedCount++;
            }
        });

        return redirect()->back()->with('success', "تم إعادة تعيين وحفظ كلمة المرور لـ {$updatedCount} من أولياء الأمور بنجاح. يمكنك الآن طباعة بطاقات الدخول PDF.");
    }

    public function destroy(User $parent)
    {
        abort_if($parent->role->name !== 'ولي أمر', 403);

        $parent->delete();

        return redirect()->route('academic.parents')->with('success', 'تم حذف حساب ولي الأمر.');
    }

    public function downloadCredentialsPdf(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $query = $this->getFilteredParentsQuery($request);
        if ($request->filled('parent_ids')) {
            $ids = is_array($request->parent_ids) ? $request->parent_ids : explode(',', (string) $request->parent_ids);
            $query->whereIn('id', array_filter(array_map('intval', $ids)));
        }

        $parents = $query
            ->with(['branch'])
            ->get();

        $googlePlayUrl = \App\Models\Setting::get('google_play_url', '');
        $appStoreUrl = \App\Models\Setting::get('app_store_url', '');
        $qrTargetUrl = $googlePlayUrl ?: ($appStoreUrl ?: url('/login'));

        $cards = $parents->map(function ($parent) {
            $childrenSummary = $parent->children->map(function ($child) {
                $childName = $child->user?->name ?? 'طالب';
                $gradeName = $child->currentEnrollment?->division?->grade?->name;
                $divisionName = $child->currentEnrollment?->division?->name;
                if ($gradeName && $divisionName) {
                    return "{$childName} ({$gradeName} - {$divisionName})";
                }
                if ($gradeName) {
                    return "{$childName} ({$gradeName})";
                }
                return $childName;
            })->implode(' ، ');

            return [
                'name' => $parent->name ?? '---',
                'username' => $parent->username ?: ($parent->national_id ?: '---'),
                'password' => $parent->getDecryptedVisiblePassword(),
                'phone' => $parent->phone ?: '---',
                'children_summary' => $childrenSummary ?: 'لا يوجد أبناء مرتبطين',
                'children_count' => $parent->children->count(),
                'school_phone' => $parent->branch?->phone ?: '774804804',
                'whatsapp_phone' => $parent->branch?->phone ?: '774804804',
            ];
        })->values();

        $footerHtml = '
            <div style="width:100%; font-family: Arial, Tahoma, sans-serif; font-size: 9px; color: #5b6e4d; text-align: center; padding: 4px 16px;">
                صفحة <span class="pageNumber"></span> من <span class="totalPages"></span>
            </div>
        ';

        $browserCandidates = [
            'C:\Program Files\Google\Chrome\Application\chrome.exe',
            'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
            'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
            'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        ];
        $chromePath = collect($browserCandidates)->first(fn ($path) => file_exists($path))
            ?? 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe';

        $fileName = 'parents-credentials-' . now()->format('Y-m-d') . '.pdf';
        $tempPath = storage_path('app/temp-' . uniqid('parents-cred-', true) . '.pdf');

        Pdf::view('pdf.academic.parent-credentials', [
            'cards' => $cards,
            'qrTargetUrl' => $qrTargetUrl,
            'googlePlayUrl' => $googlePlayUrl,
            'appStoreUrl' => $appStoreUrl,
            'generatedAt' => now()->format('Y-m-d H:i'),
        ])
            ->format('A4')
            ->margins(10, 10, 18, 10)
            ->footerHtml($footerHtml)
            ->withBrowsershot(function ($browsershot) use ($chromePath) {
                $browsershot->setOption('args', ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
                    ->setChromePath($chromePath)
                    ->timeout(300)
                    ->protocolTimeout(300);
            })
            ->save($tempPath);

        return response()->download($tempPath, $fileName)->deleteFileAfterSend(true);
    }
}
