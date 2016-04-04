var hoot = function(options) {
    var express = require('express'),
    app = express(),
    url = require('url'),
    proxy = require('express-http-proxy');

    app.listen(options.port);
    console.log('server running');

    var hootHost = 'localhost';
    var hootPort = 8888;
    var hootUrl = 'http://' + hootHost + ':' + hootPort;

    app.get('/hootenanny-id', function(req, res) {
        res.writeHead(301,
          {Location: 'http://localhost:' + options.port}
        );
        res.end();
    });

    app.use(express.static(options.dir));

    app.use('/hoot-services', proxy(hootUrl, {
        limit: '1000mb',
        forwardPath: function(req, res) {
            return '/hoot-services' + url.parse(req.url).path;
        }
    }));

    app.use('/static', proxy(hootUrl, {
        //limit: '1000mb',
        forwardPath: function(req, res) {
            return '/static' + url.parse(req.url).path;
        }
    }));
};
exports.hoot = hoot;
