


/* ================= DATA & CONSTANTS ================= */

const STORAGE_KEY = 'ai_sub_tracker_data';
const THEME_KEY = 'ai_sub_tracker_theme';
const NOTIFS_KEY = 'ai_sub_tracker_notifs';

// AI tools
const defaultTools = [
    { id: 'chatgpt', name: 'ChatGPT', domain: 'chatgpt.com', color: '#10A37F' },
    { id: 'claude', name: 'Claude', domain: 'claude.ai', color: '#D97757' },
    { id: 'gemini', name: 'Gemini', domain: 'gemini.google.com', color: '#1A73E8' },
    { id: 'grok', name: 'Grok', domain: 'x.com', color: '#000000', lightColor: '#333' },
    { id: 'perplexity', name: 'Perplexity', domain: 'perplexity.ai', color: '#22B8CD' },
    { id: 'midjourney', name: 'Midjourney', domain: 'midjourney.com', color: '#ffffff', textColor: '#000' },
    { id: 'cursor', name: 'Cursor', domain: 'cursor.com', color: '#000000', lightColor: '#333' },
    { id: 'suno', name: 'Suno', domain: 'suno.com', color: '#FF4500' },
    { id: 'runway', name: 'Runway', domain: 'runwayml.com', color: '#8A2BE2' },
    { id: 'deepseek', name: 'DeepSeek', domain: 'deepseek.com', color: '#4D94FF' },
    { id: 'copilot', name: 'GitHub Copilot', domain: 'github.com', color: '#ffffff', textColor: '#000' }
];

let subscriptions = [];
let sortColumn = 'daysRemaining';
let sortAsc = true;


/* ================= INIT & SETUP ================= */

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadData();
    renderApp();
    checkNotifications();
    setupEventListeners();
});


function setupEventListeners() {

    document.getElementById('theme-toggle')
        .addEventListener('click', toggleTheme);

    document.getElementById('add-custom-btn')
        .addEventListener('click', () => openModal(null, true));

    document.getElementById('close-modal')
        .addEventListener('click', closeModal);

    document.getElementById('cancel-btn')
        .addEventListener('click', closeModal);

    document.getElementById('modal-overlay')
        .addEventListener('click', (e) => {

            if (e.target === document.getElementById('modal-overlay')) {
                closeModal();
            }

        });

    document.getElementById('sub-form')
        .addEventListener('submit', handleFormSubmit);

    document.getElementById('delete-btn')
        .addEventListener('click', handleDelete);

    document.getElementById('export-btn')
        .addEventListener('click', exportData);

    document.getElementById('import-btn')
        .addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

    document.getElementById('import-file')
        .addEventListener('change', importData);

    document.getElementById('clear-btn')
        .addEventListener('click', clearAllData);
        

    // Table Sorting

    document.querySelectorAll('th[data-sort]').forEach(th => {

        th.addEventListener('click', () => {

            const col = th.getAttribute('data-sort');

            if (sortColumn === col) {
                sortAsc = !sortAsc;
            } else {
                sortColumn = col;
                sortAsc = true;
            }

            renderDashboard();

        });

    });
}


/* ================= UTILS & CORE LOGIC ================= */

function escapeHTML(str) {

    if (!str) return '';

    return str.toString().replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));

}


// Extract clean domain from user input
function cleanDomain(url) {

    if (!url) return '';

    url = url.trim().toLowerCase();

    try {

        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        return new URL(url).hostname.replace('www.', '');

    } catch (e) {

        return url;

    }
}


function parseLocalDate(dateString) {

    if (!dateString) return new Date();

    const [year, month, day] = dateString.split('-');

    return new Date(year, month - 1, day);
}


function loadData() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (data) {

        try {

            subscriptions = JSON.parse(data);

        } catch (e) {

            console.error("Error parsing local storage data", e);

            subscriptions = [];

        }

    }
}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(subscriptions)
    );

}


function getDaysRemaining(dateString) {

    if (!dateString) return null;

    const target = parseLocalDate(dateString);

    target.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const diffTime = target - today;

    return Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
    );

}


