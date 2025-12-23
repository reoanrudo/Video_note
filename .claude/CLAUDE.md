# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Video Note** is a Laravel 12 web application for video analysis and annotation. Users can upload videos (up to 500MB), add drawings/annotations/snapshots, and share projects via read-only links. The application uses Laravel Sail for local development with MariaDB 11.

## Development Commands

### Environment Setup

```bash
# Start Docker environment
./vendor/bin/sail up -d

# Run migrations
./vendor/bin/sail artisan migrate

# Create storage symlink (required for video/snapshot access)
./vendor/bin/sail artisan storage:link
```

### Testing

```bash
# Run all tests
./vendor/bin/sail artisan test

# Run specific test file
./vendor/bin/sail artisan test --filter=ProjectsTest

# Run specific test case
./vendor/bin/sail artisan test --filter="user can create a project"
```

### Frontend Build

```bash
# Development (inside Sail container recommended)
./vendor/bin/sail npm run dev

# Production build
./vendor/bin/sail npm run build
```

### Scheduled Tasks (Development)

Commands run via Laravel Scheduler (defined in `routes/console.php`):

```bash
# Notify users about videos expiring in 24 hours (runs daily at 00:10)
./vendor/bin/sail artisan app:notify-expiring-videos

# Delete videos older than 7 days (runs daily at 01:10)
./vendor/bin/sail artisan app:delete-expired-videos
```

### Code Quality

```bash
# Run Pint (Laravel code formatter)
./vendor/bin/sail pint

# Clear all caches
./vendor/bin/sail artisan optimize:clear
```

## Architecture

### Tech Stack

- **Backend**: Laravel 12 (PHP 8.4)
- **Frontend**: Livewire/Volt, Flux UI, Tailwind v4, Vanilla JS
- **Auth**: Laravel Fortify (with 2FA support)
- **Database**: MariaDB 11
- **Queue**: Database driver (requires worker)
- **Testing**: Pest v4

### Key Architectural Patterns

#### 1. Video Storage & Deletion Contract

**Critical**: The snapshot deletion system depends on a frontend-backend contract:

- Snapshot API returns `path` field: `projects/{project}/snapshots/{video}/{uuid}.png`
- Frontend **must** save this `path` in `videos.annotations.snapshots[].path`
- Deletion command (`app:delete-expired-videos`) reads this path to delete files

**Location**: `app/Console/Commands/DeleteExpiredVideos.php:40-51`

#### 2. Shared Views with Read-Only Mode

The same Blade view (`projects.show`) serves both owners and anonymous viewers:

- Owner access: `GET /projects/{project}` (auth + policy)
- Share access: `GET /share/{token}` (no auth, `readOnly=true`)

The `readOnly` variable controls UI/API behavior in the frontend.

#### 3. JSON-Based Annotations

Video annotations are stored in `videos.annotations` (JSON column) with structure:

```json
{
  "drawings": [...],     // Pen/arrow/text/number elements
  "snapshots": [...],    // Array with time/url/path/memo
  "notes": [...],        // External notes (off-court)
  "settings": {...}      // UI state (color/width/autoNumber)
}
```

**Why JSON**: High change frequency, schema evolution flexibility, simpler MVP implementation.

#### 4. Policy-Based Authorization

All project operations use `ProjectPolicy`:

- `view`: Owner only
- `update`: Owner only
- `delete`: Owner only

Controllers use `$this->authorize('action', $project)` consistently.

### Frontend Architecture

#### Monolithic JS (Technical Debt)

**File**: `resources/js/video-analysis.js` (4,188 lines)

**Current state**: Single file contains:
- UI construction
- State management
- Drawing tools
- Video controls
- API communication

**Noted in**: `.sdd/steering/structure.md:38-40`

**Future**: Consider splitting into modules when refactoring:
- `video-player.js`
- `drawing-tools.js`
- `snapshot-manager.js`
- `state-manager.js`
- `api-client.js`

### Database Schema

#### Core Tables

**projects**
- `share_token` (64 chars, unique): For anonymous viewing
- Cascade deletes videos on project deletion

**videos**
- `annotations` (json): Drawing/snapshot/note data
- `meta` (json): Future extensibility
- Cascade deletes on project deletion

