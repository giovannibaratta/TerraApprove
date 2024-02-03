/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/source-code-refs": {
    /** Create a reference to the source code in the system */
    post: operations["createSourceCodeRef"];
  };
  "/runs": {
    /** Create a run in the system */
    post: operations["createRun"];
  };
  "/runs/{run_id}": {
    /** Get a run in the system */
    get: operations["getRun"];
  };
  "/approvals": {
    /** Create an approval in the system */
    post: operations["createApproval"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    readonly PostSourceCode: components["schemas"]["S3Payload"];
    readonly PostRun: {
      /**
       * @description The ID managedy by the system of the source code reference. The plan must be generated
       * starting from the specified source code.
       */
      readonly source_code_id?: string;
      readonly plan_ref?: components["schemas"]["S3Payload"];
    };
    readonly S3Payload: {
      readonly s3: {
        /** Format: uri */
        readonly url?: string;
      };
    };
    readonly PostApproval: {
      /** @description The ID managedy by the system of the run. */
      readonly run_id: string;
      readonly approval: {
        readonly type: string;
        readonly comment?: string;
      };
    };
    readonly GetRun: {
      /**
       * Format: uuid
       * @description The ID managedy by the system of the run.
       */
      readonly id: string;
      readonly state: string;
      /** Format: date-time */
      readonly created_at: string;
      /** Format: date-time */
      readonly updated_at: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {

  /** Create a reference to the source code in the system */
  createSourceCodeRef: {
    readonly requestBody: {
      readonly content: {
        readonly "application/json": components["schemas"]["PostSourceCode"];
      };
    };
    responses: {
      /** @description Source code reference created successfully' */
      201: {
        content: never;
      };
    };
  };
  /** Create a run in the system */
  createRun: {
    readonly requestBody: {
      readonly content: {
        readonly "application/json": components["schemas"]["PostRun"];
      };
    };
    responses: {
      /** @description Run created successfully */
      201: {
        content: never;
      };
    };
  };
  /** Get a run in the system */
  getRun: {
    parameters: {
      path: {
        run_id: string;
      };
    };
    responses: {
      /** @description Run retrieved successfully */
      200: {
        content: {
          readonly "application/json": components["schemas"]["GetRun"];
        };
      };
    };
  };
  /** Create an approval in the system */
  createApproval: {
    readonly requestBody: {
      readonly content: {
        readonly "application/json": components["schemas"]["PostApproval"];
      };
    };
    responses: {
      /** @description Approval created successfully */
      201: {
        content: never;
      };
    };
  };
}
