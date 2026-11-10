const appShell = document.querySelector('[data-app-shell]');
const projectGrid = document.querySelector('[data-project-grid]');
const canvasView = document.querySelector('[data-canvas-view]');
const dashboard = document.querySelector('[data-dashboard]');
const dialog = document.querySelector('[data-new-idea-dialog]');
const helpDialog = document.querySelector('[data-help-dialog]');
const toast = document.querySelector('[data-toast]');

if (projectGrid && canvasView && dashboard && dialog && toast) {
    let activeFilter = 'all';
    let activeProjectId = null;
    let activeTool = 'select';
    let toastTimer;
    let zoom = 100;
    let fitZoomActive = true;
    let detailsManuallySet = false;
    let saveQueue = Promise.resolve();
    let projects = JSON.parse(appShell.dataset.projects);

    async function sendRequest(url, method, data) {
        const response = await fetch(url, {
            method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        const payload = response.status === 204 ? null : await response.json();
        if (!response.ok) {
            const validationError = payload?.errors ? Object.values(payload.errors).flat()[0] : null;
            throw new Error(validationError ?? payload?.message ?? `Request failed (${response.status}).`);
        }

        return payload;
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
    }

    function setSaveLabel(label) {
        document.querySelector('[data-canvas-save-label]').textContent = label;
    }

    function reportSaveError(error) {
        console.error('Hanger could not save this idea.', error);
        showToast(error.message || 'This idea could not be saved. Please try again.');
        setSaveLabel('Save failed');
    }

    function canvasItems(project) {
        return project.canvasItems ?? [];
    }

    function pieceCount(project) {
        return canvasItems(project).filter((item) => item.type !== 'heading').length;
    }

    function relativeTime(value) {
        if (!value) {
            return 'New idea';
        }

        const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
        if (Math.abs(seconds) < 60) {
            return 'just now';
        }

        const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const units = [
            ['minute', 60],
            ['hour', 3600],
            ['day', 86400],
            ['week', 604800],
            ['month', 2592000],
            ['year', 31536000],
        ];
        let valueInUnit = seconds;
        let unit = 'second';

        for (const [candidate, duration] of units) {
            if (Math.abs(seconds) < duration * 1.5) {
                break;
            }

            valueInUnit = seconds / duration;
            unit = candidate;
        }

        return formatter.format(Math.round(valueInUnit), unit);
    }

    function updateProjectCounts() {
        document.querySelector('[data-idea-count]').textContent = projects.length;
        document.querySelector('[data-heading-count]').textContent = String(projects.length).padStart(2, '0');
    }

    function renderProjects(query = document.querySelector('[data-search]').value) {
        projectGrid.querySelectorAll('[data-project-card-shell]').forEach((card) => card.remove());
        const normalizedQuery = query.trim().toLocaleLowerCase();
        const visibleProjects = projects
            .filter((project) => activeFilter !== 'favorites' || project.favorite)
            .filter((project) => activeFilter !== 'recent' || Boolean(project.lastOpenedAt))
            .filter((project) => !normalizedQuery || `${project.title} ${project.category}`.toLocaleLowerCase().includes(normalizedQuery));

        visibleProjects.forEach((project) => {
            projectGrid.insertBefore(createProjectCard(project), projectGrid.querySelector('[data-new-project]'));
        });

        const emptyState = document.querySelector('[data-empty-state]');
        emptyState.hidden = visibleProjects.length > 0;
        emptyState.textContent = projects.length === 0 && activeFilter === 'all' && !normalizedQuery
            ? 'Your idea wall is open. Start with one thought and see where it goes.'
            : 'No ideas match that search. Try another word.';
        updateProjectCounts();
    }

    function createProjectCard(project) {
        const shell = document.createElement('article');
        shell.className = 'project-card-shell';
        shell.dataset.projectCardShell = '';

        const openButton = document.createElement('button');
        openButton.className = 'project-card';
        openButton.type = 'button';
        openButton.dataset.projectCard = '';
        openButton.dataset.projectId = project.id;
        openButton.dataset.title = project.title;
        openButton.dataset.category = project.category;

        const preview = document.createElement('span');
        preview.className = `project-preview ${project.previewClass ?? 'preview-sunday'}`;
        preview.setAttribute('aria-hidden', 'true');
        const info = document.createElement('span');
        info.className = 'project-card-info';
        const title = document.createElement('span');
        title.className = 'project-card-title';
        title.textContent = project.title;
        const meta = document.createElement('span');
        meta.className = 'project-card-meta';
        const category = document.createElement('span');
        category.textContent = project.category;
        const separator = document.createElement('span');
        separator.className = 'meta-separator';
        separator.textContent = '·';
        const updated = document.createElement('span');
        updated.textContent = project.updated;
        meta.append(category, separator, updated);
        info.append(title, meta);
        openButton.append(preview, info);

        const favorite = document.createElement('button');
        favorite.className = 'favorite-toggle';
        favorite.type = 'button';
        favorite.dataset.toggleFavorite = project.id;
        favorite.setAttribute('aria-label', project.favorite ? 'Remove from favorites' : 'Add to favorites');
        favorite.setAttribute('aria-pressed', String(project.favorite));
        favorite.textContent = '✳';
        shell.append(openButton, favorite);

        return shell;
    }

    function renderRecentIdea() {
        const recentCard = document.querySelector('[data-continue-card]');
        const recentProject = projects.find((project) => project.lastOpenedAt) ?? projects[0];
        recentCard.hidden = !recentProject;

        if (!recentProject) {
            return;
        }

        recentCard.querySelector('[data-continue-title]').textContent = recentProject.title;
        recentCard.querySelector('[data-continue-meta]').textContent = `${pieceCount(recentProject)} things on this canvas · last opened ${relativeTime(recentProject.lastOpenedAt)}`;
        recentCard.querySelector('[data-continue-time]').textContent = relativeTime(recentProject.lastOpenedAt);
        recentCard.querySelector('[data-open-project]').dataset.openProject = recentProject.id;
    }

    async function persistProject(project) {
        const { idea } = await sendRequest(`/ideas/${encodeURIComponent(project.id)}`, 'PUT', {
            title: project.title,
            category: project.category,
            is_favorite: project.favorite,
            canvas_items: canvasItems(project),
        });
        project.updated = idea.updated;
        project.lastOpenedAt = idea.lastOpenedAt;
        setSaveLabel('Saved');
        renderProjects();
        renderRecentIdea();
    }

    function updateCanvasDetails(project) {
        const count = pieceCount(project);
        document.querySelector('[data-item-count]').textContent = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
        document.querySelector('.details-summary').textContent = project.lastOpenedAt
            ? `You last hung up ${count} things here. Add a thought whenever you’re ready.`
            : 'A fresh page for this idea. Add a note, shape, link, or reference whenever inspiration strikes.';
    }

    function createCanvasHeading(board, project, savedHeading = null) {
        const heading = document.createElement('div');
        heading.className = 'board-object board-heading';
        heading.dataset.boardObject = '';
        heading.dataset.itemType = 'heading';
        heading.setAttribute('role', 'group');
        heading.tabIndex = 0;
        heading.style.left = `${savedHeading?.left ?? 110}px`;
        heading.style.top = `${savedHeading?.top ?? 76}px`;

        const kicker = document.createElement('span');
        kicker.className = 'object-kicker';
        kicker.textContent = 'A LITTLE SPACE FOR';
        const title = document.createElement('strong');
        title.contentEditable = 'true';
        title.spellcheck = false;
        title.textContent = savedHeading?.content?.[0] ?? project.title;
        const subtitle = document.createElement('span');
        subtitle.className = 'object-subtitle';
        subtitle.contentEditable = 'true';
        subtitle.spellcheck = false;
        subtitle.textContent = savedHeading?.content?.[1] ?? 'start anywhere, see where it goes';
        heading.append(kicker, title, subtitle);
        board.append(heading);
    }

    function renderCanvas(project) {
        const board = document.querySelector('[data-idea-board]');
        const items = canvasItems(project);
        const savedHeading = items.find((item) => item.type === 'heading');
        board.replaceChildren();
        board.style.height = '650px';
        document.querySelector('[data-board-stage]').style.height = '650px';
        createCanvasHeading(board, project, savedHeading);
        items.filter((item) => item.type !== 'heading').forEach((item) => createBoardItem(item.type, item));
        board.dataset.projectId = project.id;
        updateCanvasDetails(project);
        fitZoomActive = true;
        setZoom(getFitZoom());
    }

    function getFitZoom() {
        const viewport = document.querySelector('[data-canvas-viewport]');
        return Math.max(25, Math.min(100, Math.floor(((viewport.clientWidth - 30) / 920) * 20) * 5));
    }

    function setZoom(value) {
        zoom = Math.max(25, Math.min(150, value));
        document.querySelector('[data-zoom-level]').textContent = `${zoom}%`;
        const board = document.querySelector('[data-idea-board]');
        const scale = zoom / 100;
        board.style.zoom = '1';
        board.style.transform = `scale(${scale})`;
        const stage = document.querySelector('[data-board-stage]');
        stage.style.width = `${board.offsetWidth * scale}px`;
        stage.style.height = `${board.offsetHeight * scale}px`;
    }

    function setDetailsVisible(visible, manual = true) {
        detailsManuallySet = manual;
        const panel = document.querySelector('[data-details-panel]');
        const layout = document.querySelector('.canvas-layout');
        panel.hidden = !visible;
        layout.classList.toggle('details-hidden', !visible);
        layout.classList.toggle('has-details', visible);
        document.querySelector('[data-details-toggle]').setAttribute('aria-expanded', String(visible));
        document.querySelector('[data-details-toggle]').setAttribute('aria-label', visible ? 'Hide idea details' : 'Show idea details');
    }

    function setSelectedTool(tool) {
        activeTool = tool;
        document.querySelectorAll('[data-tool], [data-add-item]').forEach((button) => {
            const selected = (button.dataset.tool ?? button.dataset.addItem) === tool;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    }

    function findBoardPosition(board, object) {
        const columnPositions = [28, 248, 468, 688];
        const rowHeight = 175;
        const existing = Array.from(board.querySelectorAll('[data-board-object]')).map((item) => ({
            left: Number.parseFloat(item.style.left) || 0,
            top: Number.parseFloat(item.style.top) || 0,
            width: item.offsetWidth,
            height: item.offsetHeight,
        }));

        for (let row = 0; row < 100; row += 1) {
            for (const left of columnPositions) {
                const top = 245 + row * rowHeight;
                const overlaps = existing.some((item) => (
                    left < item.left + item.width + 20
                    && left + object.offsetWidth + 20 > item.left
                    && top < item.top + item.height + 20
                    && top + object.offsetHeight + 20 > item.top
                ));

                if (!overlaps) {
                    board.style.height = `${Math.max(650, top + object.offsetHeight + 40)}px`;
                    return { left, top };
                }
            }
        }

        throw new Error('There is no room for another item on this canvas.');
    }

    function setBoardPosition(board, object, savedItem) {
        const position = savedItem
            ? { left: savedItem.left, top: savedItem.top }
            : findBoardPosition(board, object);
        object.style.left = `${position.left}px`;
        object.style.top = `${position.top}px`;
        board.style.height = `${Math.max(650, position.top + object.offsetHeight + 40)}px`;
        setZoom(zoom);
    }

    function safeLinkUrl(value) {
        const input = value.trim();
        if (!input) {
            return null;
        }

        try {
            const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
        } catch {
            return null;
        }
    }

    function updateLinkAction(object) {
        const urlField = object.querySelector('[data-link-url]');
        const url = safeLinkUrl(urlField.textContent);
        let openLink = object.querySelector('[data-link-open]');

        if (!url) {
            openLink?.remove();
            return;
        }

        if (!openLink) {
            openLink = document.createElement('a');
            openLink.className = 'link-open';
            openLink.dataset.linkOpen = '';
            openLink.target = '_blank';
            openLink.rel = 'noopener noreferrer';
            openLink.setAttribute('aria-label', 'Open this link in a new tab');
            openLink.textContent = 'Open ↗';
            object.append(openLink);
        }

        openLink.href = url;
    }

    function createLinkCard(object, type, savedItem) {
        object.classList.add('board-link-card');
        const icon = document.createElement('span');
        icon.className = 'link-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = type === 'reference' ? '↗' : '↗';
        const copy = document.createElement('span');
        copy.className = 'link-copy';
        const title = document.createElement('strong');
        title.contentEditable = 'true';
        title.spellcheck = false;
        title.textContent = savedItem?.content?.[0] ?? (type === 'reference' ? 'Add a reference title' : 'Add a link title');
        const url = document.createElement('small');
        url.contentEditable = 'true';
        url.spellcheck = false;
        url.dataset.linkUrl = '';
        url.textContent = savedItem?.content?.[1] ?? (type === 'reference' ? 'paste a Pinterest or web link' : 'paste a link here');
        copy.append(title, url);
        object.append(icon, copy);
        updateLinkAction(object);
    }

    function addBoardImage(object, source, name) {
        const image = document.createElement('img');
        image.alt = name ?? 'Added image';
        image.src = source;
        image.style.maxWidth = '180px';
        image.style.maxHeight = '180px';
        image.style.boxShadow = '0 5px 13px rgb(68 58 45 / 10%)';
        object.append(image);
    }

    function createBoardItem(type, savedItem = null) {
        const board = document.querySelector('[data-idea-board]');
        const object = document.createElement('div');
        object.className = 'board-object';
        object.dataset.boardObject = '';
        object.dataset.itemType = type;
        object.setAttribute('role', 'group');
        object.tabIndex = 0;

        if (type === 'note') {
            const existingNotes = board.querySelectorAll('[data-item-type="note"]').length;
            object.classList.add('board-note', existingNotes % 2 ? 'note-lilac' : 'note-butter');
            object.innerHTML = '<span class="object-pin"></span><span contenteditable="true" spellcheck="false">A little thought to keep</span><span class="object-caption">NEW NOTE</span>';
            object.querySelector('[contenteditable]').textContent = savedItem?.content?.[0] ?? 'A little thought to keep';
        } else if (type === 'text') {
            object.classList.add('board-heading', 'board-text');
            object.innerHTML = '<strong contenteditable="true" spellcheck="false">A new thought</strong>';
            object.querySelector('[contenteditable]').textContent = savedItem?.content?.[0] ?? 'A new thought';
        } else if (type === 'shape') {
            object.classList.add('board-shape');
            object.setAttribute('aria-label', 'Decorative circle');
        } else if (type === 'link' || type === 'reference') {
            createLinkCard(object, type, savedItem);
            if (type === 'reference') {
                const caption = document.createElement('span');
                caption.className = 'object-caption';
                caption.textContent = 'SAVED REFERENCE';
                object.append(caption);
            }
        } else if (type === 'image') {
            if (savedItem?.imageData) {
                addBoardImage(object, savedItem.imageData, savedItem.imageName);
            } else {
                const upload = document.createElement('input');
                upload.type = 'file';
                upload.accept = 'image/jpeg,image/png,image/gif,image/webp';
                upload.setAttribute('aria-label', 'Choose an image');
                upload.addEventListener('change', () => {
                    const file = upload.files?.[0];
                    if (!file) {
                        object.remove();
                        return;
                    }

                    if (file.size > 1024 * 1024) {
                        object.remove();
                        showToast('Choose an image smaller than 1 MB.');
                        return;
                    }

                    const reader = new FileReader();
                    reader.addEventListener('load', () => {
                        upload.remove();
                        addBoardImage(object, reader.result, file.name);
                        void saveCanvas();
                    });
                    reader.addEventListener('error', () => {
                        object.remove();
                        showToast('This image could not be opened.');
                    });
                    reader.readAsDataURL(file);
                }, { once: true });
                board.append(object);
                object.append(upload);
                upload.click();
                return object;
            }
        }

        board.append(object);
        setBoardPosition(board, object, savedItem);
        if (!savedItem && ['note', 'text'].includes(type)) {
            object.querySelector('[contenteditable]').focus();
        }
        updateCanvasDetails(projects.find((project) => project.id === activeProjectId));

        return object;
    }

    async function openCanvas(projectId) {
        window.clearTimeout(window.hangerSaveTimer);
        if (activeProjectId !== null && activeProjectId !== projectId) {
            await saveCanvas();
        }

        const project = projects.find((item) => item.id === projectId);
        if (!project) {
            return;
        }

        activeProjectId = projectId;
        dashboard.hidden = true;
        canvasView.hidden = false;
        document.querySelector('[data-canvas-title]').value = project.title;
        document.querySelector('.canvas-toolbar-label').textContent = project.title.toLocaleUpperCase();
        setSaveLabel('Saved');
        setSelectedTool('select');
        detailsManuallySet = false;
        setDetailsVisible(window.innerWidth > 1050, false);
        renderCanvas(project);
        project.lastOpenedAt = new Date().toISOString();
        project.updated = 'just now';
        renderProjects();
        renderRecentIdea();

        try {
            const { idea } = await sendRequest(`/ideas/${encodeURIComponent(project.id)}/open`, 'PATCH');
            project.updated = idea.updated;
            project.lastOpenedAt = idea.lastOpenedAt;
            renderRecentIdea();
        } catch (error) {
            reportSaveError(error);
        }
    }

    async function saveCanvas() {
        const project = projects.find((item) => item.id === activeProjectId);
        if (!project) {
            return;
        }

        project.canvasItems = Array.from(document.querySelectorAll('[data-idea-board] [data-board-object]'))
            .map((object) => ({
                type: object.dataset.itemType,
                left: Number.parseFloat(object.style.left) || 0,
                top: Number.parseFloat(object.style.top) || 0,
                content: Array.from(object.querySelectorAll('[contenteditable]')).map((editable) => editable.textContent),
                imageData: object.querySelector('img')?.src.startsWith('data:') ? object.querySelector('img').src : null,
                imageName: object.querySelector('img')?.alt ?? null,
            }));
        updateCanvasDetails(project);
        setSaveLabel('Saving…');
        const request = saveQueue.catch(() => {}).then(() => persistProject(project));
        saveQueue = request;

        try {
            await request;
        } catch (error) {
            reportSaveError(error);
        }
    }

    function filterProjects(filter) {
        activeFilter = filter;
        document.querySelectorAll('[data-filter]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.filter === filter);
        });
        renderProjects();
        document.querySelector('[data-workspace-menu]').hidden = true;
        document.querySelector('[data-workspace-toggle]').setAttribute('aria-expanded', 'false');
    }

    async function toggleFavorite(projectId) {
        const project = projects.find((item) => item.id === projectId);
        if (!project) {
            return;
        }

        try {
            const { idea } = await sendRequest(`/ideas/${encodeURIComponent(project.id)}`, 'PUT', {
                is_favorite: !project.favorite,
            });
            Object.assign(project, idea);
            renderProjects();
            renderRecentIdea();
            document.querySelector('[data-canvas-favorite]').textContent = project.favorite ? '★ Remove from favorites' : '☆ Add to favorites';
            showToast(project.favorite ? 'Added to favorites' : 'Removed from favorites');
        } catch (error) {
            console.error('Hanger could not update this favorite.', error);
            showToast(error.message || 'This favorite could not be updated.');
        }
    }

    async function deleteIdea() {
        const project = projects.find((item) => item.id === activeProjectId);
        if (!project || !window.confirm(`Delete “${project.title}”? This cannot be undone.`)) {
            return;
        }

        window.clearTimeout(window.hangerSaveTimer);
        await saveCanvas();

        try {
            await sendRequest(`/ideas/${encodeURIComponent(project.id)}`, 'DELETE');
            projects = projects.filter((item) => item.id !== project.id);
            activeProjectId = null;
            canvasView.hidden = true;
            dashboard.hidden = false;
            renderProjects();
            renderRecentIdea();
            showToast('Idea deleted');
        } catch (error) {
            console.error('Hanger could not delete this idea.', error);
            showToast(error.message || 'This idea could not be deleted.');
        }
    }

    document.addEventListener('click', async (event) => {
        const target = event.target;
        const workspaceToggle = target.closest('[data-workspace-toggle]');
        if (workspaceToggle) {
            const menu = document.querySelector('[data-workspace-menu]');
            menu.hidden = !menu.hidden;
            workspaceToggle.setAttribute('aria-expanded', String(!menu.hidden));
            return;
        }

        if (target.closest('[data-open-help]') || target.closest('[data-help-button]')) {
            helpDialog.showModal();
            return;
        }

        if (target.closest('[data-close-help]')) {
            helpDialog.close();
            return;
        }

        const filterButton = target.closest('[data-filter]');
        if (filterButton) {
            filterProjects(filterButton.dataset.filter);
            return;
        }

        const favoriteButton = target.closest('[data-toggle-favorite]');
        if (favoriteButton) {
            await toggleFavorite(favoriteButton.dataset.toggleFavorite);
            return;
        }

        const canvasFavoriteButton = target.closest('[data-canvas-favorite]');
        if (canvasFavoriteButton) {
            await toggleFavorite(activeProjectId);
            document.querySelector('[data-canvas-actions-menu]').hidden = true;
            document.querySelector('[data-canvas-more]').setAttribute('aria-expanded', 'false');
            return;
        }

        if (target.closest('[data-delete-project]')) {
            document.querySelector('[data-canvas-actions-menu]').hidden = true;
            document.querySelector('[data-canvas-more]').setAttribute('aria-expanded', 'false');
            await deleteIdea();
            return;
        }

        if (target.closest('[data-canvas-more]')) {
            const menu = document.querySelector('[data-canvas-actions-menu]');
            menu.hidden = !menu.hidden;
            document.querySelector('[data-canvas-more]').setAttribute('aria-expanded', String(!menu.hidden));
            const project = projects.find((item) => item.id === activeProjectId);
            document.querySelector('[data-canvas-favorite]').textContent = project?.favorite ? '★ Remove from favorites' : '☆ Add to favorites';
            return;
        }

        if (target.closest('[data-details-toggle]')) {
            setDetailsVisible(document.querySelector('[data-details-panel]').hidden);
            return;
        }

        if (target.closest('[data-details-close]')) {
            setDetailsVisible(false);
            return;
        }

        const toolButton = target.closest('[data-tool]');
        if (toolButton) {
            setSelectedTool(toolButton.dataset.tool);
            return;
        }

        const openButton = target.closest('[data-project-card]');
        if (openButton) {
            await openCanvas(openButton.dataset.projectId);
            return;
        }

        const continueButton = target.closest('[data-open-project]');
        if (continueButton) {
            await openCanvas(continueButton.dataset.openProject);
            return;
        }

        if (target.closest('[data-new-project]')) {
            dialog.showModal();
            dialog.querySelector('input').focus();
            return;
        }

        if (target.closest('[data-close-dialog]')) {
            dialog.close();
            return;
        }

        if (target.closest('[data-view-toggle]')) {
            const isList = projectGrid.classList.toggle('is-list');
            const viewButton = document.querySelector('[data-view-toggle]');
            viewButton.setAttribute('aria-label', isList ? 'Grid view' : 'List view');
            viewButton.title = isList ? 'Switch to grid view' : 'Switch to list view';
            return;
        }

        const addButton = target.closest('[data-add-item]');
        if (addButton) {
            const type = addButton.dataset.addItem;
            setSelectedTool(type);
            const item = createBoardItem(type);
            setSelectedTool('select');
            if (item && type !== 'image') {
                await saveCanvas();
                showToast(`${type === 'reference' ? 'Reference' : type[0].toUpperCase() + type.slice(1)} added to your canvas`);
            }
            return;
        }

        if (target.closest('[data-back-to-dashboard]')) {
            window.clearTimeout(window.hangerSaveTimer);
            await saveCanvas();
            canvasView.hidden = true;
            dashboard.hidden = false;
            renderProjects();
            renderRecentIdea();
            return;
        }

        if (target.closest('[data-zoom-fit]')) {
            fitZoomActive = true;
            setZoom(getFitZoom());
            return;
        }

        if (target.closest('[data-zoom-in]')) {
            fitZoomActive = false;
            setZoom(zoom + 10);
            return;
        }

        if (target.closest('[data-zoom-out]')) {
            fitZoomActive = false;
            setZoom(zoom - 10);
            return;
        }

        if (target.closest('[data-canvas-share]')) {
            showToast('Sharing with others is not available yet. This canvas is private to your account.');
        }
    });

    document.addEventListener('pointerdown', (event) => {
        if (!event.target.closest('[data-workspace-menu]') && !event.target.closest('[data-workspace-toggle]')) {
            document.querySelector('[data-workspace-menu]').hidden = true;
            document.querySelector('[data-workspace-toggle]').setAttribute('aria-expanded', 'false');
        }

        if (!event.target.closest('[data-canvas-actions-menu]') && !event.target.closest('[data-canvas-more]')) {
            document.querySelector('[data-canvas-actions-menu]').hidden = true;
            document.querySelector('[data-canvas-more]').setAttribute('aria-expanded', 'false');
        }

        const target = event.target.closest('[data-board-object]');
        if (!target || event.target.closest('a, button, input')) {
            return;
        }

        document.querySelectorAll('.board-object.is-focused').forEach((object) => object.classList.remove('is-focused'));
        target.classList.add('is-focused');
        if (activeTool !== 'select' || event.target.isContentEditable) {
            return;
        }

        const startX = event.clientX;
        const startY = event.clientY;
        const initialLeft = Number.parseFloat(target.style.left);
        const initialTop = Number.parseFloat(target.style.top);

        function moveObject(moveEvent) {
            target.style.left = `${Math.max(0, initialLeft + (moveEvent.clientX - startX) / (zoom / 100))}px`;
            target.style.top = `${Math.max(0, initialTop + (moveEvent.clientY - startY) / (zoom / 100))}px`;
        }

        function releaseObject() {
            document.removeEventListener('pointermove', moveObject);
            document.removeEventListener('pointerup', releaseObject);
            void saveCanvas();
        }

        document.addEventListener('pointermove', moveObject);
        document.addEventListener('pointerup', releaseObject, { once: true });
    });

    document.querySelector('[data-create-project-form]').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = form.elements.title;
        const title = input.value.trim();

        if (!title) {
            input.focus();
            return;
        }

        try {
            const { idea } = await sendRequest('/ideas', 'POST', { title });
            projects.unshift(idea);
            renderProjects();
            renderRecentIdea();
            form.reset();
            dialog.close();
            await openCanvas(idea.id);
        } catch (error) {
            console.error('Hanger could not create this idea.', error);
            showToast(error.message || 'This idea could not be created. Please try again.');
        }
    });

    document.querySelector('[data-search]').addEventListener('input', (event) => {
        renderProjects(event.currentTarget.value);
    });

    document.querySelector('[data-canvas-title]').addEventListener('change', (event) => {
        const project = projects.find((item) => item.id === activeProjectId);
        const title = event.currentTarget.value.trim();
        if (!project || !title) {
            event.currentTarget.value = project?.title ?? '';
            return;
        }

        const oldTitle = project.title;
        project.title = title;
        const boardTitle = document.querySelector('[data-idea-board] [data-item-type="heading"] strong');
        if (boardTitle.textContent === oldTitle) {
            boardTitle.textContent = title;
        }
        document.querySelector('.canvas-toolbar-label').textContent = title.toLocaleUpperCase();
        renderProjects();
        renderRecentIdea();
        void saveCanvas();
    });

    document.addEventListener('input', (event) => {
        const object = event.target.closest('[data-board-object]');
        if (!object || !event.target.isContentEditable || !event.target.closest('[data-idea-board]')) {
            return;
        }

        if (object.dataset.itemType === 'link' || object.dataset.itemType === 'reference') {
            updateLinkAction(object);
        }
        setSaveLabel('Unsaved changes');
        updateCanvasDetails(projects.find((project) => project.id === activeProjectId));
        window.clearTimeout(window.hangerSaveTimer);
        window.hangerSaveTimer = window.setTimeout(() => void saveCanvas(), 350);
    });

    document.addEventListener('keydown', async (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k' && !dialog.open && !helpDialog.open) {
            event.preventDefault();
            if (!canvasView.hidden) {
                window.clearTimeout(window.hangerSaveTimer);
                await saveCanvas();
                canvasView.hidden = true;
                dashboard.hidden = false;
                renderProjects();
                renderRecentIdea();
            }
            document.querySelector('[data-search]').focus();
            return;
        }

        if (canvasView.hidden || helpDialog.open || dialog.open || event.target.matches('input, [contenteditable="true"]')) {
            return;
        }

        const key = event.key.toLocaleLowerCase();
        if (key === 'v') {
            setSelectedTool('select');
            return;
        }

        const tools = { n: 'note', t: 'text', s: 'shape', l: 'link', r: 'reference' };
        if (tools[key]) {
            createBoardItem(tools[key]);
            setSelectedTool('select');
            void saveCanvas();
            return;
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            const selected = document.querySelector('[data-board-object].is-focused');
            if (selected && selected.dataset.itemType !== 'heading') {
                selected.remove();
                void saveCanvas();
            }
        }
    });

    window.addEventListener('resize', () => {
        if (!canvasView.hidden && fitZoomActive) {
            setZoom(getFitZoom());
        }
        if (!canvasView.hidden && !detailsManuallySet) {
            setDetailsVisible(window.innerWidth > 1050, false);
        }
    });

    renderProjects();
    renderRecentIdea();
}
