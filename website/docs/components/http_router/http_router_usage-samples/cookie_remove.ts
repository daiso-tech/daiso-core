handler: async ({ res }) => {
    return res.removeCookie("session").setBody("Cookie removed");
};
