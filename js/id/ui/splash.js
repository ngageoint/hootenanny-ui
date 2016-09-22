iD.ui.Splash = function(context) {
    return function(selection) {
        if (context.storage('sawSplash'))
             return;

        context.storage('sawSplash', true);

        var modal = iD.ui.modal(selection);

        modal.select('.modal')
            .attr('class', 'modal-splash modal col6');

        var introModal = modal.select('.content')
            .append('div')
            .attr('class', 'fillL');

        introModal.append('div')
            .attr('class','modal-section cf')
            .append('h3').text(t('splash.welcome'));

        introModal.append('div')
            .attr('class','modal-section')
            .append('p')
            .html(t('splash.text', {
                version: iD.version,
                id: '<a href="https://github.com/openstreetmap/iD">iD Editor</a>',
                hootenanny: '<a href="https://github.com/ngageoint/hootenanny">Hootenanny</a>'
            }));

        var buttons = introModal.append('div').attr('class', 'modal-actions cf');

        buttons.append('button')
            .attr('class', 'col12 start')
            .text(t('splash.start'))
            .on('click', modal.close);

        modal.select('button.close').attr('class','hide');

    };
};
