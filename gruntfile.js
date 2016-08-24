module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'hoot/js/Hoot.js',
                    'hoot/js/custom/hoot.js',
                    'hoot/js/tools.js',
                    'hoot/js/tools/Import.js',
                    'hoot/js/tools/View.js',
                    'hoot/js/tools/Conflate.js',
                    'hoot/js/tools/Conflicts.js',
                    'hoot/js/tools/Export.js',
                    'hoot/js/tools/LTDSTags.js',
                    'hoot/js/tools/Utilities.js',
                    'hoot/js/custom/rest.js',
                    'hoot/js/core/connection.js',
                    'hoot/js/core/difference.js',
                    'hoot/js/core/entity.js',
                    'hoot/js/core/graph.js',
                    'hoot/js/core/history.js',
                    'hoot/js/core/node.js',
                    'hoot/js/core/relation.js',
                    'hoot/js/core/way.js',
                    'hoot/js/core/tree.js',
                    'hoot/js/renderer/map.js',
                    'hoot/js/ui.js',
                    'hoot/js/ui/alert.js',
                    'hoot/js/ui/sidebar.js',
                    'hoot/js/ui/entity_editor.js',
                    'hoot/js/ui/processing.js',
                    'hoot/js/ui/spinner.js',
                    'hoot/js/ui/warning.js',
                    'hoot/js/svg/surface.js',
                    'hoot/js/svg/areas.js',
                    'hoot/js/svg/lines.js',
                    'hoot/js/svg/vertices.js',
                    'hoot/js/svg/tag_classes.js',
                    'hoot/js/ui/radial_menu.js',
                    'hoot/js/modes/save.js',
                    'hoot/js/actions/reverse.js',
                    ],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        jshint: {
            options: {
                eqeqeq: true,
                freeze: true,
                latedef: 'nofunc',
                noarg: true,
                noempty: true,
                nonew: true,
                quotmark: 'single',
                undef: true,
                globals: {
                    alert: false,
                    console: false,
                    Hoot: false,
                    d3: false,
                    iD: false,
                    _: false,
                    t: false,
                    bootstrap: false,
                    rbush: false,
                    JXON: false,
                    osmAuth: false,
                    toGeoJSON: false,
                    marked: false
                },
                browser: true,
                unused: true,
                trailing: true
            },
            files: ['hoot/js/**/*.js']
        },
        cssmin: {
            combine: {
                files: {
                    'dist/<%= pkg.name %>.min.css': ['hoot/css/base.css', 'hoot/css/hoot-style.css', 'hoot/css/style2.css']
                }
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'cssmin']);
};