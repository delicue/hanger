<?php

namespace Tests\Feature;

use App\Models\Idea;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class IdeaPersistenceTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_an_authenticated_user_can_create_and_update_an_idea_canvas(): void
    {
        $user = User::factory()->create();
        $canvasItems = [
            [
                'type' => 'note',
                'left' => 80,
                'top' => 120,
                'content' => ['A thought to save'],
            ],
        ];

        $this->actingAs($user)
            ->postJson(route('ideas.store'), ['title' => 'Garden notes'])
            ->assertCreated()
            ->assertJsonPath('idea.title', 'Garden notes');

        $idea = Idea::query()->whereBelongsTo($user)->firstOrFail();

        $this->actingAs($user)
            ->putJson(route('ideas.update', $idea), [
                'title' => 'Garden plans',
                'category' => 'Personal',
                'is_favorite' => true,
                'canvas_items' => $canvasItems,
                'mark_opened' => true,
            ])
            ->assertOk()
            ->assertJsonPath('idea.canvasItems.0.content.0', 'A thought to save');

        $this->assertDatabaseHas('ideas', [
            'id' => $idea->id,
            'user_id' => $user->id,
            'title' => 'Garden plans',
            'is_favorite' => true,
        ]);
        $this->assertSame($canvasItems, $idea->fresh()->canvas_items);
        $this->assertNotNull($idea->fresh()->last_opened_at);
    }

    public function test_idea_validation_rejects_unsupported_canvas_items(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('ideas.store'), [
                'title' => 'Unsafe idea',
                'canvas_items' => [
                    ['type' => 'script', 'content' => ['not an allowed object']],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['canvas_items.0.type']);

        $this->assertDatabaseCount('ideas', 0);
    }

    public function test_canvas_heading_content_and_position_are_persisted(): void
    {
        $user = User::factory()->create();
        $idea = Idea::factory()->for($user)->create(['title' => 'Garden notes']);
        $heading = [
            'type' => 'heading',
            'left' => 210,
            'top' => 94,
            'content' => ['A garden of ideas', 'Make room for the unexpected'],
        ];

        $this->actingAs($user)
            ->putJson(route('ideas.update', $idea), [
                'canvas_items' => [$heading],
            ])
            ->assertOk()
            ->assertJsonPath('idea.canvasItems.0.content.0', 'A garden of ideas')
            ->assertJsonPath('idea.canvasItems.0.content.1', 'Make room for the unexpected');

        $this->assertSame([$heading], $idea->fresh()->canvas_items);
    }

    public function test_a_user_can_favorite_and_unfavorite_an_idea_without_overwriting_other_fields(): void
    {
        $user = User::factory()->create();
        $canvasItems = [['type' => 'note', 'left' => 10, 'top' => 20, 'content' => ['Keep this']]];
        $idea = Idea::factory()->for($user)->create([
            'title' => 'Garden notes',
            'canvas_items' => $canvasItems,
        ]);

        $this->actingAs($user)
            ->putJson(route('ideas.update', $idea), ['is_favorite' => true])
            ->assertOk()
            ->assertJsonPath('idea.favorite', true)
            ->assertJsonPath('idea.title', 'Garden notes');

        $this->assertSame($canvasItems, $idea->fresh()->canvas_items);
        $this->assertDatabaseHas('ideas', ['id' => $idea->id, 'is_favorite' => true]);

        $this->putJson(route('ideas.update', $idea), ['is_favorite' => false])
            ->assertOk()
            ->assertJsonPath('idea.favorite', false);

        $this->assertDatabaseHas('ideas', ['id' => $idea->id, 'is_favorite' => false]);
    }

    public function test_an_owner_can_delete_an_idea(): void
    {
        $user = User::factory()->create();
        $idea = Idea::factory()->for($user)->create();

        $this->actingAs($user)
            ->deleteJson(route('ideas.destroy', $idea))
            ->assertNoContent();

        $this->assertDatabaseMissing('ideas', ['id' => $idea->id]);
    }

    public function test_a_user_cannot_read_or_change_another_users_idea(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $idea = Idea::factory()->for($owner)->create(['title' => 'A new idea']);

        $this->actingAs($otherUser)
            ->putJson(route('ideas.update', $idea), ['title' => 'Stolen'])
            ->assertNotFound();

        $this->actingAs($otherUser)
            ->deleteJson(route('ideas.destroy', $idea))
            ->assertNotFound();

        $this->assertSame('A new idea', $idea->fresh()->title);
    }

    public function test_the_dashboard_only_renders_ideas_owned_by_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Idea::factory()->for($user)->create(['title' => 'My private notes']);
        Idea::factory()->for($otherUser)->create(['title' => 'Someone else’s plan']);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk()
            ->assertSee('My private notes')
            ->assertDontSee('Someone else’s plan');
    }
}
