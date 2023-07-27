import {Inject, Injectable} from "@nestjs/common"
import {IPlanReader, PLAN_READER, ValidationError} from "./plan-reader"
import {TerraformDiffMap} from "@libs/domain/terraform/diffs"
import {Either} from "fp-ts/lib/Either"

@Injectable()
export class PlanReaderService {
  constructor(@Inject(PLAN_READER) private readonly planReader: IPlanReader) {}

  async readPlan(
    planLocation: string
  ): Promise<Either<ValidationError, TerraformDiffMap>> {
    return this.planReader.readPlan(planLocation)
  }
}
