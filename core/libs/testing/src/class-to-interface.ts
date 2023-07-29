// Extract all the functions defined in T
export type ToInterface<T> = {
  [P in keyof T as T[P] extends Function ? P : never]: T[P]
}
