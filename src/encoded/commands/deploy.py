import argparse
import datetime
import getpass
import re
import subprocess
import sys
import time

from base64 import b64encode
from os.path import expanduser

import boto3


class SpotClient(object):
    error_list = [
        'capacity-not-available',
        'capacity-oversubscribed',
        'not-scheduled-yet',
        'launch-group-constraint',
        'az-group-constraint',
        'placement-group-constraint',
        'constraint-not-fulfillable'
    ]
    instance_filters = [
        {
            'Name': 'availability-zone',
            'Values': [
                'us-west-2a',
                'us-west-2b',
                'us-west-2c'
            ],
        },
    ]

    def __init__(self, client, image_id, instance_type, security_groups):
        self.client = client
        self.image_id = image_id
        self.instance_type = instance_type
        self.security_groups = list(security_groups)
        self.spot_id = None


    def override_for_waiting(self, code_status):
        waiting = self.client.describe_spot_instance_requests(
            SpotInstanceRequestIds=[self.spot_id]
        )
        waiting_items_gen = (
            value
            for key, value in waiting.items()
            if key == 'SpotPriceHistory'
        )
        status_items_gen = (
            status_item
            for wait_item in waiting_items_gen
            for status_item in wait_item
            if status_item == 'Status'
        )
        for status_item in status_items_gen:
            for item in status_item:
                if item == 'Code':
                    code_status = item
        return code_status

    def request_spot_instance(self, iam_role, spot_price, user_data, bdm):
        instance = self.client.request_spot_instances(
            DryRun=False,
            SpotPrice=spot_price,
            InstanceCount=1,
            Type='one-time',
            LaunchSpecification={
                'ImageId': self.image_id,
                'SecurityGroups': self.security_groups,
                'UserData': user_data,
                'InstanceType': self.instance_type,
                'Placement': {
                    'AvailabilityZone': 'us-west-2c'
                },
                'BlockDeviceMappings': bdm,
                'IamInstanceProfile': {
                    "Name": iam_role,
                }
            }
        )
        self.spot_id = instance['SpotInstanceRequests'][0]['SpotInstanceRequestId']
        print("waiting for spot request to be fulfilled")
        code_status = self.wait_for_code_change()
        if not code_status == 'fufilled':
            code_status = self.wait_for_code_change()
        return instance

    def get_instance_id(self):
        request = self.client.describe_spot_instance_requests(
            SpotInstanceRequestIds=[self.spot_id])
        instance_id = request['SpotInstanceRequests'][0]['InstanceId']
        # print("\n Instace ID: %s" % instance_id)
        return instance_id

    def get_spot_code(self):
        request = self.client.describe_spot_instance_requests(
            SpotInstanceRequestIds=[self.spot_id]
        )
        code_status_start = request['SpotInstanceRequests'][0]['Status']
        return code_status_start['Code']

    def wait_for_code_change(self):
        code_status = None
        while code_status != 'fulfilled':
            code_status = self.get_spot_code()
            if code_status == self.error_cleanup(code_status):
                exit()
            code_status = self.override_for_waiting(code_status)
            if code_status == 'price-too-low':
                print("Spot Instance ERROR: Bid placed is too low.")
                self.cancel_spot()
                exit()
            time.sleep(0.1)
            return code_status

    def tag_spot_instance(self, tag_data):
        tags = [
            {'Key': 'Name', 'Value': tag_data['name']},
            {'Key': 'branch', 'Value': tag_data['branch']},
            {'Key': 'commit', 'Value': tag_data['commit']},
            {'Key': 'started_by', 'Value': tag_data['username']},
        ]
        instance_id = self.client.create_tags(
            Resources=[self.get_instance_id()],
            Tags=tags
        )
        return instance_id

    def error_cleanup(self, code_status):
        if code_status in self.error_list:
            print('Spot Instance ERROR: %s' % code_status)
            self.cancel_spot()
            exit()

    def cancel_spot(self):
        self.client.cancel_spot_instance_requests(SpotInstanceRequestIds=[self.spot_id])

    def spot_instance_price_check(self):
        todays_date = datetime.datetime.now()
        response = self.client.describe_spot_price_history(
            DryRun=False,
            StartTime=todays_date,
            EndTime=todays_date,
            InstanceTypes=[
                self.instance_type
            ],
            Filters=self.instance_filters
        )
        response_items_gen = (
            value
            for key, value in response.items()
            if key == 'SpotPriceHistory'
        )
        highest = 0
        for value in response_items_gen:
            for item in value:
                for i in item:
                    if i == 'SpotPrice':
                        print("SpotPrice: %s" % item[i])
                        if float(item[i]) > highest:
                            highest = float(item[i])
        print("Highest price: %f" % highest)
        return highest


def nameify(in_str):
    name = ''.join(
        c if c.isalnum() else '-'
        for c in in_str.lower()
    ).strip('-')
    return re.subn(r'\-+', '-', name)[0]


