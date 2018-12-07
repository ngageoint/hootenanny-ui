var hoot = function(options) {
    var express = require('express'),
    app = express(),
    url = require('url'),
    proxy = require('express-http-proxy');

    app.listen(options.port);
    console.log('server running');

    var hootHost = '35.174.111.201';
    var hootPort = 8080;
    var hootUrl = 'http://' + hootHost + ':' + hootPort;

    app.get('/hootenanny-id', function(req, res) {
        res.writeHead(301,
          {Location: 'http://35.174.111.201:' + options.port}
        );
        res.end();
    });

    app.use(express.static(options.dir));

    app.use('/hoot-services', proxy(hootUrl, {
        limit: '1000mb',
        proxyReqPathResolver: function(req) {
            return '/hoot-services' + url.parse(req.url).path;
        }
    }));

    app.use('/static', proxy(hootUrl, {
        //limit: '1000mb',
        proxyReqPathResolver: function(req) {
            return '/static' + url.parse(req.url).path;
        }
    }));
};

exports.hoot = hoot;
