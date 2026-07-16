/**
 * @module HttpRouter
 */

/**
 * HTTP informational status codes (1xx).
 * Indicates that the request was received and the process is continuing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpInformationalStatus = "100" | "101" | "102" | "103";

/**
 * HTTP success status codes (2xx).
 * Indicates that the request was successfully received, understood, and accepted.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpSuccessStatus =
    | "200"
    | "201"
    | "202"
    | "203"
    | "204"
    | "205"
    | "206"
    | "207"
    | "208"
    | "226";

/**
 * HTTP redirection status codes (3xx).
 * Indicates that further action is needed to complete the request.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpRedirectStatus =
    | "300"
    | "301"
    | "302"
    | "303"
    | "304"
    | "305"
    | "307"
    | "308";

/**
 * HTTP client error status codes (4xx).
 * Indicates that the request contains bad syntax or cannot be fulfilled.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpClientErrorStatus =
    | "400"
    | "401"
    | "402"
    | "403"
    | "404"
    | "405"
    | "406"
    | "407"
    | "408"
    | "409"
    | "410"
    | "411"
    | "412"
    | "413"
    | "414"
    | "415"
    | "416"
    | "417"
    | "418"
    | "421"
    | "422"
    | "423"
    | "424"
    | "425"
    | "426"
    | "428"
    | "429"
    | "431"
    | "451";

/**
 * HTTP server error status codes (5xx).
 * Indicates that the server failed to fulfill a valid request.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpServerErrorStatus =
    | "500"
    | "501"
    | "502"
    | "503"
    | "504"
    | "505"
    | "506"
    | "507"
    | "508"
    | "509"
    | "510"
    | "511";

/**
 * Union of all HTTP error status codes (4xx and 5xx).
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpErrorStatus = HttpClientErrorStatus | HttpServerErrorStatus;

/**
 * Union of all HTTP status codes (1xx through 5xx).
 * Provides autocompletion for well-known status codes while accepting any string.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpStatus =
    | HttpInformationalStatus
    | HttpSuccessStatus
    | HttpRedirectStatus
    | HttpErrorStatus;
