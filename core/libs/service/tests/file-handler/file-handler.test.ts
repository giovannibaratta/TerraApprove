// eslint-disable-next-line node/no-unpublished-import
import {fs} from "memfs"
import {either} from "fp-ts"
// eslint-disable-next-line node/no-unpublished-import
import {Test} from "@nestjs/testing"
import {FileHandler} from "@libs/service/file-handler/file-handler"

jest.mock("fs", () => fs)

describe("FileHandler", () => {
  let fileHandler: FileHandler

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FileHandler]
    }).compile()

    fileHandler = module.get<FileHandler>(FileHandler)
  })

  it('should return "directory_not_found" when the folder does not exist', () => {
    // When
    const result = fileHandler.getTerraformFilesInFolder("/tmp/does-not-exist")

    // Expect
    expect(result).toEqual(either.left("directory_not_found"))
  })

  it('should return "not_a_directory" when the path is not a directory', () => {
    // Given
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
