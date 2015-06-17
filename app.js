var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');
var url = require('url');

// Set up Heroku Redis
var client;
if (process.env.REDIS_URL) {
  var redisURL = url.parse(process.env.REDIS_URL);
  client = redis.createClient(redisURL.port, redisURL.hostname);
  client.auth(redisURL.auth.split(":")[1]);
} else {
  client = redis.createClient();
}

var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('listening on port: '+port);
});

function getData(room, callback) {
  client.exists('lineData-'+room, function(err, data) {
    if (data) {
      client.lrange('lineData-'+room, 0, -1, function (err, data) {
        for (var i = 0; i < data.length; i++) {
          data[i] = JSON.parse(data[i]);
        }
        callback(data);
      });
    } else {
      resetData(room);
      callback([]);
    }
  });
}

function resetData(room) {
  client.del('lineData-'+room);
}

function addData(room, data) {
  client.rpush('lineData-'+room, JSON.stringify(data));
}

app.get('/', function(req, res) {
  res.send('This server only does sockets.');
});

io.on('connection', function(socket) {
  socket.on('getData', function() {
    var room = socket.rooms[0];
    getData(room, function(lineData) {
      socket.emit('batch', lineData);
    });
  });

  socket.on('erase', function(data) {
    var room = socket.rooms[0];
    resetData(room);
    socket.broadcast.emit('erase');
  });

  socket.on('lineTo', function(data) {
    var room = socket.rooms[0];
    data.id = socket.id;
    addData(room, ['lineTo', data]);
    io.to(room).emit('lineTo', data);
  });

  socket.on('moveTo', function(data) {
    var room = socket.rooms[0];
    data.id = socket.id;
    addData(room, ['moveTo', data]);
    io.to(room).emit('moveTo', data);
  });

  socket.on('joinRoom', function(roomName) {
    if (socket.rooms.length > 0) {
      for (var i = 0; i < socket.rooms.length; i++) {
        socket.leave(socket.rooms[i]);
      }
    }
    socket.join(roomName);
  });
});
