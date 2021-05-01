import boto3
from botocore.exceptions import ClientError

from credentials import ACCESS_ID, ACCESS_KEY

instance_id = 'i-022eb8ac5a823efe7'

ec2 = boto3.client('ec2', 
    region_name='us-west-2',
    aws_access_key_id=ACCESS_ID,
    aws_secret_access_key=ACCESS_KEY)


def create_ec2_client():
    return boto3.client('ec2', 
        region_name='us-west-2',
        aws_access_key_id=ACCESS_ID,
        aws_secret_access_key=ACCESS_KEY)

def describe_ec2_client(client):
    response = ec2_client.describe_instance_status(InstanceIds=[instance_id])
    if response['InstanceStatuses'][0]['InstanceState']['Name'] == 'running':
        print('It is running')
    return response


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
