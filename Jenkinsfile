pipeline {
    agent any
    parameters {
        
        booleanParam(name: 'npm', defaultValue: true)
        booleanParam(name: 'cucumber', defaultValue: true)
        string(name: 'Box', defaultValue: 'hoot_centos7', description: 'Vagrant Box')
    }
    stages {
        stage("Setup") {
            steps {
                // Attempt to destroy exiting VM but don't stop job if not there
                sh "vagrant destroy -f ${params.Box} || true"
                cleanWs()

                // Configure environment
                sh 'export WORDS_HOME=/fouo/ubuntu'
            }
        }
        stage('Clone Repos') {
            steps {
                // Checkout hootenanny
                git url: 'https://github.com/ngageoint/hootenanny', branch: 'develop'
                sh "git submodule init; git submodule update; cd hoot-ui; git checkout ${env.BRANCH_NAME}"
            }
        }
        stage("Vagrant Up") {
            steps {
                sh '''
                    cp LocalConfig.pri.orig LocalConfig.pri
                    echo "QMAKE_CXXFLAGS += -Werror" >> LocalConfig.pri
                    sed -i s/"QMAKE_CXX=g++"/"#QMAKE_CXX=g++"/g LocalConfig.pri
                    sed -i s/"#QMAKE_CXX=ccache g++"/"QMAKE_CXX=ccache g++"/g LocalConfig.pri
                '''

                sh "vagrant up ${params.Box} --provider aws"
            }       
        }
        stage("npm test") {
            when { 
                expression { return params.npm }
            }
            steps {
                sh "vagrant ssh ${params.Box} -c 'cd hoot; npm cache clear; rm -rf node_modules; npm dedupe; make && npm test'"
            }
        }
        stage("Cucumber") {
            when {
                expression { return params.cucumber }
            }
            steps {
                sh "vagrant ssh ${params.Box} -c 'cd hoot; source ./SetupEnv.sh; scripts/jenkins/TestPullRequest_ui.sh'"
            }
        }
    }
    post {
        success {
            // If all tests passed, clean everything up
            sh "vagrant destroy -f ${params.Box}"
            cleanWs()
        }
        failure {
            script {
                // Check to see if we failed last time
                if (currentBuild.previousBuild.result == 'FAILURE') {
                    // Copy over any UI failure screenshots
                    sh "vagrant scp ${params.Box}:~/hoot/test-files/ui/screenshot_*.png ./test-files/ui/"
                    emailext (
                        to: '$DEFAULT_RECIPIENTS',
                        subject: "Still Failing: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                        mimeType: 'text/html',
                        attachmentsPattern: 'test-files/ui/screenshot_*.png',
                        body: """<p>Failure: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
                            <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
                            recipientProviders: [
                                [$class: 'DevelopersRecipientProvider'],
                                [$class: 'CulpritsRecipientProvider'],
                                [$class: 'RequesterRecipientProvider']]
                    )
                }
            }
        }
        changed {
            script {
                // Job has been fixed
                if (currentBuild.currentResult == 'SUCCESS') {
                    emailext (
                        to: '$DEFAULT_RECIPIENTS',
                        subject: "Back to normal: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                        mimeType: 'text/html',
                        attachmentsPattern: 'test-files/ui/screenshot_*.png',
                        body: """<p>Fixed: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
                            <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
                            recipientProviders: [
                                [$class: 'DevelopersRecipientProvider'],
                                [$class: 'CulpritsRecipientProvider'],
                                [$class: 'RequesterRecipientProvider']]
                        )
                } else  if (currentBuild.currentResult == 'FAILURE') {
                    // Copy over any UI failure screenshots
                    sh "vagrant scp ${params.Box}:~/hoot/test-files/ui/screenshot_*.png ./test-files/ui/"
                    emailext (
                        to: '$DEFAULT_RECIPIENTS',
                        subject: "Failed: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                        mimeType: 'text/html',
                        attachmentsPattern: 'test-files/ui/screenshot_*.png',
                        body: """<p>Fixed: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
                        <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
                            recipientProviders: [
                                [$class: 'DevelopersRecipientProvider'],
                                [$class: 'CulpritsRecipientProvider'],
                                [$class: 'RequesterRecipientProvider']]
                    )
                }
            }
        }
    }
}
