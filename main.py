from flask import Flask
from flask import render_template, jsonify
from instance_util import *
  
app = Flask(__name__)


@app.route("/")
def home_view():
	# ec2 = create_ec2_client()
	instance_state, ip = describe_ec2_client()
	return render_template("index.html")

@app.route("/instance_state")
def instance_state():
	instance_state, ip = describe_ec2_client()
	if instance_state == STOPPED or instance_state == SHUTTINGDOWN or instance_state == "stopping":
		return jsonify([instance_state, ip])
	return jsonify([server.state, ip])

@app.route("/start_instance")
def start_instance():
	instance_state, ip = describe_ec2_client()
	if instance_state != STOPPED:
		print("Server is already running")
		return jsonify([])
	response = start_ec2_instance()
	print(response)
	return jsonify(response)

# @app.route("/stop_instance")
# def stop_instance():
# 	instance_state, ip = describe_ec2_client()
# 	if instance_state != "running":
# 		return jsonify([])
# 	response = stop_ec2_instance(ec2)
# 	print(response)
# 	return jsonify(response)

@app.route("/launch_minecraft")
def launch_minecraft():
	print("Starting minecraft")
	if server.state != STARTING:
		return jsonify(['not ok', 401])
	return start_minecraft()


if __name__ == '__main__':
    # Threaded option to enable multiple instances for multiple user access support
	
    app.run()
