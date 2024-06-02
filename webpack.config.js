'use strict';

const path = require('node:path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const distributionFolder = 'dist';

// eslint-disable-next-line jsdoc/require-jsdoc
module.exports = environment => {
    let environmentPlugin;
    if (environment.BIBLE_API_KEY !== undefined) {
        environmentPlugin = new webpack.EnvironmentPlugin({'BIBLE_API_KEY': environment.BIBLE_API_KEY});
    }
    let developmentMode = environment === undefined || environment.NODE_ENV !== 'production';

    return {
        // mode: devMode ? 'development' : 'production',
        mode: 'development',
        entry: {
            'background': './js/background.js',
            'biblePreviewer': './js/biblePreviewer.js',
            'options': './js/options.js',
            'popup': './js/popup.js'
        },
        output: {
            filename: 'js/[name].js',
            path: path.resolve(__dirname, distributionFolder)
        },
        devtool: developmentMode ? 'source-map' : false,
        module: {
            rules: [
                {
                    test: /\.s?css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    ident: 'postcss',
                                    plugins: [
                                        autoprefixer(),
                                    ]
                                }
                            }
                        },
                        'sass-loader'
                    ]
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            'presets': [[
                                '@babel/preset-env', {
                                    'targets':
                                    {
                                        'chrome': '58',
                                        'firefox': '57'
                                    }
                                }
                            ]]
                        }
                    }
                }
            ]
        },
        plugins: [
            // If an environment variable exists for the BIBLE_API_KEY, then use that.
            // Otherwise, use the value from the .env file.
            environmentPlugin ?? new Dotenv(),
            new CleanWebpackPlugin({verbose: true}),
            new MiniCssExtractPlugin({
                filename: 'css/[name].css',
                chunkFilename: '[id].css'
            }),
            new CopyWebpackPlugin({
                patterns: [
                    'manifest.json',
                    'html/*.html',
                    'icons/**/*'
                ]
            })
        ],
        stats:
        {
            colors: true
        }
    };
};