function getBadgeStatus(daysRemaining) {

    if (daysRemaining === null) {
        return 'var(--badge-gray)';
    }

    if (daysRemaining < 0) {
        return 'var(--badge-red)';
    }

    if (daysRemaining <= 7) {
        return 'var(--badge-yellow)';
    }

    return 'var(--badge-green)';
}


function getRandomColor() {

    const hue = Math.floor(Math.random() * 360);

    return `hsl(${hue}, 70%, 45%)`;

}


/* ================= RENDERING ================= */

function renderApp() {

    renderGrid();

    renderDashboard();

    const activeCount = subscriptions.length;

    document.getElementById('summary-text').textContent =
        `You have ${activeCount} active AI subscription${activeCount !== 1 ? 's' : ''}.`;

}


function renderGrid() {

    const grid = document.getElementById('tools-grid');

    grid.innerHTML = '';

    const allTools = [...defaultTools];


    subscriptions.forEach(sub => {

        if (sub.isCustom) {

            allTools.push({

                id: sub.id,

                name: sub.toolName,

                domain: sub.domain,

                color: sub.color || getRandomColor(),

                isCustom: true

            });

        }

    });


    allTools.forEach(tool => {

        const sub = subscriptions.find(
            s => s.id === tool.id
        );

        const daysRemaining = sub
            ? getDaysRemaining(sub.renewalDate)
            : null;

        const badgeColor =
            getBadgeStatus(daysRemaining);


        const isLight =
            document.documentElement.classList.contains('light-mode');


        const bgColor =
            (isLight && tool.lightColor)
                ? tool.lightColor
                : tool.color;


        const textColor =
            tool.textColor && !isLight
                ? tool.textColor
                : (
                    isLight &&
                    tool.textColor === '#000' &&
                    tool.color === '#ffffff'
                        ? '#000'
                        : '#fff'
                );


        // Logo

        let iconHTML = '';

        let styleString = '';


        if (tool.domain) {

            iconHTML = `
                <img
                    src="https://www.google.com/s2/favicons?domain=${tool.domain}&sz=128"
                    alt="${escapeHTML(tool.name)} logo"
                    style="
                        width: 100%;
                        height: 100%;
                        border-radius: inherit;
                        object-fit: cover;
                        background-color: #ffffff;
                    "
                >
            `;

            styleString =
                `background-color: transparent;
                 border: 1px solid var(--border);`;

        } else {

            iconHTML =
                escapeHTML(
                    tool.name.charAt(0).toUpperCase()
                );

            styleString =
                `background-color: ${bgColor};
                 color: ${textColor};
                 border: ${
                     bgColor === '#ffffff'
                         ? '1px solid #ddd'
                         : 'none'
                 };`;

        }


        const card = document.createElement('div');

        card.className = 'card';

        card.onclick = () =>
            openModal(
                tool.id,
                tool.isCustom,
                tool
            );


        card.innerHTML = `

            <div
                class="status-badge"
                style="background-color: ${badgeColor};"
                title="${
                    sub
                        ? daysRemaining + ' days left'
                        : 'No reminder set'
                }"
            ></div>

            <div
                class="icon-placeholder"
                style="${styleString}"
            >
                ${iconHTML}
            </div>

            <h3>${escapeHTML(tool.name)}</h3>

            <p class="plan-text">
                ${
                    sub
                        ? `${escapeHTML(sub.plan)} Plan`
                        : 'Not Active'
                }
            </p>

        `;

        grid.appendChild(card);

    });

}


