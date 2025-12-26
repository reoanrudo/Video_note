<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderPlaylistItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'orders' => ['required', 'array'],
            'orders.*.id' => ['required', 'exists:playlist_items,id'],
            'orders.*.position' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'orders.required' => '並び順を指定してください。',
            'orders.array' => '並び順の形式が正しくありません。',
            'orders.*.id.required' => 'アイテムIDは必須です。',
            'orders.*.id.exists' => '存在しないアイテムです。',
            'orders.*.position.required' => '位置は必須です。',
            'orders.*.position.integer' => '位置は整数で入力してください。',
            'orders.*.position.min' => '位置は1以上で入力してください。',
        ];
    }
}
