module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@domain': './src/domain',
            '@data': './src/data',
            '@infrastructure': './src/infrastructure',
            '@presentation': './src/presentation',
          },
        },
      ],
    ],
  };
};
