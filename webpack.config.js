'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const distFolder = 'dist';

// eslint-disable-next-line jsdoc/require-jsdoc
module.exports = env => {
    let devMode = env === undefined || env.NODE_ENV !== 'production';

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
            path: path.resolve(__dirname, distFolder)
        },
        devtool: devMode ? 'source-map' : false,
        module: {
            rules: [
                {
                    test: /\.s?css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
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
                        }
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
