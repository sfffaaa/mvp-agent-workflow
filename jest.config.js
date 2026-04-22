import { createDefaultEsmPreset } from "ts-jest"

const preset = createDefaultEsmPreset({
  tsconfig: { isolatedModules: true },
})

export default {
  ...preset,
  testEnvironment: "node",
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  injectGlobals: true,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
}
