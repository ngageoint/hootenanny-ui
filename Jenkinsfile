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
            }
        }   
        stage("Vagrant Up") {
            steps {
                sh "vagrant up ${params.Box} --provider aws"
            }       
        }
        stage("npm test") {
            when { 
                expression { return params.npm }
            }
            steps {
                "vagrant ssh ${params.Box} -c 'cd hoot; npm cache clear; rm 0rf nod_modules; npm dedupe; make && npm test'"
            }
        }
        stage("Cucumber") {
            when {
                expression { return params.cucumber }
            }
            steps {
            
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
