<?php

namespace App\Http\Controllers;

use App\Models\Idea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class IdeaController extends Controller
{
    public function index(): View
    {
        $ideas = Auth::user()->ideas()
            ->latest('updated_at')
            ->get()
            ->map(fn (Idea $idea): array => $this->serializeIdea($idea));
        $recentIdea = Auth::user()->ideas()
            ->orderByDesc('last_opened_at')
            ->orderByDesc('updated_at')
            ->first();

        return view('dashboard', [
            'ideas' => $ideas,
            'recentIdea' => $recentIdea,
            'user' => Auth::user(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateIdea($request, creating: true);
        $idea = Auth::user()->ideas()->create([
            'title' => $validated['title'],
            'category' => $validated['category'] ?? 'New idea',
            'is_favorite' => false,
            'canvas_items' => $validated['canvas_items'] ?? [],
        ]);

        return response()->json(['idea' => $this->serializeIdea($idea)], 201);
    }

    public function update(Request $request, int $idea): JsonResponse
    {
        $record = $this->ownedIdea($idea);
        $validated = $this->validateIdea($request);
        $record->fill(collect($validated)->only([
            'title',
            'category',
            'is_favorite',
            'canvas_items',
        ])->all());

        if (($validated['mark_opened'] ?? false) === true) {
            $record->last_opened_at = now();
        }

        $record->save();

        return response()->json(['idea' => $this->serializeIdea($record->refresh())]);
    }

    public function open(int $idea): JsonResponse
    {
        $record = $this->ownedIdea($idea);
        $record->forceFill(['last_opened_at' => now()])->save();

        return response()->json(['idea' => $this->serializeIdea($record->refresh())]);
    }

    public function destroy(int $idea): JsonResponse
    {
        $this->ownedIdea($idea)->delete();

        return response()->json(status: 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateIdea(Request $request, bool $creating = false): array
    {
        $validated = Validator::make($request->all(), [
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:80'],
            'category' => ['sometimes', 'string', 'max:80'],
            'is_favorite' => ['sometimes', 'boolean'],
            'mark_opened' => ['sometimes', 'boolean'],
            'canvas_items' => ['sometimes', 'array', 'max:100'],
            'canvas_items.*' => ['array:type,left,top,content,imageData,imageName'],
            'canvas_items.*.type' => ['required', Rule::in(['note', 'text', 'shape', 'link', 'image', 'reference', 'heading'])],
            'canvas_items.*.left' => ['required', 'numeric', 'between:0,10000'],
            'canvas_items.*.top' => ['required', 'numeric', 'between:0,10000'],
            'canvas_items.*.content' => ['sometimes', 'array', 'max:3'],
            'canvas_items.*.content.*' => ['string', 'max:2000'],
            'canvas_items.*.imageData' => [
                'nullable',
                'string',
                'max:1400000',
                'regex:/\Adata:image\/(?:jpeg|png|gif|webp);base64,[A-Za-z0-9+\/=]+\z/',
            ],
            'canvas_items.*.imageName' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $imageDataSize = collect($validated['canvas_items'] ?? [])
            ->sum(fn (array $item): int => strlen($item['imageData'] ?? ''));

        if ($imageDataSize > 4_000_000) {
            throw ValidationException::withMessages([
                'canvas_items' => 'The combined image data cannot exceed 4 MB.',
            ]);
        }

        return $validated;
    }

    private function ownedIdea(int $idea): Idea
    {
        return Auth::user()->ideas()->findOrFail($idea);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeIdea(Idea $idea): array
    {
        return [
            'id' => (string) $idea->id,
            'title' => $idea->title,
            'category' => $idea->category,
            'favorite' => $idea->is_favorite,
            'updated' => $idea->updated_at->diffForHumans(),
            'canvasItems' => $idea->canvas_items ?? [],
            'lastOpenedAt' => $idea->last_opened_at?->toIso8601String(),
            'previewClass' => match (strtolower($idea->category)) {
                'branding' => 'preview-studio',
                'writing' => 'preview-rituals',
                default => 'preview-sunday',
            },
        ];
    }
}
