<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class YouTubeDownloadService
{
    private string $tempPath;

    public function __construct()
    {
        $this->tempPath = storage_path('app/temp/youtube');
    }

    /**
     * YouTube動画をダウンロード
     *
     * @param string $url YouTube URL
     * @param string $outputPath 出力先パス（Storage::disk('public')でのパス）
     * @return array{path: string, filename: string, size: int, duration: int}
     * @throws \RuntimeException
     */
    public function download(string $url, string $outputPath): array
    {
        // 一時ディレクトリを作成
        if (! is_dir($this->tempPath)) {
            mkdir($this->tempPath, 0755, true);
        }

        $filename = Str::uuid()->toString().'.mp4';
        $tempFile = $this->tempPath.'/'.$filename;

        try {
            // yt-dlpで動画をダウンロード
            $this->downloadVideo($url, $tempFile);

            // ファイル情報を取得
            $fileSize = filesize($tempFile);
            $duration = $this->getVideoDuration($tempFile);

            // Storageに移動
            Storage::disk('public')->put($outputPath.'/'.$filename, file_get_contents($tempFile));

            // 一時ファイルを削除
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }

            return [
                'filename' => $filename,
                'path' => $outputPath.'/'.$filename,
                'size' => $fileSize,
                'duration' => $duration,
            ];
        } catch (\Exception $e) {
            // エラー時は一時ファイルを削除
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }

            Log::error('YouTube download failed', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('YouTube動画のダウンロードに失敗しました: '.$e->getMessage());
        }
    }

    /**
     * yt-dlpで動画をダウンロード
     */
    protected function downloadVideo(string $url, string $outputFile): void
    {
        // ファイル名のみを指定（yt-dlpが追加処理をするため）
        $outputTemplate = str_replace('.mp4', '', $outputFile).'.mp4';

        $process = new Process([
            'yt-dlp',
            '--format', 'mp4',
            '--merge-output-format', 'mp4',
            '-o', $outputTemplate,
            '--no-playlist',
            $url,
        ]);

        $process->setTimeout(300); // 5分タイムアウト
        $process->run();

        if (! $process->isSuccessful()) {
            $errorOutput = $process->getErrorOutput();
            throw new ProcessFailedException($process);
        }
    }

    /**
     * 動画の長さを取得（秒）
     */
    protected function getVideoDuration(string $filePath): int
    {
        $process = new Process([
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            $filePath,
        ]);

        $process->run();

        if ($process->isSuccessful()) {
            return (int) floatval(trim($process->getOutput()));
        }

        return 0;
    }

    /**
     * YouTube URLから動画IDを抽出
     */
    public function extractVideoId(string $url): ?string
    {
        // 標準のYouTube URLパターン
        preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i', $url, $matches);

        return $matches[1] ?? null;
    }

    /**
     * YouTube URLかどうかを判定
     */
    public function isYouTubeUrl(string $url): bool
    {
        return $this->extractVideoId($url) !== null;
    }

    /**
     * yt-dlpがインストールされているか確認
     */
    public function isYtDlpInstalled(): bool
    {
        $process = new Process(['which', 'yt-dlp']);
        $process->run();

        return $process->isSuccessful();
    }
}
