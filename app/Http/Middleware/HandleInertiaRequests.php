<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $isAdmin = false;
        $isAdmin = false;
        $isSystemAdmin = false;
        $userPermissions = [];

        if ($user) {
            $user->loadMissing(['role.permissions', 'branch']);
            $isAdmin = $user->role && $user->role->name === 'مدير الفرع';
            $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';
            if ($user->role) {
                $userPermissions = $user->role->permissions->pluck('name')->toArray();
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'permissions' => $userPermissions,
            ],
            'isAdmin' => $isAdmin,
            'isSystemAdmin' => $isSystemAdmin,
            'logo_url' => asset('images/logo.png') . '?v=' . (file_exists(public_path('images/logo.png')) ? filemtime(public_path('images/logo.png')) : time()),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'asset_url' => rtrim(asset(''), '/'),
        ];
    }
}
