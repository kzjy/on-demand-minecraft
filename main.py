from flask import Flask
  
app = Flask(__name__)
  
@app.route("/")
def home_view():
        return "<h1>Welcome to the swamp</h1>"

if __name__ == '__main__':
    # Threaded option to enable multiple instances for multiple user access support
    app.run()
