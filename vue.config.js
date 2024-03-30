const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  filenameHashing: false,
  publicPath: "/gofree/",
  css: {
    extract: true,
  },
  configureWebpack: {
    optimization: {
      splitChunks: false,
    }
  },
})
