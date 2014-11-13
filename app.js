var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var lineData = [];

app.get('/', function(req, res){
  res.send('index');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('wipe', function(data) {
    console.log('wipe');
    lineData = [];
    socket.broadcast.emit('wipe');
  });

  socket.on('lineTo', function(data) {
    console.log(data);
    lineData.push(data);
    socket.broadcast.emit('lineTo', data);
  });

  socket.on('moveTo', function(data) {
    console.log(data);
    lineData.push(data);
    socket.broadcast.emit('moveTo', data);
  });
});

http.listen(9001, function(){
  console.log('listening on *:9001');
});