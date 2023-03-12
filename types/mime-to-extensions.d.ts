declare module "mime-to-extensions" {
  const mime: {
    lookup: (path: string) => string;
    contentType: (type: string) => string;
    extension: (type: string) => string;
    allExtensions: (type: string) => string[];
    charset: (type: string) => string;
  };
  export default mime;
}
