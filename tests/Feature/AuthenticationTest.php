<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_a_guest_is_redirected_to_the_login_page(): void
    {
        $this->get('/')
            ->assertRedirect(route('login'));
    }

    public function test_a_visitor_can_register_and_is_logged_in(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Taylor Ideas',
            'email' => 'taylor@example.test',
            'password' => 'Creative123!',
            'password_confirmation' => 'Creative123!',
        ]);

        $response->assertRedirect(route('home'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'name' => 'Taylor Ideas',
            'email' => 'taylor@example.test',
        ]);
    }

    public function test_registration_rejects_an_existing_email_address(): void
    {
        User::factory()->create(['email' => 'taken@example.test']);

        $this->from(route('register'))
            ->post(route('register.store'), [
                'name' => 'New Person',
                'email' => 'taken@example.test',
                'password' => 'Creative123!',
                'password_confirmation' => 'Creative123!',
            ])
            ->assertRedirect(route('register'))
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_a_user_can_log_in_and_log_out(): void
    {
        $user = User::factory()->create([
            'email' => 'owner@example.test',
            'password' => Hash::make('Creative123!'),
        ]);

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'Creative123!',
        ])->assertRedirect(route('home'));

        $this->assertAuthenticatedAs($user);

        $this->post(route('logout'))
            ->assertRedirect(route('login'));

        $this->assertGuest();
    }

    public function test_invalid_credentials_do_not_authenticate_a_user(): void
    {
        User::factory()->create(['email' => 'owner@example.test']);

        $this->from(route('login'))
            ->post(route('login.store'), [
                'email' => 'owner@example.test',
                'password' => 'incorrect',
            ])
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }
}