function renderDashboard() {

    const tbody =
        document.getElementById('dashboard-body');

    tbody.innerHTML = '';


    if (subscriptions.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    No active subscriptions.
                    Add one by clicking a card below.
                </td>
            </tr>
        `;

        return;

    }


    let tableData = subscriptions.map(sub => {

        const toolInfo =
            sub.isCustom
                ? sub
                : defaultTools.find(
                    t => t.id === sub.id
                ) || {
                    name: 'Unknown Tool'
                };


        return {

            ...sub,

            displayName:
                sub.isCustom
                    ? sub.toolName
                    : toolInfo.name,

            daysRemaining:
                getDaysRemaining(
                    sub.renewalDate
                )

        };

    });


    tableData.sort((a, b) => {

        let valA = a[sortColumn];

        let valB = b[sortColumn];


        if (sortColumn === 'toolName') {

            valA =
                a.displayName.toLowerCase();

            valB =
                b.displayName.toLowerCase();

        }


        if (valA < valB) {
            return sortAsc ? -1 : 1;
        }

        if (valA > valB) {
            return sortAsc ? 1 : -1;
        }

        return 0;

    });


    tableData.forEach(sub => {

        const tr =
            document.createElement('tr');


        let statusText =
            `${sub.daysRemaining} days`;


        if (sub.daysRemaining === 0) {
            statusText = 'Today';
        }


        if (sub.daysRemaining < 0) {

            statusText =
                `Passed (${Math.abs(sub.daysRemaining)}d ago)`;

        }


        const color =
            sub.daysRemaining < 0
                ? 'var(--danger)'
                : (
                    sub.daysRemaining <= 7
                        ? 'var(--badge-yellow)'
                        : 'var(--badge-green)'
                );


        tr.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(sub.displayName)}
                </strong>
            </td>

            <td>
                ${escapeHTML(sub.plan)}
            </td>

            <td>
                ${parseLocalDate(
                    sub.renewalDate
                ).toLocaleDateString()}
            </td>

            <td
                style="
                    color: ${color};
                    font-weight: 600;
                "
            >
                ${statusText}
            </td>

            <td
                style="
                    color: var(--text-muted);
                    font-size: 0.9rem;
                "
            >
                ${escapeHTML(sub.notes || '-')}
            </td>

        `;

        tbody.appendChild(tr);

    });


    document
        .querySelectorAll('th[data-sort]')
        .forEach(th => {

            const col =
                th.getAttribute('data-sort');

            th.textContent =
                th.textContent.replace(
                    / [↑↓↕]/,
                    ''
                ) +
                (
                    sortColumn === col
                        ? (sortAsc ? ' ↑' : ' ↓')
                        : ' ↕'
                );

        });

}


/* ================= MODAL LOGIC ================= */

