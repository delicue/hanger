const appShell = document.querySelector('[data-app-shell]');
const projectGrid = document.querySelector('[data-project-grid]');
const canvasView = document.querySelector('[data-canvas-view]');
const dashboard = document.querySelector('[data-dashboard]');
const dialog = document.querySelector('[data-new-idea-dialog]');
const toast = document.querySelector('[data-toast]');

if (projectGrid && canvasView && dashboard && dialog && toast) {
    let activeFilter = 'all';
    let activeProjectId = null;
    let toastTimer;
    let zoom = 100;
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

    function reportSaveError(error) {
        console.error('Hanger could not save this idea.', error);
        showToast(error.message || 'This idea could not be saved. Please try again.');
        document.querySelector('[data-canvas-save-label]').textContent = 'Save failed';
    }

    async function persistProject(project, extra = {}) {
        const { idea } = await sendRequest(`/ideas/${encodeURIComponent(project.id)}`, 'PUT', {
            title: project.title,
            category: project.category,
            is_favorite: project.favorite,
            canvas_items: project.canvasItems ?? [],
            ...extra,
        });
        Object.assign(project, idea);
        document.querySelector('[data-canvas-save-label]').textContent = 'Saved';
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
    }

    function updateProjectCounts() {
        const total = String(projects.length).padStart(2, '0');
        document.querySelector('[data-idea-count]').textContent = projects.length;
        document.querySelector('[data-heading-count]').textContent = total;
    }

    function renderProjects(query = '') {
        projectGrid.querySelectorAll('[data-project-card]').forEach((card) => card.remove());
        const normalizedQuery = query.trim().toLocaleLowerCase();
        let visibleCount = 0;

        projects
            .filter((project) => activeFilter !== 'favorites' || project.favorite)
            .filter((project) => activeFilter !== 'recent' || Boolean(project.lastOpenedAt))
            .filter((project) => !normalizedQuery || `${project.title} ${project.category}`.toLocaleLowerCase().includes(normalizedQuery))
            .forEach((project) => {
                const card = createProjectCard(project);
                projectGrid.insertBefore(card, projectGrid.querySelector('[data-new-project]'));
                visibleCount += 1;
            });

        document.querySelector('[data-empty-state]').hidden = visibleCount > 0;
        if (projects.length === 0) {
            document.querySelector('[data-empty-state]').textContent = 'Your idea wall is open. Start with one thought and see where it goes.';
        } else {
            document.querySelector('[data-empty-state]').textContent = 'No ideas match that search. Try another word.';
        }
        updateProjectCounts();
    }

    function createProjectCard(project) {
        const card = document.createElement('button');
        card.className = 'project-card';
        card.type = 'button';
        card.dataset.projectCard = '';
        card.dataset.projectId = project.id;
        card.dataset.title = project.title;
        card.dataset.category = project.category;
        card.dataset.updated = project.updated;
        card.dataset.favorite = String(project.favorite);

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
        meta.textContent = `${project.category} · ${project.updated}`;
        if (project.favorite) {
            const favorite = document.createElement('span');
            favorite.className = 'favorite-mark';
            favorite.setAttribute('aria-label', 'Favorite');
            favorite.textContent = '✳';
            meta.append(favorite);
        }
        info.append(title, meta);
        card.append(preview, info);

        return card;
    }

    function renderCanvas(project) {
        const board = document.querySelector('[data-idea-board]');

        board.replaceChildren();
        createCanvasHeading(board, project.title);
        project.canvasItems?.forEach((item) => createBoardItem(item.type, item));

        board.dataset.projectId = project.id;
        document.querySelector('.details-summary').textContent = project.lastOpenedAt
            ? `You last hung up ${project.canvasItems.length} things here. Add a thought whenever you’re ready.`
            : 'A fresh page for this idea. Add a note, shape, link, or image whenever inspiration strikes.';
        document.querySelector('[data-item-count]').textContent = `${project.canvasItems.length} ${project.canvasItems.length === 1 ? 'piece' : 'pieces'}`;
    }

    function createCanvasHeading(board, title) {
        const heading = document.createElement('div');
        heading.className = 'board-object board-heading';
        heading.dataset.boardObject = '';
        heading.dataset.itemType = 'heading';
        heading.style.left = '110px';
        heading.style.top = '76px';
        const kicker = document.createElement('span');
        kicker.className = 'object-kicker';
        kicker.textContent = 'A LITTLE SPACE FOR';
        const titleElement = document.createElement('strong');
        titleElement.contentEditable = 'true';
        titleElement.spellcheck = false;
        titleElement.textContent = title;
        const subtitle = document.createElement('span');
        subtitle.className = 'object-subtitle';
        subtitle.contentEditable = 'true';
        subtitle.spellcheck = false;
        subtitle.textContent = 'start anywhere, see where it goes';
        heading.append(kicker, titleElement, subtitle);
        board.append(heading);
    }

    async function openCanvas(projectId, title) {
        window.clearTimeout(window.hangerSaveTimer);
        if (activeProjectId !== null && activeProjectId !== projectId) {
            await saveCanvas();
        }

        activeProjectId = projectId;
        dashboard.hidden = true;
        canvasView.hidden = false;
        document.querySelector('[data-canvas-title]').value = title;
        document.querySelector('.canvas-toolbar-label').textContent = title.toLocaleUpperCase();
        document.querySelector('[data-canvas-save-label]').textContent = 'Saved';
        const project = projects.find((item) => item.id === projectId);
        if (project) {
            renderCanvas(project);
            project.lastOpenedAt = new Date().toISOString();
            project.updated = 'just now';
            renderProjects(document.querySelector('[data-search]').value);
            try {
                const { idea: savedIdea } = await sendRequest(`/ideas/${encodeURIComponent(project.id)}/open`, 'PATCH');
                Object.assign(project, savedIdea);
            } catch (error) {
                reportSaveError(error);
            }
        }
    }

    function createBoardItem(type, savedItem = null) {
        const board = document.querySelector('[data-idea-board]');
        const object = document.createElement('div');
        const existingItems = board.querySelectorAll('[data-board-object]').length;
        object.className = 'board-object';
        object.dataset.boardObject = '';
        object.dataset.itemType = type;
        object.style.left = `${savedItem?.left ?? 120 + (existingItems % 4) * 145}px`;
        object.style.top = `${savedItem?.top ?? 385 + (existingItems % 3) * 40}px`;

        if (type === 'note') {
            object.classList.add('board-note', existingItems % 2 ? 'note-lilac' : 'note-butter');
            object.innerHTML = '<span class="object-pin"></span><span contenteditable="true" spellcheck="false">A little thought to keep</span><span class="object-caption">NEW NOTE</span>';
            object.querySelector('[contenteditable]').textContent = savedItem?.content?.[0] ?? 'A little thought to keep';
            if (!savedItem) {
                object.querySelector('[contenteditable]').focus();
            }
        } else if (type === 'text') {
            object.classList.add('board-heading', 'board-text');
            object.innerHTML = '<strong contenteditable="true" spellcheck="false">A new thought</strong>';
            object.querySelector('[contenteditable]').textContent = savedItem?.content?.[0] ?? 'A new thought';
            if (!savedItem) {
                object.querySelector('[contenteditable]').focus();
            }
        } else if (type === 'shape') {
            object.classList.add('board-shape');
            object.setAttribute('aria-label', 'Decorative circle');
        } else if (type === 'link') {
            object.classList.add('board-link-card');
            object.innerHTML = '<span class="link-icon" aria-hidden="true">↗</span><span><strong contenteditable="true" spellcheck="false">Add a link title</strong><small contenteditable="true" spellcheck="false">paste a link here</small></span>';
            const editableContent = object.querySelectorAll('[contenteditable]');
            editableContent[0].textContent = savedItem?.content?.[0] ?? 'Add a link title';
            editableContent[1].textContent = savedItem?.content?.[1] ?? 'paste a link here';
        } else if (type === 'reference') {
            object.classList.add('board-image-card');
            object.innerHTML = '<span class="image-card-art" aria-hidden="true"><span></span><i></i></span><span class="image-card-caption"><strong>A quiet place</strong><small>little journal · saved reference</small></span>';
        } else if (type === 'image') {
            if (savedItem?.imageData) {
                addBoardImage(object, savedItem.imageData, savedItem.imageName);
            } else {
                const upload = document.createElement('input');
                upload.type = 'file';
                upload.accept = 'image/*';
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
                        addBoardImage(object, reader.result, file.name);
                        saveCanvas();
                    });
                    reader.addEventListener('error', () => {
                        object.remove();
                        showToast('This image could not be opened.');
                    });
                    reader.readAsDataURL(file);
                }, { once: true });
                object.append(upload);
                board.append(object);
                upload.click();
                return object;
            }
        }

        board.append(object);
        return object;
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

    async function saveCanvas() {
        const project = projects.find((item) => item.id === activeProjectId);
        if (!project) {
            return;
        }

        project.canvasItems = Array.from(document.querySelectorAll('[data-idea-board] [data-board-object]'))
            .filter((object) => object.dataset.itemType !== 'heading')
            .map((object) => ({
            type: object.dataset.itemType ?? 'heading',
            left: Number.parseFloat(object.style.left) || 0,
            top: Number.parseFloat(object.style.top) || 0,
            content: Array.from(object.querySelectorAll('[contenteditable]')).map((editable) => editable.textContent),
            imageData: object.querySelector('img')?.src.startsWith('data:') ? object.querySelector('img').src : null,
            imageName: object.querySelector('img')?.alt ?? null,
            }));
        try {
            await persistProject(project);
        } catch (error) {
            reportSaveError(error);
        }
    }

    function filterProjects(filter) {
        activeFilter = filter;
        document.querySelectorAll('[data-filter]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.filter === filter);
        });
        renderProjects(document.querySelector('[data-search]').value);
    }

    document.addEventListener('click', async (event) => {
        const projectCard = event.target.closest('[data-project-card]');
        if (projectCard) {
            await openCanvas(projectCard.dataset.projectId, projectCard.dataset.title);
            return;
        }

        const openProjectButton = event.target.closest('[data-open-project]');
        if (openProjectButton) {
            const project = projects.find((item) => item.id === openProjectButton.dataset.openProject);
            if (project) {
                await openCanvas(project.id, project.title);
            }
            return;
        }

        const filterButton = event.target.closest('[data-filter]');
        if (filterButton) {
            filterProjects(filterButton.dataset.filter);
            return;
        }

        if (event.target.closest('[data-new-project]')) {
            dialog.showModal();
            dialog.querySelector('input').focus();
            return;
        }

        if (event.target.closest('[data-close-dialog]')) {
            dialog.close();
            return;
        }

        const addButton = event.target.closest('[data-add-item]');
        if (addButton) {
            const item = createBoardItem(addButton.dataset.addItem);
            if (item && addButton.dataset.addItem !== 'image') {
                await saveCanvas();
                showToast(`${addButton.dataset.addItem[0].toUpperCase()}${addButton.dataset.addItem.slice(1)} added to your canvas`);
            }
            return;
        }

        if (event.target.closest('[data-back-to-dashboard]')) {
            window.clearTimeout(window.hangerSaveTimer);
            await saveCanvas();
            canvasView.hidden = true;
            dashboard.hidden = false;
            renderProjects(document.querySelector('[data-search]').value);
            return;
        }

        if (event.target.closest('[data-zoom-in]')) {
            zoom = Math.min(150, zoom + 10);
            document.querySelector('[data-zoom-level]').textContent = `${zoom}%`;
            document.querySelector('[data-idea-board]').style.transform = `scale(${zoom / 100})`;
            return;
        }

        if (event.target.closest('[data-zoom-out]')) {
            zoom = Math.max(50, zoom - 10);
            document.querySelector('[data-zoom-level]').textContent = `${zoom}%`;
            document.querySelector('[data-idea-board]').style.transform = `scale(${zoom / 100})`;
            return;
        }

        if (event.target.closest('[data-canvas-share]')) {
            showToast('Sharing will be available when accounts are connected.');
        }
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
            form.reset();
            dialog.close();
            await openCanvas(idea.id, idea.title);
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

        if (project && title) {
            project.title = title;
            document.querySelector('.canvas-toolbar-label').textContent = title.toLocaleUpperCase();
            renderProjects(document.querySelector('[data-search]').value);
            saveCanvas();
        }
    });

    document.addEventListener('input', (event) => {
        if (event.target.isContentEditable && event.target.closest('[data-idea-board]')) {
            document.querySelector('[data-canvas-save-label]').textContent = 'Unsaved changes';
            window.clearTimeout(window.hangerSaveTimer);
            window.hangerSaveTimer = window.setTimeout(saveCanvas, 300);
        }
    });

    document.addEventListener('pointerdown', (event) => {
        const target = event.target.closest('[data-board-object]');
        if (!target || event.target.isContentEditable || event.target.closest('input')) {
            return;
        }

        document.querySelectorAll('.board-object.is-focused').forEach((object) => object.classList.remove('is-focused'));
        target.classList.add('is-focused');
        const board = document.querySelector('[data-idea-board]');
        const boardRect = board.getBoundingClientRect();
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
            if (boardRect.width > 0) {
                saveCanvas();
            }
        }

        document.addEventListener('pointermove', moveObject);
        document.addEventListener('pointerup', releaseObject, { once: true });
    });

    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
            event.preventDefault();
            document.querySelector('[data-search]').focus();
            return;
        }

        if (canvasView.hidden || event.target.matches('input, [contenteditable="true"]')) {
            return;
        }

        const tools = { n: 'note', t: 'text', s: 'shape', l: 'link' };
        const type = tools[event.key.toLocaleLowerCase()];
        if (type) {
            createBoardItem(type);
        }
    });

    renderProjects();
}
