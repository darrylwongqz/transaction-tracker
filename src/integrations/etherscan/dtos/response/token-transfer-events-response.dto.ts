import { ApiProperty } from '@nestjs/swagger';
import { EventEntity } from '../../entities/event.entity';

export class TokenTransferEventsResponseDto {
  @ApiProperty({
    description: 'The total number of events returned.',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'The list of token transfer events.',
    type: [EventEntity], // Specify the type of array elements
  })
  events: EventEntity[];

  @ApiProperty({
    description:
      "Indicates whether the result was trimmed due to Etherscan's 10,000-record limit.",
    example: false,
  })
  isTrimmed: boolean;
}