def tag_ec2_instance(instance, tag_data):
    tags = [
        {'Key': 'Name', 'Value': tag_data['name']},
        {'Key': 'branch', 'Value': tag_data['branch']},
        {'Key': 'commit', 'Value': tag_data['commit']},
        {'Key': 'started_by', 'Value': tag_data['username']},
    ]
    instance.create_tags(Tags=tags)
    return instance


def read_ssh_key():
    home = expanduser("~")
    ssh_key_path = home + '/' + '.ssh/id_rsa.pub'
    ssh_keygen_args = ['ssh-keygen', '-l', '-f', ssh_key_path]
    fingerprint = subprocess.check_output(
        ssh_keygen_args
    ).decode('utf-8').strip()
    if fingerprint:
        with open(ssh_key_path, 'r') as key_file:
            ssh_pub_key = key_file.readline().strip()
            return ssh_pub_key
    return None


def _get_bdm(main_args):
    return [
        {
            'DeviceName': '/dev/sda1',
            'Ebs': {
                'VolumeSize': int(main_args.volume_size),
                'VolumeType': 'gp3',
                'DeleteOnTermination': True
            }
        },
        {
            'DeviceName': '/dev/sdb',
            'NoDevice': "",
        },
        {
            'DeviceName': '/dev/sdc',
            'NoDevice': "",
        },
    ]


def get_user_data(commit, config_file, data_insert, main_args):
    cmd_list = ['git', 'show', commit + config_file]
    config_template = subprocess.check_output(cmd_list).decode('utf-8')
    ssh_pub_key = read_ssh_key()
    if not ssh_pub_key:
        print(
            "WARNING: User is not authorized with ssh access to "
            "new instance because they have no ssh key"
        )
    data_insert['LOCAL_SSH_KEY'] = ssh_pub_key
    # aws s3 authorized_keys folder
    auth_base = 's3://regulome-conf-prod/ssh-keys'
    auth_type = 'prod'
    if main_args.profile_name != 'production':
        auth_type = 'demo'
    auth_keys_dir = '{auth_base}/{auth_type}-authorized_keys'.format(
        auth_base=auth_base,
        auth_type=auth_type,
    )
    data_insert['S3_AUTH_KEYS'] = auth_keys_dir
    user_data = config_template % data_insert
    return user_data


def _get_instances_tag_data(main_args):
    instances_tag_data = {
        'branch': main_args.branch,
        'commit': None,
        'name': main_args.name,
        'username': None,
    }
    if instances_tag_data['branch'] is None:
        instances_tag_data['branch'] = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD']
        ).decode('utf-8').strip()
    instances_tag_data['commit'] = subprocess.check_output(
        ['git', 'rev-parse', '--short', instances_tag_data['branch']]
    ).decode('utf-8').strip()
    if not subprocess.check_output(
            ['git', 'branch', '-r', '--contains', instances_tag_data['commit']]
        ).strip():
        print("Commit %r not in origin. Did you git push?" % instances_tag_data['commit'])
        sys.exit(1)
    instances_tag_data['username'] = getpass.getuser()
    if instances_tag_data['name'] is None:
        instances_tag_data['name'] = nameify(
            '%s-%s-%s' % (
                instances_tag_data['branch'],
                instances_tag_data['commit'],
                instances_tag_data['username'],
            )
        )
    return instances_tag_data


def _get_ec2_client(main_args, instances_tag_data):
    session = boto3.Session(region_name='us-west-2', profile_name=main_args.profile_name)
    ec2 = session.resource('ec2')
    if any(ec2.instances.filter(
            Filters=[
                {'Name': 'tag:Name', 'Values': [instances_tag_data['name']]},
                {'Name': 'instance-state-name',
                 'Values': ['pending', 'running', 'stopping', 'stopped']},
            ])):
        print('An instance already exists with name: %s' % instances_tag_data['name'])
        return None
    return ec2


def _get_run_args(main_args, instances_tag_data):
    master_user_data = None
    security_groups = ['ssh-http-https']
    iam_role = 'regulome-instance'
    count = 1
    data_insert = {
        'COMMIT': instances_tag_data['commit'],
        'ROLE': main_args.role,
        'GIT_REPO': main_args.git_repo,
    }
    config_file = ':cloud-config.yml'
    user_data = get_user_data(instances_tag_data['commit'], config_file, data_insert, main_args)
    run_args = {
        'count': count,
        'iam_role': iam_role,
        'user_data': user_data,
        'security_groups': security_groups,
    }
    if master_user_data:
        run_args['master_user_data'] = master_user_data
    return run_args


