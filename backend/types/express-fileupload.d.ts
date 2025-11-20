declare module "express-fileupload" {
  import { RequestHandler } from "express";

  interface UploadedFile {
    name: string;
    encoding: string;
    mimetype: string;
    mv(path: string): Promise<void>;
    size: number;
    data: Buffer;
    tempFilePath: string;
    truncated: boolean;
    md5: string;
  }

  interface FileArray {
    [fieldname: string]: UploadedFile | UploadedFile[];
  }

  interface Options {
    createParentPath?: boolean;
    limits?: {
      fileSize?: number;
    };
    abortOnLimit?: boolean;
    safeFileNames?: boolean | RegExp;
    preserveExtension?: number | boolean;
    useTempFiles?: boolean;
    tempFileDir?: string;
    debug?: boolean;
  }

  function fileUpload(options?: Options): RequestHandler;

  export default fileUpload;

  export {
    UploadedFile,
    FileArray,
    Options
  };
}
