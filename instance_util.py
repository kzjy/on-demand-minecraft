import boto3
import os
import paramiko
import io
from botocore.exceptions import ClientError



ACCESS_ID, ACCESS_KEY, SSH_KEY = None, None, None

if 'IS_ON_HEROKU' in os.environ:
    ACCESS_ID = os.environ['ACCESS_ID']
    ACCESS_KEY = os.environ['ACCESS_KEY']
    temp_file_io = io.StringIO(os.environ['SSH_KEY'])
    SSH_KEY = paramiko.RSAKey.from_private_key(temp_file_io)

else:
    import credentials
    ACCESS_ID = credentials.ACCESS_ID
    ACCESS_KEY = credentials.ACCESS_KEY
    key = open("minecraftkey.cer", 'r').read()
    temp_file_io = io.StringIO(key)
    SSH_KEY = paramiko.RSAKey.from_private_key(temp_file_io)


instance_id = 'i-022eb8ac5a823efe7'

ec2 = boto3.client('ec2', 
    region_name='us-west-2',
    aws_access_key_id=ACCESS_ID,
    aws_secret_access_key=ACCESS_KEY)

sshClient = paramiko.SSHClient()
sshClient.set_missing_host_key_policy(paramiko.AutoAddPolicy())


def create_ec2_client():
    return boto3.client('ec2', 
        region_name='us-west-2',
        aws_access_key_id=ACCESS_ID,
        aws_secret_access_key=ACCESS_KEY)

def describe_ec2_client(client):
    response = client.describe_instances(InstanceIds=[instance_id])
    reservations = response['Reservations']
    reservation = reservations[0]
    instances = reservation['Instances']

    # No instances running
    if len(instances) == 0:
        return 'on fire', ''

    # Get first instance
    instance = instances[0]
    state = instance['State']
    current_instance_state = state['Name']
    if current_instance_state == 'stopped' or current_instance_state == 'shutting-down':
        return current_instance_state, ''
    elif current_instance_state == 'running':
        return current_instance_state, instance['PublicIpAddress']


def stop_ec2_instance(client):
    # Do a dryrun first to verify permissions
    try:
        ec2.stop_instances(InstanceIds=[instance_id], DryRun=True)
    except ClientError as e:
        if 'DryRunOperation' not in str(e):
            raise

    # Dry run succeeded, call stop_instances without dryrun
    try:
        response = ec2.stop_instances(InstanceIds=[instance_id], DryRun=False)
        return response
    except ClientError as e:
        return e


def start_ec2_instance(client):
    # Do a dryrun first to verify permissions
    try:
        ec2.start_instances(InstanceIds=[instance_id], DryRun=True)
    except ClientError as e:
        if 'DryRunOperation' not in str(e):
            raise

    # Dry run succeeded, run start_instances without dryrun
    try:
        response = ec2.start_instances(InstanceIds=[instance_id], DryRun=False)
        return response
    except ClientError as e:
        return e


def start_minecraft():
    try:
        sshClient.connect(hostname=instanceIp, username="ubuntu", pkey=key)
        
        stdin, stdout, stderr = sshClient.exec_command("screen -dmS minecraft bash -c 'sudo java " + Config.MEMORY_ALLOCATION + "-jar server.jar nogui'")
        print("COMMAND EXECUTED")
       
        sshClient.close()

    except:
        print('Error running server commands')