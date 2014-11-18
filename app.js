var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');
var url = require('url');

var client;
if (process.env.REDISCLOUD_URL) {
  var redisURL = url.parse(process.env.REDISCLOUD_URL);
  client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
  client.auth(redisURL.auth.split(":")[1]);
} else {
  client = redis.createClient();
}

function checkType() {
  client.type('lineData', function(err, data) {
    if (data != "list" && data != "none") {
      resetData();
    }
  });
}
checkType();

function getData(callback) {
  client.exists('lineData', function(err, data) {
    if (data) {
      client.lrange('lineData', 0, -1, function (err, data) {
        callback(data);
      });
    } else {
      resetData();
      callback([]);
    }
  });
}

function resetData() {
  client.del('lineData');
}

function addData(data) {
  client.rpush('lineData', JSON.stringify(data));
}

app.get('/', function(req, res) {
  res.send('index');
});

io.on('connection', function(socket) {
  getData(function(lineData) {
    for (var i = 0; i < lineData.length; i++) {
      var parsedData = JSON.parse(lineData[i]);
      socket.emit(parsedData[0], parsedData[1]);
    }
  });

  socket.on('erase', function(data) {
    resetData();
    socket.broadcast.emit('erase');
  });

  socket.on('lineTo', function(data) {
    data.id = socket.id;
    addData(['lineTo', data]);
    socket.broadcast.emit('lineTo', data);
  });

  socket.on('moveTo', function(data) {
    data.id = socket.id;
    addData(['moveTo', data]);
    socket.broadcast.emit('moveTo', data);
  });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
  console.log('listening on port: '+port);
});