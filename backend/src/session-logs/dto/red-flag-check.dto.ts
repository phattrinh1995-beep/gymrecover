import { IsBoolean, IsUUID } from 'class-validator';

export class RedFlagCheckDto {
  @IsUUID()
  injuryProfileId!: string;

  @IsBoolean()
  severeOrWorseningPain!: boolean;

  @IsBoolean()
  newOrIncreasingSwelling!: boolean;

  @IsBoolean()
  fever!: boolean;

  @IsBoolean()
  numbnessOrTingling!: boolean;

  @IsBoolean()
  calfPainOrSwelling!: boolean;

  @IsBoolean()
  chestPainOrShortnessOfBreath!: boolean;
}
