handler: async ({ res }) => {
    return res
        .putCookie("session", "abc123", {
            httpOnly: true,
            secure: true,
            maxAge: TimeSpan.fromHours(1),
            path: "/",
            sameSite: "Lax",
        })
        .setBody("Cookie set");
};
