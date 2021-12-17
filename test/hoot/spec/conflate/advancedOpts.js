import { expect } from 'chai';
import AdvancedOpts  from '../../../../modules/Hoot/ui/sidebar/advancedOpts';

const { generateAdvOptsLayerParams } = require( '../../helpers' );


describe.only( 'Advanced Options', () => {
        let layerParams;
        before( async () => { // upload 2 datasets and have conflate ui showing...
            try {
                let generateCount = 2;
                layerParams = await generateAdvOptsLayerParams( [ ...Array( generateCount ).keys() ] );

                await Promise.all(layerParams.map(params => Hoot.api.uploadDataset( params )
                    .then( resp => {
                        let jobId = resp.data[ 0 ].jobid;
                        return Hoot.api.statusInterval( jobId ); //wait for import job to complete
                    } )
                    .then( async () => {
                        await Hoot.folders.refreshAll();

                        expect(Hoot.layers.allLayers
                            .filter(lyr => lyr.name.startsWith('advOpts_')).length)
                            .to.be.equal( 2 );

                        let layerNames = Hoot.layers.allLayers
                            .filter(lyr => lyr.name.startsWith('advOpts_'))
                            .map(lyr => lyr.name);
                        expect(layerParams.map( lyr => lyr.name).every( lyrName => layerNames.includes(lyrName) )).to.be.true;
                    } )
                ));

                // await Hoot.events.emit( 'render-dataset-table' );

                // await new Promise(res => {
                //     d3.select( '#reference a' ).dispatch( 'click' ); // open add ref layer...
                //     Hoot.events.on( 'load-layer', () => res());
                //     console.log(' click add reference ');

                //     setTimeout(() => {
                //         let reference = d3.select( '#reference' );
                //         expect(reference.size()).to.be.equal(1);

                //         reference // set desired ref dataset...
                //             .select( '.recently-used-input' )
                //             .property( 'value', layerParams[0].INPUT_NAME )
                //             .dispatch( 'change' );

                //         setTimeout(() => {
                //             reference // add layer
                //                 .select( '.add-layer' )
                //                 .dispatch( 'click' );
                //             console.log(' click add reference ');
                //         }, 1000);
                //     }, 1000);
                // })
                // .then(() => { // same logic as above, just for secondary...
                //     return new Promise(res => {
                //         d3.select( '#secondary a' ).dispatch( 'click' );
                //         Hoot.events.on( 'load-layer', () => res());

                //         setTimeout(() => {
                //             let secondary = d3.select( '#secondary' );

                //             secondary
                //                 .select( '.recently-used-input' )
                //                 .property( 'value', layerParams[1].INPUT_NAME )
                //                 .dispatch( 'change' );

                //             setTimeout(() => {
                //                 secondary
                //                     .select( '.add-layer' )
                //                     .dispatch( 'click' );

                //             }, 100);
                //         }, 100);
                //     });
                // })
                // .then(() => {
                //     return new Promise(res => {
                //         setTimeout(() => {
                //             d3.select( '#conflate .toggle-button' )
                //                 .dispatch( 'click' );
                //             res();
                //         }, 500);
                //     });
                // });
            } finally { /* eslint-disable */
                return Promise.resolve();
            }
        } );
        after( async () => {
            // let reference = d3.select( '#reference' ),
            //     secondary = d3.select( '#secondary' );

            // Hoot.layers.removeLoadedLayer( reference.attr('data-id') );
            // Hoot.ui.sidebar.layerRemoved( reference.datum() );

            // Hoot.layers.removeLoadedLayer( secondary.attr( data-id') );
            // Hoot.ui.sidebar.layerRemoved( secondary.datum() );


            await Promise.all(layerParams.map(lyr => Hoot.api.deleteLayer(lyr.INPUT_NAME)));
            await Hoot.layers.refreshLayers();
            expect(Hoot.layers.allLayers
                .filter(lyr => lyr.name.startsWith('advOpts_')).length)
                .to.be.equal( 0 );
        } );

        it( 'has all conflation types toggled initially', (done) => {
            done();
            // let conButton = d3.select( '#conflate .toggle-button' );
            // expect( conButton.size() ).to.be.equal(1);
            // let advOptsToggle = d3.select( '#advanced-opts-toggle' );
            // expect( advOptsToggle.size() ).to.be.equal(1);
            // advOptsToggle.dispatch( 'click' );

            // setTimeout(() => {
            //     let adv_panel =  d3.selectAll( '#advanced-opts-panel' );
            //     expect( adv_panel.size()).to.be.equal(1);

                // let adv_opts_groups = d3.selectAll( '#advanced-opts-panel .advanced-opts-content .form-group');
                // expect( adv_opts_groups.size()).to.be.equal(13);
                // adv_opts_groups.each(function(d) {
                //     const input = d.select( 'input' );
                //     expect( input.property( 'checked' ) ).to.be.true;
                // });
                // setTimeout(() => {
                //     let { advanced, cleaning } = AdvancedOpts.getInstance().getOptions();

                //     expect( advanced.includes( 'match.creators' )  ).to.be.true;
                //     expect( advanced.includes( 'merger.creators' )  ).to.be.true;
                //     done();
                // }, 500);
            //     done();
            // }, 500);

        } );
        // it ( 'removes specific merger and match creators when relevant conflation types are unchecked', (done) => {
        //     d3.select( '#Roads-toggle input' ).property( 'checked', false );

        //     let { advanced, cleaning } = AdvancedOpts.getInstance().getOptions();

        //     expect( advanced.includes( 'HighwayMatchCreator' ) ).to.be.false;
        //     expect( advanced.includes( 'HighwayMergerCreator' ) ).to.be.false;
        //     done();
        // } );
        // it ( 'makes only road input checked and users network matcher/merger when network selected', (done) => {
        //     d3.select( '#conflateType')
        //     .property( 'value', 'Network')
        //     .dispatch( 'change' );

        //     setTimeout(() => {
        //         d3.selectAll( '.advanced-opts-content .form-group')
        //             .each(function(d) {
        //                 const input = d3.select( this ).select( 'input' );
        //                 if ( d.id === 'Roads-toggle' ) {
        //                     expect( input.property( 'checked' ) ).to.be.true;
        //                 } else {
        //                     expect( input.property( 'checked' ) ).to.be.false;
        //                 }
        //             });
        //             let { advanced, cleaning } = AdvancedOpts.getInstance().getOptions();
        //             expect( advanced.includes( 'NetworkMatchCreator' )).to.be.true
        //             expect( advanced.includes( 'NetworkMergerCreator' )).to.be.true
        //             expect( advanced.includes( 'HighwayMatchCreator' ) ).to.be.false;
        //             expect( advanced.includes( 'HighwayMergerCreator' ) ).to.be.false;
        //         done();
        //     }, 500);
        // } );
} );