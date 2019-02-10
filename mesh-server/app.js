var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mqtt = require('mqtt');
const { Observable, Subject, ReplaySubject, from, of, interval } = require('rxjs');
const { map, take, filter, switchMap } = require('rxjs/operators');

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public' ));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(client) {
    client.on('join', function(data) {
        console.log(data);
    });

    client.on('mouse-click',
      function(index) {
        var data = testdata[index % testdata.length];
        var message = JSON.stringify(data);
        socketClient.emit('mesh-data', message);
      }
    );
});



var options = {
  host: 'your-mqtt-server',
  port: 1883,
  username: 'your-mqtt-username',
  password: 'your-mqtt-password'
}

var mqttClient  = mqtt.connect(options)

mqttClient.on('connect', function () {
  mqttClient.subscribe('mesh_gateway/data', function (err) {
    if (!err) {
      console.log("successfully subscribed to topic");
    } else {
      console.log("failed to subscrib to topic");
    }
  })
})

mqttClient.on('message', function (topic, message) {
  console.log(message.toString())
  io.sockets.emit('mesh-data', message.toString());
})

/*
var testdata = [
  {"2": [{"n":1,"r":-44},{"n":255,"r":0},{"n":3,"r":-13}]},
  {"1": [{"n":255,"r":0},{"n":0,"r":0},{"n":2,"r":0}]},
  {"3": [{"n":2,"r":0},{"n":2,"r":-24},{"n":255,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":0,"r":0},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"3": [{"n":2,"r":0},{"n":2,"r":-24},{"n":255,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-54},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-55},{"n":2,"r":0}]},
  {"2": [{"n":0,"r":0},{"n":255,"r":0},{"n":3,"r":-27}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-54},{"n":2,"r":0}]},
  {"2": [{"n":1,"r":-43},{"n":255,"r":0},{"n":0,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-53},{"n":0,"r":0}]},
  {"2": [{"n":1,"r":-43},{"n":255,"r":0},{"n":3,"r":-27}]},
  {"3": [{"n":0,"r":0},{"n":0,"r":-27},{"n":255,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-54},{"n":2,"r":0}]},
  {"2": [{"n":1,"r":-43},{"n":255,"r":0},{"n":3,"r":-26}]},
  {"3": [{"n":2,"r":0},{"n":2,"r":-12},{"n":255,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-53},{"n":2,"r":0}]},
  {"2": [{"n":1,"r":-43},{"n":255,"r":0},{"n":3,"r":-26}]},
  {"3": [{"n":2,"r":0},{"n":2,"r":-12},{"n":255,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-51},{"n":2,"r":0}]},
  {"2": [{"n":1,"r":-42},{"n":255,"r":0},{"n":3,"r":-26}]},
  {"3": [{"n":2,"r":0},{"n":2,"r":-12},{"n":255,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-42},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-53},{"n":2,"r":0}]},
  {"2": [{"n":1,"r":-41},{"n":255,"r":0},{"n":3,"r":-26}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-41},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-50},{"n":2,"r":0}]},
  {"2": [{"n":1,"r":-42},{"n":255,"r":0},{"n":3,"r":-15}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-41},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-41},{"n":0,"r":0}]},
  {"2": [{"n":0,"r":0},{"n":255,"r":0},{"n":3,"r":-26}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":0,"r":0}]},
  {"2": [{"n":1,"r":-54},{"n":255,"r":0},{"n":3,"r":-26}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-42},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":2,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-43},{"n":0,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-54},{"n":0,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-54},{"n":0,"r":0}]},
  {"2": [{"n":1,"r":-41},{"n":255,"r":0},{"n":0,"r":0}]},
  {"3": [{"n":2,"r":0},{"n":2,"r":-24},{"n":255,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-41},{"n":0,"r":0}]},
  {"1": [{"n":255,"r":0},{"n":2,"r":-52},{"n":2,"r":0}]},
  {"3": [{"n":2,"r":0},{"n":2,"r":-24},{"n":255,"r":0}]}
];


var source = interval(1000).pipe(map(i => JSON.stringify(testdata[i % testdata.length])))
  .subscribe(message => {
    console.log(message);
    if (socketClient) {
      socketClient.emit('mesh-data', message.toString());
    } else {
      console.log("no socketClient");
    }
  });
*/

server.listen(4200);
