import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpException, HttpStatus, HttpCode, UseGuards, Req } from "@nestjs/common";
import { FilesService } from "./files.service";
import { CreateFileDto } from "./dto/create-file.dto";
import { UpdateFileDto } from "./dto/update-file.dto";
import { ApiBody, ApiOkResponse } from "@nestjs/swagger";
import { UploadFileResponse } from "./dto/uploadFile.response";
import { UploadFileDto } from "./dto/uploadFile.dto";
import { CreateFileResponse } from "./dto/create-file.response";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBody({ type: CreateFileDto })
  @ApiOkResponse({
    description: "Presigned URL for uploading file is generated.",
    type: CreateFileResponse,
  })
  async copyTo(@Body() createFileDto: CreateFileDto, @Req() req) {
    try {
      let id: string = await this.filesService.copyTo(createFileDto, req.user);
      return {
        id,
      };
    } catch (error) {
      console.error(error);
      throw new HttpException("Some error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post("/upload")
  @HttpCode(200)
  @ApiBody({ type: UploadFileDto })
  @ApiOkResponse({
    description: "Presigned URL for uploading file is generated.",
    type: UploadFileResponse,
  })
  async getPresignedURL(@Body() createFileDto: UploadFileDto) {
    try {
      let { id, url } = await this.filesService.getPresignedURL(createFileDto);
      return {
        id,
        file_type: createFileDto.file_type,
        url,
      };
    } catch (error) {
      console.error(error);
      throw new HttpException("Some error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req) {
    try {
      return await this.filesService.findOne(id, req.user);
    } catch (error) {
      console.error(error);
      throw new HttpException("Some error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(+id, updateFileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req) {
    try {
      await this.filesService.remove(id, req.user);
      return `${id} was successfully removed`;
    } catch (error) {
      console.error(error);
      throw new HttpException("Some error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
