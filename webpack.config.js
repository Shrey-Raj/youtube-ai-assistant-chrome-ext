const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/service-worker.ts',
    content: './src/content/content.ts',
    inject: './src/content/inject.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/index.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: "public",
          to: ".",
          globOptions: {
            ignore: ["**/.DS_Store"] // Ignore macOS metadata files
          }
        },
        { 
          from: "src/content/inject.ts",
          to: "inject.js"
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};