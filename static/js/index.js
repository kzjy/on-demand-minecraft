let start = true

// States of server 
const STOPPED = "stopped"
const STARTING = "starting"
const INSTANCE_UP = "instance-up"
const LAUNCHING = "launching"
const RUNNING = "running"
const SHUTTINGDOWN = "shutting-down"
const ONFIRE = "on fire"

let serverStatus = STOPPED
let serverMetadata = {}
let serverIP = ''


const getServerStatus = () => {
    return $.ajax({
        url: "/get_server_status",
        type: "get"})
}

const updateServerStatus = () => {
    getServerStatus().then((response) => {
        if ('Ip' in response) {
            serverIP = response['Ip']
        }
        if ('Server' in response) {
            serverMetadata = response['Server']
        }
        if ([STOPPED, STARTING, INSTANCE_UP, LAUNCHING, RUNNING, SHUTTINGDOWN, ONFIRE].includes(response['State'])) {
            // console.log(response)
            setServerState(response['State'])
        }
    }).catch((e) => {
        console.log(e)
    })
}

const setServerState = (state) => {
    serverStatus = state
    toggleButton()
    setServerStatusText()
    setServerProgressBarAndText()
}

const startEC2Server = () => {
    getServerStatus().then((response) => {
        if (response['State'] == STOPPED) {
            setServerState(STARTING)
            return $.ajax({
                url: "/start_ec2_instance",
                type: "post"
            })
        }
    }).then((response) => {
        console.log("started ec2", response)
        setServerState(INSTANCE_UP)
    }).catch((e) => {
        console.log(e)
    })
}

const startMinecraftServer = () => {
    getServerStatus().then((response) => {
        if (response['State'] == INSTANCE_UP) {
            setServerState(LAUNCHING)
            return $.ajax({
                url: "/start_minecraft_server",
                type: "post"
            })
        }
    }).then((response) => {
        console.log("started minecraft", response)
        setServerState(RUNNING)
    }).catch((e) => {
        console.log(e)
    })

    // updateServerStatus()

    // if (serverStatus == INSTANCE_UP) {
    //     console.log("Starting minecraft server")

    //     setServerState(LAUNCHING)

    //     $.ajax({
    //         url: "/start_minecraft_server",
    //         type: "post"
    //     }).then((res) => {
    //         console.log("Launching minecraft")
    //         setServerState(RUNNING)
            
    //     }).catch((e) => {
    //         console.log(e)
    //     })
    // }
    
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
        
        case INSTANCE_UP:
            progressBar.style.display = "block"
            progressBar.style.width = "60%"
            progressText.textContent = ""
            break
        
        case LAUNCHING:
            progressBar.style.display = "block"
            progressBar.style.width = "80%"
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
    const attributes = ["btn-danger", "btn-primary", 'btn-secondary', 'btn-info', 'disabled']
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
            button.append(document.createTextNode("Start EC2 Instance"))
            button.classList.add("btn-secondary")
            button.disabled = false
            button.onclick = startEC2Server
            break 

        case STARTING:
            button.append(document.createTextNode("Starting EC2 Instance"))
            button.classList.add("btn-secondary", "disabled")
            button.disabled = true
            button.onclick = function () {console.log("This does nothing")}
            break
        
        case INSTANCE_UP:
            button.append(document.createTextNode("Start Minecraft Server"))
            button.classList.add("btn-info")
            button.disabled = false
            button.onclick = startMinecraftServer
            break
        
        case LAUNCHING:
            button.append(document.createTextNode("Starting Minecraft Server"))
            button.classList.add("btn-info", "disabled")
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

            let serverIPText = document.createElement("h4")
            serverIPText.append(document.createTextNode("Server IP: " + serverIP))
            serverStatusText.append(serverIPText)

            serverStatusText.append(document.createElement('br'))

            let metadataDiv = document.createElement('div')
            metadataDiv.classList.add('d-flex', 'flex-row')
            
            Object.keys(serverMetadata).map(function(key, index) {
                if (key != 'Players') {
                    let value = serverMetadata[key];
                    let serverMetadataItem = document.createElement("p")
                    serverMetadataItem.classList.add('server-metadata-item')
                    serverMetadataItem.append(document.createTextNode(key + ": " + value))
                    metadataDiv.append(serverMetadataItem)
                }
            });
            
            serverStatusText.append(metadataDiv)

            let serverMetadataItem = document.createElement("p")
            serverMetadataItem.classList.add('server-metadata-item')
            serverMetadataItem.append(document.createTextNode('Players' + ": " + serverMetadata.Players))
            serverStatusText.append(serverMetadataItem)

            
            break
        
        case STOPPED:
            text += "Offline"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)
            
            break
        
        case STARTING:
            text += "Starting EC2 Instance"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)

            break
        
        case INSTANCE_UP:
            text += "EC2 Instance Online"
            statusHeader.append(document.createTextNode(text))
            serverStatusText.append(statusHeader)

            let instance_ip = document.createElement("h4")
            instance_ip.append(document.createTextNode("Instance IP: " + serverIP))
            serverStatusText.append(instance_ip)

            break

        case LAUNCHING:
            text += "Launching Minecraft Server"
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


$('document').ready(function(){
    updateServerStatus()
    setInterval(function(){
        // console.log("updaing status")
        updateServerStatus()
        }, 10000);
});


