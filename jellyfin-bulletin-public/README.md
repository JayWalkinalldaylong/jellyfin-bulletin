# Jellyfin Bulletin

A lightweight Jellyfin-style bulletin page for recently added media, future releases, requests, active downloads, and server status.

It is built to be easy first: run a Docker container, fill out one `.env` file, and open a dashboard URL. Embedding inside Jellyfin is optional.

## Preview

![Jellyfin Bulletin screenshot](docs/screenshot.png)

## What It Shows

- Recently added movies from Jellyfin
- Recently added shows from Jellyfin
- Future releases from Radarr, Sonarr, and Jellyseerr
- Active qBittorrent downloads
- Recent Jellyseerr requests
- Optional Bazarr subtitle status
- Library stats for movies, shows, and episodes

## Quick Start

Clone or download this project, then copy the example config:

```bash
cp .env.example .env
```

Start the demo:

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:18099
```

The demo uses sample data and does not need API keys.

## Connect Your Apps

Edit `.env`.

Set:

```env
DEMO_MODE=false
```

Then add whichever services you use:

```env
JELLYFIN_URL=http://host.docker.internal:8096
JELLYFIN_API_KEY=your-jellyfin-api-key

RADARR_URL=http://host.docker.internal:7878
RADARR_API_KEY=your-radarr-api-key

SONARR_URL=http://host.docker.internal:8989
SONARR_API_KEY=your-sonarr-api-key

JELLYSEERR_URL=http://host.docker.internal:5055
JELLYSEERR_API_KEY=your-jellyseerr-api-key

QBITTORRENT_URL=http://host.docker.internal:8080
QBITTORRENT_USERNAME=your-qbittorrent-username
QBITTORRENT_PASSWORD=your-qbittorrent-password

BAZARR_URL=http://host.docker.internal:6767
BAZARR_API_KEY=your-bazarr-api-key
```

Restart the container:

```bash
docker compose up -d --build
```

Open diagnostics:

```text
http://localhost:18099/api/diagnostics
```

## Linux Support

This project runs anywhere Docker runs, including:

- Ubuntu
- Debian
- Fedora
- Arch Linux
- Linux Mint
- openSUSE
- Raspberry Pi OS on supported hardware

Install Docker using your distro's recommended method, then run:

```bash
docker compose up -d --build
```

On Linux, if your apps are also on the same host, `host.docker.internal` may not exist by default. Use your host LAN IP instead, for example:

```env
JELLYFIN_URL=http://192.168.1.50:8096
RADARR_URL=http://192.168.1.50:7878
SONARR_URL=http://192.168.1.50:8989
```

## Add It To Jellyfin

The simplest setup is to add a Jellyfin custom link/tab that opens:

```text
http://your-server-ip:18099
```

That is enough for most homes.

## Advanced: Embed Inside Jellyfin

If your Jellyfin is available at a public HTTPS domain, put Bulletin behind the same reverse proxy.

Example public URL:

```text
https://watch.example.com/bulletin/
```

Set this in `.env`:

```env
BASE_PATH=/bulletin
```

Proxy `/bulletin/` to:

```text
http://your-server-ip:18099/
```

Then inject this script into Jellyfin's `index.html` using your preferred custom JavaScript or file transformation method:

```html
<script src="https://watch.example.com/bulletin/jellyfin-bulletin-inject.js"></script>
```

Advanced embedding is optional. The dashboard works perfectly as a standalone page.

## API Keys

API keys stay server-side in the container. The browser only calls:

```text
/api/dashboard
```

Do not commit your `.env` file.

## Troubleshooting

Check service connectivity:

```text
http://localhost:18099/api/diagnostics
```

Common issues:

- `401`: wrong API key for that app
- `404`: wrong URL or reverse proxy path
- blank Jellyfin embed: mixed HTTP/HTTPS content or custom plugin stripping iframes
- no artwork for downloads: qBittorrent does not provide posters, so artwork depends on title matching

## License

MIT
