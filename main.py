from flask import Flask
from flask import render_template, jsonify
from instance_util import *
  
app = Flask(__name__)


@app.route("/")
def home_view():
	return render_template("index.html")

@app.route('/get_server_status')
def get_server_status():
	res = get_status()
	print(res)
	return jsonify(res)

@app.route("/start_ec2_instance", methods = ['POST'])
def start_instance():
	current_instance_status = get_status()
	if current_instance_status['State'] != STOPPED:
		print("Server is already running")
		return jsonify([])

	response = start_ec2_instance()
	print(response)
	return jsonify(response)

@app.route("/start_minecraft_server", methods = ['POST'])
def start_minecraft_server():
	print("Starting minecraft")
	return start_minecraft()



if __name__ == '__main__':
    # Threaded option to enable multiple instances for multiple user access support
	
    app.run()
