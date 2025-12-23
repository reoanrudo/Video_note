<?php

use Illuminate\Support\Facades\Auth;
use Livewire\Volt\Component;

new class extends Component {
    public string $plan = 'free';

    /**
     * Mount the component.
     */
    public function mount(): void
    {
        $this->plan = Auth::user()->plan ?? 'free';
    }

    /**
     * Update the plan for the currently authenticated user.
     */
    public function updatePlan(): void
    {
        $user = Auth::user();

        $validated = $this->validate([
            'plan' => ['required', 'string', 'in:free,pro'],
        ]);

        $user->fill($validated);
        $user->save();

        $this->dispatch('plan-updated');
    }
}; ?>

<section class="w-full">
    @include('partials.settings-heading')

    <x-settings.layout :heading="__('プラン')" :subheading="__('利用プランを選択してください（現在は制限は変わりません）')">
        <form wire:submit="updatePlan" class="my-6 w-full space-y-6">
            <div class="space-y-4">
                <flux:radio.group wire:model="plan" label="利用プラン">
                    <flux:radio value="free" label="Free プラン" description="プロジェクト10件まで、7日間保存" />
                    <flux:radio value="pro" label="Pro プラン" description="（将来実装予定）無制限のプロジェクトと長期保存" />
                </flux:radio.group>

                <flux:fieldset>
                    <flux:legend>現在の制限</flux:legend>
                    <flux:description>
                        プランを選択しても、現時点では以下の制限が適用されます：
                        <ul class="mt-2 list-disc list-inside space-y-1">
                            <li>プロジェクト上限: 10件</li>
                            <li>保存期間: 7日間</li>
                            <li>動画サイズ上限: 500MB</li>
                        </ul>
                        将来のアップデートで Pro プランの追加機能が有効になります。
                    </flux:description>
                </flux:fieldset>
            </div>

            <div class="flex items-center gap-4">
                <flux:button type="submit" variant="primary">保存</flux:button>

                <flux:button
                    type="button"
                    variant="ghost"
                    href="{{ route('dashboard') }}"
                    wire:navigate
                >
                    キャンセル
                </flux:button>
            </div>

            <x-action-message on="plan-updated">
                {{ __('保存しました。') }}
            </x-action-message>
        </form>
    </x-settings.layout>
</section>
