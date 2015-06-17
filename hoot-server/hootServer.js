var listen = function(options){
express = require('express');
http = require('http');
app = express(),
url = require('url'),
proxy = require('express-http-proxy');


if(options.socket){

server = http.createServer(app);
io = require('socket.io').listen(server);
server.listen(options.port);

app.use(express.static(options.dir));


io.sockets.on('connection', function (socket) {
  socket.emit('connected', 'webSocketEnabled');

socket.on('node-drag', function (data) {
    console.log(data);
    socket.broadcast.emit('node-dragged', data);
  });
});
return;
}
app.use(express.static(options.dir));
app.listen(options.port);
console.log('server running');
};

exports.listen = listen;

var hoot = function(){
var hootHost = 'localhost';
var hootPort = 8888;
var hootUrl = 'http://' + hootHost + ':' + hootPort;

app.use('/hoot-services', proxy(hootUrl, {
    limit: '1000mb',
    forwardPath: function(req, res) {
        return '/hoot-services' + url.parse(req.url).path;
    }
}));

};
exports.hoot = hoot;