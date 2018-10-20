# LoRa Mesh Networking

This project implements the components of a system that demonstrates mesh networking between LoRa nodes and a way to visualize the network on a web page. For full details of the project, see the [full project writeup on the Project Lab blog](https://nootropicdesign.com/projectlab/2018/10/20/lora-mesh-networking/).

Nodes in the network are Arduino-compatible boards with a LoRa tranceiver. For example, [Moteino](https://lowpowerlab.com/guide/moteino/lora-support/) boards.

There are several  components of this project:

### SetNodeId

Arduino sketch to set the node's ID in EEPROM so that every node can have the same source code (without hard-coding the node ID). This is a one-time process for each node. Set the node ID in this sketch then upload to a node (e.g. a Moteino). When it runs it saves the node ID in EEPROM. Then you can load the LoRaMesh sketch to the node.

### LoRaMesh

Arduino sketch that attempts to talk to all other nodes in the mesh. Each node sends its routing information to every other node. The process of sending data and receiving acknowledgements lets a node determine which nodes it can successfully communicate with directly. This is how each node builds up it's routing table. You must set N_NODES to the max number of nodes in your mesh.

Dependencies:

* [RadioHead library](http://www.airspayce.com/mikem/arduino/RadioHead/)


### Gateway

ESP8266 Arduino sketch that talks to a connected LoRa node via Serial (node number 1 in the mesh) and publishes mesh routing information to an MQTT topic. Node 1 in the mesh will eventually receive routing info from every other node.

Dependencies:

* [PubSubClient](https://github.com/knolleary/pubsubclient)


### mesh-server

Node.js server provides a web visualization of the mesh. Runs on port 4200. Install with `npm install`. The server subscribes to the MQTT topic to receive routing info about nodes. This server sends the received routing info to the web client using Socket.IO. The web client uses p5.js to draw a representation of the mesh based on the routing information received from each node.

Dependencies (install with `npm install`)

* express
* jquery
* mqtt
* socket.io
* rxjs
* p5




