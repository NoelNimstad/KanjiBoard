const path = require('path');

module.exports =
{
    mode: 'production',
    entry: './build/js/kb.js',
    output:
    {
        path: path.resolve(__dirname, 'build/dist'),
        filename: 'kb.bundle.js',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
    resolve:
    {
        extensions: ['.js'],
    },
};
