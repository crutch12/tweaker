export default {
  sourceDir: "./dist",
  artifactsDir: "./signed-extensions",

  verbose: true,

  sign: {
    apiKey: process.env.MOZILLA_ADDONS_JWT_ISSUER,
    apiSecret: process.env.MOZILLA_ADDONS_JWT_SECRET,
    channel: "unlisted",
  },
};
