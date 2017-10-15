const path = require('path');

module.exports = {
  entry: "./src/main.js", // string | object | array

  output: {
    path: path.join(__dirname, "dist/"), // string
    filename: "bundle.js",
  },
  
  module: {
  rules: [
  	
    {
	test: /\.jsx?/,
    }

  ]
  }
}
