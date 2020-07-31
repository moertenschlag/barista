import resolve from '@rollup/plugin-node-resolve';
const localResolve = require('rollup-plugin-local-resolve');

export default (args) => {
  return {
    plugins: [
      resolve(),
      localResolve(),
    ],
    external: [
      'lit-element',
      // Lit-html does have sub-imports, that would not be picked up without
      // a regex.
      /lit-html.*/,
      // Treat other fluid-elements as external dependencies as well.
      /@dynatrace\/fluid\-elements\/*/,
    ]
  };
};
