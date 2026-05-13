<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Grade;
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('username', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'type', 'status'])
        ]);
    }

    public function create()
    {
        $grades = Grade::with('divisions')->get();
        return Inertia::render('Users/Create', [
            'grades' => $grades,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['supervisor', 'teacher', 'student'])],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255', 'unique:users'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'username' => ['required', 'string', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            // for supervisor/teacher, they might have sections
            'sections' => ['nullable', 'array'],
            'sections.*' => ['exists:sections,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'phone' => $validated['phone'],
            'gender' => $validated['gender'],
            'type' => $validated['type'],
            'password' => Hash::make($validated['password']),
        ]);

        if (!empty($validated['sections'])) {
            $user->sections()->sync($validated['sections']);
        }

        return redirect()->back()->with('success', 'تم إنشاء المستخدم بنجاح');
    }

    public function edit(User $user)
    {
        $grades = Grade::with('divisions')->get();
        // Get the sections assigned to this user
        // But users have many sections maybe? Wait, what's the relation?
        // User has a 'sections' relationship
        $userSections = [];
        if (method_exists($user, 'sections')) {
            $userSections = $user->sections()->pluck('sections.id')->toArray();
        }

        return Inertia::render('Users/Edit', [
            'grades' => $grades,
            'user' => $user,
            'userSections' => $userSections,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['supervisor', 'teacher', 'student', 'admin'])],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'sections' => ['nullable', 'array'],
            'sections.*' => ['exists:sections,id'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'phone' => $validated['phone'],
            'gender' => $validated['gender'],
            'type' => $validated['type'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if (method_exists($user, 'sections')) {
            if (!empty($validated['sections'])) {
                $user->sections()->sync($validated['sections']);
            } else {
                $user->sections()->detach();
            }
        }

        return redirect()->route('users.index')->with('success', 'تم تحديث بيانات المستخدم بنجاح');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'], // max 10MB
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();

        if ($extension === 'csv') {
            $handle = fopen($file->getRealPath(), 'r');
            $header = true;
            while ($row = fgetcsv($handle, 1000, ',')) {
                if ($header) {
                    $header = false;
                    continue;
                }
                // Expecting Name, Username, Phone, Gender, Type, Password
                if (count($row) >= 6 && !empty($row[1])) {
                    User::updateOrCreate(
                        ['username' => $row[1]],
                        [
                            'name' => $row[0],
                            'phone' => $row[2],
                            'gender' => in_array(strtolower($row[3]), ['male', 'female']) ? strtolower($row[3]) : 'male',
                            'type' => in_array(strtolower($row[4]), ['admin', 'supervisor', 'teacher', 'student']) ? strtolower($row[4]) : 'student',
                            'password' => Hash::make($row[5]),
                            'status' => 'active',
                        ]
                    );
                }
            }
            fclose($handle);
        } else {
            // Excel (.xlsx) using SimpleXLSX
            if ($xlsx = \Shuchkin\SimpleXLSX::parse($file->getRealPath())) {
                foreach ($xlsx->rows() as $index => $row) {
                    if ($index === 0) continue; // Skip header
                    
                    if (count($row) >= 6 && !empty($row[1])) {
                        User::updateOrCreate(
                            ['username' => $row[1]],
                            [
                                'name' => $row[0],
                                'phone' => $row[2],
                                'gender' => in_array(strtolower($row[3]), ['male', 'female']) ? strtolower($row[3]) : 'male',
                                'type' => in_array(strtolower($row[4]), ['admin', 'supervisor', 'teacher', 'student']) ? strtolower($row[4]) : 'student',
                                'password' => Hash::make($row[5]),
                                'status' => 'active',
                            ]
                        );
                    }
                }
            } else {
                return redirect()->back()->withErrors(['file' => \Shuchkin\SimpleXLSX::parseError()]);
            }
        }

        return redirect()->back()->with('success', 'تم استيراد المستخدمين بنجاح!');
    }
}
