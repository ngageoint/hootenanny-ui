pipeline {
    
    agent { label 'master' }
    
    parameters {
        booleanParam(name: 'UI', defaultValue: true)
        string(name: 'Box', defaultValue: 'default', description: 'Vagrant Box')
    }
    
    stages {
        stage("Setup") {
            steps {
                // Attempt to destroy exiting VM but don't stop job if not there
                sh "vagrant destroy -f ${params.Box} || true"
                cleanWs()
            }
        }
        stage('Clone Repos') {
            steps {
                // Checkout hootenanny
                git url: 'https://github.com/ngageoint/hootenanny', branch: 'develop'
                sh "git submodule init; git submodule update; cd hoot-ui-2x; git checkout ${env.GIT_COMMIT}"
                // Remove any screenshots from previous builds
                sh "rm -rf ./test-files/ui/screenshot_*.png"
            }
        }
        stage("Vagrant Up") {
            steps {
                // TODO: Vagrant up --noprovision, install hoot from daily develop RPMs
                sh "vagrant up ${params.Box} --provider aws --provision-with hoot"
                sh "vagrant ssh ${params.Box} -c 'sudo yum install -y epel-release yum-utils'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum-config-manager --add-repo https://s3.amazonaws.com/hoot-repo/el7/pgdg95.repo'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum-config-manager --add-repo https://s3.amazonaws.com/hoot-repo/el7/develop/hoot.repo'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum makecache -y'"
                sh "vagrant ssh ${params.Box} -c 'sudo yum install -y hootenanny-autostart'"
            }       
        }
        stage("UI") {
            when {
                expression { return params.UI }
            }
            steps {
                // Build ui-2x
                sh "vagrant ssh ${params.Box} -c 'cd hoot/hoot-ui-2x; npm i -s; npm run production -s'"
                // Run ui-2x tests
                sh "vagrant ssh ${params.Box} -c 'cd hoot; ./scripts/database/AddKarmaTestUser.sh; cd hoot-ui-2x; npm test'"
            }
        }
    }
    post {
        always {
            // Send build notification
            notifySlack(currentBuild.result, "#builds_hoot-ui")
        }
        success {
            // If all tests passed, clean everything up
            sh "vagrant destroy -f ${params.Box}"
            cleanWs()
        }
        failure {
            // Copy over any UI failure screenshots and send to slack
            sh "vagrant scp ${params.Box}:~/hoot/test-files/ui/screenshot_*.png ./test-files/ui/"
            postSlack("${env.WORKSPACE}/test-files/ui/", "screenshot_*.png", "${env.JENKINS_BOT_TOKEN}", "#builds_hoot-ui")
        }
    }
}