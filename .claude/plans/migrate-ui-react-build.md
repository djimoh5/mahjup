# Plan: Update UI Deploy Job for Vite/React

## Context

The project has a React 18 + Vite frontend (at the repo root) that replaced an Angular app. The existing `ui.deploy.job.ts` was written for the Angular build, which output to `./ui/dist/browser/`. The Vite build outputs to `dist/` at the repo root — a different path and a different file structure. Critically, Vite puts **all** JS and CSS bundles inside `dist/assets/` with content-hashed filenames, whereas Angular scattered JS files in the root of `dist/browser/`. The current job's `ignoreAssets = true` flag was designed to preserve a static Angular assets folder; for Vite it would mean the most important files (all JS/CSS) are never uploaded.

## What `npm run build` produces

```
dist/
  index.html          ← entry point, must never be cached
  vite.svg            ← default Vite icon (or whatever is in public/)
  assets/
    index-[hash].js   ← content-hashed, safe to cache forever
    index-[hash].css  ← content-hashed, safe to cache forever
```

Run: `npm run build` from the repo root. Vite's default output dir is `dist/`.

## Changes to `core/jobs/ui.deploy.job.ts`

### 1. Fix source path
The job runs from `core/` (via `ts-node jobs/...`), so the Vite `dist/` is one level up:

```
./ui/dist/browser/  →  ../dist/
```

Update every hardcoded path:
- `deployBucket`: `'./ui/dist/browser/index.html'` → `'../dist/index.html'`
- `uploadFiles` call: `'./ui/dist/browser/'` → `'../dist/'`
- `oneTimeDeploy`: `'./ui/dist/browser/favicon.ico'` → `'../dist/favicon.ico'`

### 2. Set `ignoreAssets = false`
Vite's `assets/` folder contains all JS and CSS — it **must** be uploaded and replaced on every deploy. Change:
```ts
ignoreAssets = false;
```

### 3. Add recursive upload for `assets/` subdirectory
The current `uploadFiles` only reads the top-level directory (files with a `.` in the name). It won't descend into `assets/`. Add a recursive helper and update `uploadFiles` to recurse:

```ts
private async uploadFiles(dir: string, bucket: string, keyPrefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const localPath = dir + entry.name;
        const s3Key = keyPrefix + entry.name;
        if (entry.isDirectory()) {
            await this.uploadFiles(localPath + '/', bucket, s3Key + '/');
        } else if (this.excludedFiles.indexOf(entry.name) < 0) {
            await this.uploadFile(localPath, s3Key, bucket);
        }
    }
}
```

### 4. Add `Cache-Control` headers
Vite assets use content-hashed filenames — they can be cached indefinitely. `index.html` must never be cached so users always get the latest entry point.

Update `uploadFile` to accept a `cacheControl` parameter, and set it in `putObject`. Then in `deployBucket`:
- Upload `index.html` with `Cache-Control: no-cache, no-store, must-revalidate`
- All files under `assets/` get `Cache-Control: max-age=31536000, immutable`
- Everything else (e.g. `vite.svg`): `Cache-Control: no-cache`

### 5. Update CloudFront invalidation
With content-hashed assets, only `index.html` ever changes its content at a fixed key. The invalidation paths `['/', '/index.html', '/favicon.ico']` are fine. If a CloudFront distribution ID is configured in `DeployConfig.CLOUDFRONT_DISTRIBUTION`, this will work as-is.

## Critical files

- [core/jobs/ui.deploy.job.ts](core/jobs/ui.deploy.job.ts) — primary file to modify
- [core/config/deploy.config.ts](core/config/deploy.config.ts) — set `AWS_ACCESS_KEY`, `AWS_ACCESS_SECRET`, `CLOUDFRONT_DISTRIBUTION` before running

## Verification

1. Run `npm run build` from repo root → confirm `dist/` is created with `index.html` and `assets/` subfolder
2. Set credentials and bucket in `deploy.config.ts`
3. Run the deploy job: `cd core && ts-node jobs/deploy.app.ts --release` (adjust entry point as needed)
4. Check S3 bucket — should contain `index.html`, `assets/index-[hash].js`, `assets/index-[hash].css`
5. Load the S3 website URL in a browser and confirm the app loads
