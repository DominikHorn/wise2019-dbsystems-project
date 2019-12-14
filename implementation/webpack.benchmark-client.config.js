const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const webpack = require("webpack");

const nodeEnv = process.env.NODE_ENV;
const OUTPUT_BUNDLE_NAME = "benchmark.bundle.js";
const SRC_DIR_NAME = "benchmark-client";
const NAME = "benchmark-client";

const plugins = [
  new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  new CleanWebpackPlugin()
];

let entry = [
  "babel-polyfill",
  path.resolve(path.join(__dirname, `./src/${SRC_DIR_NAME}/index.ts`))
];

module.exports = {
  entry,
  plugins,
  devtool: false,
  mode: "production",
  name: NAME,
  target: "node",
  output: {
    filename: OUTPUT_BUNDLE_NAME,
    path: path.resolve(__dirname, `dist/${SRC_DIR_NAME}`)
  },
  resolve: {
    extensions: [
      ".webpack-loader.js",
      ".web-loader.js",
      ".loader.js",
      ".ts",
      ".tsx",
      ".js",
      ".jsx"
    ],
    modules: [path.resolve(__dirname, "node_modules")]
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            babelrc: false,
            cacheDirectory: true,
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              "@babel/preset-typescript"
            ],
            plugins: ["transform-class-properties"]
          }
        }
      }
    ]
  },
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false
  }
};
