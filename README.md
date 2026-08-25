# CI/CD Demo App

A minimal Node.js/Express web application used to illustrate a full CI/CD pipeline:
tests → Docker image build → Kubernetes deployment.

## Features

- `GET /` – web page explaining CI/CD concepts and this app's pipeline
- `GET /api/info` – JSON with app name/version/build id/timestamp
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

## Building

This app does not require a JavaScript compilation or bundling step. The build
command validates the application's JavaScript syntax without requiring Docker:

```bash
npm run build
```

Docker image creation is handled separately by the CI/CD pipeline.

## CI/CD pipeline

[Jenkinsfile](Jenkinsfile) defines a declarative pipeline that clones the
repo, installs dependencies, runs the test suite, then builds and pushes a
Docker image to Docker Hub. It expects a Jenkins credential named
`dockerhub-credentials` (username/password) for authenticating with Docker Hub.

## Docker

Build and run the container locally:

```bash
docker build -t cicd-demo-app:latest .
docker run --rm -p 3000:3000 cicd-demo-app:latest
```

## Kubernetes

Manifests live under [k8s/](k8s):

```bash
kubectl apply -f k8s/
```

This creates the `cicd-demo` namespace, a `Deployment` (2 replicas, rolling
updates, liveness/readiness probes, non-root/read-only-fs security context),
and a `Service`.

To point the deployment at an image you built/pushed, update the `image:`
field in [k8s/deployment.yaml](k8s/deployment.yaml) and re-apply:

```bash
kubectl apply -f k8s/
```

