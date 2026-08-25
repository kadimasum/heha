pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_NAME = "${DOCKERHUB_CREDENTIALS_USR}/cicd-demo-app"
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Clone') {
            steps {
               git url: "https://github.com/kadimasum/heha", branch: "main"
            }
        }

        stage('Install Dependencies') {
            tools {
                nodejs 'node'
            }
            steps {
                sh 'ldconfig -p | grep -q "libatomic.so.1" || { echo "Missing libatomic.so.1; install the libatomic1 package on the Jenkins agent" >&2; exit 1; }'
                sh 'npm ci'
            }
        }

        stage('Test') {
            tools {
                nodejs 'node'
            }
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Docker Push') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }
    }

}
