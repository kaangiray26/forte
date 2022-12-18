'use strict';

var app = require('./index.js');

require('greenlock-express')
    .init({
        packageRoot: __dirname,

        // where to look for configuration
        configDir: './greenlock.d',

        // whether or not to run at cloudscale
        cluster: false
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
