import { ApiProperty } from "@nestjs/swagger";

export class CreateFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  file_type: string;

  @ApiProperty()
  org: string;

  @ApiProperty()
  user_id: string;
}
