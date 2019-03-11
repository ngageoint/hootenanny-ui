/*******************************************************************************************************
 * File: clipSelectBbox.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import SelectBbox  from './selectBbox';
import ClipDataset from './clipDataset';

import { modeDrawBoundingBox } from '../../modes';

export default class ClipSelectBbox extends SelectBbox {
    constructor( context ) {
        super( context );

        // Used in super class
        this.operationName = 'clip';
    }

    render() {
        const formInfo = {
            metadata: {
                title: 'Enter Coordinates for Clip Bounding Box',
                button: {
                    text: 'Next',
                    id: 'clipNextBtn',
                    onClick: () => this.handleNext()
                }
            }
        };

        super.render(formInfo);
    }

    handleNext() {
        this.bbox = this.minLonInput.property( 'value' ) + ',' +
            this.minLatInput.property( 'value' ) + ',' +
            this.maxLonInput.property( 'value' ) + ',' +
            this.maxLatInput.property( 'value' );

        this.container.remove();
        this.nextButton = null;

        new ClipDataset( this ).render();
    }
}
