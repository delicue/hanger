<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ $registering ? 'Make a little space' : 'Welcome back' }} — Hanger</title>
        @fonts
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="auth-page">
        <main class="auth-card">
            <a class="brand auth-brand" href="{{ route('login') }}" aria-label="Hanger">
                <span class="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 32 32" fill="none">
                        <path d="M16 5.5v4.2m0 0c-2.6 0-4.2-1.6-4.2-3.5m4.2 3.5c2.6 0 4.2-1.6 4.2-3.5M7 25.5l8.4-8.1a2.1 2.1 0 0 1 1.2-.5h.8a2.1 2.1 0 0 1 1.2.5l6.4 6.1" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6.5 25.5h19" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
                    </svg>
                </span>
                <span>hanger<span class="brand-period">.</span></span>
            </a>
            <span class="auth-sparkle" aria-hidden="true">✳</span>
            <p class="eyebrow">{{ $registering ? 'A FRESH PAGE' : 'YOUR IDEAS ARE HERE' }}</p>
            <h1>{{ $registering ? 'Make a little space.' : 'Welcome back.' }}</h1>
            <p class="auth-intro">{{ $registering ? 'One account for all the things you want to hang onto.' : 'Come back to that thought you had.' }}</p>

            <form class="auth-form" method="POST" action="{{ $registering ? route('register.store') : route('login.store') }}">
                @csrf
                @if ($registering)
                    <label for="name">Your name</label>
                    <input id="name" name="name" type="text" value="{{ old('name') }}" autocomplete="name" maxlength="100" required autofocus>
                    @error('name')<span class="auth-error">{{ $message }}</span>@enderror
                @endif

                <label for="email">Email address</label>
                <input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required @if (! $registering) autofocus @endif>
                @error('email')<span class="auth-error">{{ $message }}</span>@enderror

                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="{{ $registering ? 'new-password' : 'current-password' }}" required>
                @error('password')<span class="auth-error">{{ $message }}</span>@enderror

                @if ($registering)
                    <label for="password_confirmation">Confirm password</label>
                    <input id="password_confirmation" name="password_confirmation" type="password" autocomplete="new-password" required>
                @else
                    <label class="remember-option"><input name="remember" type="checkbox" value="1"> Keep me signed in</label>
                @endif

                <button class="primary-button auth-submit" type="submit">{{ $registering ? 'Create my space' : 'Log in' }} <span aria-hidden="true">→</span></button>
            </form>

            <p class="auth-switch">
                @if ($registering)
                    Already have a space? <a href="{{ route('login') }}">Log in</a>
                @else
                    New around here? <a href="{{ route('register') }}">Make an account</a>
                @endif
            </p>
            <p class="auth-footnote">Your ideas belong to you. Always. <span>✳</span></p>
        </main>
    </body>
</html>
