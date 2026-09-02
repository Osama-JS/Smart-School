<?php

// 1. Modify Controller
$controllerPath = 'c:\xampp\htdocs\Smart-School\app\Http\Controllers\StudentAttendanceController.php';
$controllerContent = file_get_contents($controllerPath);

// We want to add the classAttendanceReport method right before classReports
$classReportsPos = strpos($controllerContent, 'public function classReports');
if ($classReportsPos !== false) {
    // Extract the classReports method to duplicate it
    $endOfClassReports = strpos($controllerContent, 'public function storeClassAttendance', $classReportsPos);
    $classReportsMethod = substr($controllerContent, $classReportsPos, $endOfClassReports - $classReportsPos);
    
    // Create classAttendanceReport method
    $classAttendanceReportMethod = str_replace('function classReports', 'function classAttendanceReport', $classReportsMethod);
    $classAttendanceReportMethod = str_replace("render('Academic/Attendances/ClassReports'", "render('Academic/Attendances/ClassAttendanceReport'", $classAttendanceReportMethod);
    
    $controllerContent = substr_replace($controllerContent, $classAttendanceReportMethod . "\n    ", $classReportsPos, 0);
    file_put_contents($controllerPath, $controllerContent);
    echo "Controller updated.\n";
}

// 2. Modify routes
$routesPath = 'c:\xampp\htdocs\Smart-School\routes\web.php';
$routesContent = file_get_contents($routesPath);

if (strpos($routesContent, 'academic.attendances.class-report') === false) {
    $routeToAdd = "        Route::get('/academic/class-attendances-report', [\App\Http\Controllers\StudentAttendanceController::class, 'classAttendanceReport'])->name('academic.attendances.class-report');\n";
    $routesContent = str_replace("Route::get('/academic/class-attendances'", $routeToAdd . "        Route::get('/academic/class-attendances'", $routesContent);
    file_put_contents($routesPath, $routesContent);
    echo "Routes updated.\n";
}

// 3. Modify Center.jsx
$centerPath = 'c:\xampp\htdocs\Smart-School\resources\js\Pages\Reports\Center.jsx';
$centerContent = file_get_contents($centerPath);
if (strpos($centerContent, "academic.attendances.class-report") === false) {
    $reportToAdd = <<<EOT
                {
                    name: 'تقرير الغياب بالحصص',
                    description: 'تقرير تفصيلي لغياب الطلاب بالحصص مخصص للطباعة',
                    icon: CheckSquare,
                    url: route('academic.attendances.class-report'),
                    permission: 'إدارة الطلاب',
                },
EOT;
    $centerContent = str_replace("url: route('academic.attendances.classes'),", "url: route('academic.attendances.classes'),\n                },\n" . $reportToAdd, $centerContent);
    // Let's ensure we didn't duplicate the closing bracket
    $centerContent = str_replace("                },\n                },\n", "                },\n", $centerContent);

    file_put_contents($centerPath, $centerContent);
    echo "Center.jsx updated.\n";
}

?>
