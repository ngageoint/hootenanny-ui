import { geoExtent } from './extent';

export function geoSphericalMercator() {

    /**
     * SphericalMercator constructor: precaches calculations
     * for fast tile lookups
     */
        var size = 256;
        var SphericalMercator = {};
        SphericalMercator.Bc = [];
        SphericalMercator.Cc = [];
        SphericalMercator.zc = [];
        SphericalMercator.Ac = [];
        SphericalMercator.DEG_TO_RAD = Math.PI / 180;
        SphericalMercator.RAD_TO_DEG = 180 / Math.PI;
        SphericalMercator.size = 256;
        SphericalMercator.levels = 18;
        for (var d = 0; d < SphericalMercator.levels; d++) {
            SphericalMercator.Bc.push(size / 360);
            SphericalMercator.Cc.push(size / (2 * Math.PI));
            SphericalMercator.zc.push(size / 2);
            SphericalMercator.Ac.push(size);
            size *= 2;
        }

    /**
     * Get the max of the first two numbers and the min of that and the third
     *
     * @param {Number} a the first number.
     * @param {Number} b the second number.
     * @param {Number} c the third number.
     * @return {Number}
     */
    SphericalMercator.minmax = function(a, b, c) {
        return Math.min(Math.max(a, b), c);
    };

    /**
     * Convert lat lon to screen pixel value
     *
     * @param {Array} px [lat lon] array of geographic coordinates.
     * @param {Number} zoom number of the zoom level.
     */
    SphericalMercator.ll_to_px = function(ll, zoom) {
        var d = SphericalMercator.zc[zoom];
        var f = SphericalMercator.minmax(Math.sin(SphericalMercator.DEG_TO_RAD * ll[1]), -0.9999, 0.9999);
        var x = Math.round(d + ll[0] * SphericalMercator.Bc[zoom]);
        var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * (-SphericalMercator.Cc[zoom]));
        return [x, y];
    };

    /**
     * Convert screen pixel value to lat lon
     *
     * @param {Array} px [x y] array of geographic coordinates.
     * @param {Number} zoom number of the zoom level.
     */
    SphericalMercator.px_to_ll = function(px, zoom) {
        var zoom_denom = SphericalMercator.zc[zoom];
        var g = (px[1] - zoom_denom) / (-SphericalMercator.Cc[zoom]);
        var lat = (px[0] - zoom_denom) / SphericalMercator.Bc[zoom];
        var lon = SphericalMercator.RAD_TO_DEG * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
        return [lat, lon];
    };

    /**
     * Convert tile xyz value to Mapnik envelope
     *
     * @param {Number} x latitude number.
     * @param {Number} y longitude number.
     * @param {Number} zoom zoom.
     * @param {Boolean} tms_style whether to compute a tms tile.
     * @return Object Mapnik envelope.
     */
    SphericalMercator.xyz_to_envelope = function(x, y, zoom, TMS_SCHEME) {
        if (TMS_SCHEME) {
            y = (Math.pow(2, zoom) - 1) - y;
        }
        var ll = [x * SphericalMercator.size, (y + 1) * SphericalMercator.size];
        var ur = [(x + 1) * SphericalMercator.size, y * SphericalMercator.size];
        return geoExtent(SphericalMercator.px_to_ll(ll, zoom), SphericalMercator.px_to_ll(ur, zoom));
    };

    return SphericalMercator;
}
