const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // You might need this for HTML injection

module.exports = {
  entry: './src/pages/courses.js', // Adjust the entry file accordingly
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      }
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.scss'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'), // Adjust as needed
    }),
  ],
};
