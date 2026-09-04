prefixedAdapter.dispatch("user.created", data);
// -> dispatches "tenant-42:user.created"
prefixedAdapter.addListener("user.created", listener);
// -> listens to "tenant-42:user.created"
