import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/app/(.*)$": "<rootDir>/src/app/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/services/(.*)$": "<rootDir>/src/services/$1",
    "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
    "^@/constants/(.*)$": "<rootDir>/src/constants/$1",
    "^@/models/(.*)$": "<rootDir>/src/models/$1",
  },
  // Coverage thresholds - fail tests if coverage drops below these values
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 60,
      lines: 75,
      statements: 75,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
