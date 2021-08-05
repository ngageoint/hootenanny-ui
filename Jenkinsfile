pipeline {

    agent { label 'master' }

    parameters {
        booleanParam(name: 'UI', defaultValue: true)
        string(name: 'Box', defaultValue: 'default', description: 'Vagrant Box')
        string(name: 'HOOT_UI_AWS_ENV_TAG', defaultValue: 'testing')
        string(name: 'HOOT_UI_AWS_USE_TAG', defaultValue: 'jenkins')
        string(name: 'HOOT_UI_AWS_GROUP_TAG', defaultValue: 'devops')
    }

    environment {
        HOOT_UI_AWS_ENV_TAG="${params.HOOT_UI_AWS_ENV_TAG}"
        HOOT_UI_AWS_USE_TAG="${params.HOOT_UI_AWS_USE_TAG}"
        HOOT_UI_AWS_GROUP_TAG="${params.HOOT_UI_AWS_GROUP_TAG}"
    }

    stages {
        stage("Setup") {
            steps {
                // Attempt to destroy exiting VM but don't stop job if not there
                sh "vagrant destroy -f ${params.Box} || true"
            }
        }
        stage("Vagrant Up") {
            steps {
                // TODO: Vagrant up --noprovision, install hoot from daily develop RPMs
                sh "vagrant up ${params.Box} --provider aws"
                sh "vagrant ssh ${params.Box} -c 'sudo yum install -y epel-release yum-utils git bzip2'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum-config-manager --add-repo https://hoot-repo.s3.amazonaws.com/el7/pgdg13.repo'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum-config-manager --add-repo https://geoint-deps.s3.amazonaws.com/el7/stable/geoint-deps.repo'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum-config-manager --add-repo https://hoot-repo.s3.amazonaws.com/el7/master/hoot.repo'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum makecache -y'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum install -y hootenanny-autostart'"
                sh "vagrant ssh ${params.Box} -c '/var/lib/hootenanny/scripts/database/AddKarmaTestUser.sh;'"
                sh "vagrant ssh ${params.Box} -c '/var/lib/hootenanny/scripts/chrome/chrome-install.sh;'"
                sh "vagrant ssh ${params.Box} -c '/var/lib/hootenanny/scripts/chrome/driver-install.sh;'"
            }
        }
        stage("UI") {
            when {
                expression { return params.UI }
            }
            steps {
                // Build ui-2x
                sh "vagrant ssh ${params.Box} -c 'cd hoot-ui; npm i; npm run production'"
                // Run ui-2x tests
                sh "vagrant ssh ${params.Box} -c 'cd hoot-ui; npm test'"
            }
        }
    }
    post {
        aborted {
            script {
                notifySlack("ABORTED", "#builds_hoot-ui")
            }
        }
        success {
            script {
                notifySlack("SUCCESS", "#builds_hoot-ui")
                // If all tests passed, clean everything up
                sh "vagrant destroy -f ${params.Box}"
                cleanWs()
            }
        }
        failure {
            script {
                notifySlack("FAILURE", "#builds_hoot-ui")
            }
        }
    }
}
