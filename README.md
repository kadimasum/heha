# CI/CD Demo App

A small Node.js and Express application that demonstrates a delivery path from
source control through Jenkins, Docker, and Kubernetes:

```text
GitHub -> Jenkins -> Docker Hub -> Kubernetes or Argo CD
```

## Application

The server is started by [src/server.js](src/server.js) and listens on port
`3000` by default. Static content is served from [src/public/](src/public/).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Serves the CI/CD explainer page |
| `GET` | `/api/info` | Returns application and build metadata |
| `GET` | `/healthz` | Kubernetes liveness check; returns `{"status":"ok"}` |
| `GET` | `/readyz` | Kubernetes readiness check; returns `{"status":"ready"}` |

`GET /api/info` returns the package name, version, build ID, container
hostname, and an ISO timestamp. The version defaults to `package.json`, while
the following environment variables can override deployment metadata:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listen port |
| `APP_VERSION` | `1.0.0` | Version returned by `/api/info` |
| `BUILD_ID` | `local` | Build identifier returned by `/api/info` |

## Requirements

- Node.js 18 or newer
- npm
- Docker, for image workflows
- `kubectl`, for direct Kubernetes deployment
- An available Kubernetes cluster, for Kubernetes workflows

## Local development

Install dependencies and start the server:

```bash
npm install
npm start
```

Open <http://localhost:3000>. Set environment variables before starting when
testing deployment metadata, for example:

```bash
APP_VERSION=1.0.0 BUILD_ID=local PORT=3000 npm start
```

## Tests and checks

Run the Jest and Supertest suite:

```bash
npm ci
npm test
```

Tests are in [test/app.test.js](test/app.test.js). Coverage output is written
to [coverage/](coverage/). The `build` script is not a compilation step; it
only checks the syntax of the two server files:

```bash
npm run build
```

The available npm scripts are:

| Script | Command | Purpose |
| --- | --- | --- |
| `start` | `node src/server.js` | Start the server |
| `test` | `jest --coverage` | Run tests with coverage |
| `build` | `node --check ...` | Check JavaScript syntax |
| `lint` | placeholder command | Currently exits successfully without linting |

## Docker

Build and run the application image locally:

```bash
docker build -t cicd-demo-app:latest .
docker run --rm -p 3000:3000 cicd-demo-app:latest
```

The application image uses Node.js 20 Alpine, installs production
dependencies, runs as the non-root `app` user, exposes port `3000`, and has a
Docker health check against `/healthz`.

## Jenkins pipeline

[Jenkinsfile](Jenkinsfile) defines these stages:

1. **Clone**: checks out the `main` branch of `https://github.com/kadimasum/heha`.
2. **Install Dependencies**: uses the Jenkins NodeJS tool named `node`, checks
	 for `libatomic.so.1`, and runs `npm ci`.
3. **Test**: installs dependencies and runs `npm test`.
4. **Docker Build**: builds tags for the Jenkins build number and `latest`.
5. **Docker Push**: logs in to Docker Hub and pushes both tags.

Configure a Jenkins username/password credential named
`dockerhub-credentials`. The pipeline uses the credential username as the
Docker Hub namespace and `BUILD_NUMBER` as the version tag.

The Jenkins agent must provide Node.js through the NodeJS plugin tool named
`node`, Docker CLI, and access to the Docker daemon. The Node.js installation
also requires `libatomic.so.1`; on Debian or Ubuntu, install the `libatomic1`
package.

### Jenkins container

[jenkins.dockerfile](jenkins.dockerfile) creates a Jenkins image with the
`libatomic1` runtime dependency and Docker CLI. Build it with:

```bash
docker build -f jenkins.dockerfile -t jenkins-with-node-deps:latest .
```

Recreate Jenkins from that image and preserve the Jenkins home volume. The
Docker socket is mounted so Docker commands run by Jenkins use the host daemon:

```bash
docker stop cne-jenkins
docker rm cne-jenkins
docker run -d --name cne-jenkins \
	-p 8080:8080 -p 50000:50000 \
	-v jenkins_home:/var/jenkins_home \
	-v /var/run/docker.sock:/var/run/docker.sock \
	--group-add "$(stat -c '%g' /var/run/docker.sock)" \
	jenkins-with-node-deps:latest
```

Verify the client and socket before running the job:

```bash
docker exec cne-jenkins docker --version
docker exec cne-jenkins test -S /var/run/docker.sock
```

Mounting the Docker socket gives Jenkins permission to control the host Docker
daemon. Use this setup only on a trusted Jenkins installation.

## Kubernetes

The manifests in [k8s/](k8s) define:

- [namespace.yaml](k8s/namespace.yaml): the `cicd-demo` namespace
- [deployment.yaml](k8s/deployment.yaml): two replicas, rolling updates,
	resource requests/limits, and HTTP liveness/readiness probes
- [service.yaml](k8s/service.yaml): an internal `ClusterIP` service on port 80
	forwarding to container port 3000

Apply them directly:

```bash
kubectl apply -f k8s/
kubectl -n cicd-demo get pods,service
```

The deployment currently references `cicd-demo-app:latest` and uses
`IfNotPresent`. For a remote registry, change the `image:` value in
[k8s/deployment.yaml](k8s/deployment.yaml) to the pushed image and tag, then
apply the manifest again. `BUILD_ID` is populated from the pod's `app` label.

## Argo CD

[argocd/application.yaml](argocd/application.yaml) defines an Argo CD
Application named `cicd`. It watches the `k8s` directory in
`https://github.com/kadimasum/heha.git`, deploys to the `cicd-demo` namespace,
and enables automated sync, pruning, and self-healing:

```bash
kubectl apply -f argocd/application.yaml
kubectl -n argocd get application cicd
```

Argo CD must already be installed, and the destination cluster must contain
the `cicd-demo` namespace or be able to create it through the synced manifests.

## Repository layout

```text
src/                  Express application and static page
test/                 Jest and Supertest tests
k8s/                  Kubernetes namespace, deployment, and service
argocd/               Argo CD Application definition
Jenkinsfile           Jenkins CI/CD pipeline
Dockerfile            Application image definition
jenkins.dockerfile    Custom Jenkins image definition
package.json          npm scripts and dependencies
```

