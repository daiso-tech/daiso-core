type MiddlewareArgs<TParameters, TReturn> = {
    // Original function arguments
    args: TParameters;
    // Function to invoke next middleware or original function
    next: NextFn<TParameters, TReturn>;
    // Name of the function/method
    name: string;
};
