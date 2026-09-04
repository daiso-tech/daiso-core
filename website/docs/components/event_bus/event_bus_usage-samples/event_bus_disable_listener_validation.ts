const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
    eventMapSchema: {
        "user.created": z.object({
            userId: z.string(),
            name: z.string(),
        }),
    },
    shouldValidateListeners: false,
});