def _wait_and_tag_instances(main_args, run_args, instances_tag_data, instances, cluster_master=False):
    tmp_name = instances_tag_data['name']
    domain = 'production' if main_args.profile_name == 'production' else 'instance'
    for i, instance in enumerate(instances):
        instances_tag_data['name'] = tmp_name
        if not main_args.spot_instance:
            print('AWS EC2 Instance created')
            print('Instance id: %s' % (instance.id))  # Instance:i-34edd56f
            instance.wait_until_running()
            tag_ec2_instance(instance, instances_tag_data)
            print('SSH Access: ssh ubuntu@%s' % (instance.public_dns_name))
            print('Cloud Config Logs: ssh ubuntu@%s \'tail -f /var/log/cloud-init-output.log\'' % (instance.public_dns_name))
            print('HTTP Access: https://%s.demo.regulomedb.org' % instances_tag_data['name'])


def main():
    # Gather Info
    main_args = parse_args()
    instances_tag_data = _get_instances_tag_data(main_args)
    if instances_tag_data is None:
        sys.exit(10)
    ec2_client = _get_ec2_client(main_args, instances_tag_data)
    if ec2_client is None:
        sys.exit(20)
    run_args = _get_run_args(main_args, instances_tag_data)
    if main_args.dry_run_aws:
        print('Dry Run AWS')
        print('main_args', main_args)
        print('run_args', run_args.keys())
        print('Dry Run AWS')
        sys.exit(30)
    # Run Cases
    if main_args.check_price:
        print("check_price")
        boto_client = boto3.client('ec2')
        spot_client = SpotClient(
            boto_client,
            main_args.image_id,
            main_args.instance_type,
            run_args['security_groups']
        )
        spot_client.spot_instance_price_check()
    elif main_args.spot_instance:
        print("spot_instance")
        boto_client = boto3.client('ec2')
        # issue with base64 encoding so no decoding in utc-8 and recoding in base64 then decoding in base 64.
        user_config = subprocess.check_output(['git', 'show', instances_tag_data['commit'] + ':cloud-config.yml'])
        user_data_b64 = b64encode(user_config)
        run_args['user_data'] = user_data_b64.decode()
        spot_client = SpotClient(
            boto_client,
            main_args.image_id,
            main_args.instance_type,
            run_args['security_groups']
        )
        print("security_groups: %s" % run_args['security_groups'])
        bdm = _get_bdm(main_args)
        instances = spot_client.request_spot_instance(
            run_args['iam_role'],
            main_args.spot_price,
            run_args['user_data'],
            bdm,
        )
        _wait_and_tag_instances(main_args, run_args, instances_tag_data, instances)
        spot_client.tag_spot_instance(instances_tag_data)
        print("Spot instance request had been completed, please check to be sure it was fufilled")
    else:
        bdm = _get_bdm(main_args)
        instances = ec2_client.create_instances(
            ImageId=main_args.image_id,
            MinCount=run_args['count'],
            MaxCount=run_args['count'],
            InstanceType=main_args.instance_type,
            SecurityGroups=run_args['security_groups'],
            UserData=run_args['user_data'],
            BlockDeviceMappings=bdm,
            InstanceInitiatedShutdownBehavior='terminate',
            IamInstanceProfile={
                "Name": run_args['iam_role'],
            },
            Placement={
                'AvailabilityZone': main_args.availability_zone,
            },
        )
        _wait_and_tag_instances(main_args, run_args, instances_tag_data, instances)


def parse_args():

    def check_volume_size(value):
        allowed_values = ['120', '200', '500']
        if not value.isdigit() or value not in allowed_values:
            raise argparse.ArgumentTypeError(
                "%s' is not in [%s]." % (
                    str(value),
                    ', '.join(allowed_values),
                )
            )
        return value

    def hostname(value):
        if value != nameify(value):
            raise argparse.ArgumentTypeError(
                "%r is an invalid hostname, only [a-z0-9] and hyphen allowed." % value)
        return value

    parser = argparse.ArgumentParser(
        description="Deploy Regulome on AWS",
    )
    parser.add_argument('-b', '--branch', default=None, help="Git branch or tag")
    parser.add_argument('-n', '--name', type=hostname, help="Instance name")
    parser.add_argument('--dry-run-aws', action='store_true', help="Abort before ec2 requests.")
    parser.add_argument('--check-price', action='store_true', help="Check price on spot instances")
    parser.add_argument('--image-id', default='ami-012af15928e0c2823', help="packer AMI build")
    parser.add_argument('--instance-type', default='t2.medium',
                        help="AWS Instance type")
    parser.add_argument('--profile-name', default=None, help="AWS creds profile")
    parser.add_argument('--spot-instance', action='store_true', help="Launch as spot instance")
    parser.add_argument('--spot-price', default='0.70', help="Set price or keep default price of 0.70")
    parser.add_argument('--volume-size', default=120, type=check_volume_size,
                        help="Size of disk. Allowed values 120, 200, and 500")
    parser.add_argument('--availability-zone', default='us-west-2a',
        help="Set EC2 availabilty zone")
    parser.add_argument('--git-repo', default='https://github.com/ENCODE-DCC/regulome-encoded.git',
            help="Git repo to checkout branches: https://github.com/{user|org}/{repo}.git")
    
    args = parser.parse_args()
    args.role = 'candidate'
    return args


if __name__ == '__main__':
    main()
