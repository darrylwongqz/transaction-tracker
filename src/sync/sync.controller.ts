import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncStatusResponseDto } from './dtos/response/sync-status-response.dto';
import { SyncStatusQueryDto } from './dtos/request/sync-status-query.dto';
import { PoolsService } from '../pools/pools.service';

/**
 * SyncController
 *
 * Responsible for handling API requests related to synchronization status.
 * This controller provides endpoints to fetch information about the current
 * synchronization state of the system (e.g., blocks behind, latest synced block).
 */
@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly poolsService: PoolsService,
  ) {}

  /**
   * Get Synchronization Status
   *
   * Fetches the current synchronization status of pools, including:
   * - How many blocks are behind
   * - The latest synced block
   * - The current block being processed
   *
   * @returns SyncStatusEntity containing synchronization details.
   */
  @ApiOperation({ summary: 'Get sync status' })
  @ApiResponse({
    status: 200,
    description: 'Returns synchronization status of the pools.',
    type: SyncStatusResponseDto,
  })
  @Get('/status')
  async getSyncStatus(
    @Query() query: SyncStatusQueryDto,
  ): Promise<SyncStatusResponseDto> {
    const pool = this.poolsService.getPoolByAddress(query.address);
    return this.syncService.getSyncStatus(
      pool.chainType,
      pool.address,
      pool.chainId,
    );
  }
}
