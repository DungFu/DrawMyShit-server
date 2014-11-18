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

function getData(callback) {
  client.get('lineData', function (err, data) {
    if (data === null) {
      setData([]);
      callback([]);
    } else {
      callback(JSON.parse(data));
    }
  });
}

function setData(data) {
  client.set('lineData', JSON.stringify(data));
}

app.get('/', function(req, res) {
  res.send('index');
});

io.on('connection', function(socket) {
  getData(function(lineData) {
    for (var i = 0; i < lineData.length; i++) {
      socket.emit(lineData[i][0], lineData[i][1]);
    }
  });
  

  socket.on('erase', function(data) {
    setData([]);
    socket.broadcast.emit('erase');
  });

  socket.on('lineTo', function(data) {
    data.id = socket.id;
    getData(function(lineData) {
      lineData.push(['lineTo', data]);
      setData(lineData);
      socket.broadcast.emit('lineTo', data);
    });
  });

  socket.on('moveTo', function(data) {
    data.id = socket.id;
    getData(function(lineData) {
      lineData.push(['moveTo', data]);
      setData(lineData);
      socket.broadcast.emit('moveTo', data);
    });
  });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
  console.log('listening on port: '+port);
});