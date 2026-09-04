import { Container } from "eridu-tech/di";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { ExecutionContext } from "eridu-tech/execution-context";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

const container = new Container({
    executionContext,
});
