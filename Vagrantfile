# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "hoot/centos7-minimal"
  config.vm.hostname = "hoot-centos"
  config.vm.synced_folder ".", "/home/vagrant/hoot-ui"

  def aws_provider(config, os)
    # AWS Provider.  Set enviornment variables for values below to use
    config.vm.provider :aws do |aws, override|
      override.nfs.functional = false
      aws.region_config ENV['AWS_DEFAULT_REGION'], :ami => ENV['AWS_MINIMAL_AMI_ID']
      aws.subnet_id = ENV['AWS_SUBNET_ID']
      aws.instance_type = ENV.fetch('AWS_INSTANCE_TYPE', 'm5.2xlarge')

      aws.block_device_mapping = [{ 'DeviceName' => '/dev/sda1', 'Ebs.VolumeSize' => 64 }]

      if ENV.key?('AWS_KEYPAIR_NAME')
        aws.keypair_name = ENV['AWS_KEYPAIR_NAME']
      end

      if ENV.key?('AWS_SECURITY_GROUP')
        $security_grp = ENV['AWS_SECURITY_GROUP']
        if $security_grp.is_a?(String) and $security_grp.include? ',' and $security_grp.split(',').length > 0
            aws.security_groups = $security_grp.split(',')
        else
            aws.security_groups = $security_grp
        end
      end

      aws.tags = {
        'Name' => ENV.fetch('AWS_INSTANCE_NAME_TAG', "jenkins-hootenanny-ui-#{os.downcase}"),
        'URL'  => ENV.fetch('AWS_INSTANCE_URL_TAG', 'https://github.com/ngageoint/hootenanny-ui'),
        'env' => ENV.fetch('HOOT_UI_AWS_ENV_TAG', 'testing'),
        'use' => ENV.fetch('HOOT_UI_AWS_USE_TAG', 'Jenkins'),
        'group' => ENV.fetch('HOOT_UI_AWS_GROUP_TAG', 'devops')
      }

      if ENV.key?('JOB_NAME')
        aws.tags['JobName'] = ENV['JOB_NAME']
      end

      if ENV.key?('BUILD_NUMBER')
        aws.tags['BuildNumber'] = ENV['BUILD_NUMBER']
      end
    end
  end

  aws_provider(config, 'CentOS7')

  # tomcat service
  config.vm.network "forwarded_port", guest: 8080, host: 8888
  # translation nodejs service
  config.vm.network "forwarded_port", guest: 8094, host: 8094
  # merge nodejs service
  config.vm.network "forwarded_port", guest: 8096, host: 8096
  # node-mapnik-server nodejs service
  config.vm.network "forwarded_port", guest: 8000, host: 8000
  # node-export-server nodejs service
  config.vm.network "forwarded_port", guest: 8101, host: 8101

end
