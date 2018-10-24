import 'babel-polyfill';
import * as iD from './index';
import $ from 'jquery';

import '../css/main.scss';

window.iD = iD;
window.$ = window.jQuery = $;
