import '@babel/polyfill';
import * as iD from './index';
import $ from 'jquery';

import '../css/00_reset.css';
import '../css/20_map.css';
import '../css/25_areas.css';
import '../css/30_highways.css';
import '../css/35_aeroways.css';
import '../css/40_railways.css';
import '../css/45_waterways.css';
import '../css/50_misc.css';
import '../css/55_cursors.css';
import '../css/60_photos.css';
import '../css/65_data.css';
import '../css/70_fills.css';
import '../css/80_app.css';

import '../css/hoot/hoot.scss';

window.iD = iD;
window.$ = window.jQuery = $;

export default iD;
