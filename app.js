var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var lineData = [];

app.get('/', function(req, res) {
  res.send('index');
});

io.on('connection', function(socket) {
  for (var i = 0; i < lineData.length; i++) {
    socket.emit(lineData[i][0], lineData[i][1]);
  }

  socket.on('erase', function(data) {
    lineData = [];
    socket.broadcast.emit('erase');
  });

  socket.on('lineTo', function(data) {
    data.id = socket.id;
    lineData.push(['lineTo', data]);
    socket.broadcast.emit('lineTo', data);
  });

  socket.on('moveTo', function(data) {
    data.id = socket.id;
    lineData.push(['moveTo', data]);
    socket.broadcast.emit('moveTo', data);
  });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
  console.log('listening on port: '+port);
});