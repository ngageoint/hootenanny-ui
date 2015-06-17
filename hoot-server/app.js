var server = require('./hootServer.js');
server.listen({dir:'..',port:8080,socket:true});
server.hoot();