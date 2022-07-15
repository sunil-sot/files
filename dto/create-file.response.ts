import { ApiProperty } from "@nestjs/swagger";

export class CreateFileResponse {
  @ApiProperty()
  id: string;
}
