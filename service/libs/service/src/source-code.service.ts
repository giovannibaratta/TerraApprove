import {CreateSourceCode, SourceCode} from "@libs/domain"
import {Inject, Injectable} from "@nestjs/common"
import {
  SOURCE_CODE_REPOSITORY_TOKEN,
  SourceCodeRepository
} from "./interfaces/source-code.interfaces"

@Injectable()
export class SourceCodeService {
  constructor(
    @Inject(SOURCE_CODE_REPOSITORY_TOKEN)
    private readonly sourceCodeRepo: SourceCodeRepository
  ) {}

  async createSourceCodeRef(request: CreateSourceCode): Promise<SourceCode> {
    return this.sourceCodeRepo.createSourceCode(request)
  }
}
