var grunt = require('grunt');
grunt.loadNpmTasks('grunt-aws-lambda');
grunt.loadNpmTasks('grunt-simple-mocha');

grunt.initConfig({
    lambda_invoke: {
        launch: {
            options: {
                file_name: 'run.js',
                event: 'events/launch.json'
            }
        },
        specials: {
            options: {
                file_name: 'run.js',
                event: 'events/getSpecials.json'
            }
        },
        sellers: {
            options: {
                file_name: 'run.js',
                event: 'events/getTopSellers.json'
            }
        },
        madness: {
            options: {
                file_name: 'run.js',
                event: 'events/getMadness.json'
            }
        },
        new: {
            options: {
                file_name: 'run.js',
                event: 'events/newReleases.json'
            }
        },
        yesdeals: {
            options: {
                file_name: 'run.js',
                event: 'events/dealsYes.json'
            }
        },
        featured: {
            options: {
                file_name: 'run.js',
                event: 'events/getTodaysFeatured.json'
            }
        }
    }
});

var env = grunt.option('env') || 'default';
