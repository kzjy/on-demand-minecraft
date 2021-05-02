let start = true

// States of server 
const STOPPED = "stopped"
const RUNNING = "running"
const SHUTTINGDOWN = "shutting-down"
const STARTING = "starting"
const LAUNCHING = "launching"
const ONFIRE = "on fire"

let serverStatus = STOPPED
let serverIP = ''

const getInstanceStatus = () => {
    // setServerState(STOPPED)
    $.ajax({
        url: "/instance_state",
        type: "get",
        success: function(response) {
            console.log(response)
            switch (response[0]) {
                case RUNNING:
                    console.log(response)
                    serverIP = response[1]
                    setServerState(RUNNING)
                    break
                
                case STARTING:
                    setServerState(STARTING)
                    serverIP = response[1]
                    break
                
                case LAUNCHING:
                    setServerState(LAUNCHING)
                    serverIP = response[1]
                    break

                case STOPPED:
                    setServerState(STOPPED)
                    serverIP = ''
                    break

                case SHUTTINGDOWN:
                    setServerState(SHUTTINGDOWN)
                    serverIP = ''
                    break

                default:
                    setServerState(STOPPED)
                    serverIP = ''
            }
        },
        error: function(xhr) {
            console.log(xhr)
        }
    })
}

const setServerState = (state) => {
    serverStatus = state
    toggleButton()
    setServerStatusText()
    setServerProgressBarAndText()
}

const postStartServer = () => {
    getInstanceStatus()

    if (serverStatus == STOPPED) {
        console.log("Start server")

        setServerState(STARTING)

        
        
        $.ajax({
            url: "/start_instance",
            type: "get"
        }).then((res) => {
            if (res[0] == RUNNING) {
                console.log("Instance started, waiting to launching minecraft")

                setServerState(LAUNCHING)

                return $.ajax({
                    url: "/launch_minecraft",
                    type: "get"
                })
            } else {
                console.log('????')
            }
            
        }).then((res) => {
            console.log(res)
            if (res[0] == "ok") {
                // Set start up progress bar

                getInstanceStatus()
                setServerState(RUNNING)
                progressText.textContent = ""

                console.log("Minecraft launched, enjoy")
            } else {
                setServerState(ONFIRE)
                progressText.textContent = "An error has occured while launching minecraft"

                console.log("Minecraft launch failed its doomed")
            }
        }).catch((e) => {
            console.log(e)
        })
    }
    
}


const setServerProgressBarAndText = () => {
    // Set start up progress bar and progress text
    let progressBar = document.getElementById("starting-progress-bar")
    progressBar.style.width = "0%"
    progressBar.style.display = "none"
    progressBar.classList.remove("bg-secondary")

    let progressText = document.getElementById("starting-progress-text")
    progressText.textContent = ""

    switch (serverStatus) {
        case RUNNING:
            progressBar.style.display = "block"
            progressBar.style.width = "100%"
            break 

        case STOPPED:
            break 

        case STARTING:
            progressBar.style.display = "block"
            progressBar.style.width = "10%"
            progressText.textContent = "Progress: Starting AWS EC2 instance"
            break
        
        case LAUNCHING:
            progressBar.style.display = "block"
            progressBar.style.width = "60%"
            progressText.textContent = "Progress: Launching minecraft server"
            break

        case SHUTTINGDOWN:
            progressBar.style.display = "block"
            progressBar.style.width = "60%"
            progressBar.classList.add("bg-secondary")
            progressText.textContent = "Progress: Stopping AWS EC2 instance"
            break

        case ONFIRE:
            progressBar.style.width = "0%"
            progressBar.style.display = "none"
            progressText.textContent = ""
            break
        
        default:
            break
    }

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
            button.append(document.createTextNode("Server is up!"))
            button.classList.add("btn-primary")
            button.disabled = false
            button.onclick = function () {console.log("This does nothing")}
            break 

        case STOPPED:
            button.append(document.createTextNode("Start Server"))
            button.classList.add("btn-secondary")
            button.disabled = false
            button.onclick = postStartServer
            break 

        case STARTING:
            button.append(document.createTextNode("Starting"))
            button.classList.add("btn-primary", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            break
        
        case LAUNCHING:
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
            button.append(document.createTextNode("Server on fire, discord msg me"))
            button.classList.add("btn-danger", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            break
        
        default:
            button.append(document.createTextNode("Server on fire"))
            button.classList.add("btn-danger", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            break
    }
}

const setServerStatusText = () => {
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

        case LAUNCHING:
            text += "Launching"
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

});


