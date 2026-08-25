# CI/CD Demo App

A minimal Node.js/Express web application used to illustrate a full CI/CD pipeline:
tests → Docker image build → Kubernetes deployment.

## Features

- `GET /` – simple static web page showing app info
- `GET /api/info` – JSON with app name/version/build id/hostname
- `GET /healthz` – liveness probe endpoint
- `GET /readyz` – readiness probe endpoint

## Local development

```bash
npm install
npm start
# visit http://localhost:3000
```

## Running tests

```bash
npm install
npm test
```

Tests use Jest + Supertest and live in [test/app.test.js](test/app.test.js).

## Docker

Build and run the container locally:

```bash
docker build -t cicd-demo-app:latest .
docker run --rm -p 3000:3000 cicd-demo-app:latest
```

## Kubernetes

Manifests live under [k8s/](k8s) and are managed with Kustomize:

```bash
kubectl apply -k k8s/
```

This creates the `cicd-demo` namespace, a `Deployment` (2 replicas, rolling
updates, liveness/readiness probes, non-root/read-only-fs security context),
a `Service`, and an `Ingress`.

To point the deployment at an image you built/pushed:

```bash
cd k8s
kustomize edit set image cicd-demo-app=<registry>/<image>:<tag>
kubectl apply -k .
```

