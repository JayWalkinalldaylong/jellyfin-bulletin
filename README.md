# JayFlix Bulletin

JayFlix Bulletin is a Jellyfin-friendly dashboard/newsletter page for recently added media, upcoming Radarr/Sonarr items, qBittorrent downloads, Jellyseerr requests, and server status.

<img width="1600" height="1400" alt="image" src="https://github.com/user-attachments/assets/cfa1bc40-b0cb-4e88-bc3a-2ec62e983694" />


## Public vs Private

This folder is safe to use as the public GitHub version as long as `private/.env` is not committed.

Public files:

- `Dockerfile`
- `docker-compose.yml`
- `server.js`
- `public/`
- `private/.env.example`
- `.gitignore`

Private files:

- `private/.env`

<img width="1600" height="1400" alt="image" src="https://github.com/user-attachments/assets/5d66154b-c7fb-47cd-a821-172aa615ab11" />


## Setup

Copy the example environment file:

```powershell
copy .\private\.env.example .\private\.env
```

Edit `private/.env` and add your API keys.

Start the container:

```powershell
docker compose up -d --build
```

Open:

```text
http://localhost:18099/
```

If serving behind a reverse proxy path such as `/bulletin/`, set:

```text
BASE_PATH=/bulletin
```

## Jellyfin Custom Tab

Use this as the tab HTML content:

```html
<iframe
  src="http://localhost:18099/"
  style="width:100%; height:calc(100vh - 90px); border:0; background:#050505;"
  allowfullscreen>
</iframe>
```

For other devices, replace `localhost` with your Jellyfin server's LAN IP.

## API Notes

The browser only talks to `/api/dashboard`. API keys stay in the container environment and are not exposed to the frontend.
