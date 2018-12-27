'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const distFolder = 'dist';

let pathsToClean = [
    distFolder,
    '*.zip'
];

module.exports = env => {
    let devMode = env === undefined || env.NODE_ENV !== 'production';

    return {
        target: 'node',
        mode: devMode ? 'development' : 'production',
        entry: {
            'background': './js/background.js',
            'biblePreviewer': './js/biblePreviewer.js',
            'options': './js/options.js',
            'popup': './js/popup.js'
        },
        output: {
            filename: 'js/[name].js',
            path: path.resolve(__dirname, distFolder)
        },
        devtool: devMode ? 'source-map' : false,
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    autoprefixer(),
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(pathsToClean, {}),
            new MiniCssExtractPlugin({
                filename: 'css/[name].css',
                chunkFilename: '[id].css'
            }),
            new CopyWebpackPlugin([
                'manifest.json',
                'manifest.json',
                'html/*.html',
                'html/*.html',
                'icons/**/*',
                'icons/**/*'
            ], {})
        ]
    };
};
