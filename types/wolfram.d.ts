// wolfram.d.ts

declare module "@wolfram-alpha/wolfram-alpha-api" {
  type OutputFormat = "string" | "json" | "image" | "xml";

  type FetchParams = {
    params: {
      url: string;
      output: OutputFormat;
    };
  };

  type FormatParams = {
    params: {
      data: string;
      output: OutputFormat;
      statusCode: number;
      contentType: string;
    };
  };

  type Pod = {
    title: string;
    scanner: string;
    id: string;
    position: number;
    error: boolean;
    numsubpods: number;
    subpods: SubPod[];
  };

  type SubPod = {
    title: string;
    img: {
      src: string;
      alt: string;
      title: string;
    };
    plaintext: string;
  };

  type FullResult = {
    success: boolean;
    error: boolean;
    numpods: number;
    datatypes: string;
    timedout: string;
    timing: number;
    parsetiming: number;
    parsetimedout: boolean;
    recalculate: string;
    id: string;
    host: string;
    server: string;
    related: string;
    version: string;
    pods: Pod[];
  };

  function createApiParams(
    baseUrl: string,
    input: string | object,
    output?: OutputFormat,
  ): Promise<FetchParams>;

  function fetchResults(params: FetchParams): Promise<FormatParams>;

  function formatResults(params: FormatParams): Promise<string | object>;

  class WolframAlphaAPI {
    constructor(appid: string);

    getSimple(input: string | object): Promise<string>;

    getShort(input: string | object): Promise<string>;

    getSpoken(input: string | object): Promise<string>;

    getFull(input: string | object): Promise<FullResult>;
  }

  function initializeClass(appid: string): WolframAlphaAPI;

  export = initializeClass;
}
