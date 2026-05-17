/** @type {import('cz-customizable').Options} */
module.exports = {
    types: [
        { value: "feature", name: "feature:      A new feature" },
        {
            value: "enhancement",
            name: "enhancement:  An improvement to an existing feature",
        },
        { value: "bug", name: "bug:          A bug fix" },
        { value: "fix", name: "fix:          A general fix (non-bug)" },
        {
            value: "refactor",
            name: "refactor:     A code change that neither fixes a bug nor adds a feature",
        },
        { value: "docs", name: "docs:         Documentation only changes" },
        {
            value: "chore",
            name: "chore:        Build process, CI CD, tooling, or dependency updates",
        },
    ],
    allowCustomScopes: true,
    allowBreakingChanges: ["feature", "enhancement", "bug", "fix", "refactor"],
    skipQuestions: ["footer"],
    subjectLimit: 100,
};
