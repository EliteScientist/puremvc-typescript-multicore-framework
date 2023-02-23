
export default {
	preset: 'ts-jest',
	roots: ['<rootDir>/spec'],
	collectCoverage: true,
	collectCoverageFrom: ['<rootDir>/src/**'],
	coverageDirectory: '<rootDir>/coverage/jest',
	transformIgnorePatterns: [`node_modules`],
	moduleDirectories: ["<rootDir>/src", "<rootDir>/node_modules"]
}
