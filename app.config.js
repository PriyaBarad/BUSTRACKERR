module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      eas: {
        projectId: "ebeb2fbc-63e6-4727-b6e8-d189d5c01df4",
      },
      buildDate: new Date().toISOString(),
    },
  };
};