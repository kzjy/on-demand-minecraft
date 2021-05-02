import boto3
import os
import paramiko
import io
import time
from botocore.exceptions import ClientError
from flask import jsonify
from mcstatus import MinecraftServer


STOPPED = "stopped"
RUNNING = "running"
SHUTTINGDOWN = "shutting-down"
STARTING = "starting"
LAUNCHING = "launching"
ONFIRE = "on fire"

class Server():
	def __init__(self):
		self.state = STOPPED


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

server = Server()

def create_ec2_client():
    return boto3.client('ec2', 
        region_name='us-west-2',
        aws_access_key_id=ACCESS_ID,
        aws_secret_access_key=ACCESS_KEY)

def describe_ec2_client():
    response = ec2.describe_instances(InstanceIds=[instance_id])
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
    print(current_instance_state)

    if current_instance_state == 'stopped':
        server.state = STOPPED
        print("setting state to {}".format(server.state))
        return current_instance_state, ''
    elif current_instance_state == 'running' or current_instance_state == 'pending':
        if server.state == STOPPED:
            server.state = RUNNING
            print("setting state to {}".format(server.state))
        return current_instance_state, instance['PublicIpAddress']
    elif current_instance_state == "stopping" or "shutting-down":
        server.state = SHUTTINGDOWN
        print("setting state to {}".format(server.state))
        return 'shutting-down', ''
    
    return ONFIRE, ''


def start_ec2_instance():
    # Do a dryrun first to verify permissions
    try:
        ec2.start_instances(InstanceIds=[instance_id], DryRun=True)
    except ClientError as e:
        if 'DryRunOperation' not in str(e):
            raise

    # Dry run succeeded, run start_instances without dryrun
    try:
        response = ec2.start_instances(InstanceIds=[instance_id], DryRun=False)

        # Wait for running
        server.state = STARTING
        print("setting state to {}".format(server.state))
        print("Waiting for instance running")
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        print('Waiting for status ok')
        waiter = ec2.get_waiter('instance_status_ok')
        waiter.wait(InstanceIds=[instance_id])

        state, ip = describe_ec2_client()
        return [state, ip]

    except ClientError as e:
        server.state = STOPPED
        return e


def start_minecraft():
    launched = False
    num_attempts = 0
    server.state = LAUNCHING
    print("setting state to {}".format(server.state))
    state, ip = describe_ec2_client()
    while not launched and num_attempts < 3:
        try:
            state, ip = describe_ec2_client()
            print(state, server.state)
            if state == "running":
                command = "screen -S minecraft -d -m sudo java -Xmx4G -Xms2G -jar /home/ubuntu/server.jar nogui"

                sshClient = paramiko.SSHClient()
                sshClient.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                sshClient.connect(hostname=ip, username="ubuntu", pkey=SSH_KEY)
                        
                stdin, stdout, stderr = sshClient.exec_command(command)

                sshClient.close()
                launched = True
                time.sleep(15)
            else:
                print("somehow state isnt running")
                raise Exception
            
        except Exception as e:
            print('Error running server commands, retrying in 1 minute')
            print(e)
            num_attempts += 1
            time.sleep(60)
    
    if launched:
        server.state = RUNNING
        print("setting state to {}".format(server.state))
        return jsonify(['ok', 200])

    server.state = ONFIRE
    print("setting state to {}".format(server.state))
    return jsonify(['not ok', 400])
        