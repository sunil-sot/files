import { ApiProperty } from "@nestjs/swagger";

export class UploadFileResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  file_type: string;

  @ApiProperty()
  url: string;
}