function openModal(
    toolId,
    isCustom = false,
    toolRef = null
) {

    const form =
        document.getElementById('sub-form');

    form.reset();


    document.getElementById(
        'tool-is-custom'
    ).value =
        isCustom ? 'true' : 'false';


    const deleteBtn =
        document.getElementById('delete-btn');


    const customGroup =
        document.getElementById('custom-name-group');

    const customInput =
        document.getElementById('custom-tool-name');


    const customDomainGroup =
        document.getElementById('custom-domain-group');

    const customDomainInput =
        document.getElementById('custom-tool-domain');


    let sub =
        toolId
            ? subscriptions.find(
                s => s.id === toolId
            )
            : null;


    if (isCustom) {

        customGroup.classList.remove('hidden');

        customDomainGroup.classList.remove('hidden');

        customInput.required = true;


        if (sub) {

            customInput.value =
                sub.toolName;

            customDomainInput.value =
                sub.domain || '';

            document.getElementById(
                'tool-id'
            ).value = sub.id;

        } else {

            document.getElementById(
                'tool-id'
            ).value =
                'custom_' + Date.now();

        }

    } else {

        customGroup.classList.add('hidden');

        customDomainGroup.classList.add('hidden');

        customInput.required = false;

        document.getElementById(
            'tool-id'
        ).value = toolId;

    }


    if (sub) {

        document.getElementById('plan').value =
            sub.plan;

        document.getElementById('renewal-date').value =
            sub.renewalDate;

        document.getElementById('reminder-lead').value =
            sub.reminderLeadTime;

        document.getElementById('notes').value =
            sub.notes || '';

        deleteBtn.classList.remove('hidden');

    } else {

        const tomorrow = new Date();

        tomorrow.setDate(
            tomorrow.getDate() + 1
        );

        document.getElementById(
            'renewal-date'
        ).value =
            tomorrow.toLocaleDateString('en-CA');

        deleteBtn.classList.add('hidden');

    }


    const fallbackRef =
        defaultTools.find(
            t => t.id === toolId
        ) || {
            name: 'Unknown Tool'
        };


    const nameText =
        isCustom
            ? (
                sub
                    ? sub.toolName
                    : 'New Custom Tool'
            )
            : (
                toolRef
                    ? toolRef.name
                    : fallbackRef.name
            );


    document.getElementById(
        'modal-tool-name-text'
    ).textContent = nameText;


    const iconDiv =
        document.getElementById('modal-icon');

    let targetDomain = null;


    if (isCustom && sub && sub.domain) {

        targetDomain = sub.domain;

    } else if (!isCustom) {

        targetDomain =
            (
                toolRef &&
                toolRef.domain
            )
                ? toolRef.domain
                : fallbackRef.domain;

    }


    if (targetDomain) {

        iconDiv.innerHTML = `
            <img
                src="https://www.google.com/s2/favicons?domain=${targetDomain}&sz=128"
                style="
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    object-fit: cover;
                    background-color: #ffffff;
                "
            >
        `;

        iconDiv.style.backgroundColor =
            'transparent';

        iconDiv.style.border =
            '1px solid var(--border)';

        iconDiv.style.display =
            'flex';

    } else {

        let bgColor =
            getRandomColor();

        let textColor =
            '#fff';


        if (!isCustom && toolRef) {

            const isLight =
                document.documentElement
                    .classList
                    .contains('light-mode');


            bgColor =
                (
                    isLight &&
                    toolRef.lightColor
                )
                    ? toolRef.lightColor
                    : toolRef.color;


            textColor =
                toolRef.textColor &&
                !isLight
                    ? toolRef.textColor
                    : (
                        isLight &&
                        toolRef.textColor === '#000' &&
                        toolRef.color === '#ffffff'
                            ? '#000'
                            : '#fff'
                    );

        } else if (isCustom && sub) {

            bgColor =
                sub.color || bgColor;

        }


        iconDiv.style.backgroundColor =
            bgColor;

        iconDiv.style.color =
            textColor;

        iconDiv.style.border =
            bgColor === '#ffffff'
                ? '1px solid #ddd'
                : 'none';

        iconDiv.innerHTML =
            nameText.charAt(0).toUpperCase();

        iconDiv.style.display =
            'flex';

    }


    document.getElementById(
        'modal-overlay'
    ).classList.add('active');

}


function closeModal() {

    document.getElementById(
        'modal-overlay'
    ).classList.remove('active');

}


function handleFormSubmit(e) {

    e.preventDefault();


    requestNotificationPermission();


    const id =
        document.getElementById(
            'tool-id'
        ).value;


    const isCustom =
        document.getElementById(
            'tool-is-custom'
        ).value === 'true';


    const plan =
        document.getElementById(
            'plan'
        ).value;


    const renewalDate =
        document.getElementById(
            'renewal-date'
        ).value;


    const reminderLeadTime =
        parseInt(
            document.getElementById(
                'reminder-lead'
            ).value
        );


    const notes =
        document.getElementById(
            'notes'
        ).value;


    let toolName = "";

    let color = "";

    let domain = "";


    if (isCustom) {

        toolName =
            document.getElementById(
                'custom-tool-name'
            ).value;


        domain =
            cleanDomain(
                document.getElementById(
                    'custom-tool-domain'
                ).value
            );


        const existing =
            subscriptions.find(
                s => s.id === id
            );


        color =
            existing
                ? existing.color
                : getRandomColor();

    }


    const newSub = {

        id,

        isCustom,

        toolName,

        domain,

        plan,

        renewalDate,

        reminderLeadTime,

        notes,

        color

    };


    const index =
        subscriptions.findIndex(
            s => s.id === id
        );


    if (index >= 0) {

        subscriptions[index] =
            newSub;

    } else {

        subscriptions.push(
            newSub
        );

    }


    saveData();

    renderApp();

    closeModal();

    checkNotifications();

}


function handleDelete() {

    if (
        confirm(
            'Are you sure you want to remove this subscription reminder?'
        )
    ) {

        const id =
            document.getElementById(
                'tool-id'
            ).value;


        subscriptions =
            subscriptions.filter(
                s => s.id !== id
            );


        saveData();

        renderApp();

        closeModal();

    }

}


