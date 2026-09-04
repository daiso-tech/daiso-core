handler: async ({ res }) => {
    return res.withoutCookies().setBody("All cookies stripped");
};