**kpi_events** (Analytics)
- `event`: Event type (e.g., 'project_created')
- `occurred_at`: For weekly aggregation
- Indexed on `[event, occurred_at]` and `user_id`

**users**
- `plan` (string, default 'free'): 'free' or 'pro'
- **Note**: Plan selection exists but limits unchanged (10 projects, 7-day retention for all users)

### Critical Business Rules

#### Free Tier Limits

- **Projects**: 10 per user (`ProjectController::store:19-25`)
- **Video size**: 500MB (`StoreProjectVideoRequest:32`)
- **Retention**: 7 days, with 24h notice before deletion
- **Storage**: `public` disk (videos/snapshots accessible via `/storage/...`)

**Note**: Pro plan exists in DB but enforcement not implemented.

#### Deletion Flow

1. Day 6: `app:notify-expiring-videos` sends email via queue
2. Day 7: `app:delete-expired-videos` removes:
   - Video file from storage
   - Snapshot files (using `annotations.snapshots[].path`)
   - DB record (cascade)

### Livewire/Volt Components

Settings pages use Livewire Volt (single-file components):

- `resources/views/livewire/settings/profile.blade.php`
- `resources/views/livewire/settings/password.blade.php`
- `resources/views/livewire/settings/plan.blade.php`
- `resources/views/livewire/settings/appearance.blade.php`
- `resources/views/livewire/settings/two-factor.blade.php`

**Pattern**: PHP logic in `new class extends Component` at top, Blade template below.

### Testing Strategy

#### Test Organization

- `tests/Feature/`: HTTP/Command tests
- `tests/Unit/`: Unit tests (including JS validation via `VideoAnalysisScriptTest`)

#### Key Test Coverage

**Must maintain**:
- Snapshot deletion contract (E2E): `SnapshotDeletionContractTest`
- Command behavior: `DeleteExpiredVideosTest`, `NotifyExpiringVideosTest`
- KPI recording: `KpiEventsTest`
- Plan selection: `Settings/PlanUpdateTest`

#### Testing Livewire/Volt

```php
use Livewire\Volt\Volt;

$user = User::factory()->create();
$this->actingAs($user);

Volt::test('settings.plan')
    ->set('plan', 'pro')
    ->call('updatePlan')
    ->assertHasNoErrors();
```

### Configuration Files

#### Important Settings

- `routes/console.php`: Scheduled commands (notify at 00:10, delete at 01:10)
- `routes/web.php`: Volt routes registered via `Volt::route()`
- `.sdd/`: Design documentation directory (requirements, specs, steering)

#### Vite & Node Modules

**Important**: Use Sail for npm commands to avoid native dependency issues:

```bash
./vendor/bin/sail npm install
./vendor/bin/sail npm run build
```

Rollup native dependencies are OS-specific; running inside Sail container ensures consistency.

### Common Patterns

#### FormRequest Validation

Each API endpoint has dedicated FormRequest:
- `StoreProjectRequest`
- `StoreProjectVideoRequest`
- `UpdateVideoAnnotationsRequest`
- `StoreVideoSnapshotRequest`

#### Storage Paths

```
public/
  projects/{project_id}/
    videos/{uuid}.mp4
    snapshots/{video_id}/{uuid}.png
```

#### API Response Format (JSON)

Consistent structure for AJAX requests:

```php
return response()->json([
    'ok' => true,
    'video_id' => $video->id,
    'path' => $path,  // Critical for snapshots
    // ... other data
]);
```

### Known Technical Debt

1. **Frontend monolith**: 4K+ line single JS file
2. **Public storage**: Videos/snapshots in public disk (consider private + signed URLs)
3. **No plan enforcement**: Plan selection UI exists but limits not differentiated
4. **Environment-dependent uploads**: 500MB requires PHP/nginx/Apache config alignment

### Project Documentation

Design docs in `.sdd/` directory:
- `steering/`: High-level product/tech/structure decisions
- `requirements/`: Requirements draft
- `specs/video-analysis-tool/`: Detailed requirements, design, tasks

Refer to these when clarifying business logic or making architectural decisions.
