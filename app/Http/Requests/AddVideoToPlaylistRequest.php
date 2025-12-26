<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddVideoToPlaylistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'video_id' => ['required', 'exists:videos,id'],
            'start_time' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'end_time' => ['nullable', 'numeric', 'min:0', 'decimal:0,2', 'gt:start_time'],
        ];
    }

    public function messages(): array
    {
        return [
            'video_id.required' => '動画を選択してください。',
            'video_id.exists' => '存在しない動画です。',
            'start_time.numeric' => '開始時刻は数値で入力してください。',
            'start_time.min' => '開始時刻は0以上で入力してください。',
            'end_time.numeric' => '終了時刻は数値で入力してください。',
            'end_time.min' => '終了時刻は0以上で入力してください。',
            'end_time.gt' => '終了時刻は開始時刻より後である必要があります。',
        ];
    }
}
