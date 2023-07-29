export const rejectPromiseMock = () => {
  return () => {
    throw new Error("This is a mock function.")
  }
}
