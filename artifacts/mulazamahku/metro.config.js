const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(projectRoot);

// Pnpm monorepo: watch the workspace root so Metro can resolve packages
// from the shared .pnpm store at the workspace root
config.watchFolders = [workspaceRoot];

config.resolver = {
  ...(config.resolver ?? {}),
  // Block the _tmp_ directories that expo-notifications generates
  // during Android native builds — they don't exist in Expo Go / web
  blockList: [
    /node_modules\/.*expo-notifications_tmp_\d+.*/,
  ],
  nodeModulesPaths: [
    path.join(projectRoot, "node_modules"),
    path.join(workspaceRoot, "node_modules"),
  ],
};

module.exports = config;
