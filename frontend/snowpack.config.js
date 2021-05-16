/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    "src": {url: "/src"},
    "public": {url: "/"}
  },
  plugins: [
    '@snowpack/plugin-postcss',
  ],
  routes: [
    {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
};
