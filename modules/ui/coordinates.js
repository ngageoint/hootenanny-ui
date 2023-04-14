import { prefs } from "../core";

export function uiCoordinates(context) {
    var projection = context.projection;
    var formats = ['DMS', 'DD', 'UTM', 'MGRS'];
    var coordinateFormat = prefs('coordinate-format') || 'DMS';

    function leadingZeros(num) {
        return ('0' + num.toString()).slice(-2);
    }

    function DDtoDMS(coords){
        var lat = coords[1];
        var lng = coords[0];

        var degrees = new Array(0,0);
        var minutes = new Array(0,0);
        var seconds = new Array(0,0);
        // var direction = new Array(' ',' ');
        var hundreths = new Array(0.0,0.0);

        var LatCardinal = ((lat>0)?'N':'S');
        var LngCardinal = ((lng>0)?'E':'W');

        degrees[0]=Math.abs(parseInt(lat, 10));
        degrees[1]=Math.abs(parseInt(lng, 10));

        var lat_leftover = (Math.abs(lat)-degrees[0])*60;
        var lng_leftover = (Math.abs(lng)-degrees[1])*60;

        minutes[0] = parseInt(lat_leftover, 10);
        minutes[1] = parseInt(lng_leftover, 10);

        lat_leftover = (lat_leftover-minutes[0])*60;
        lng_leftover = (lng_leftover-minutes[1])*60;

        seconds[0] = parseInt(lat_leftover, 10);
        hundreths[0] = parseInt((lat_leftover-seconds[0])*100, 10);

        seconds[1] = parseInt(lng_leftover, 10);
        hundreths[1] = parseInt((lng_leftover-seconds[1])*100, 10);

        return degrees[0] + '°' + leadingZeros(minutes[0]) + '\'' + leadingZeros(seconds[0]) + '.' + leadingZeros(hundreths[0]) + '" ' + LatCardinal + '  '
            + degrees[1] + '°' + leadingZeros(minutes[1]) + '\'' + leadingZeros(seconds[1]) + '.' + leadingZeros(hundreths[1]) + '" ' + LngCardinal;
    }

    function formatDD(coords) {
        // Format to 4 decimal places
        var lat = coords[1];
        var lng = coords[0];

        function latDD() {
            return (lat).toFixed(4);
        }
        function lngDD() {
            return (lng).toFixed(4);
        }
        return latDD() + ', ' + lngDD();
    }

    function DDtoUTM(coords){
        //http://gis.stackexchange.com/questions/62281/converting-utm-decimal-degrees-with-javascript-or-using-a-web-service

        var lan1 = coords[0];
        var fi = coords[1];

        var a=6378137.000;
        var b=6356752.314;
        // var f=(a-b)/a;
        // var e2=Math.sqrt((Math.pow(a,2)-Math.pow(b,2))/Math.pow(b,2));
        var e=Math.sqrt((Math.pow(a,2)-Math.pow(b,2))/Math.pow(a,2));

        var zone;
        var lan0;
        if (lan1>0)
        {
            zone=30+Math.ceil(lan1/6);
            lan0=Math.floor(lan1/6)*6+3;
        }
        else
        {
            zone=30-Math.floor(Math.abs(lan1)/6);
            lan0=-Math.floor(Math.abs(lan1)/6)*6-3;
        }


        //-----------------------------------------------

        var lan=lan1-lan0;
        lan=lan*Math.PI/180;
        fi=fi*Math.PI/180;
        var N=a/Math.pow(1-Math.pow(e,2)*Math.pow(Math.sin(fi),2),0.5);
        var M=a*(1-Math.pow(e,2))/Math.pow((1-(Math.pow(e,2)*Math.pow(Math.sin(fi),2))),(3/2));
        var t=Math.tan(fi);
        var p=N/M;

        //----------------------------------------------
        var k0=0.9996;

        var term1=Math.pow(lan,2)*p*Math.pow(Math.cos(fi),2)/2;
        var term2=Math.pow(lan,4)*Math.pow(Math.cos(fi),4)*(4*Math.pow(p,3)*(1-6*Math.pow(t,2))+Math.pow(p,2)*(1+24*Math.pow(t,2))-4*p*Math.pow(t,2))/24;
        var term3=Math.pow(lan,6)*Math.pow(Math.cos(fi),6)*(61-148*Math.pow(t,2)+16*Math.pow(t,4))/720;

        // var Kutm=k0*(term1+term2+term3);


        //----------------------------------------------
        term1=Math.pow(lan,2)*p*Math.pow(Math.cos(fi),2)*(p-Math.pow(t,2))/6;
        term2=Math.pow(lan,4)*Math.pow(Math.cos(fi),4)*(4*Math.pow(p,3)*(1-6*Math.pow(t,2))+Math.pow(p,2)*(1+8*Math.pow(t,2))-Math.pow(p,2)*Math.pow(t,2)+Math.pow(t,4))/120;
        term3=Math.pow(lan,6)*Math.pow(Math.cos(fi),6)*(61-479*Math.pow(t,2)+179*Math.pow(t,4)-Math.pow(t,6))/5040;

        var Xutm=500000+k0*lan*N*Math.cos(fi)*(1+term1+term2+term3);

        //----------------------------------------------

        var A0=1-0.25*Math.pow(e,2)-3/64*Math.pow(e,4)-5/256*Math.pow(e,6);
        var A2=3/8*(Math.pow(e,2)+0.25*Math.pow(e,4)+15/128*Math.pow(e,6));
        var A4=15/256*(Math.pow(e,4)+0.75*Math.pow(e,6));
        var A6=35/3072*Math.pow(e,6);

        var sfi=a*(A0*fi-A2*Math.sin(2*fi)+A4*Math.sin(4*fi)-A6*Math.sin(6*fi));

        //----------------------------------------------

        term1=Math.pow(lan,2)*N*Math.sin(fi)*Math.cos(fi)/2;
        term2=Math.pow(lan,4)*N*Math.sin(fi)*Math.pow(Math.cos(fi),3)*(4*Math.pow(p,2)+p-Math.pow(t,2))/24;
        term3=Math.pow(lan,6)*N*Math.sin(fi)*Math.pow(Math.cos(fi),5)*(8*Math.pow(p,4)*(11-24*Math.pow(t,2))-28*Math.pow(p,3)*(1-6*Math.pow(t,2))+Math.pow(p,2)*(1-32*Math.pow(t,2))-p*2*Math.pow(t,2)+Math.pow(t,4));
        var term4=Math.pow(lan,8)*N*Math.sin(fi)*Math.pow(Math.cos(fi),7)*(1385-3111*Math.pow(t,2)+543*Math.pow(t,4)-Math.pow(t,6));

        var Yutm=k0*(sfi+term1+term2+term3+term4);
        var sn='N';
        if (fi <0)
        {
            Yutm = 10000000 + Yutm;
            sn='S';
        }

        Xutm = Math.round(Xutm);
        Yutm = Math.round(Yutm);

        return zone.toString() + sn + ' ' + Xutm.toString() + 'm E ' + Yutm.toString() + 'm N';
    }

    function UTMtoMGRS(coords, DDtoUTM){
        var lat = coords[1];
        var UTM = DDtoUTM(coords).split(' ');
        var zone = Number((UTM[0]).slice(0, -1));
        var utmEasting = Number((UTM[1]).slice(0, -1));
        var utmNorthing = Number((UTM[3]).slice(0, -1));
        var latBands = 'CDEFGHJKLMNPQRSTUVWXX';
        var e100kLetters = [ 'ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ' ];
        var n100kLetters = ['ABCDEFGHJKLMNPQRSTUV', 'FGHJKLMNPQRSTUVABCDE'];
        var band = latBands.charAt(Math.floor(lat/8+10));
        var col = Math.floor(utmEasting / 100e3);
        var e100k = e100kLetters[(zone-1)%3].charAt(col-1);
        var row = Math.floor(utmNorthing / 100e3) % 20;
        var n100k = n100kLetters[(zone-1)%2].charAt(row);
        var easting = utmEasting % 100e3;
        var northing = utmNorthing % 100e3;

        function correctCoordinates(coords) {
            coords = String(coords);
            if (coords.length < 5) {
                coords = new Array(5 - coords.length + 1).join('0') + coords;
            }
            return coords;
        }

        return String(zone + band + ' ' + e100k + n100k + ' ' + correctCoordinates(easting) + ' ' + correctCoordinates(northing));
    }

    function validCoords(coords) {
        var lon = coords[0];
        var lat = coords[1];
        return lon > -180 && lon < 180 && lat > -85 && lat < 85;
    }

    function update(selection, coords) {
        if (validCoords(coords)) {
            var formatted;
            switch (coordinateFormat) {
                case 'DD':
                    formatted = formatDD(coords);
                    break;
                case 'UTM':
                    formatted = DDtoUTM(coords);
                    break;
                case 'MGRS':
                    formatted = UTMtoMGRS(coords, DDtoUTM);
                    break;
                case 'DMS':
                default:
                    formatted = DDtoDMS(coords);
                    break;
            }
            selection.text(coordinateFormat + ': ' + formatted);
        }
    }


    return function(selection){
        var center = projection.invert(context.map().center());
        update(selection, center);

        selection.on('click', function() {
            var currIndex = formats.indexOf(coordinateFormat);
            var newIndex = (currIndex < (formats.length - 1)) ? currIndex + 1 : 0;
            coordinateFormat = formats[newIndex];
            prefs('coordinate-format', coordinateFormat);
            var coords = projection.invert(context.map().mouse());
            update(selection, coords);
        });

        context.map().surface.on('mousemove', function() {
            var coords = projection.invert(context.map().mouse());
            update(selection, coords);
        });
    };
}
