let start = true
const getInstanceStatus = () => {
    $.ajax({
        url: "/instance_state",
        type: "get",
        success: function(response) {
            if (!start){
                response[0] = "stopped"
            } else {
                response[0] = "running"
            }
            start = !start
            setServerStatusText(response[0], response[1])
            toggleButton(response[0])
        },
        error: function(xhr) {
            console.log(xhr)
        }
    });
}

const postStartServer = () => {
    console.log("Start server")
    getInstanceStatus()
}

const postStopServer = () => {
    console.log("Stop server")
    getInstanceStatus()
}

const toggleButton = (status) => {
    let button = document.getElementsByClassName("control-button")[0]
    button.innerHTML = ''
    if (status == "running") {
        button.append(document.createTextNode("Stop Server"))
        button.classList.remove("btn-danger")
        button.classList.remove("btn-primary")
        button.classList.add("btn-secondary")
        button.onclick = postStopServer
    } else if (status == "stopped") {
        button.append(document.createTextNode("Start Server"))
        button.classList.remove("btn-danger")
        button.classList.add("btn-primary")
        button.classList.remove("btn-secondary")
        button.onclick = postStartServer
    } else {
        button.append(document.createTextNode("Error, Message me on discord"))
        button.classList.add("btn-danger")
        button.classList.remove("btn-primary")
        button.classList.remove("btn-secondary")
        button.onclick = function() {console.log("this does nothing")}
    }
}

const setServerStatusText = (status, ip) => {
    let serverStatus = document.getElementsByClassName("server-status")[0]
    serverStatus.innerHTML = ''

    let text = "Server Status:         "
    if (status == "running") {
        text += "Online"
        let header = document.createElement("h4")
        header.append(document.createTextNode(text))
        serverStatus.append(header)

        let server_ip = document.createElement("h4")
        server_ip.append(document.createTextNode("Server IP: " + ip))
        serverStatus.append(server_ip)
    } else if (status == "stopped") {
        text += "Offline"
        let header = document.createElement("h4")
        header.append(document.createTextNode(text))
        serverStatus.append(header)
    } else if (status == "shutting-down") {
        text += "Offline"
        let header = document.createElement("h4")
        header.append(document.createTextNode(text))
        serverStatus.append(header)
    } else {
        text += "ON FIRE"
        let header = document.createElement("h4")
        header.append(document.createTextNode(text))
        serverStatus.append(header)
    } 
}

$('document').ready(function(){
    getInstanceStatus()

});


