type MiddlewareFn<TParameters, TReturn> = (
    args: MiddlewareArgs<TParameters, TReturn>,
) => TReturn;
