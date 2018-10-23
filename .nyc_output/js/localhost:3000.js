
    // google analytics
    //var _gaq = _gaq || [];
    //_gaq.push(['_setAccount', 'UA-38039653-2']);
    //_gaq.push(['_trackPageview']);
    //(function() {
    //    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    //    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    //    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    //})();

    // crazyegg
    //setTimeout(function(){var a=document.createElement('script');
    //    var b=document.getElementsByTagName('script')[0];
    //    a.src=document.location.protocol+'//dnn506yrbagrg.cloudfront.net/pages/scripts/0013/6714.js?'+Math.floor(new Date().getTime()/3600000);
    //    a.async=true;a.type='text/javascript';b.parentNode.insertBefore(a,b)}, 1);

    if (typeof iD == 'undefined' || !iD.Detect().support) {
        document.getElementById('id-container').innerHTML = 'Sorry, your browser is not currently supported. Please use Potlatch 2 to edit the map.';
        document.getElementById('id-container').className = 'unsupported';

    } else {
        var id = iD.Context();

        // disable boundaries (unless we have an explicit disable_features list)
        var q = iD.utilStringQs(window.location.hash.substring(1));
        if (!q.hasOwnProperty('disable_features')) {
            id.features().disable('boundaries');
        }

        id.ui()(document.getElementById('id-sink'), function() {
            id.container().select('#about-list')
                .insert('li', '.user-list')
                .attr('class', 'source-switch')
                .call(iD.uiSourceSwitch(id)
                    .keys([{
                        'urlroot': 'https://www.openstreetmap.org',
                        'oauth_consumer_key': '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
                        'oauth_secret': 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL'
                    }, {
                        'urlroot': 'https://api06.dev.openstreetmap.org',
                        'oauth_consumer_key': 'zwQZFivccHkLs3a8Rq5CoS412fE5aPCXDw9DZj7R',
                        'oauth_secret': 'aMnOOCwExO2XYtRVWJ1bI9QOdqh1cay2UgpbhA6p'
                    }
                    ])
                );
        });
    }
