const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const port = Number(process.env.PORT || 80);
const publicDir = path.join(__dirname, "public");
const basePath = normalizeBasePath(process.env.BASE_PATH || "");
const demoMode = String(process.env.DEMO_MODE || "").toLowerCase() === "true";

const config = {
    jellyfin: {
        url: cleanUrl(process.env.JELLYFIN_URL),
        apiKey: process.env.JELLYFIN_API_KEY || "",
        userId: process.env.JELLYFIN_USER_ID || "",
    },
    radarr: {
        url: cleanUrl(process.env.RADARR_URL),
        apiKey: process.env.RADARR_API_KEY || "",
    },
    sonarr: {
        url: cleanUrl(process.env.SONARR_URL),
        apiKey: process.env.SONARR_API_KEY || "",
    },
    jellyseerr: {
        url: cleanUrl(process.env.JELLYSEERR_URL),
        apiKey: process.env.JELLYSEERR_API_KEY || "",
    },
    qbittorrent: {
        url: cleanUrl(process.env.QBITTORRENT_URL),
        username: process.env.QBITTORRENT_USERNAME || "",
        password: process.env.QBITTORRENT_PASSWORD || "",
    },
    bazarr: {
        url: cleanUrl(process.env.BAZARR_URL),
        apiKey: process.env.BAZARR_API_KEY || "",
    },
};

const fallback = {
    generatedAt: new Date().toISOString(),
    services: [],
    stats: [
        { label: "Movies available", value: "92" },
        { label: "Shows available", value: "34" },
        { label: "Episodes available", value: "1,256" },
        { label: "Downloads active", value: "8" },
        { label: "Coming soon", value: "14" },
    ],
    newMovies: [
        {
            title: "Avengers",
            subtitle: "Added today",
            overview: "When an unexpected enemy threatens global safety, a daring recruitment effort begins to pull the world back from the brink.",
            poster: "https://image.tmdb.org/t/p/w342/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
            backdrop: "https://image.tmdb.org/t/p/w1280/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg",
            badges: ["Available", "Movie"],
        },
    ],
    newSeries: [],
    inCinemasSoon: [],
    comingSoon: [],
    downloads: [],
    requests: [],
    status: [
        { label: "Storage", value: "72%", percent: 72 },
        { label: "Downloads", value: "44%", percent: 44 },
        { label: "Subtitles", value: "88%", percent: 88 },
    ],
};

