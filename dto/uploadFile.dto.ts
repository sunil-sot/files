import { ApiProperty } from "@nestjs/swagger";

export class UploadFileDto {
  @ApiProperty({
    description: 'File extension. For e.g., in case the file is "example.png" then send in ".png"',
  })
  file_type: string;
}
