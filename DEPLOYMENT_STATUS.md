# Deployment Status

## NAS Central Sync

- NAS device: DS225
- Deployment folder: `/home/building-services-sync`
- Data folder: `/home/building-services-defects`
- Service port: `3020`
- Health check: `http://123.203.194.209:3020/health`
- API base URL for the app: `http://123.203.194.209:3020`

## Verified

- NAS server health endpoint returns `{"ok":true}`.
- Defect API can create, list, and delete a temporary test record.
- Android export check completed successfully with the NAS sync environment loaded.
- Local Git branch is `main`.

## Local-Only Files

These are intentionally not committed:

- `.env`
- `deploy/`
- `node_modules/`
- `nas-server/node_modules/`
- `nas-server/data/`
- `.expo-export-check-android/`

## GitHub Remaining Step

Add a GitHub remote and push:

```bash
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin main
```
