# NAS Central Defect Sync Guide

This app now supports central defect storage through a small API service that can run on a NAS.

## How It Works

1. The app keeps saving defects and photos on the device first.
2. When `EXPO_PUBLIC_SYNC_SERVER_URL` is configured, the app sends pending defects to the NAS.
3. The app sends pending deletes to the NAS and pulls all central records plus delete markers when it starts, opens the defect log, or opens statistics.
4. If the network is unavailable, records stay on the device and retry later.

## Files Added

- `constants/syncConfig.js` - app sync configuration.
- `utils/centralSync.js` - app sync logic.
- `nas-server/server.js` - NAS central API service.
- `nas-server/.env.example` - NAS server environment example.
- `.env.example` - Expo app environment example.

## NAS Setup

1. Copy the `nas-server` folder to the NAS.
2. Install Node.js 18 or newer on the NAS.
3. Create a NAS data folder, for example:
   ```bash
   mkdir -p /volume1/building-services-defects
   ```
4. Create `nas-server/.env` from `nas-server/.env.example`:
   ```bash
   PORT=3020
   DATA_DIR=/volume1/building-services-defects
   PUBLIC_BASE_URL=http://YOUR_NAS_IP:3020
   SYNC_API_KEY=change-this-key
   MAX_PHOTO_SIZE_BYTES=15728640
   ```
5. Install and start the NAS service:
   ```bash
   cd nas-server
   npm install
   npm start
   ```
6. Confirm the service is reachable from a phone on the same network:
   ```bash
   curl http://YOUR_NAS_IP:3020/health
   ```

For production use, run the service with a process manager such as PM2, Synology Task Scheduler, Docker, or the NAS vendor's service manager.

## Synology / QuickConnect Notes

QuickConnect URLs such as `https://quickconnect.to/YOUR_ID` normally open the Synology DSM login portal. The mobile app cannot sync to that login portal directly; it must reach the `nas-server` API endpoints:

- `GET /health`
- `GET /api/defects`
- `POST /api/defects`
- `DELETE /api/defects/:defectId`

Recommended Synology options:

1. **Internet access from anywhere**: set `EXPO_PUBLIC_SYNC_SERVER_URL` to `https://knleung60.synology.me`.
2. **Recommended hardening**: in DSM, map the HTTPS hostname to `http://127.0.0.1:3020`, then keep the app on the public HTTPS URL.
3. **Firewall and router**: expose only the required sync route. Use a strong `SYNC_API_KEY`.

Do not store NAS login passwords in this project. Only store the API key used by this defect sync service, and keep real `.env` files out of Git.

## Current Operating Decisions

- Access: internet access from anywhere.
- Hostname: `knleung60.synology.me`.
- Authentication: all app users share the same sync API key.
- Conflict rule: latest `updatedAt` value for the same `defectId` wins.
- Delete rule: deleting a central defect also deletes the associated uploaded photo and returns a delete marker to other app users.
- User IDs: not required at this stage.

## App Setup

1. Create `.env` from `.env.example` in the app root:
   ```bash
   EXPO_PUBLIC_SYNC_SERVER_URL=https://knleung60.synology.me
   EXPO_PUBLIC_SYNC_API_KEY=change-this-key
   EXPO_PUBLIC_SYNC_TIMEOUT_MS=15000
   ```
2. Start or rebuild the app:
   ```bash
   pnpm start
   ```
3. For APK distribution, rebuild the Android package after changing `.env`.

## User Workflow

1. User A adds a defect.
2. The app stores it locally and sends it to the NAS.
3. User B opens Defect Log or Statistics.
4. The app pulls central data and shows User A's defect.

## GitHub Sync Steps

This folder was not a Git repository when checked. To sync this project to GitHub:

1. Initialize Git:
   ```bash
   git init
   git add .
   git commit -m "Add NAS central defect sync"
   ```
2. Create a new private GitHub repository.
3. Connect the local repository:
   ```bash
   git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
4. Keep these files private and do not commit real secrets:
   - `.env`
   - `nas-server/.env`
   - `nas-server/data/`

## Validation Checklist

1. Start the NAS service and open `/health`.
2. Start the app with `EXPO_PUBLIC_SYNC_SERVER_URL` set.
3. Add a defect from one device.
4. Open `nas-server/data/defects.json` on the NAS and confirm the record exists.
5. Open the app on another device and go to Defect Log.
6. Confirm the defect and photo appear.
7. Delete the defect from one device.
8. Open Defect Log on another device and confirm the same defect disappears after sync.
9. Export a PDF and confirm NAS-hosted photos appear in the report.
