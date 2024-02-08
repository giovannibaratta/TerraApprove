import {Injectable, OnModuleInit} from "@nestjs/common"
import {PrismaClient} from "@prisma/client"

@Injectable()
export class DatabaseClient extends PrismaClient implements OnModuleInit {
  constructor() {
    super()
  }

  onModuleInit() {
    this.$connect()
  }
}
