module.exports = function(grunt){

    var full = [
        'src/core.js',
        'src/utils.js',
        'src/plugins/plugins.js',
        'src/plugins/strophe.min.js',
        'src/plugins/xml2json.js',
        'src/transport.js',
        'src/user.js',
        'src/device.js',
        'src/messaging.js',
        'src/core-footer.js'
    ];

    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
        concat : {
            options : {
                stripBanners : false
            },
            webKitchenSink : {
                src  : full,
                dest : '../samples/web/assets/<%= pkg.name %>.js'
            },
            full : {
                src  : full,
                dest : 'target/<%= pkg.name %>.js'
            }
        },
        uglify : {
            min : {
                options : {
                    preserveComments : 'some'
                },
                files : {
                    'target/<%= pkg.name %>-min.js': ['target/<%= pkg.name %>.js']
                }
            }
        },
        jsdoc : {
            dist : {
                src : ['target/<%= pkg.name %>.js'],
                options : {
                    destination : 'target/docs'
                }
            },
            docstrap: {
                src : ['target/<%= pkg.name %>.js'],
                options : {
                    destination : 'target/docs',
                    template    : 'config/template',
                    configure   : 'config/docstrap_config.json'
                }
            }
        },
        jasmine : {
            src     : [
                'target/magnet-sdk.js',
                'tests/resources/magnet-jumpstart-controllers.js',
                'tests/resources/generated-models.js',
                'tests/resources/generated-controllers.js',
                'tests/resources/magnet-test-controllers.js',
                'tests/resources/magnet-test-models.js',
                'tests/resources/multipart-controllers.js',
                'tests/resources/multipart-models.js',
                'tests/resources/magnetoauth-controllers.js',
                'tests/resources/magnetoauth-models.js'
            ],
            options : {
                specs    : [
                    'tests/all/*-spec.js',
                    'tests/web/*-spec.js'
                ],
                helpers  : 'tests/all/helpers.js',
                junit    : {
                    path : 'target/reports/junit-web/'
                },
                outfile  : 'target/reports/jasmine/_SpecRunner.html',
                '--web-security' : false,
                '--local-to-remote-url-access' : true,
                '--ignore-ssl-errors' : true,
                template : require('grunt-template-jasmine-istanbul'),
                templateOptions : {
                    coverage : 'target/reports/jasmine/coverage.json',
                    report   : 'target/reports/jasmine/lcov-report/'
                }
            }
        },
        jasmine_node : {
            coverage   : {
                report   : ['html'],
                savePath : 'target/reports/jasmine-node/'
            },
            useHelpers : true,
            options    : {
                forceExit       : true,
                match           : '.',
                matchall        : false,
                projectRoot     : '.',
                extensions      : 'js',
                specFolders     : [
                    'tests/all',
                    'tests/nodejs'
//                    'tests/foo'
                ],
                specNameMatcher : '*',
                junitreport : {
                    report         : true,
                    savePath       : 'target/reports/junit-node/',
                    useDotNotation : true,
                    consolidate    : true
                }
            }
        },
        maven : {
            options : {
                goal         : 'deploy',
                repositoryId : 'libs-release-local',
                url          : 'http://dev-repo.magnet.com:8081/artifactory/libs-release-local'
            },
            deploy_sdk  : {
                options : {
                    groupId    : 'com.magnet',
                    artifactId : 'magnet-mobile-javascript-sdk'
                },
                src  : ['target/magnet-sdk**']
            },
            deploy_kitchensink : {
                options : {
                    groupId    : 'com.magnet.demo',
                    artifactId : 'magnet-apps-demo-javascript-kitchen-sink'
                },
                src : ['../samples/phonegap/feature-test/platforms/**']
            },
            deploy_peopleatwork : {
                options : {
                    groupId    : 'com.magnet.demo',
                    artifactId : 'magnet-apps-demo-javascript-people'
                },
                src : ['../samples/phonegap/People/platforms/**']
            },
            deploy_jumpstart : {
                options : {
                    groupId    : 'com.magnet.demo',
                    artifactId : 'magnet-apps-demo-javascript-jumpstart'
                },
                src : ['../samples/phonegap/Jumpstart/platforms/**']
            }
        },
        clean : [
            'target/**',
            'magnet-mobile-javascript-sdk*',
            'magnet-apps-demo-javascript-kitchen-sink*',
            'magnet-apps-demo-javascript-people*',
            'magnet-apps-demo-javascript-jumpstart*'
        ]
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-jasmine-node-coverage');
    grunt.loadNpmTasks('grunt-maven-tasks');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['concat']);
    grunt.registerTask('min', ['concat', 'uglify']);
    grunt.registerTask('docs', ['clean', 'concat', 'jsdoc:docstrap']);
    grunt.registerTask('full', ['clean', 'concat', 'uglify', 'jsdoc:docstrap']);
    //grunt.registerTask('test', ['clean', 'concat', 'jasmine']);
    //grunt.registerTask('full', ['clean', 'concat', 'uglify', 'jsdoc:docstrap', 'jasmine_node']);
    //grunt.registerTask('nodetests', ['clean', 'concat', 'jasmine_node']);
    //grunt.registerTask('webtests', ['concat', 'jasmine']);
    //grunt.registerTask('tests', ['concat', 'jasmine', 'jasmine_node']);
    //grunt.registerTask('deploy', ['maven', 'clean']);

};