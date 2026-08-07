import packageJson from "../../package.json"

export const PACKAGE_NAME: string = packageJson.name;
export const PACKAGE_VERSION: string = packageJson.version;

const excludedComponents = ["utilities"]
const allComponents = [
    ...new Set(
        [
            ...Object.keys(packageJson.exports).map(
                (path) =>
                    path
                        .split("/")
                        .filter((path) => path !== ".")
                        .filter((path) => path !== "")[0],
            ),
        ]
            .filter((value) => value !== undefined)
            .map((component) => component.toLowerCase()),
    ),
].filter((component) => !excludedComponents.includes(component));

export const COMPONENT_COUNT = allComponents.length