const STORAGE_KEY = 'promptManagerCollapsedStates';
let isProcessing = false;

function getInitials(str) {
    return str.split(/\s+/).map(word => word[0]).join('').toUpperCase();
}

function saveCollapsedState(identifier, isCollapsed) {
    let states = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    states[identifier] = isCollapsed;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

function getCollapsedStates() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function createCollapseHandler(item, collapsedContainer) {
    return (e) => {
        e.stopPropagation();
        const name = item.querySelector('.prompt-manager-inspect-action').textContent;
        const initials = getInitials(name);
        const identifier = item.getAttribute('data-pm-identifier');

        saveCollapsedState(identifier, true);

        const collapsedBox = document.createElement('div');
        collapsedBox.className = 'collapsed-prompt-box';
        collapsedBox.title = name;
        collapsedBox.textContent = initials;
        collapsedBox.dataset.originalHTML = item.dataset.originalHTML;
        collapsedBox.dataset.originalPosition = item.dataset.originalPosition;
        collapsedBox.dataset.pmIdentifier = identifier;

        collapsedBox.addEventListener('click', () => {
            saveCollapsedState(identifier, false);
            item.innerHTML = collapsedBox.dataset.originalHTML;
            item.style.display = 'grid';

            const newControls = item.querySelector('.prompt_manager_prompt_controls');
            const newCollapseBtn = document.createElement('span');
            newCollapseBtn.className = 'prompt-collapse-btn';
            newCollapseBtn.textContent = '🗜️';
            newCollapseBtn.style.cursor = 'pointer';
            newCollapseBtn.style.marginRight = '5px';
            newCollapseBtn.addEventListener('click', createCollapseHandler(item, collapsedContainer));

            const existingBtn = newControls.querySelector('.prompt-collapse-btn');
            if (existingBtn) {
                existingBtn.remove();
            }

            newControls.insertBefore(newCollapseBtn, newControls.firstChild);
            collapsedBox.remove();
        });

        collapsedContainer.appendChild(collapsedBox);
        item.style.display = 'none';
    };
}

function addCollapseButtons() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        let collapsedContainer = document.querySelector('.collapsed-items-container');
        if (!collapsedContainer) {
            collapsedContainer = document.createElement('div');
            collapsedContainer.className = 'collapsed-items-container';
            const separator = document.querySelector('.completion_prompt_manager_list_separator');
            if (separator) {
                separator.parentNode.insertBefore(collapsedContainer, separator);
            }
        }

        const items = document.querySelectorAll('.completion_prompt_manager_prompt');
        const collapsedStates = getCollapsedStates();

        items.forEach(item => {
            if (item.classList.contains('completion_prompt_manager_list_head')) return;
            if (item.querySelector('.prompt-collapse-btn')) return;

            const identifier = item.getAttribute('data-pm-identifier');
            if (!identifier) return;

            item.dataset.originalHTML = item.innerHTML;
            item.dataset.originalPosition = Array.from(item.parentNode.children).indexOf(item);

            const controls = item.querySelector('.prompt_manager_prompt_controls');
            if (!controls) return;

            const collapseBtn = document.createElement('span');
            collapseBtn.className = 'prompt-collapse-btn';
            collapseBtn.textContent = '🗜️';
            collapseBtn.style.cursor = 'pointer';
            collapseBtn.style.marginRight = '5px';

            collapseBtn.addEventListener('click', createCollapseHandler(item, collapsedContainer));
            controls.insertBefore(collapseBtn, controls.firstChild);

            if (collapsedStates[identifier]) {
                collapseBtn.click();
            }
        });
    } finally {
        isProcessing = false;
    }
}

// Initialize extension
jQuery(() => {
    setTimeout(addCollapseButtons, 1000);

    const observer = new MutationObserver((mutations) => {
        const relevantChanges = mutations.some(mutation =>
            mutation.target.classList?.contains('completion_prompt_manager_prompt') ||
            mutation.target.id === 'completion_prompt_manager_list'
        );

        if (relevantChanges) {
            setTimeout(addCollapseButtons, 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
