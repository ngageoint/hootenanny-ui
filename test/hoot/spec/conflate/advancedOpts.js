import AdvancedOpts  from '../../../../modules/Hoot/ui/sidebar/advancedOpts';

const { generateAdvOptsLayerParams } = require( '../../helpers' );


describe.only( 'Advanced Options', () => {
        before( async function () { // upload 2 datasets and have conflate ui showing...
            try {
                let generateCount = 2,
                    layerParams   = await generateAdvOptsLayerParams( [ ...Array( generateCount ).keys() ] );

                await Promise.all( _.map( layerParams, params => Hoot.api.uploadDataset( params ) ) ); // generate  test layer
                await Hoot.folders.refreshAll();
                await Hoot.layers.refreshAll();
                await Hoot.events.emit( 'render-dataset-table' );

                await new Promise(res => {
                    d3.select( '#reference a' ).dispatch( 'click' ); // open add ref layer...
                    Hoot.events.on( 'load-layer', () => res());

                    setTimeout(() => {
                        let reference = d3.select( '#reference' );

                        reference // set desired ref dataset...
                            .select( '.recently-used-input' )
                            .property( 'value', layerParams[0].INPUT_NAME )
                            .dispatch( 'change' );

                        setTimeout(() => {
                            reference // add layer
                                .select( '.add-layer' )
                                .dispatch( 'click' );
                        }, 100);
                    }, 100);
                })
                .then(() => { // same logic as above, just for secondary...
                    return new Promise(res => {
                        d3.select( '#secondary a' ).dispatch( 'click' );
                        Hoot.events.on( 'load-layer', () => res());

                        setTimeout(() => {
                            let secondary = d3.select( '#secondary' );

                            secondary
                                .select( '.recently-used-input' )
                                .property( 'value', layerParams[1].INPUT_NAME )
                                .dispatch( 'change' );

                            setTimeout(() => {
                                secondary
                                    .select( '.add-layer' )
                                    .dispatch( 'click' );

                            }, 100);
                        }, 100);
                    });
                })
                .then(() => {
                    return new Promise(res => {
                        setTimeout(() => {
                            d3.select( '#conflate .toggle-button' )
                                .dispatch( 'click' );
                            res();
                        }, 500);
                    });
                });
            } catch (e) { /* eslint-disable */
            } finally { /* eslint-disable */
                return Promise.resolve();
            }
        } );
        after( function () {
            let reference = d3.select( '#reference' ),
                secondary = d3.select( '#secondary' );

            Hoot.layers.removeLoadedLayer( reference.attr( 'data-id') );
            Hoot.ui.sidebar.layerRemoved( reference.datum() );

            Hoot.layers.removeLoadedLayer( secondary.attr( 'data-id') );
            Hoot.ui.sidebar.layerRemoved( secondary.datum() );
        } );

        it( 'has all conflation types toggled initially', (done) => {
            d3.selectAll( '#advanced-opts-panel .advanced-opts-content .form-group')
                .each(function(d) {
                    const input = d.select( 'input' );
                    expect( input.property( 'checked' ) ).to.be.true;
                });
                setTimeout(() => {
                    let { advanced, cleaning } = AdvancedOpts.getInstance().getOptions();
                    
                    expect( advanced.includes( 'match.creators' )  ).to.be.true;
                    expect( advanced.includes( 'merger.creators' )  ).to.be.true;
                    done();
                }, 500);

        } );
        it ( 'removes specific merger and match creators when relevant conflation types are unchecked', (done) => {
            d3.select( '#Roads-toggle input' ).property( 'checked', false );

            let { advanced, cleaning } = AdvancedOpts.getInstance().getOptions();

            expect( advanced.includes( 'HighwayMatchCreator' ) ).to.be.false;
            expect( advanced.includes( 'HighwayMergerCreator' ) ).to.be.false;
            done();
        } );
        it ( 'makes only road input checked and users network matcher/merger when network selected', (done) => {
            d3.select( '#conflateType')
            .property( 'value', 'Network')
            .dispatch( 'change' );

        setTimeout(() => {
            d3.selectAll( '.advanced-opts-content .form-group')
                .each(function(d) {
                    const input = d3.select( this ).select( 'input' );
                    if ( d.id === 'Roads-toggle' ) {
                        expect( input.property( 'checked' ) ).to.be.true;
                    } else {
                        expect( input.property( 'checked' ) ).to.be.false;
                    }
                });
                let { advanced, cleaning } = AdvancedOpts.getInstance().getOptions();
                expect( advanced.includes( 'NetworkMatchCreator' )).to.be.true
                expect( advanced.includes( 'NetworkMergerCreator' )).to.be.true
                expect( advanced.includes( 'HighwayMatchCreator' ) ).to.be.false;
                expect( advanced.includes( 'HighwayMergerCreator' ) ).to.be.false;
            done();
        }, 500);
        } );
} );