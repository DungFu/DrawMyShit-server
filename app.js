var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.send('index');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('test', function(data) {
    console.log(data);
  });
});

http.listen(9001, function(){
  console.log('listening on *:9001');
});