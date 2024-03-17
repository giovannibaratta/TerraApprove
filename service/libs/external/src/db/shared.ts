import {Prisma} from "@prisma/client"

const PRISMA_FOREIGN_KEY_VIOLATION_ERROR_CODE = "P2003"

export function isPrismaForeignKeyViolationErrorForTarget(
  error: unknown,
  target: string
): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_FOREIGN_KEY_VIOLATION_ERROR_CODE &&
    error.meta !== undefined &&
    Object.hasOwnProperty.call(error.meta, "field_name") &&
    typeof error.meta.field_name === "string" &&
    error.meta.field_name === target
  )
}
