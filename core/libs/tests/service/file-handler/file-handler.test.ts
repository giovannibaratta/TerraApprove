// eslint-disable-next-line node/no-unpublished-import
import {fs} from "memfs"
import {FileHandler} from "../../../src/service/file-handler/file-handler"
import {either} from "fp-ts"

jest.mock("fs", () => fs)

describe("FileHandler", () => {
  it('should return "directory_not_found" when the folder does not exist', () => {
    // Given
    const fileHandler = new FileHandler()

    // When
    const result = fileHandler.getTerraformFilesInFolder("/tmp/does-not-exist")

    // Expect
    expect(result).toEqual(either.left("directory_not_found"))
  })

  it('should return "not_a_directory" when the path is not a directory', () => {
    // Given
    const fileHandler = new FileHandler()
    const path = "/afile"
    fs.writeFileSync(path, "content")

    // When
    const result = fileHandler.getTerraformFilesInFolder(path)

    // Expect
    expect(result).toEqual(either.left("not_a_directory"))
  })

  it("should read only terraform files", () => {
    // Given
    const dirPath = "/tmp"
    fs.mkdirSync(dirPath)
    const terraformFileName = "aterraformfile.tf"
    fs.writeFileSync(`${dirPath}/${terraformFileName}`, "content")
    // Should be ignored because it is not a terraform file
    fs.writeFileSync(`${dirPath}/notaterraformfile.something`, "content")

    const fileHandler = new FileHandler()

    // When
    const result = fileHandler.getTerraformFilesInFolder(dirPath)

    // Expect
    expect(result).toMatchObject(
      either.right([
        {
          name: terraformFileName
        }
      ])
    )
  })
})
