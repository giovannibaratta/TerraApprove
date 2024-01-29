/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/source-code-refs": {
    /** Create a reference to the source code in the system */
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["PostSourceCode"]
        }
      }
      responses: {
        /** @description Source code reference created successfully' */
        201: {
          content: never
        }
      }
    }
  }
  "/runs": {
    /** Create a run in the system */
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["PostRun"]
        }
      }
      responses: {
        /** @description Run created successfully */
        201: {
          content: never
        }
      }
    }
  }
  "/runs/{run_id}": {
    /** Get a run in the system */
    get: {
      parameters: {
        path: {
          run_id: string
        }
      }
      responses: {
        /** @description Run retrieved successfully */
        200: {
          content: {
            "application/json": components["schemas"]["GetRun"]
          }
        }
      }
    }
  }
  "/approvals": {
    /** Create an approval in the system */
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["PostApproval"]
        }
      }
      responses: {
        /** @description Approval created successfully */
        201: {
          content: never
        }
      }
    }
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    PostSourceCode: components["schemas"]["S3Payload"]
    PostRun: {
      /**
       * @description The ID managedy by the system of the source code reference. The plan must be generated
       * starting from the specified source code.
       */
      source_code_id?: string
      plan_ref?: components["schemas"]["S3Payload"]
    }
    S3Payload: {
      s3: {
        /** Format: uri */
        url?: string
      }
    }
    PostApproval: {
      /** @description The ID managedy by the system of the run. */
      run_id: string
      approval: {
        type: string
        comment?: string
      }
    }
    GetRun: {
      /**
       * Format: uuid
       * @description The ID managedy by the system of the run.
       */
      id: string
      state: string
      /** Format: date-time */
      created_at: string
      /** Format: date-time */
      updated_at: string
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type $defs = Record<string, never>

export type external = Record<string, never>

export type operations = Record<string, never>
