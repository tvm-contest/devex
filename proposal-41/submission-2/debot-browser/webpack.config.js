const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin")
const PATHS = {
	src: path.join(__dirname, 'src'),
	build: path.join(__dirname, 'build-element')
}

const common = {
	entry: {
		'debot-browser': `${PATHS.src}/elements/browser/index.tsx`
	},
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
	output: {
		path: PATHS.build,
		filename: '[name].js'
	},
	module: {
		rules: [
      {
        test: /\.tsx?$/,
        use: [{
					loader: 'ts-loader',
					options: {
						configFile: "tsconfig.base.json"
					}
				}],
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      }
		]
	},
	optimization: {
		minimize: true,
		minimizer: [
			new UglifyJsPlugin({
				sourceMap: true
			})
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify('production')
			}
		}),
		new CopyPlugin({
      patterns: [
				"public/tonclient.wasm"
      ],
    }),
	]
}

module.exports = common