const demoDashboard = {
    generatedAt: new Date().toISOString(),
    services: [
        { name: "Jellyfin", status: "demo" },
        { name: "Radarr", status: "demo" },
        { name: "Sonarr", status: "demo" },
        { name: "Jellyseerr", status: "demo" },
        { name: "qBittorrent", status: "demo" },
        { name: "Bazarr", status: "demo" },
    ],
    stats: [
        { label: "Movies available", value: "1,284" },
        { label: "Shows available", value: "214" },
        { label: "Episodes available", value: "12,906" },
        { label: "Downloads active", value: "3" },
        { label: "In cinemas soon", value: "6" },
    ],
    newMovies: [
        {
            title: "Avengers",
            subtitle: "Added today",
            overview: "A newly available blockbuster has landed in the library and is ready for movie night.",
            poster: "https://image.tmdb.org/t/p/w342/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
            backdrop: "https://image.tmdb.org/t/p/w1280/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg",
            badges: ["Available", "Movie"],
        },
        {
            title: "Your Name.",
            subtitle: "Added this week",
            overview: "A beautiful animated feature recently imported and matched with fresh metadata.",
            poster: "https://image.tmdb.org/t/p/w342/q719jXXEzOoYaps6babgKnONONX.jpg",
            backdrop: "https://image.tmdb.org/t/p/w1280/8rpDcsfLJypbO6vREc0547VKqEv.jpg",
            badges: ["Available", "Movie"],
        },
    ],
    newSeries: [
        {
            title: "Grey's Anatomy Season 21",
            subtitle: "Added yesterday",
            overview: "Fresh episodes have arrived and are now visible in the Jellyfin TV library.",
            poster: "https://image.tmdb.org/t/p/w342/daSFbrt8QCXV2hSwB0hqYjbj681.jpg",
            backdrop: "https://image.tmdb.org/t/p/w1280/5QEtCB4n6mx4RYbr1OuNoGLnm2l.jpg",
            badges: ["Available", "Series"],
        },
    ],
    inCinemasSoon: [
        {
            title: "Star Wars: Starfighter",
            subtitle: "In cinemas May 2027",
            overview: "Tracked by Radarr and waiting for a future cinema release.",
            poster: "https://image.tmdb.org/t/p/w342/aUSQtKgQ0GNKJzXXJ6fY0auadjo.jpg",
            backdrop: "https://image.tmdb.org/t/p/w1280/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg",
            releaseDate: "2027-05-28",
            badges: ["In cinemas soon", "Movie"],
        },
        {
            title: "The Simpsons Movie 2",
            subtitle: "In cinemas soon",
            overview: "A future movie request displayed separately from items that are already available.",
            poster: "https://image.tmdb.org/t/p/w342/6bWJH0s0X2cTynececEJSnfbNn9.jpg",
            backdrop: "https://image.tmdb.org/t/p/w1280/8rpDcsfLJypbO6vREc0547VKqEv.jpg",
            releaseDate: "2027-07-23",
            badges: ["In cinemas soon", "Requested"],
        },
    ],
    comingSoon: [
        {
            title: "Approved Request",
            subtitle: "Requested this week",
            overview: "Approved in the request system and waiting for Radarr or Sonarr to grab it.",
            poster: "",
            backdrop: "",
            badges: ["Requested"],
        },
    ],
    downloads: [
        {
            title: "Weekend Feature",
            subtitle: "64% complete",
            overview: "Downloading through qBittorrent before import and Jellyfin library scan.",
            poster: "",
            backdrop: "",
            badges: ["Downloading"],
        },
    ],
    requests: [
        {
            title: "Family Movie Night",
            subtitle: "Requested by demo user",
            overview: "A request card with personal details removed for public screenshots and demos.",
            poster: "",
            backdrop: "",
            badges: ["Requested"],
        },
    ],
    status: [
        { label: "Downloads", value: "3 active", percent: 64 },
        { label: "Requests", value: "2 pending", percent: 38 },
        { label: "Subtitles", value: "Connected", percent: 100 },
    ],
};

let cache = {
    expiresAt: 0,
    data: fallback,
};

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = stripBasePath(url.pathname);

        if (pathname === "/api/dashboard") {
            const data = await getDashboard();
            sendJson(res, data);
            return;
        }

        if (pathname === "/api/diagnostics") {
            const data = await getDiagnostics();
            sendJson(res, data);
            return;
        }

        await serveStatic(pathname, res);
    } catch (error) {
        sendJson(res, { error: error.message }, 500);
    }
});

server.listen(port, "0.0.0.0", () => {
    console.log(`JayFlix Bulletin running on port ${port}`);
});

async function getDashboard() {
    if (demoMode) {
        return {
            ...demoDashboard,
            generatedAt: new Date().toISOString(),
        };
    }

    if (Date.now() < cache.expiresAt) {
        return cache.data;
    }

    const services = [];
    const [jellyfin, radarr, sonarr, jellyseerr, qbittorrent, bazarr] = await Promise.allSettled([
        getJellyfinData(),
        getRadarrData(),
        getSonarrData(),
        getJellyseerrData(),
        getQbittorrentData(),
        getBazarrData(),
    ]);

    const jellyfinData = unwrap(jellyfin, "Jellyfin", services);
    const radarrData = unwrap(radarr, "Radarr", services);
    const sonarrData = unwrap(sonarr, "Sonarr", services);
    const jellyseerrData = unwrap(jellyseerr, "Jellyseerr", services);
    const qbittorrentData = unwrap(qbittorrent, "qBittorrent", services);
    const bazarrData = unwrap(bazarr, "Bazarr", services);
    const futurePipeline = uniqueCards([
        ...(radarrData.upcoming || []),
        ...(sonarrData.upcoming || []),
        ...(jellyseerrData.requests || []).filter(card => isFutureDate(card.releaseDate)),
    ]).sort(sortByReleaseDate);
    const enrichedDownloads = await enrichDownloadCards(qbittorrentData.downloads || [], jellyseerrData.requests || [], [
        ...(radarrData.upcoming || []),
        ...(sonarrData.upcoming || []),
    ]);

    const data = {
        generatedAt: new Date().toISOString(),
        services,
        stats: [
            { label: "Movies available", value: formatNumber(jellyfinData.movieCount) },
            { label: "Shows available", value: formatNumber(jellyfinData.showCount) },
            { label: "Episodes available", value: formatNumber(jellyfinData.episodeCount) },
            { label: "Downloads active", value: formatNumber(qbittorrentData.activeCount) },
            { label: "In cinemas soon", value: formatNumber(futurePipeline.length) },
        ],
        newMovies: jellyfinData.newMovies?.length ? jellyfinData.newMovies : fallback.newMovies,
        newSeries: jellyfinData.newSeries || [],
        inCinemasSoon: futurePipeline.slice(0, 10),
        comingSoon: uniqueCards([
            ...(jellyseerrData.requests || []).filter(card => !isFutureDate(card.releaseDate)),
            ...enrichedDownloads,
        ]).slice(0, 8),
        downloads: enrichedDownloads,
        requests: jellyseerrData.requests || [],
        status: [
            { label: "Downloads", value: `${qbittorrentData.activeCount || 0} active`, percent: clamp((qbittorrentData.averageProgress || 0) * 100) },
            { label: "Requests", value: `${jellyseerrData.pendingCount || 0} pending`, percent: jellyseerrData.pendingCount ? 38 : 100 },
            { label: "Subtitles", value: bazarrData.enabled ? "Connected" : "Optional", percent: bazarrData.enabled ? 100 : 0 },
        ],
    };

    cache = {
        expiresAt: Date.now() + 1000 * 60 * 3,
        data,
    };

    return data;
}

