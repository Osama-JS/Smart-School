<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GamificationTier;
use App\Models\GamificationBadge;
use App\Models\Branch;

class GamificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            // إضافة المستويات الافتراضية إذا لم تكن موجودة
            if (GamificationTier::where('branch_id', $branch->id)->count() === 0) {
                GamificationTier::insert([
                    [
                        'branch_id' => $branch->id,
                        'name' => 'ألماسي',
                        'min_points' => 500,
                        'icon' => 'Award',
                        'color_class' => 'bg-cyan-50 text-cyan-600 border-cyan-200',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'branch_id' => $branch->id,
                        'name' => 'ذهبي',
                        'min_points' => 300,
                        'icon' => 'Trophy',
                        'color_class' => 'bg-amber-50 text-amber-600 border-amber-200',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'branch_id' => $branch->id,
                        'name' => 'فضي',
                        'min_points' => 100,
                        'icon' => 'Medal',
                        'color_class' => 'bg-slate-100 text-slate-700 border-slate-300',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'branch_id' => $branch->id,
                        'name' => 'برونزي',
                        'min_points' => 0,
                        'icon' => 'Award',
                        'color_class' => 'bg-orange-50 text-orange-700 border-orange-200',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ]);
            }

            // إضافة الشارات الافتراضية إذا لم تكن موجودة
            if (GamificationBadge::where('branch_id', $branch->id)->count() === 0) {
                GamificationBadge::insert([
                    [
                        'branch_id' => $branch->id,
                        'name' => 'العبقري',
                        'description' => 'لتحقيق 3 إنجازات أكاديمية متتالية',
                        'category_target' => 'أكاديمي',
                        'required_count' => 3,
                        'icon' => 'Brain',
                        'color_class' => 'bg-blue-50 text-blue-500 border-blue-200',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'branch_id' => $branch->id,
                        'name' => 'المبادر',
                        'description' => 'لتميزه بـ 3 مبادرات سلوكية إيجابية',
                        'category_target' => 'سلوكي',
                        'required_count' => 3,
                        'icon' => 'Star',
                        'color_class' => 'bg-amber-50 text-amber-500 border-amber-200',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'branch_id' => $branch->id,
                        'name' => 'البطل',
                        'description' => 'لتحقيق 3 إنجازات وبطولات رياضية',
                        'category_target' => 'رياضي',
                        'required_count' => 3,
                        'icon' => 'Trophy',
                        'color_class' => 'bg-orange-50 text-orange-500 border-orange-200',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'branch_id' => $branch->id,
                        'name' => 'القدوة',
                        'description' => 'لتميزه بـ 3 إنجازات دينية أو أخلاقية',
                        'category_target' => 'ديني',
                        'required_count' => 3,
                        'icon' => 'Heart',
                        'color_class' => 'bg-emerald-50 text-emerald-500 border-emerald-200',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ]);
            }
        }
    }
}
