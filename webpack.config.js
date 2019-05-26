const path = require('path');

module.exports = {
    mode: 'development', // from webpack-4.0
    entry: './src/main.ts',
    output: {
        filename: 'main.js',
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