async function getDiagnostics() {
    const start = new Date();
    const radarrEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45);
    const sonarrEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    return Promise.all([
        testEndpoint("Jellyfin", config.jellyfin.url, "/System/Info/Public", { "X-Emby-Token": config.jellyfin.apiKey }),
        testEndpoint("Radarr status", config.radarr.url, "/api/v3/system/status", apiKeyHeaders(config.radarr.apiKey)),
        testEndpoint("Radarr calendar", config.radarr.url, `/api/v3/calendar?start=${isoDate(start)}&end=${isoDate(radarrEnd)}`, apiKeyHeaders(config.radarr.apiKey)),
        testEndpoint("Sonarr status", config.sonarr.url, "/api/v3/system/status", apiKeyHeaders(config.sonarr.apiKey)),
        testEndpoint("Sonarr calendar", config.sonarr.url, `/api/v3/calendar?start=${isoDate(start)}&end=${isoDate(sonarrEnd)}&includeSeries=true`, apiKeyHeaders(config.sonarr.apiKey)),
        testEndpoint("Jellyseerr", config.jellyseerr.url, "/api/v1/status", { "X-Api-Key": config.jellyseerr.apiKey }),
        testEndpoint("Bazarr status", config.bazarr.url, "/api/system/status", apiKeyHeaders(config.bazarr.apiKey)),
    ]);
}

async function testEndpoint(name, baseUrl, pathName, headers) {
    if (!baseUrl) {
        return { name, status: "missing-url" };
    }

    try {
        const response = await fetch(`${baseUrl}${pathName}`, { headers });
        return {
            name,
            status: response.ok ? "ok" : "failed",
            code: response.status,
        };
    } catch (error) {
        return {
            name,
            status: "error",
            message: error.message,
        };
    }
}

async function getJellyfinData() {
    if (!config.jellyfin.url || !config.jellyfin.apiKey) {
        return {};
    }

    const headers = { "X-Emby-Token": config.jellyfin.apiKey };
    const base = isLikelyJellyfinUserId(config.jellyfin.userId)
        ? `${config.jellyfin.url}/Users/${config.jellyfin.userId}/Items`
        : `${config.jellyfin.url}/Items`;

    const [movies, shows, episodes, recentMovies, recentSeries] = await Promise.all([
        jfCount(base, headers, "Movie"),
        jfCount(base, headers, "Series"),
        jfCount(base, headers, "Episode"),
        jfItems(base, headers, "Movie", 8),
        jfItems(base, headers, "Series", 8),
    ]);

    return {
        movieCount: movies,
        showCount: shows,
        episodeCount: episodes,
        newMovies: recentMovies.map(item => jellyfinCard(item, "Movie")),
        newSeries: recentSeries.map(item => jellyfinCard(item, "Series")),
    };
}

async function jfCount(base, headers, type) {
    const data = await getJson(`${base}?Recursive=true&IncludeItemTypes=${type}&Limit=1`, headers);
    return data.TotalRecordCount || 0;
}

