const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const WebpackShellPlugin = require("webpack-shell-plugin");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

const nodeEnv = process.env.NODE_ENV;
const isProduction = nodeEnv !== "development";

const OUTPUT_BUNDLE_NAME = "server.bundle.js";

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
  path.resolve(path.join(__dirname, "./src/server/index.ts"))
];

console.log(`Webpack Server is in ${nodeEnv} mode`);
if (!isProduction) {
  plugins.push(
    new WebpackShellPlugin({
      onBuildEnd: ["yarn run nodemon:server"]
    })
  );
  plugins.push(new webpack.HotModuleReplacementPlugin());
  entry = ["webpack/hot/poll?1000", ...entry];
}

module.exports = {
  entry,
  plugins,
  devtool: false,
  externals: [
    nodeExternals({
      whitelist: ["webpack/hot/poll?1000"]
    })
  ],
  mode: nodeEnv,
  name: "server",
  target: "node",
  output: {
    filename: OUTPUT_BUNDLE_NAME,
    path: path.resolve(__dirname, "dist/server")
  },
  resolve: {
    extensions: [
      ".webpack-loader.js",
      ".web-loader.js",
      ".loader.js",
      ".ts",
      ".js"
    ],
    modules: [path.resolve(__dirname, "node_modules")]
  },
  module: {
    rules: [
      {
        test: /\.(j|t)s$/,
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
      },
      {
        test: /\.graphql$/,
        exclude: /node_modules/,
        loader: "graphql-tag/loader"
      },
      {
        test: /\.sql$/,
        exclude: /node_modules/,
        loader: "raw-loader"
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
