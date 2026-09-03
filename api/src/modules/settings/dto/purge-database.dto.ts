import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsString } from 'class-validator';
import { PURGE_CONFIRM_PHRASE } from '../../../common/constants/purge';

export class PurgeDatabaseDto {
  @ApiProperty({
    example: PURGE_CONFIRM_PHRASE,
    description: 'Phrase de confirmation obligatoire',
  })
  @IsString()
  @Equals(PURGE_CONFIRM_PHRASE, {
    message: `يجب كتابة "${PURGE_CONFIRM_PHRASE}" للتأكيد`,
  })
  confirmPhrase!: string;
}
