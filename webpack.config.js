const path = require("path");

const config = {
	target: "node",
	entry: {
		index: "./src/index.ts"
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]",
		sourceMapFilename: "[name].js.map"
	},
	devtool: false,
	externals: {
		vscode: "commonjs vscode"
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	module: {
		rules: [{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: "ts-loader"
			}]
		}]
	},
	optimization: {
		minimize: process.argv[3] == "production" ? true : false
	},
	watchOptions: {
		poll: 1000,
		aggregateTimeout: 500,
		ignored: /node_modules/,
	}
};
module.exports = config;