let start = true

// States of server 
const STOPPED = "stopped"
const RUNNING = "running"
const SHUTTINGDOWN = "shutting-down"
const STARTING = "starting"
const ONFIRE = "on fire"

let serverStatus = STOPPED
let serverIP = ''

const getInstanceStatus = () => {
    // return serverStatus
    if (!start){
        serverStatus = RUNNING
    } else {
        serverStatus = STOPPED
    }
    start = !start
    // $.ajax({
    //     url: "/instance_state",
    //     type: "get",
    //     success: function(response) {
            
    //     },
    //     error: function(xhr) {
    //         console.log(xhr)
    //     }
    // });
}

const setServerState = (state) => {
    serverStatus = state
    toggleButton()
    setserverStatusText()
}

const postStartServer = () => {
    console.log("Start server")

    setServerState(STARTING)
    
    // Replace with actual code to start server
    let s = sleep(3000)
    s.then((res) => {
        console.log("resolved start")
        setServerState(RUNNING)
    }, (error) => {
        console.log("resolved error start")
        setServerState(ONFIRE)
    })
    // ========================================
    
}

const postStopServer = () => {
    console.log("Stop server")
    setServerState(SHUTTINGDOWN)

    // Replace with actual code to start server
    let s = sleep(3000)
    s.then((res) => {
        console.log("resolved stop")
        setServerState(STOPPED)
    }, (error) => {
        console.log("resolved error stop")
        setServerState(ONFIRE)
    })
    // ========================================

}


const toggleButton = () => {
    let button = document.getElementsByClassName("control-button")[0]
    button.innerHTML = ''

    // Remove color/disabled attributes 
    const attributes = ["btn-danger", "btn-primary", 'btn-secondary', 'disabled']
    attributes.map(function (x) {
        button.classList.remove(x)
    })

    switch (serverStatus) {
        case RUNNING:
            button.append(document.createTextNode("Stop Server"))
            button.classList.add("btn-secondary")
            button.disabled = false
            button.onclick = postStopServer
            break 

        case STOPPED:
            button.append(document.createTextNode("Start Server"))
            button.classList.add("btn-primary")
            button.disabled = false
            button.onclick = postStartServer
            break 

        case STARTING:
            button.append(document.createTextNode("Starting"))
            button.classList.add("btn-primary", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            break

        case SHUTTINGDOWN:
            button.append(document.createTextNode("Stopping"))
            button.classList.add("btn-secondary", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            break

        case ONFIRE:
            button.append(document.createTextNode("Server on fire"))
            button.classList.add("btn-danger", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            break
        
        default:
            button.append(document.createTextNode("Server on fire"))
            button.classList.add("btn-danger", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            

    }
}

const setserverStatusText = () => {
    let serverStatusText = document.getElementsByClassName("server-status")[0]
    serverStatusText.innerHTML = ''

    let text = "Server Status:         "
    let statusHeader = document.createElement("h4")
    switch (serverStatus) {
        case RUNNING:
            text += "Online"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)

            let server_ip = document.createElement("h4")
            server_ip.append(document.createTextNode("Server IP: " + serverIP))
            serverStatusText.append(server_ip)
            break
        
        case STOPPED:
            text += "Offline"
            
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)
            break
        
        case STARTING:
            text += "Starting"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)
            break

        case SHUTTINGDOWN:
            text += "Shutting Down"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)
            break
        
        case ONFIRE:
            text += "ON FIRE"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)
            break
        
        default:
            text += "ON FIRE"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)

    }

}

const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}

$('document').ready(function(){
    getInstanceStatus()
    setserverStatusText()
    toggleButton()

});


