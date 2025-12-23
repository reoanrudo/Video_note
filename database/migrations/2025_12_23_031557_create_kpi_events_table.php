<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kpi_events', function (Blueprint $table) {
            $table->id();
            $table->string('event'); // 例: 'project_created'
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamp('occurred_at'); // 集計基準時刻
            $table->json('meta')->nullable(); // 将来の追加情報用
            $table->timestamps();

            $table->index(['event', 'occurred_at']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_events');
    }
};
