const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('./public_html/game/'));
app.use(express.static('./public_html/libs'));
app.use(express.static('./public_html/game/v3'));
app.get('/',function(req, res) {
    res.sendFile(__dirname + './public_html/game/v3/index.html');
});
 const port = process.env.PORT||5501
io.sockets.on('connection', function(socket){
	socket.userData = { x:0, y:0, z:0, heading:0 }; //Default values;
 
	console.log(`${socket.id} connected`);
	socket.emit('setId', { id:socket.id });
	
    socket.on('disconnect', function(){
		socket.broadcast.emit('deletePlayer', { id: socket.id });
    });	
	
	socket.on('init', function(data){
		console.log(`socket.init ${data.model}`);
		socket.userData.model = data.model;
		socket.userData.colour = data.colour;
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb,
		socket.userData.action = "Idle";

		console.log(`socket.init ${data.colour}`);
	});
	
	socket.on('update', function(data){
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb,
		socket.userData.action = data.action;
	});
	
	socket.on('chat message', function(data){
		console.log(`chat message:${data.id} ${data.message}`);
		io.to(data.id).emit('chat message', { id: socket.id, message: data.message });
	});

	// rtc

	// convenience function to log server messages on the client
	function log() {
		var array = ['Message from server:'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

	socket.on('message', function(message) {
		log('Client said: ', message);
		// for a real app, would be room-only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function(room) {
		log('Received request to create or join room ' + room);
		
		var clientsInRoom = io.sockets.adapter.rooms[room];
		var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
		log('Room ' + room + ' now has ' + numClients + ' client(s)');
		
		if (numClients === 0) {
			socket.join(room);
			log('Client ID ' + socket.id + ' created room ' + room);
			socket.emit('created', room, socket.id);
			
		} else if (numClients >= 1) {
			log('Client ID ' + socket.id + ' joined room ' + room);
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room, socket.id);
			io.sockets.in(room).emit('ready');
		} else { // no limit for max no. of users
			socket.emit('full', room);
		}
	});

	socket.on('ipaddr', function() {
		var ifaces = os.networkInterfaces();
		for (var dev in ifaces) {
			ifaces[dev].forEach(function(details) {
				if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
					socket.emit('ipaddr', details.address);
				}
			});
		}
	});

	socket.on('bye', function(){
		console.log('received bye');
	});
});

http.listen(port, function(){
  console.log('listening on *:5501');
});

setInterval(function(){
	const nsp = io.of('/');
    let pack = [];
	
    for(let id in io.sockets.sockets){
        const socket = nsp.connected[id];
		//Only push sockets that have been initialised
		if (socket.userData.model!==undefined){
			pack.push({
				id: socket.id,
				model: socket.userData.model,
				colour: socket.userData.colour,
				x: socket.userData.x,
				y: socket.userData.y,
				z: socket.userData.z,
				heading: socket.userData.heading,
				pb: socket.userData.pb,
				action: socket.userData.action
			});    
		}
    }
	if (pack.length>0) io.emit('remoteData', pack);
}, 40);