async function jfItems(base, headers, type, limit) {
    const data = await getJson(`${base}?Recursive=true&IncludeItemTypes=${type}&SortBy=DateCreated&SortOrder=Descending&Fields=Overview,DateCreated,PrimaryImageAspectRatio&Limit=${limit}`, headers);
    return data.Items || [];
}

function jellyfinCard(item, type) {
    const imageBase = `${config.jellyfin.url}/Items/${item.Id}/Images`;
    return {
        title: item.Name,
        subtitle: item.DateCreated ? `Added ${formatDate(item.DateCreated)}` : "Recently added",
        overview: item.Overview || "Newly added to the JayFlix library.",
        poster: `${imageBase}/Primary?fillHeight=450&fillWidth=300&quality=90&tag=${item.ImageTags?.Primary || ""}`,
        backdrop: `${imageBase}/Backdrop?fillHeight=720&fillWidth=1280&quality=80&tag=${item.BackdropImageTags?.[0] || ""}`,
        badges: ["Available", type],
    };
}

async function getRadarrData() {
    if (!config.radarr.url || !config.radarr.apiKey) {
        return {};
    }

    const headers = apiKeyHeaders(config.radarr.apiKey);
    const start = new Date();
    const end = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45);
    const calendar = await getJson(`${config.radarr.url}/api/v3/calendar?start=${isoDate(start)}&end=${isoDate(end)}`, headers);

    return {
        upcoming: calendar.slice(0, 8).map(movie => ({
            title: movie.title,
            subtitle: movie.inCinemas ? `In cinemas ${formatDate(movie.inCinemas)}` : movie.digitalRelease ? `Digital ${formatDate(movie.digitalRelease)}` : `Release ${formatDate(movie.physicalRelease)}`,
            overview: movie.overview || "Tracked by Radarr and coming soon.",
            poster: firstRemoteImage(movie.images, "poster"),
            backdrop: firstRemoteImage(movie.images, "fanart"),
            releaseDate: movie.inCinemas || movie.digitalRelease || movie.physicalRelease || "",
            badges: ["In cinemas soon", "Movie"],
        })),
    };
}

async function getSonarrData() {
    if (!config.sonarr.url || !config.sonarr.apiKey) {
        return {};
    }

    const headers = apiKeyHeaders(config.sonarr.apiKey);
    const start = new Date();
    const end = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const calendar = await getJson(`${config.sonarr.url}/api/v3/calendar?start=${isoDate(start)}&end=${isoDate(end)}&includeSeries=true`, headers);

    return {
        upcoming: calendar.slice(0, 8).map(episode => ({
            title: `${episode.series?.title || "Series"} S${episode.seasonNumber}E${episode.episodeNumber}`,
            subtitle: episode.airDateUtc ? `Airs ${formatDate(episode.airDateUtc)}` : "Upcoming episode",
            overview: episode.overview || episode.series?.overview || "Tracked by Sonarr and coming soon.",
            poster: firstRemoteImage(episode.series?.images, "poster"),
            backdrop: firstRemoteImage(episode.series?.images, "fanart"),
            releaseDate: episode.airDateUtc || episode.airDate || "",
            badges: ["Airing soon", "Episode"],
        })),
    };
}

async function getJellyseerrData() {
    if (!config.jellyseerr.url || !config.jellyseerr.apiKey) {
        return {};
    }

    const headers = { "X-Api-Key": config.jellyseerr.apiKey };
    const data = await getJson(`${config.jellyseerr.url}/api/v1/request?take=8&skip=0&sort=added`, headers);
    const results = data.results || [];

    const requests = await Promise.all(results.map(request => jellyseerrRequestCard(request, headers)));

    return {
        pendingCount: results.filter(request => request.status === 1).length,
        requests,
    };
}

async function jellyseerrRequestCard(request, headers) {
    const media = request.media || {};
    const details = await getJellyseerrMediaDetails(media, headers);
    const title = details.title || details.name || details.originalTitle || details.originalName || media.title || media.name || "Requested media";

    return {
        title,
        subtitle: request.requestedBy?.displayName ? `Requested by ${request.requestedBy.displayName}` : "Recently requested",
        overview: details.overview || media.overview || "Requested through Jellyseerr.",
        poster: tmdbImage(details.posterPath || details.poster_path || media.posterPath || media.poster_path, "poster"),
        backdrop: tmdbImage(details.backdropPath || details.backdrop_path || media.backdropPath || media.backdrop_path, "backdrop"),
        releaseDate: details.releaseDate || details.release_date || details.firstAirDate || details.first_air_date || media.releaseDate || media.release_date || "",
        badges: isFutureDate(details.releaseDate || details.release_date || details.firstAirDate || details.first_air_date || media.releaseDate || media.release_date) ? ["In cinemas soon", "Requested"] : ["Requested"],
    };
}

