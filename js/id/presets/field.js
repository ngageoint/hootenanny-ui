iD.presets.Field = function(id, field) {
    field = _.clone(field);

    field.id = id;

    field.matchGeometry = function(geometry) {
        return !field.geometry || field.geometry === geometry;
    };

    field.t = function(scope, options) {
        return t('presets.fields.' + id + '.' + scope, options);
    };

    field.label = function() {
        //if a field has an overrideLabel, don't try to translate it
        return field.overrideLabel || field.t('label', {'default': id});
    };

    var placeholder = field.placeholder;
    field.placeholder = function() {
        return field.t('placeholder', {'default': placeholder});
    };

    return field;
};
