<?php

namespace App\Mail;

use App\Models\ParentReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyParentReport extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public ParentReport $report
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $weekRange = $this->report->data['summary']['week_range'] ?? '今週';

        return new Envelope(
            subject: "【{$this->report->project->name}】週次活動レポート ({$weekRange})",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.weekly-parent-report',
            with: [
                'report' => $this->report,
                'summary' => $this->report->data['summary'] ?? [],
                'achievements' => $this->report->data['achievements'] ?? [],
                'improvements' => $this->report->data['improvements'] ?? [],
                'nextWeekGoals' => $this->report->data['next_week_goals'] ?? [],
                'coachComment' => $this->report->data['coach_comment'] ?? '',
                'coachName' => $this->report->user->name,
                'projectName' => $this->report->project->name,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
