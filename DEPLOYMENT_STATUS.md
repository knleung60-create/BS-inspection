# Deployment Status

## NAS Central Sync

- NAS device: DS225
- Deployment folder: `/home/building-services-sync`
- Data folder: `/home/building-services-defects`
- Service port: `3020`
- DDNS hostname: `knleung60.synology.me`
- Health check: `http://knleung60.synology.me:3020/health`
- API base URL for the app: `http://knleung60.synology.me:3020`

## Verified

- NAS server health endpoint returns `{"ok":true}`.
- `knleung60.synology.me` resolves to the NAS public IP.
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

## Remaining Hardening

- Finish DSM certificate assignment for the reverse proxy. A Let's Encrypt certificate for `knleung60.synology.me` exists, but the reverse proxy is still serving the DSM self-signed certificate.
- After HTTPS is active, change the app URL to `https://knleung60.synology.me/...` and remove reliance on Android cleartext traffic.

## GitHub

The deployment branch is:

`codex-nas-sync-deployment`
