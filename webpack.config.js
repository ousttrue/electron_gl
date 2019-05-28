const path = require('path');

const main = {
    mode: 'development', // from webpack-4.0
    target: 'electron-main',
    entry: path.join(__dirname, 'src', 'electron.ts'),
    node: {
        __dirname: false,
        __filename: false
    },    
    output: {
        filename: 'electron.js',
        path: path.join(__dirname, 'public') // absolute path
    },
    devtool: 'inline-source-map',

    module: {
        rules: [{
            test: /\.ts$/,
            use: "ts-loader"
        }]
    },
    resolve: {
        extensions: [".ts"]
    }
}


var renderer = {
    mode: 'development',
    target: 'electron-renderer',
    devtool: 'cheap-module-source-map', // avoid unsafe-eval
    entry: path.join(__dirname, 'src', 'renderer.ts'),
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'public')
    },

    module: {
        rules: [{
            test: /\.ts$/,
            use: "ts-loader"
        }]
    },
    resolve: {
        extensions: [".ts"]
    }
};


module.exports = [
    main, renderer
];