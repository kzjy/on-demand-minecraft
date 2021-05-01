from flask import Flask
from flask import render_template, jsonify
from instance_util import *
  
app = Flask(__name__)
  
@app.route("/")
def home_view():
	# ec2 = create_ec2_client()
	return render_template("index.html")

@app.route("/instance_state")
def instance_state():
	instance_state, ip = describe_ec2_client(ec2)
	return jsonify([instance_state, ip])

@app.route("/start_instance")
def start_instance():
	instance_state, ip = describe_ec2_client(ec2)
	if instance_state != "stopped":
		return jsonify([])
	response = start_ec2_instance(ec2)
	print(response)
	return jsonify(response)

@app.route("/stop_instance")
def stop_instance():
	instance_state, ip = describe_ec2_client(ec2)
	if instance_state != "running":
		return jsonify([])
	response = stop_ec2_instance(ec2)
	print(response)
	return jsonify(response)

# @app.route("/launch_minecraft")
# def launch_minecraft():






if __name__ == '__main__':
    # Threaded option to enable multiple instances for multiple user access support
    app.run()
