'use strict';

import app from './app/index.js';
import greenlock from 'greenlock-express';

greenlock
    .init({
        packageRoot: './',

        // where to look for configuration
        configDir: './greenlock.d',

        maintainerEmail: 'maintain@example.com',

        // whether or not to run at cloudscale
        cluster: false
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);