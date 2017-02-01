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
        },
        daily: {
            options: {
                file_name: 'run.js',
                event: 'events/getDailyDeals.json'
            }
        }
    }
});

var env = grunt.option('env') || 'default';