/* ================= NOTIFICATIONS ================= */

function requestNotificationPermission() {

    if (!("Notification" in window)) {
        return;
    }


    if (
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
    ) {

        Notification.requestPermission();

    }

}


function checkNotifications() {

    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }


    let notifiedEvents =
        JSON.parse(
            localStorage.getItem(
                NOTIFS_KEY
            ) || '{}'
        );


    const todayStr =
        new Date().toLocaleDateString(
            'en-CA'
        );


    let changed = false;


    subscriptions.forEach(sub => {

        const daysLeft =
            getDaysRemaining(
                sub.renewalDate
            );


        if (daysLeft === null) {
            return;
        }


        if (
            daysLeft <= sub.reminderLeadTime &&
            daysLeft >= 0
        ) {

            const eventKey =
                `${sub.id}_${sub.renewalDate}`;


            if (
                notifiedEvents[eventKey] !== todayStr
            ) {

                const fallbackRef =
                    defaultTools.find(
                        t => t.id === sub.id
                    ) || {
                        name: 'Unknown Tool'
                    };


                const toolName =
                    sub.isCustom
                        ? sub.toolName
                        : fallbackRef.name;


                let msg =
                    `${toolName} renews today!`;


                if (daysLeft > 0) {

                    msg =
                        `${toolName} renews in ${daysLeft} day${
                            daysLeft > 1
                                ? 's'
                                : ''
                        } (${sub.renewalDate}).`;

                }


                new Notification(
                    "AI Sub Tracker Reminder",
                    {
                        body: msg,

                        icon:
                            "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⏰</text></svg>"
                    }
                );


                notifiedEvents[eventKey] =
                    todayStr;

                changed = true;

            }

        }

    });


    if (changed) {

        localStorage.setItem(
            NOTIFS_KEY,
            JSON.stringify(notifiedEvents)
        );

    }

}


/* ================= DATA MANAGEMENT ================= */

function exportData() {

    if (subscriptions.length === 0) {

        alert(
            'No data to export.'
        );

        return;

    }


    const dataStr =
        JSON.stringify(
            subscriptions,
            null,
            2
        );


    const blob =
        new Blob(
            [dataStr],
            {
                type: "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const a =
        document.createElement('a');


    a.href = url;


    a.download =
        `ai-subs-backup-${new Date().toLocaleDateString('en-CA')}.json`;


    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

}


function importData(e) {

    const file =
        e.target.files[0];


    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            try {

                const imported =
                    JSON.parse(
                        event.target.result
                    );


                if (Array.isArray(imported)) {

                    subscriptions =
                        imported;

                    saveData();

                    renderApp();

                    alert(
                        'Data imported successfully!'
                    );

                } else {

                    alert(
                        'Invalid file format.'
                    );

                }

            } catch (err) {

                alert(
                    'Error parsing JSON file.'
                );

            }

        };


    reader.readAsText(file);

    e.target.value = '';

}


function clearAllData() {

    if (
        confirm(
            'Are you absolutely sure you want to delete ALL data? This cannot be undone.'
        )
    ) {

        subscriptions = [];

        localStorage.removeItem(
            STORAGE_KEY
        );

        localStorage.removeItem(
            NOTIFS_KEY
        );

        renderApp();

    }

}


/* ================= THEME ================= */

function toggleTheme() {

    const root =
        document.documentElement;


    root.classList.toggle(
        'light-mode'
    );


    const isLight =
        root.classList.contains(
            'light-mode'
        );


    localStorage.setItem(
        THEME_KEY,
        isLight
            ? 'light'
            : 'dark'
    );


    document.getElementById(
        'theme-toggle'
    ).textContent =
        isLight
            ? '🌙 Dark Mode'
            : '☀️ Light Mode';


    renderGrid();

}


function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (theme === 'light') {

        document.documentElement
            .classList
            .add('light-mode');

        document.getElementById(
            'theme-toggle'
        ).textContent =
            '🌙 Dark Mode';

    } else {

        document.getElementById(
            'theme-toggle'
        ).textContent =
            '☀️ Light Mode';

    }

}
