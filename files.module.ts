import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ConfigModule } from "@nestjs/config";
import { File } from "./entities/file.entity";
import { User } from "src/users/entities/user.entity";
import { AuditLogsModule } from "src/audit-logs/audit-logs.module";

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [MikroOrmModule.forFeature([File]), MikroOrmModule.forFeature([User]), ConfigModule, AuditLogsModule],
  exports: [FilesService],
})
export class FilesModule {}
