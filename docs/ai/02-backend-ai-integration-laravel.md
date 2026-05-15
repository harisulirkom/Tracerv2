# Implementasi Backend AI Career Advisor (Laravel)

Status: `DRAFT`
Tanggal: `2026-04-09`

## Tujuan

Memastikan provider AI hanya dipanggil dari backend Laravel, bukan dari frontend.

## 1. Environment Backend (`.env`)

```env
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TIMEOUT=25
```

## 2. Config (`config/services.php`)

```php
'openai' => [
    'api_key' => env('OPENAI_API_KEY'),
    'model' => env('OPENAI_MODEL', 'gpt-4.1-mini'),
    'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    'timeout' => (int) env('OPENAI_TIMEOUT', 25),
],
```

## 3. Route API

```php
Route::prefix('v1/career-advisor')->middleware('auth:sanctum')->group(function () {
    Route::get('/options', [CareerAdvisorController::class, 'options']);
    Route::post('/sessions', [CareerAdvisorController::class, 'createSession']);
    Route::patch('/sessions/{session}/profile', [CareerAdvisorController::class, 'updateProfile']);
    Route::post('/sessions/{session}/generate', [CareerAdvisorController::class, 'generate']);
    Route::get('/sessions/{session}/result', [CareerAdvisorController::class, 'result']);
    Route::post('/sessions/{session}/action', [CareerAdvisorController::class, 'saveAction']);
    Route::post('/sessions/{session}/feedback', [CareerAdvisorController::class, 'saveFeedback']);
});
```

## 4. Service Backend untuk panggil OpenAI

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CareerAdvisorAiService
{
    public function generate(array $payload): array
    {
        $model = config('services.openai.model');
        $apiKey = config('services.openai.api_key');
        $baseUrl = rtrim(config('services.openai.base_url'), '/');
        $timeout = (int) config('services.openai.timeout', 25);

        $systemPrompt = implode("\n", [
            'Kamu adalah AI career advisor untuk alumni perguruan tinggi di Indonesia.',
            'Kembalikan JSON valid dengan key: motivation_narrative, recommendations, skill_gap, plan_12_weeks.',
            'recommendations minimal 3 item, plan_12_weeks minimal 4 item.',
            'Gunakan Bahasa Indonesia formal dan spesifik dari profil alumni.',
        ]);

        $response = Http::timeout($timeout)
            ->withToken($apiKey)
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'temperature' => 0.35,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => json_encode($payload, JSON_UNESCAPED_UNICODE)],
                ],
            ]);

        $response->throw();

        $content = data_get($response->json(), 'choices.0.message.content', '{}');
        $decoded = json_decode($content, true);

        if (!is_array($decoded)) {
            throw new \RuntimeException('Invalid AI response format');
        }

        return $decoded;
    }
}
```

## 5. Controller `generate`

- Validasi profile wajib lengkap.
- Simpan status `queued/in_progress/completed/failed`.
- Panggil service AI (sinkron atau via queue job).
- Simpan hasil ke tabel `career_advisor_results`.
- Kembalikan `analysis_id` dan status.

## 6. Keamanan Wajib

1. Jangan pernah expose `OPENAI_API_KEY` ke frontend.
2. Masking data sensitif di log backend.
3. Rate limit endpoint generate.
4. Simpan `request_id` untuk audit.

## 7. Integrasi dengan Frontend Saat Ini

Frontend sudah diarahkan ke endpoint:
- `GET /v1/career-advisor/options`
- `POST /v1/career-advisor/sessions`
- `PATCH /v1/career-advisor/sessions/{id}/profile`
- `POST /v1/career-advisor/sessions/{id}/generate`
- `GET /v1/career-advisor/sessions/{id}/result`
- `POST /v1/career-advisor/sessions/{id}/action`
- `POST /v1/career-advisor/sessions/{id}/feedback`

Jika endpoint tersedia, label source di UI akan tampil `API Backend` atau `API Backend (OpenAI)`.
