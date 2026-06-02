const sections = {
    stats: document.querySelector("#stats"),
    newMovies: document.querySelector("#newMovies"),
    newSeries: document.querySelector("#newSeries"),
    inCinemasSoon: document.querySelector("#inCinemasSoon"),
    comingSoon: document.querySelector("#comingSoon"),
    downloads: document.querySelector("#downloads"),
    requests: document.querySelector("#requests"),
    statusGrid: document.querySelector("#statusGrid"),
    services: document.querySelector("#services"),
    generatedAt: document.querySelector("#generatedAt"),
};

loadDashboard();

async function loadDashboard() {
    try {
        const response = await fetch("api/dashboard");
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        renderEmpty(sections.newMovies, "Could not load the bulletin API.");
        console.error(error);
    }
}

function renderDashboard(data) {
    sections.stats.innerHTML = (data.stats || []).map(stat => `
        <div class="stat">
            <strong>${escapeHtml(stat.value)}</strong>
            <span>${escapeHtml(stat.label)}</span>
        </div>
    `).join("");

    renderCards(sections.newMovies, data.newMovies, "No new films found yet.");
    renderCards(sections.newSeries, data.newSeries, "No new series found yet.");
    renderCards(sections.inCinemasSoon, data.inCinemasSoon, "No future cinema or airing dates found yet.");
    renderCards(sections.comingSoon, data.comingSoon, "No pending request or import pipeline items found yet.");
    renderCards(sections.downloads, data.downloads, "No active downloads right now.");
    renderCards(sections.requests, data.requests, "No recent requests found yet.");

    sections.statusGrid.innerHTML = (data.status || []).map(item => `
        <div class="statusPanel">
            <h3>${escapeHtml(item.label)}</h3>
            <div class="meter" style="--value:${Number(item.percent || 0)}%"><span></span></div>
            <div class="kv"><span>Status</span><span>${escapeHtml(item.value)}</span></div>
        </div>
    `).join("");

    sections.services.innerHTML = (data.services || []).map(service => `
        <span class="service ${escapeHtml(service.status)}">${escapeHtml(service.name)}: ${escapeHtml(service.status)}</span>
    `).join("");

    sections.generatedAt.textContent = data.generatedAt
        ? `Updated ${new Date(data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "Live values";
}

function renderCards(target, cards = [], emptyText) {
    if (!cards.length) {
        renderEmpty(target, emptyText);
        return;
    }

    target.innerHTML = cards.map(card => {
        const badges = (card.badges || []).map(badge => {
            const slug = String(badge).toLowerCase().replace(/\s+/g, "-");
            const state = slug.includes("available") ? "available" : slug.includes("download") ? "downloading" : slug.includes("request") ? "requested" : slug.includes("coming") ? "coming" : "";
            return `<span class="badge ${state}">${escapeHtml(badge)}</span>`;
        }).join("");

        const poster = card.poster
            ? `<img alt="" src="${escapeAttribute(card.poster)}" loading="lazy">`
            : `<div class="posterFallback">Bulletin</div>`;

        const backdrop = card.backdrop ? `url('${escapeAttribute(card.backdrop)}')` : "linear-gradient(145deg, #2a0507, #050505)";

        return `
            <article class="mediaRow" style="--backdrop: ${backdrop}">
                <div class="poster">${poster}</div>
                <div class="mediaBody">
                    <h3 class="mediaTitle">${escapeHtml(card.title || "Untitled")}</h3>
                    <div class="mediaDate">${escapeHtml(card.subtitle || "")}</div>
                    <p class="overview">${escapeHtml(card.overview || "No overview available.")}</p>
                </div>
                <div class="badges">${badges}</div>
            </article>
        `;
    }).join("");
}

function renderEmpty(target, text) {
    target.innerHTML = `<div class="empty">${escapeHtml(text)}</div>`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}
