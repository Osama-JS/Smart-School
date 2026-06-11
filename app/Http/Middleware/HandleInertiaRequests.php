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
        $userPermissions = [];

        if ($user) {
            $user->loadMissing(['role.permissions', 'branch']);
            $isAdmin = $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);
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
            'logo_url' => asset('images/logo.png') . '?v=' . (file_exists(public_path('images/logo.png')) ? filemtime(public_path('images/logo.png')) : time()),
        ];
    }
}
