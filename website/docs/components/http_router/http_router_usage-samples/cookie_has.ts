handler: async ({ res }) => {
    if (res.hasCookies("session")) {
        res.removeCookie("session");
    }
    return res.setBody("Checked");
};
