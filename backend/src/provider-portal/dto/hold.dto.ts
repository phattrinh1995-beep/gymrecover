import { IsString, MaxLength, MinLength } from 'class-validator';

export class PlaceHoldDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
