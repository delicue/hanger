<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#f7f6f2">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Hanger — your ideas, taking shape</title>

        @fonts
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body>
        <div class="app-shell" data-app-shell data-projects="{{ json_encode($ideas) }}">
            <aside class="sidebar">
                <a class="brand" href="/" aria-label="Hanger home">
                    <span class="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 32 32" fill="none">
                            <path d="M16 5.5v4.2m0 0c-2.6 0-4.2-1.6-4.2-3.5m4.2 3.5c2.6 0 4.2-1.6 4.2-3.5M7 25.5l8.4-8.1a2.1 2.1 0 0 1 1.2-.5h.8a2.1 2.1 0 0 1 1.2.5l6.4 6.1" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6.5 25.5h19" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
                        </svg>
                    </span>
                    <span>hanger<span class="brand-period">.</span></span>
                </a>

                <div class="workspace-menu-wrap">
                <button class="workspace-switcher" type="button" aria-label="Current workspace" aria-expanded="false" aria-controls="workspace-menu" data-workspace-toggle>
                    <span class="workspace-avatar">S</span>
                    <span class="workspace-copy"><strong>Studio</strong><small>Personal space</small></span>
                    <svg class="chevron-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
                </button>
                <div class="workspace-menu" id="workspace-menu" data-workspace-menu hidden>
                    <p class="workspace-menu-title">Studio <span>Personal space</span></p>
                    <button class="workspace-menu-filter" type="button" data-filter="all">All ideas</button>
                    <button class="workspace-menu-filter" type="button" data-filter="recent">Recently opened</button>
                    <button class="workspace-menu-filter" type="button" data-filter="favorites">Favorites</button>
                    <div class="workspace-menu-account">
                        <span class="profile-avatar">{{ mb_strtoupper(mb_substr($user->name, 0, 1)) }}</span>
                        <span><strong>{{ $user->name }}</strong><small>{{ $user->email }}</small></span>
                    </div>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button class="workspace-menu-logout" type="submit">Log out</button>
                    </form>
                </div>
                </div>

                <nav class="main-nav" aria-label="Main navigation">
                    <p class="nav-label">WORKSPACE</p>
                    <button class="nav-link is-active" type="button" data-filter="all">
                        <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="5.5" height="5.5" rx="1.5"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1.5"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1.5"/><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.5"/></svg>
                        <span>All ideas</span>                        <span class="nav-count" data-idea-count>{{ $ideas->count() }}</span>
                    </button>
                    <button class="nav-link" type="button" data-filter="recent">
                        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.8 1.7"/></svg>
                        <span>Recently opened</span>
                    </button>
                    <button class="nav-link" type="button" data-filter="favorites">
                        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2.8 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L10 2.8Z"/></svg>
                        <span>Favorites</span>
                    </button>
                </nav>

                <div class="sidebar-bottom">
                    <div class="plan-card">
                        <span class="plan-sparkle" aria-hidden="true">✳</span>
                        <p>Your mind has room</p>
                        <span>Unlimited ideas, always.</span>
                    </div>
                    <div class="profile-button">
                        <span class="profile-avatar">{{ mb_strtoupper(mb_substr($user->name, 0, 1)) }}</span>
                        <span class="profile-copy"><strong>{{ $user->name }}</strong><small>Personal space</small></span>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button class="logout-button" type="submit">Log out</button>
                        </form>
                    </div>
                </div>
            </aside>

            <main class="main-content" data-dashboard>
                <header class="topbar">
                    <div class="breadcrumbs"><span>Studio</span><span class="breadcrumb-divider">/</span><strong>All ideas</strong></div>
                    <div class="topbar-actions">
                        <span class="save-indicator"><span class="status-dot"></span> All changes saved</span>
                        <button class="icon-button help-button" type="button" aria-label="Help" data-help-button>
                            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.2"/><path d="M8.2 7.7a1.9 1.9 0 1 1 3.2 1.4c-.9.8-1.4 1.1-1.4 2.2m0 2.5h.01"/></svg>
                        </button>
                    </div>
                </header>

                <div class="dashboard-content">
                    <section class="welcome-row">
                        <div>
                            <p class="eyebrow"><span class="eyebrow-sparkle">✳</span> YOUR CREATIVE CORNER</p>
                            <h1>Your ideas, <span>taking shape.</span></h1>
                            <p class="welcome-copy">A little space for everything you're dreaming up.</p>
                        </div>
                        <button class="primary-button" type="button" data-new-project>
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>
                            <span>New idea</span>
                        </button>
                    </section>

                    <section class="continue-card" aria-label="Continue where you left off" data-continue-card @if (! $recentIdea) hidden @endif>
                        <div class="continue-art" aria-hidden="true">
                            <span class="continue-art-sun"></span>
                            <span class="continue-art-line continue-art-line-one"></span>
                            <span class="continue-art-line continue-art-line-two"></span>
                            <span class="continue-art-note">slow<br>mornings</span>
                        </div>
                        <div class="continue-copy">
                            <span class="continue-label"><span class="continue-dot"></span> PICK UP WHERE YOU LEFT OFF</span>
                            <h2 data-continue-title>{{ $recentIdea?->title }}</h2>
                            <p data-continue-meta>{{ $recentIdea ? count($recentIdea->canvas_items ?? []) : 0 }} things on this canvas{{ $recentIdea?->last_opened_at ? ' · last opened '.$recentIdea->last_opened_at->diffForHumans() : ' · ready when you are' }}</p>
                            <button class="text-button" type="button" data-open-project="{{ $recentIdea?->id }}">
                                Keep wandering <span aria-hidden="true">→</span>
                            </button>
                        </div>
                        <span class="continue-time" data-continue-time>{{ $recentIdea?->last_opened_at?->diffForHumans() ?? 'New idea' }}</span>
                    </section>

                    <section class="ideas-section" aria-labelledby="ideas-heading">
                        <div class="section-heading">
                            <div>
                                <h2 id="ideas-heading">Your ideas <span class="heading-count" data-heading-count>{{ str_pad((string) $ideas->count(), 2, '0', STR_PAD_LEFT) }}</span></h2>
                                <p>A home for the sparks you don't want to lose.</p>
                            </div>
                            <div class="section-tools">
                                <label class="search-field">
                                    <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.7"/><path d="m13 13 4 4"/></svg>
                                    <input type="search" placeholder="Find an idea..." aria-label="Find an idea" data-search>
                                    <kbd>⌘ K</kbd>
                                </label>
                                <button class="view-toggle" type="button" aria-label="List view" title="Switch to list view" data-view-toggle>
                                    <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1"/></svg>
                                </button>
                            </div>
                        </div>

                        <div class="project-grid" data-project-grid>
                            @foreach ($ideas as $idea)
                            <article class="project-card-shell" data-project-card-shell>
                                <button class="project-card" type="button" data-project-card data-project-id="{{ $idea['id'] }}" data-title="{{ $idea['title'] }}" data-category="{{ $idea['category'] }}" data-updated="{{ $idea['updated'] }}" data-favorite="{{ $idea['favorite'] }}">
                                    <span class="project-preview {{ $idea['previewClass'] }}" aria-hidden="true"></span>
                                    <span class="project-card-info">
                                        <span class="project-card-title">{{ $idea['title'] }}</span>
                                        <span class="project-card-meta"><span>{{ $idea['category'] }}</span><span class="meta-separator">·</span><span>{{ $idea['updated'] }}</span></span>
                                    </span>
                                </button>
                                <button class="favorite-toggle" type="button" data-toggle-favorite="{{ $idea['id'] }}" aria-label="{{ $idea['favorite'] ? 'Remove from favorites' : 'Add to favorites' }}" aria-pressed="{{ $idea['favorite'] ? 'true' : 'false' }}">✳</button>
                            </article>
                            @endforeach
                            <button class="new-project-card" type="button" data-new-project>
                                <span class="new-project-icon"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg></span>
                                <strong>Hang up a new idea</strong>
                                <span>Start with a thought, see where it goes.</span>
                            </button>
                        </div>
                        <p class="empty-state" data-empty-state @if ($ideas->isNotEmpty()) hidden @endif>
                            @if ($ideas->isEmpty())
                                Your idea wall is open. Start with one thought and see where it goes.
                            @else
                                No ideas match that search. Try another word.
                            @endif
                        </p>
                    </section>

                    <footer class="dashboard-footer"><span>Made for the ideas that find you in the middle of everything.</span><span>Take your time. ✳</span></footer>
                </div>
            </main>

            <section class="canvas-view" data-canvas-view aria-label="Idea canvas" hidden>
                <header class="canvas-topbar">
                    <button class="canvas-back" type="button" data-back-to-dashboard>
                        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17"/></svg>
                        <span>All ideas</span>
                    </button>
                    <span class="canvas-breadcrumb-divider">/</span>
                    <input class="canvas-title" type="text" maxlength="80" value="A slower kind of Sunday" aria-label="Idea title" data-canvas-title>
                    <span class="canvas-save"><span class="status-dot"></span><span data-canvas-save-label>Saved</span></span>
                    <button class="share-button" type="button" data-canvas-share>
                        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 11.5v4A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-4"/></svg>
                        Share
                    </button>
                    <button class="details-toggle" type="button" aria-label="Show idea details" aria-expanded="true" data-details-toggle>Details</button>
                    <div class="canvas-actions-wrap">
                        <button class="canvas-more" type="button" aria-label="More idea options" aria-expanded="false" aria-controls="canvas-actions-menu" data-canvas-more>•••</button>
                        <div class="canvas-actions-menu" id="canvas-actions-menu" data-canvas-actions-menu hidden>
                            <button type="button" data-canvas-favorite>☆ Add to favorites</button>
                            <button class="delete-idea-action" type="button" data-delete-project>Delete idea</button>
                        </div>
                    </div>
                </header>

                <div class="canvas-layout">
                    <aside class="tool-rail" aria-label="Canvas tools">
                        <button class="tool-button is-selected" type="button" data-tool="select" aria-label="Select and move" title="Select (V)" aria-pressed="true">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 3 10 8-5 .7-2.3 4.3L5 3Z"/></svg>
                        </button>
                        <span class="tool-divider"></span>
                        <button class="tool-button" type="button" data-add-item="note" aria-label="Add a note" title="Sticky note (N)">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5h10A1.5 1.5 0 0 1 16.5 5v7.5L12 17H5A1.5 1.5 0 0 1 3.5 15.5v-10A2 2 0 0 1 5 3.5Z"/><path d="M12 17v-4.5h4.5"/></svg>
                        </button>
                        <button class="tool-button" type="button" data-add-item="text" aria-label="Add text" title="Text (T)">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5V3.5h13V5M10 3.5v13m-3 0h6"/></svg>
                        </button>
                        <button class="tool-button" type="button" data-add-item="shape" aria-label="Add a shape" title="Shape (S)">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M10 3.5v13"/></svg>
                        </button>
                        <button class="tool-button" type="button" data-add-item="link" aria-label="Add a link" title="Link (L)">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 12 6.5 13.5a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0M12 8l1.5-1.5a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0M7 10h6"/></svg>
                        </button>
                        <span class="tool-divider"></span>
                        <button class="tool-button" type="button" data-add-item="reference" aria-label="Add a reference" title="Reference (R)">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5h7l3 3v10H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5Z"/><path d="M12 3.5v3h3m-8 4h5m-5 3h5"/></svg>
                        </button>
                        <button class="tool-button upload-tool" type="button" data-add-item="image" aria-label="Add an image" title="Image">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3.5" width="14" height="13" rx="2"/><circle cx="7.5" cy="8" r="1.5"/><path d="m4 14 4-3 2.5 2 2-1.5 3.5 3"/></svg>
                        </button>
                    </aside>

                    <div class="canvas-workspace">
                        <div class="canvas-toolbar">
                            <span class="canvas-toolbar-label">SUNDAY MOODBOARD</span>
                            <span class="canvas-toolbar-divider"></span>
                            <span class="canvas-toolbar-hint">A place for all the little things</span>
                            <button type="button" class="fit-button" data-zoom-fit>Fit</button>
                            <button type="button" class="zoom-button" data-zoom-out aria-label="Zoom out">−</button>
                            <span class="zoom-level" data-zoom-level>100%</span>
                            <button type="button" class="zoom-button" data-zoom-in aria-label="Zoom in">+</button>
                        </div>
                        <div class="canvas-viewport" data-canvas-viewport>
                            <div class="board-stage" data-board-stage>
                                <div class="idea-board" data-idea-board></div>
                            </div>
                        </div>
                        <div class="canvas-statusbar">
                            <span><span class="status-dot"></span> Your changes are saved to your account</span>
                            <span>Everything is a work in progress. ✳</span>
                        </div>
                    </div>

                    <aside class="details-panel" data-details-panel>
                        <div class="details-panel-heading"><span>IDEA DETAILS</span><button type="button" aria-label="Close details" data-details-close>×</button></div>
                        <div class="details-content">
                            <span class="details-label">LAST TIME YOU WERE HERE</span>
                            <p class="details-summary">A fresh page for this idea. Add a note, shape, link, or image whenever inspiration strikes.</p>
                            <div class="details-divider"></div>
                            <span class="details-label">A FEW THINGS ON THIS BOARD</span>
                            <div class="detail-activity" data-item-summary><span class="activity-icon activity-note">✎</span><span><strong data-item-count>0 pieces</strong><small>Saved on this canvas</small></span></div>
                            <div class="details-divider"></div>
                            <button class="add-to-board" type="button" data-add-item="note"><span>＋</span> Add a little note</button>
                        </div>
                    </aside>
                </div>
            </section>

            <dialog class="new-idea-dialog" data-new-idea-dialog>
                <form method="dialog" class="dialog-close-form"><button class="dialog-close" aria-label="Close">×</button></form>
                <span class="dialog-sparkle">✳</span>
                <p class="eyebrow">A FRESH PAGE</p>
                <h2>What's on your mind?</h2>
                <p>Give this little idea a name. You can figure the rest out as you go.</p>
                <form data-create-project-form>
                    <label class="dialog-label" for="idea-title">A name for your idea</label>
                    <input id="idea-title" name="title" maxlength="80" placeholder="e.g. Places that feel like home" required>
                    <div class="dialog-actions">
                        <button class="dialog-cancel" type="button" data-close-dialog>Maybe later</button>
                        <button class="primary-button" type="submit">Start hanging it up <span aria-hidden="true">→</span></button>
                    </div>
                </form>
            </dialog>
            <dialog class="help-dialog" data-help-dialog aria-labelledby="help-title">
                <form method="dialog" class="dialog-close-form"><button class="dialog-close" aria-label="Close">×</button></form>
                <p class="eyebrow">A FEW QUICK SHORTCUTS</p>
                <h2 id="help-title">Make yourself at home.</h2>
                <p>Find your way around the dashboard and canvas.</p>
                <dl>
                    <div><dt>Search ideas anywhere</dt><dd><kbd>⌘ K</kbd></dd></div>
                    <div><dt>Sticky note</dt><dd><kbd>N</kbd></dd></div>
                    <div><dt>Text</dt><dd><kbd>T</kbd></dd></div>
                    <div><dt>Shape</dt><dd><kbd>S</kbd></dd></div>
                    <div><dt>Link</dt><dd><kbd>L</kbd></dd></div>
                    <div><dt>Reference</dt><dd><kbd>R</kbd></dd></div>
                    <div><dt>Select and move</dt><dd><kbd>V</kbd></dd></div>
                    <div><dt>Delete selected piece</dt><dd><kbd>Delete</kbd></dd></div>
                </dl>
                <button class="primary-button help-done" type="button" data-close-help>Got it</button>
            </dialog>
            <div class="toast" role="status" aria-live="polite" data-toast></div>
        </div>
    </body>
</html>
