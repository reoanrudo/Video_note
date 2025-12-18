<?php

namespace App\Http\Requests;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectVideoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $project = $this->route('project');
        if (! $project instanceof Project) {
            return false;
        }

        return $this->user()?->can('update', $project) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 500MB = 500 * 1024 KB = 512000
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime,video/webm,video/ogg,application/octet-stream', 'max:512000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'video.required' => '動画ファイルを選択してください。',
            'video.file' => '動画ファイルを選択してください。',
            'video.max' => '動画ファイルは500MB以内にしてください。',
        ];
    }
}
