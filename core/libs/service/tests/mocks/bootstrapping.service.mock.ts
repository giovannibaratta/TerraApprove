import {BootstrappingService} from "@libs/service/bootstrapping/bootstrapping.service"
import {ToInterface} from "@libs/testing/class-to-interface"
import {rejectPromiseMock} from "@libs/testing/mock-functions"
import {Injectable} from "@nestjs/common"

@Injectable()
export class BootstrappingServiceMock
  implements ToInterface<BootstrappingService>
{
  bootstrap = rejectPromiseMock()
  setConfigurationLocation = rejectPromiseMock()
  setTerraformPlanLocation = rejectPromiseMock()
  setTerraformCodeBaseLocation = rejectPromiseMock()
}
