<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\KpiService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class KpiDashboardController extends Controller
{
    public function __construct(
        private KpiService $kpiService
    ) {
        // あとで認可を追加: $this->middleware('can:view-kpi-dashboard');
    }

    /**
     * KPIダッシュボードを表示
     */
    public function index(Request $request): View
    {
        $summary = $this->kpiService->getDashboardSummary();

        return view('admin.kpi-dashboard', [
            'summary' => $summary,
        ]);
    }
}
