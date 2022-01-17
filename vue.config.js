module.exports = {
    pluginOptions: {
      electronBuilder: {
        nodeIntegration: true,
        
      },
      builderOptions:{
        publish: ['github']
      }
    },
    pages: {
      index: {
        entry: "src/main.js",
        template: "public/index.html",
      },
    },
  };