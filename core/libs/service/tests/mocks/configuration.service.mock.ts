import {ConfigurationService} from "@libs/service/configuration/configuration.service"
import {ToInterface} from "@libs/testing/class-to-interface"
import {rejectPromiseMock} from "@libs/testing/mock-functions"
import {Injectable} from "@nestjs/common"

@Injectable()
export class ConfigurationServiceMock
  implements ToInterface<ConfigurationService>
{
  readConfiguration = rejectPromiseMock()
}
