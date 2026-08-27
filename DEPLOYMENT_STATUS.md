# Deployment Status

## NAS Central Sync

- NAS device: DS225
- Deployment folder: `/home/building-services-sync`
- Data folder: `/home/building-services-defects`
- Service port: `3020`
- DDNS hostname: `knleung60.synology.me`
- Health check: `https://knleung60.synology.me/health`
- API base URL for the app: `https://knleung60.synology.me`

## Verified

- NAS server health endpoint returns `{"ok":true}`.
- `knleung60.synology.me` resolves to the NAS public IP.
- DSM reverse proxy and trusted HTTPS certificate are active for `knleung60.synology.me`.
- Defect API can create, list, and delete a temporary test record.
- Android export check completed successfully with the NAS sync environment loaded.
- Local sync conflict/delete tests passed for latest-write-wins and deleted-defect propagation.
- Local Git branch is `main`.

## Local-Only Files

These are intentionally not committed:

- `.env`
- `deploy/`
- `node_modules/`
- `nas-server/node_modules/`
- `nas-server/data/`
- `.expo-export-check-android/`

## Sync Rules

- Current access mode: internet access from anywhere.
- Current authentication model: all users share one API key.
- Current conflict rule: latest write wins when the same `defectId` is uploaded again.
- Delete rule: deleting a central defect deletes its associated uploaded photo and records a delete marker so other devices remove the same defect during sync.

## Remaining Step

- Restart the NAS sync server process so the uploaded delete-marker server code is loaded.

## GitHub

The deployment branch is:

`codex-nas-sync-deployment`
