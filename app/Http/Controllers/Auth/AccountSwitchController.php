<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountSwitchController extends Controller
{
    /**
     * جلب الحسابات المرتبطة للمستخدم الحالي
     */
    public function getLinkedAccounts(Request $request)
    {
        $user = $request->user();
        $linkedAccounts = $user->getLinkedAccounts();

        return response()->json([
            'success' => true,
            'data' => $linkedAccounts
        ]);
    }

    /**
     * التبديل السريع إلى حساب مرتبط في فرع آخر (Web)
     */
    public function switchAccount(Request $request, User $user)
    {
        $currentUser = $request->user();

        // التحقق من أن الحساب المطلوب هو بالفعل حساب مرتبط
        $linkedAccounts = $currentUser->getLinkedAccounts();
        $isLinked = $linkedAccounts->contains('id', $user->id);

        if (!$isLinked) {
            abort(403, 'غير مصرح لك بالتبديل إلى هذا الحساب.');
        }

        if (!$user->is_active) {
            return back()->with('error', 'هذا الحساب معطل حالياً.');
        }

        // تسجيل الدخول بالحساب الجديد
        Auth::login($user);
        $request->session()->regenerate();

        $branchName = $user->branch ? $user->branch->name : 'الفرع المحدد';

        return redirect()->route('dashboard')->with('success', "تم التبديل بنجاح إلى فرع ($branchName).");
    }
}
