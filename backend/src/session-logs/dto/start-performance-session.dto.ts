import { IsUUID } from 'class-validator';

export class StartPerformanceSessionDto {
  @IsUUID()
  programInstanceId!: string;
}