async function getJellyseerrMediaDetails(media, headers) {
    const tmdbId = media.tmdbId || media.tmdbid || media.id;
    if (!tmdbId) {
        return {};
    }

    const type = String(media.mediaType || media.media_type || "").toLowerCase();
    const endpoint = type === "tv" || type === "series"
        ? `${config.jellyseerr.url}/api/v1/tv/${tmdbId}`
        : `${config.jellyseerr.url}/api/v1/movie/${tmdbId}`;

    try {
        return await getJson(endpoint, headers);
    } catch {
        return {};
    }
}

async function getQbittorrentData() {
    if (!config.qbittorrent.url || !config.qbittorrent.username || !config.qbittorrent.password) {
        return {};
    }

    const login = await fetch(`${config.qbittorrent.url}/api/v2/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            username: config.qbittorrent.username,
            password: config.qbittorrent.password,
        }),
    });

    const cookie = login.headers.get("set-cookie") || "";
    const torrents = await getJson(`${config.qbittorrent.url}/api/v2/torrents/info?filter=downloading`, { Cookie: cookie });

    return {
        activeCount: torrents.length,
        averageProgress: torrents.length ? torrents.reduce((sum, torrent) => sum + Number(torrent.progress || 0), 0) / torrents.length : 0,
        downloads: torrents.slice(0, 8).map(torrent => ({
            title: torrent.name,
            subtitle: `${Math.round(Number(torrent.progress || 0) * 100)}% complete`,
            overview: torrent.eta && torrent.eta > 0 ? `ETA ${formatEta(torrent.eta)}` : "Downloading through qBittorrent.",
            poster: "",
            backdrop: "",
            badges: ["Downloading"],
        })),
    };
}

async function enrichDownloadCards(downloads, requests, upcoming) {
    if (!downloads.length) {
        return [];
    }

    return Promise.all(downloads.map(async (download) => {
        if (download.poster || download.backdrop) {
            return download;
        }

        const localMatch = findArtworkMatch(download.title, [...requests, ...upcoming]);
        if (localMatch) {
            return {
                ...download,
                poster: localMatch.poster || "",
                backdrop: localMatch.backdrop || "",
            };
        }

        const searchMatch = await searchJellyseerrArtwork(download.title);
        return {
            ...download,
            poster: searchMatch.poster || "",
            backdrop: searchMatch.backdrop || "",
            title: searchMatch.title || download.title,
            overview: download.overview || searchMatch.overview || "Downloading through qBittorrent.",
        };
    }));
}

function findArtworkMatch(title, cards) {
    const normalizedTitle = normalizeTitle(title);
    if (!normalizedTitle) {
        return null;
    }

    return cards.find(card => {
        const candidate = normalizeTitle(card.title);
        return candidate && (normalizedTitle.includes(candidate) || candidate.includes(normalizedTitle));
    });
}

async function searchJellyseerrArtwork(title) {
    if (!config.jellyseerr.url || !config.jellyseerr.apiKey) {
        return {};
    }

    const query = cleanSearchTitle(title);
    if (!query) {
        return {};
    }

    try {
        const data = await getJson(`${config.jellyseerr.url}/api/v1/search?query=${encodeURIComponent(query)}&page=1`, {
            "X-Api-Key": config.jellyseerr.apiKey,
        });
        const result = (data.results || []).find(item => item.mediaType === "movie" || item.mediaType === "tv") || data.results?.[0];

        if (!result) {
            return {};
        }

        return {
            title: result.title || result.name,
            overview: result.overview,
            poster: tmdbImage(result.posterPath || result.poster_path, "poster"),
            backdrop: tmdbImage(result.backdropPath || result.backdrop_path, "backdrop"),
        };
    } catch {
        return {};
    }
}

async function getBazarrData() {
    if (!config.bazarr.url || !config.bazarr.apiKey) {
        return {};
    }

    await getJson(`${config.bazarr.url}/api/system/status`, apiKeyHeaders(config.bazarr.apiKey));
    return { enabled: true };
}

async function serveStatic(requestPath, res) {
    const cleanPath = requestPath === "/" ? "/index.html" : requestPath;
    const filePath = path.normalize(path.join(publicDir, cleanPath));

    if (!filePath.startsWith(publicDir)) {
        sendText(res, "Not found", 404);
        return;
    }

    try {
        const file = await fs.readFile(filePath);
        res.writeHead(200, frameHeaders({ "Content-Type": contentType(filePath) }));
        res.end(file);
    } catch {
        sendText(res, "Not found", 404);
    }
}

async function getJson(url, headers = {}) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`${url} returned ${response.status}`);
    }

    return response.json();
}

function unwrap(result, name, services) {
    if (result.status === "fulfilled") {
        services.push({ name, status: "connected" });
        return result.value || {};
    }

    services.push({ name, status: "offline", message: result.reason?.message || "Unavailable" });
    return {};
}

function cleanUrl(value) {
    return (value || "").replace(/\/+$/, "");
}

function firstRemoteImage(images = [], coverType) {
    const image = images.find(item => item.coverType === coverType && item.remoteUrl) || images.find(item => item.remoteUrl);
    return image?.remoteUrl || "";
}

function tmdbImage(value, type) {
    if (!value) {
        return "";
    }

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    const size = type === "backdrop" ? "w1280" : "w342";
    return `https://image.tmdb.org/t/p/${size}${value}`;
}

function cleanSearchTitle(value) {
    return String(value || "")
        .replace(/\bS\d{1,2}E\d{1,2}\b/gi, " ")
        .replace(/\bSeason\s+\d+\b/gi, " ")
        .replace(/\[[^\]]+\]/g, " ")
        .replace(/\([^\)]*\b(19|20)\d{2}[^\)]*\)/g, " ")
        .replace(/\b(19|20)\d{2}\b/g, " ")
        .replace(/\b(1080p|2160p|720p|480p|4k|uhd|hdr|web[- ]?dl|webrip|bluray|brrip|x264|x265|h264|h265|hevc|aac|dts|atmos|proper|repack)\b/gi, " ")
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeTitle(value) {
    return cleanSearchTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isFutureDate(value) {
    if (!value) {
        return false;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
}

function sortByReleaseDate(a, b) {
    return new Date(a.releaseDate || "9999-12-31") - new Date(b.releaseDate || "9999-12-31");
}

function uniqueCards(cards) {
    const seen = new Set();
    return cards.filter(card => {
        const key = normalizeTitle(card.title);
        if (!key || seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function apiKeyHeaders(apiKey) {
    return {
        "X-Api-Key": apiKey,
    };
}

function isLikelyJellyfinUserId(value) {
    return /^[a-f0-9-]{32,36}$/i.test(value || "");
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
}

function isoDate(date) {
    return date.toISOString().slice(0, 10);
}

function formatDate(value) {
    if (!value) {
        return "soon";
    }

    return new Intl.DateTimeFormat("en-AU", {
        month: "short",
        day: "numeric",
    }).format(new Date(value));
}

function formatEta(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function clamp(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function sendJson(res, data, status = 200) {
    res.writeHead(status, frameHeaders({ "Content-Type": "application/json; charset=utf-8" }));
    res.end(JSON.stringify(data));
}

function sendText(res, text, status = 200) {
    res.writeHead(status, frameHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    res.end(text);
}

function frameHeaders(headers) {
    return {
        ...headers,
        "Access-Control-Allow-Origin": "*",
        "Content-Security-Policy": "frame-ancestors *",
    };
}

function contentType(filePath) {
    switch (path.extname(filePath)) {
        case ".html": return "text/html; charset=utf-8";
        case ".css": return "text/css; charset=utf-8";
        case ".js": return "application/javascript; charset=utf-8";
        case ".json": return "application/json; charset=utf-8";
        case ".png": return "image/png";
        case ".jpg":
        case ".jpeg": return "image/jpeg";
        case ".webp": return "image/webp";
        default: return "application/octet-stream";
    }
}

function normalizeBasePath(value) {
    if (!value || value === "/") {
        return "";
    }

    return `/${String(value).replace(/^\/+|\/+$/g, "")}`;
}

function stripBasePath(pathname) {
    if (!basePath) {
        return pathname;
    }

    if (pathname === basePath) {
        return "/";
    }

    if (pathname.startsWith(`${basePath}/`)) {
        return pathname.slice(basePath.length);
    }

    return pathname;
}
