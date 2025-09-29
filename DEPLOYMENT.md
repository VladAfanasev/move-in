# Move-in Docker Deployment Guide (GHCR, Raspberry Pi 5 ARM64)

This guide shows how to build, publish, and run the `move-in` app as a Docker container, optimized for Raspberry Pi 5 (ARM64, Cortex-A76), using GitHub Container Registry (GHCR).

- Repository: `github.com/VladAfanasev/move-in`
- Image registry: `ghcr.io/vladafanasev/move-in`
- Default tag used in this repo: `main` (published by GitHub Actions on every push to main)

## Contents
- [Prerequisites](#prerequisites)
- [How publishing works](#how-publishing-works)
- [Package visibility: public vs private](#package-visibility-public-vs-private)
- [Granting access to a private image](#granting-access-to-a-private-image)
- [Pull and run on a server (Docker)](#pull-and-run-on-a-server-docker)
- [Pull and run with docker-compose](#pull-and-run-with-docker-compose)
- [Environment variables](#environment-variables)
- [Manual build and push (optional)](#manual-build-and-push-optional)
- [Versioned releases (tags)](#versioned-releases-tags)
- [Multi-arch images (optional)](#multi-arch-images-optional)
- [Troubleshooting](#troubleshooting)

## Prerequisites
- Docker installed on the server (Raspberry Pi 5 or any ARM64 machine)
- If the package is private: a GitHub Personal Access Token (PAT) with `read:packages`

## How publishing works
Publishing is automated by GitHub Actions at `.github/workflows/publish-ghcr.yml`:

- Triggers on:
  - Pushes to `main`
  - Git tags matching `v*` (e.g., `v0.1.0`)
  - Manual dispatch
- Builds for `linux/arm64` (Raspberry Pi 5)
- Pushes to `ghcr.io/vladafanasev/move-in` with tags including:
  - `:main` for main branch
  - `:vX.Y.Z` for tags
  - `:<short-sha>`
  - `:arm64`
- Uses `GITHUB_TOKEN` with `packages: write` permission, so it works for a private repo

You do not need to build locally for normal use. Just push to `main` and the image will appear on GHCR.

## Package visibility: public vs private
- Public: anyone can pull without authentication.
- Private (recommended for private repos): only explicitly authorized users/teams/orgs can pull.

Change visibility and manage access:
1) GitHub → your repo → right sidebar "Packages" → select `move-in` package → "Package settings".
2) Set **Visibility** to Public or Private.
3) If Private, grant **Read** access to specific users/teams/orgs.

## Granting access to a private image
If the image is private, each server/user must authenticate with GHCR before pulling.

1) The user creates a GitHub Personal Access Token (PAT) with `read:packages`:
   - GitHub → Settings → Developer settings → Personal access tokens
   - Create token with scope `read:packages` (fine-grained or classic)
2) On the server, log in to GHCR:
```bash
# Replace with their GitHub username and set GHCR_TOKEN to their PAT
echo $GHCR_TOKEN | docker login ghcr.io -u THEIR_GITHUB_USERNAME --password-stdin
```

## Pull and run on a server (Docker)
```bash
# Pull the ARM64 image
docker pull ghcr.io/vladafanasev/move-in:main

# Run the container
docker run -d \
  --name move-in \
  -p 3000:3000 \
  -e NODE_ENV=production \
  ghcr.io/vladafanasev/move-in:main
```
- App listens on `0.0.0.0:3000` in the container.

## Pull and run with docker-compose
This repository contains `docker-compose.yml` that references GHCR.

```bash
docker compose pull
docker compose up -d
```
- Update `docker-compose.yml` if you want a specific version tag (e.g., `v0.1.0`).
- Logs: `docker compose logs -f`
- Stop: `docker compose down`

## Environment variables
Set runtime environment via `-e` flags or `environment:` in `docker-compose.yml`.

Defaults used:
- `PORT=3000`
- `HOSTNAME=0.0.0.0`
- `NODE_ENV=production`

For secrets, prefer Docker/Compose environment variables or a `.env` file (not committed).

## Manual build and push (optional)
You generally don’t need this because CI publishes images. If you do want to build locally:

- On Raspberry Pi 5 (ARM64 host):
```bash
docker build -t ghcr.io/vladafanasev/move-in:arm64 .
# Login then push (if private, requires PAT with write:packages)
docker push ghcr.io/vladafanasev/move-in:arm64
```

- On x86 host (cross-build via Buildx):
```bash
docker buildx create --use --name multi || true
docker buildx build --platform linux/arm64 \
  -t ghcr.io/vladafanasev/move-in:arm64 \
  --push .
```

## Versioned releases (tags)
Create a git tag to publish a versioned image:
```bash
git tag v0.1.0
git push origin v0.1.0
```
The workflow publishes `ghcr.io/vladafanasev/move-in:v0.1.0`.

## Multi-arch images (optional)
If you need both `amd64` and `arm64` under the same tag, the CI workflow can be extended. Example (conceptual):
```yaml
# docker/build-push-action inputs
platforms: linux/amd64,linux/arm64
```
Then consumers on any architecture can `docker pull ghcr.io/vladafanasev/move-in:latest` and receive the correct variant.

## Troubleshooting
- "denied: permission denied" when pulling:
  - Image is private and the user is not logged in to `ghcr.io` or lacks `read:packages`.
- "no matching manifest for linux/arm64":
  - Ensure you’re pulling an ARM64 tag built by the workflow (`:main`, `:arm64`, or a tagged release).
- Build failures in CI:
  - Check GitHub → Actions → `Publish Docker image to GHCR` logs.
- Port already in use:
  - Change `-p 3000:3000` to another host port (e.g., `-p 8080:3000`).

---

For questions or access requests, contact the repository maintainer.
