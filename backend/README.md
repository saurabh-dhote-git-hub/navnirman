# Navnirman Backend

## Video storage: local or Cloudflare R2

Local development uses `./storage/videos` by default. To enable Cloudflare R2, configure these environment variables:

- `R2_ENABLED=true`
- `R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_REGION=auto`
- `R2_BUCKET=navnirman-videos`
- `R2_ACCESS_KEY_ID=<R2 access key ID>`
- `R2_SECRET_ACCESS_KEY=<R2 secret access key>`

Keep credentials in Render Environment Variables; never commit them.

The existing `/api/admin/videos` upload endpoint stores the object in R2 when enabled. The existing `/api/videos/{id}/stream` endpoint continues enforcing publication and premium subscription checks and supports HTTP byte ranges. Video deletion removes the database record and the stored object.

## Existing videos

Existing database rows still point to their old `storedFilename` values. If their files existed only on a previous Render instance's local filesystem, those files may already be gone. Re-upload those videos through the admin dashboard after enabling R2. Do not delete old records until the replacement uploads have been checked.

## Build

```bash
mvn clean package
```

The Dockerfile is at the backend root and builds `navnirman-api-0.7.1.jar`.
