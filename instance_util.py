import boto3
import os
import paramiko
import io
import time
from botocore.exceptions import ClientError
from flask import jsonify
from mcstatus import MinecraftServer


STOPPED = "stopped"
STARTING = "starting"
INSTANCE_UP = "instance-up"
LAUNCHING = "launching"
RUNNING = "running"
SHUTTINGDOWN = "shutting-down"
ONFIRE = "on fire"


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


def summarize_ec2_instance():
    response = ec2.describe_instances(InstanceIds=[instance_id])
    reservations = response['Reservations']
    reservation = reservations[0]
    instances = reservation['Instances']

    # No instances running
    if len(instances) == 0:
        return ONFIRE, ''

    # Get first instance
    instance = instances[0]
    state = instance['State']
    current_instance_state = state['Name']
    # print(current_instance_state)

    if current_instance_state == STOPPED:
        return current_instance_state, ''
    elif current_instance_state == RUNNING:
        return RUNNING, instance['PublicIpAddress']
    elif current_instance_state == 'pending':
        return STARTING, ''
    elif current_instance_state == SHUTTINGDOWN or 'stopping':
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

        print("Waiting for instance running")
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        print('Waiting for status ok')
        waiter = ec2.get_waiter('instance_status_ok')
        waiter.wait(InstanceIds=[instance_id])

        print('Status ok')
        state, ip = summarize_ec2_instance()
        return [state, ip]

    except ClientError as e:
        
        return e


def get_status():
    instance_state, ip = summarize_ec2_instance()
    minecraft_server_status = check_minecraft_status(ip)

    # Minecraft server is up and running
    if len(minecraft_server_status.items()) > 0:
        return {'State': RUNNING, 'Ip': ip, 'Server': minecraft_server_status}
    
    # EC2 Instance is up but minecraft server isnt online
    if instance_state == RUNNING:
        screen_is_on = check_minecraft_screen_is_on(ip)
        if screen_is_on:
            return {'State': LAUNCHING, 'Ip': ip}
        
        instance_status_ok = ec2_instance_status_ok()
        if instance_status_ok:
            return {'State': INSTANCE_UP, 'Ip': ip}

        return {'State': STARTING}
    
    # EC2 Instance shutting down
    if instance_state == SHUTTINGDOWN:
        return {'State': SHUTTINGDOWN}
    
    # EC2 Instnace stopped
    if instance_state == STOPPED:
        return {'State': STOPPED}
    
    # EC2 Instance pending
    if instance_state == STARTING:
        return {'State': STARTING}

    # Unknown error ?
    return {'State': ONFIRE}


def ec2_instance_status_ok():
    res = ec2.describe_instance_status(InstanceIds=[instance_id])
    # double check 2/2 status
    # print(res.keys())
    # print(res)
    instance_status = res['InstanceStatuses'][0]['InstanceStatus']['Status']
    system_status = res['InstanceStatuses'][0]['SystemStatus']['Status']

    if str(instance_status) == 'ok' and str(system_status) == 'ok':
        return True
    
    return False


def check_minecraft_screen_is_on(ip):
    try:
        command = "screen -list | grep 'minecraft'"
        sshClient = paramiko.SSHClient()

        sshClient.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        sshClient.connect(hostname=ip, username="ubuntu", pkey=SSH_KEY)
        
        stdin, stdout, stderr = sshClient.exec_command(command)
        screens = stdout.readlines()
        sshClient.close()

        if len(screens) == 1:
            return True
    except:
        return False
    
    return False


def check_minecraft_status(ip):
    if ip != '':
        try:
            server = MinecraftServer.lookup(ip)
            status = server.status()
            # print(status)
            # print("The server has {0} players and replied in {1} ms".format(status.players.online, status.latency))
            # print(status.version.name, status.description)
            
            query = server.query()
            # print(query.motd, query.software.plugins, query.players.names, query.software.version)
            # print("The server has the following players online: {0}".format(", ".join(query.players.names)))

            return {'Num Players': status.players.online, 'Players': ", ".join(query.players.names), 
                    'Motd': query.motd, 'Version': status.version.name, 'Description': status.description['text'], 
                    'Latency': '{}ms'.format(status.latency)}

        except Exception as e:
            print("Error while checking for minecraft status", e)

    return {}

def start_minecraft():
    launched = False
    num_attempts = 0

    state, ip = summarize_ec2_instance()
    while not launched and num_attempts < 3:
        try:
            state, ip = summarize_ec2_instance()
            
            if state == "running":
                command = "screen -S minecraft -d -m sudo java -Xmx4G -Xms2G -jar /home/ubuntu/server.jar nogui"

                sshClient = paramiko.SSHClient()
                sshClient.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                sshClient.connect(hostname=ip, username="ubuntu", pkey=SSH_KEY)
                        
                stdin, stdout, stderr = sshClient.exec_command(command)

                sshClient.close()
                launched = True

            else:
                raise Exception
                print("somehow state isnt running")
            
        except Exception as e:
            print("Error while starting minecraft server", e)
            num_attempts += 1
            time.sleep(5)
    
    minecraft_status = check_minecraft_status(ip)
    while len(minecraft_status.items()) == 0:
        time.sleep(2)

    if launched:
        return {'State': 'Launched'}
    return {'State': 'Error on launch'}
        