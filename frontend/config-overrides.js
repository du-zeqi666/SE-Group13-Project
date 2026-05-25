module.exports = {
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      const { onBeforeSetupMiddleware, onAfterSetupMiddleware, ...rest } = config;
      return {
        ...rest,
        setupMiddlewares: (middlewares, devServer) => {
          if (onBeforeSetupMiddleware) {
            onBeforeSetupMiddleware(devServer);
          }
          if (onAfterSetupMiddleware) {
            onAfterSetupMiddleware(devServer);
          }
          return middlewares;
        },
      };
    };
  },
};
