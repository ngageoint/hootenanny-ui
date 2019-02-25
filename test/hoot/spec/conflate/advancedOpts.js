const { generateAdvOptsLayerParams } = require( '../../helpers' );


describe( 'Advanced Options', () => {
    before( async function () { // upload 2 datasets and have conflate ui showing...
        try {
            this.enableTimeouts(false);
            let layerParams = await generateAdvOptsLayerParams();

            await Promise.all( _.map( layerParams, params => Hoot.api.uploadDataset( params ) ) ); // generate  test layer
            await Hoot.folders.refreshAll();
            await Hoot.events.emit( 'render-dataset-table' );

            await new Promise(res => {
                let name = layerParams[0].INPUT_NAME;
                d3.select( '#reference a' ).dispatch( 'click' ); // open add ref layer...
                Hoot.events.on( 'load-layer', () => res());

                setTimeout(() => {
                    let reference = d3.select( '#reference' );

                    reference // set desired ref dataset...
                        .select( '.recently-used-input' )
                        .property( 'value', name )
                        .dispatch( 'change' );

                    setTimeout(() => {
                        reference // add layer
                            .select( '.add-layer' )
                            .dispatch( 'click' );
                    }, 500);
                }, 500);
            })
            .then(() => { // same logic as above, just for secondary...
                return new Promise(res => {
                    let name = layerParams[1].INPUT_NAME;
 
                    d3.select( '#secondary a' ).dispatch( 'click' );
                    Hoot.events.on( 'load-layer', () => res());

                    setTimeout(() => {
                        let secondary = d3.select( '#secondary' );
                        
                        secondary
                            .select( '.recently-used-input' )
                            .property( 'value', name )
                            .dispatch( 'change' );

                        setTimeout(() => {
                            secondary
                                .select( '.add-layer' )
                                .dispatch( 'click' );
                            
                        }, 500);
                    }, 500);
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
            console.log(e)
        } finally { /* eslint-disable */
            return Promise.resolve();
        }
    } );
    describe( 'Toggle on and off certain conflation types', () => {
        let advancedOptions, options;
        it( 'has all conflation types toggled initially', () => {
            advancedOptions = Hoot.ui.sidebar.forms.conflate.advancedOptions;
            d3.selectAll( '#advanced-opts-panel .advanced-opts-content .form-group')
                .each(function(d) {
                    const input = d3.select( this ).select( 'input' );
                    expect( input.property( 'checked' ) ).to.be.true;
                })

            options = advancedOptions.getOptions();

            expect( options.includes( 'match.creators' )  ).to.be.true;
            expect( options.includes( 'merger.creators' )  ).to.be.true;

        } );

        it ( 'removes specific merger and match creators when relevant conflation types are unchecked', () => {
            d3.select( '#roadOptions_group input' ).property( 'checked', false );

            options = advancedOptions.getOptions();
            
            expect( options.includes( 'hoot::HighwayMatchCreator' ) ).to.be.false;
            expect( options.includes( 'hoot::HighwayMergerCreator' ) ).to.be.false;
        } );
        
        it ( 'makes only road input checked and users network matcher/merger when network selected', () => {
            d3.select( '#conflateType')
                .property( 'value', 'Network')
                .dispatch( 'change' );

            setTimeout(() => {
                d3.selectAll( '.advanced-opts-content .form-group')
                    .each(function(d) {
                        const input = d3.select( this ).select( 'input' );
                        if ( d.id === 'roadOptions' ) {
                            expect( input.property( 'checked' ) ).to.be.true
                        } else {
                            expect( input.property( 'checked' ) ).to.be.false;
                        }
                    })

                options = advancedOptions.getOptions();

                expect( options.includes( 'hoot::NetworkMatchCreator' )).to.be.true
                expect( options.includes( 'hoot::NetworkMergerCreator' )).to.be.true
                expect( options.includes( 'hoot::HighwayMatchCreator' ) ).to.be.false;
                expect( options.includes( 'hoot::HighwayMergerCreator' ) ).to.be.false;
            }, 500)
        } );
    } );
} );
  