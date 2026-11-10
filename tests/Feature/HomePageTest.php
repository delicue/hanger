<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_the_homepage_displays_the_hanger_idea_dashboard_for_authenticated_users(): void
    {
        $response = $this->actingAs(User::factory()->create())->get('/');

        $response
            ->assertOk()
            ->assertViewIs('dashboard')
            ->assertSee('Your ideas,')
            ->assertSee('Your idea wall is open.')
            ->assertSee('Add a note')
            ->assertSee('A FEW QUICK SHORTCUTS')
            ->assertSee('data-workspace-menu', false)
            ->assertDontSee('Laravel');
    }
}
