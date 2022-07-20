import { HttpException, HttpStatus, Injectable, Inject } from "@nestjs/common";
import { CreateFileDto } from "./dto/create-file.dto";
import { UpdateFileDto } from "./dto/update-file.dto";
import { S3 } from "aws-sdk";
import { ConfigService } from "@nestjs/config";
import { v4 as uuid } from "uuid";
import * as mime from "mime-types";
import { UploadFileDto } from "./dto/uploadFile.dto";
import { InjectRepository } from "@mikro-orm/nestjs";
import { File } from "./entities/file.entity";
import { EntityRepository } from "@mikro-orm/postgresql";
import { User } from "src/users/entities/user.entity";
import { UserObject } from "src/users/dto/user.object";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { auditActionTypeENUM } from "src/audit-logs/entities/common";

enum operationType {
  CREATE = "File Created",
  UPDATE = "File Updated",
  COPY = "File Copied",
  VIEW = "File Viewed",
  DELETE = "File Deleted",
}

@Injectable()
export class FilesService {
  private readonly awsCredentials;
  private readonly s3Client: S3;
  tableName: string;

  constructor(
    @InjectRepository(File)
    private fileRepository: EntityRepository<File>,
    @Inject(AuditLogsService)
    private auditLog: AuditLogsService,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
    private config: ConfigService,
  ) {
    this.auditLog.initialize("file");
    this.tableName = "file";

    this.awsCredentials = {
      accessKeyId: config.get<string>("aws.accessKeyId"),
      secretAccessKey: config.get<string>("aws.secretAccessKey"),
    };
    this.s3Client = new S3({
      // endpoint: config.get<string>("aws.endpoint"),
      region: config.get<string>("aws.region"),
      credentials: this.awsCredentials,
      signatureVersion: "v4",
    });
    this.config = config;
  }

  async getPresignedURL(createFileDto: UploadFileDto) {
    let id = uuid();
    let params = {
      Bucket: this.config.get<string>("aws.bucket"),
      Key: `temp/${id}.${createFileDto.file_type}`,
      Expires: 600,
      ContentType: mime.lookup(createFileDto.file_type),
    };
    let url = await this.s3Client.getSignedUrlPromise("putObject", params);
    return { id, url };
  }

  async copyTo(createFileDto: CreateFileDto, user: any): Promise<string> {
    console.log("cop to ", JSON.stringify(createFileDto));
    let fileRecord = new File(createFileDto.user_id, createFileDto.filename, createFileDto.file_type, createFileDto.org);
    let id: string = fileRecord.id;
    let oldFilePath: string = `temp/${createFileDto.id}.${createFileDto.file_type}`;
    let newFilePath: string = `uploads/${id}.${createFileDto.file_type}`;
    let params: any = {
      Bucket: this.config.get<string>("aws.bucket"),
      CopySource: `${this.config.get<string>("aws.bucket")}/${oldFilePath}`,
      Key: newFilePath,
    };
    let res = await this.s3Client.copyObject(params).promise();
    fileRecord.path = newFilePath;
    params = {
      Bucket: this.config.get<string>("aws.bucket"),
      Key: oldFilePath,
    };
    res = await this.s3Client.deleteObject(params).promise();
    await this.fileRepository.persist(fileRecord);
    await this.fileRepository.flush();
    await this.auditLog.create({
      type: auditActionTypeENUM.Create,
      entityType: "file",
      entityID: id,
      entityName: createFileDto.filename+'.'+createFileDto.file_type,
      operationType: operationType.COPY,
      valueBefore: {path: oldFilePath},
      valueAfter: {path: newFilePath},
      ref: {},
      owner: user.id,
      org: createFileDto.org,
      tableName: this.tableName,
    });
    console.log(
      await this.auditLog.create({
        type: auditActionTypeENUM.Create,
        entityType: "file",
        entityID: id,
        entityName: createFileDto.filename+'.'+createFileDto.file_type,
        operationType: operationType.CREATE,
        valueBefore: null,
        valueAfter: fileRecord,
        ref: {},
        owner: user.id,
        org: createFileDto.org,
        tableName: this.tableName,
      }),
    );
    return id;
  }

  findAll() {
    return `This action returns all files`;
  }

  async findOne(id: string, user: any) {
    let fileRecord = await this.fileRepository.findOne({ $or: [{ id }] }, { fields: ["id", "filename", "file_type", "path"]});
    let res = await this.s3Client.getSignedUrlPromise("getObject", {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileRecord.path,
      Expires: 600,
      ResponseContentDisposition: 'attachment; filename ="' + `${fileRecord.filename}.${fileRecord.file_type}` + '"',
    });
   
    console.log(
      await this.auditLog.create({
        type: auditActionTypeENUM.View,
        entityType: "file",
        entityID: id,
        entityName: fileRecord.filename+"."+fileRecord.file_type,
        operationType: operationType.VIEW,
        valueBefore: null,
        valueAfter: res,
        ref: {},
        owner: user.id,
        org: user.org.id,
        tableName: this.tableName,
      }),
    );
    return {
      fileRecord,
      url: res
    };
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  async remove(id: string, user: any) {
    let fileRecord = await this.fileRepository.findOne({ $or: [{ id }] });
    let params = {
      Bucket: this.config.get<string>("aws.bucket"),
      Key: fileRecord.path,
    };
    let res = await this.s3Client.deleteObject(params).promise();

    console.log(
      await this.auditLog.create({
        type: auditActionTypeENUM.Delete,
        entityType: "file",
        entityID: id,
        entityName: "FileRecord",
        operationType: operationType.DELETE,
        valueBefore: null,
        valueAfter: res,
        ref: {},
        owner: user.id,
        org: user.org.id,
        tableName: this.tableName,
      }),
    );
    return res;
  }
}
