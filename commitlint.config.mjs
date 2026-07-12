export default {
    extends: ['@commitlint/config-conventional'],
    // The Changesets release action commits/opens PRs titled "Version Packages".
    ignores: [(message) => message.startsWith('Version Packages')],
};
