import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { BaseEntity } from "../../database/entities/base-entity.entity";
import { v4 as uuid } from "uuid";
import { User } from "../../users/entities/user.entity";

@Entity({ tableName: "files" })
export class File extends BaseEntity {
  @PrimaryKey()
  id: string = uuid();

  @Property()
  owner: string;

  @Property()
  filename: string;

  @Property()
  file_type: string;

  @Property()
  path: string;

  @Property()
  org: string;

  constructor(owner: string, filename: string, file_type: string, org: string) {
    super();
    this.filename = filename;
    this.file_type = file_type;
    this.org = org;
    this.owner = owner;
  }
}
