<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * DisciplineAndGamificationPermissionsSeeder
 * ─────────────────────────────────────────────────────────────────────────────
 * يُنشئ ويُسند جميع الصلاحيات التفصيلية لوحدتي:
 *  1. التلعيب وإنجازات الطلاب (Gamification)
 *  2. الانضباط، الاستدعاءات والتعهدات (Student Discipline)
 *
 * الخوارزمية:
 *  أ) إنشاء الصلاحية العامة (Parent).
 *  ب) إنشاء الصلاحيات التفصيلية (Granular).
 *  ج) مزامنة ومنح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع".
 * ─────────────────────────────────────────────────────────────────────────────
 */
class DisciplineAndGamificationPermissionsSeeder extends Seeder
{
    private array $permissionsMap = [

        // ── 1. إنجازات الطلاب والتلعيب (Student Gamification) ──
        'إدارة إنجازات الطلاب' => [
            'module'   => 'academic',
            'children' => [
                'عرض إنجازات الطلاب',
                'إضافة إنجاز لطالب',
                'تعديل إنجاز طالب',
                'حذف إنجاز طالب',
                'اعتماد إنجازات الطلاب',
                'طباعة شهادة التميز',
                'إدارة أنواع الإنجازات',
                'إعدادات التلعيب والشارات',
            ],
        ],

        // ── 2. الانضباط السلوكي للطلاب (Student Discipline) ──
        'إدارة انضباط الطلاب' => [
            'module'   => 'academic',
            'children' => [
                'عرض سجلات الانضباط',
                'إضافة مخالفة سلوكية',
                'تعديل مخالفة سلوكية',
                'حذف مخالفة سلوكية',
                'إعدادات أنواع المخالفات السلوكية',
                // استدعاءات أولياء الأمور
                'عرض الاستدعاءات',
                'إضافة استدعاء',
                'تعديل استدعاء',
                'حذف استدعاء',
                'طباعة الاستدعاء',
                // تعهدات الطلاب
                'عرض التعهدات',
                'إضافة تعهد',
                'تعديل تعهد',
                'حذف تعهد',
                'توقيع التعهد',
                'طباعة التعهد',
            ],
        ],
    ];

    /**
     * الأدوار الوحيدة التي تحصل على جميع الصلاحيات تلقائياً.
     */
    private array $fullAccessRoles = [
        'مدير النظام',
        'مدير الفرع',
    ];

    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════╗');
        $this->command->info('║   DisciplineAndGamificationPermissionsSeeder         ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');

        // ── الخطوة 1: إنشاء الصلاحيات العامة (Parents) ──
        $this->command->info('🔧 [1/3] إنشاء الصلاحيات العامة (Parent Permissions)...');
        $createdParents = 0;

        foreach ($this->permissionsMap as $parentName => $config) {
            $perm = Permission::firstOrCreate(
                ['name'   => $parentName],
                ['module' => $config['module']]
            );
            if ($perm->wasRecentlyCreated) {
                $this->command->line("   ✅ تم إنشاء: {$parentName}");
                $createdParents++;
            } else {
                $this->command->line("   ✔  موجودة بالفعل: {$parentName}");
            }
        }
        $this->command->info("   > إجمالي الصلاحيات العامة المُضافة حديثاً: {$createdParents}\n");

        // ── الخطوة 2: إنشاء الصلاحيات التفصيلية (Children) ──
        $this->command->info('🔧 [2/3] إنشاء الصلاحيات التفصيلية (Granular Permissions)...');
        $createdChildren = 0;

        foreach ($this->permissionsMap as $parentName => $config) {
            foreach ($config['children'] as $childName) {
                $child = Permission::firstOrCreate(
                    ['name' => $childName],
                    ['module' => $config['module']]
                );

                if ($child->wasRecentlyCreated) {
                    $this->command->line("   ✅ تم إنشاء: {$childName} (تابع لـ {$parentName})");
                    $createdChildren++;
                }
            }
        }
        $this->command->info("   > إجمالي الصلاحيات التفصيلية المُضافة حديثاً: {$createdChildren}\n");

        // ── الخطوة 3: إسناد الصلاحيات (Assignment) ──
        $this->command->info('🔧 [3/3] إسناد الصلاحيات للمديرين...');

        $allPermissionIds = [];
        foreach ($this->permissionsMap as $parentName => $config) {
            // Parent
            $p = Permission::where('name', $parentName)->first();
            if ($p) $allPermissionIds[] = $p->id;

            // Children
            $children = Permission::whereIn('name', $config['children'])->pluck('id')->toArray();
            $allPermissionIds = array_merge($allPermissionIds, $children);
        }
        $allPermissionIds = array_unique($allPermissionIds);

        foreach ($this->fullAccessRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                // نستخدم syncWithoutDetaching بدلاً من sync لكي لا نحذف الصلاحيات القديمة
                $role->permissions()->syncWithoutDetaching($allPermissionIds);
                $this->command->line("   ✅ تم منح كافة الصلاحيات إلى دور: {$roleName}");
            } else {
                $this->command->line("   ⚠️  الدور '{$roleName}' غير موجود بقاعدة البيانات.");
            }
        }

        $this->command->info("\n🚀 تمت عملية تسجيل صلاحيات الانضباط والتلعيب بنجاح!\n");
    }
}
