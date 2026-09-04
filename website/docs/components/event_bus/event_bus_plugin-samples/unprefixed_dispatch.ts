adapter.dispatch("user.created", data);
// -> dispatches "user.created"
adapter.addListener("user.created", listener);
// -> listens to "user.created"
