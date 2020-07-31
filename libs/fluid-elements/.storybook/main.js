
module.exports = {
  stories: ['../**/*.stories.{js,md,mdx}'],
  addons: [
    'storybook-prebuilt/addon-knobs/register.js',
    'storybook-prebuilt/addon-docs/register.js',
    'storybook-prebuilt/addon-viewport/register.js',
  ],
  esDevServer: {
    // custom es-dev-server options
    nodeResolve: true,
    watch: true,
    open: true,
    // For bazel and the esDevServer to find the correct modules,
    // we need to specify the node_modules dir based on the bazel
    // structure.
    moduleDirs: ["external/npm/node_modules/"]
  },
};
