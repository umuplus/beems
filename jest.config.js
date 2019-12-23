module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    testPathIgnorePatterns: [ '/node_modules/', 'dist/', 'tests/*.ts' ],
    roots: [ '<rootDir>/src/tests' ],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
};