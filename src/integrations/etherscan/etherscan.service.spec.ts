import { Test, TestingModule } from '@nestjs/testing';
import { EtherscanService } from './etherscan.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('EtherscanService', () => {
  let service: EtherscanService;
  let httpService: HttpService;

  const mockTokenTransferResponse = {
    data: {
      status: '1',
      message: 'OK',
      result: [
        {
          blockNumber: '4730207',
          timeStamp: '1513240363',
          hash: '0xe8c208398bd5ae8e4c237658580db56a2a94dfa0ca382c99b776fa6e7d31d5b4',
          nonce: '406',
          blockHash:
            '0x022c5e6a3d2487a8ccf8946a2ffb74938bf8e5c8a3f6d91b41c56378a96b5c37',
          from: '0x642ae78fafbb8032da552d619ad43f1d81e4dd7c',
          contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          to: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
          value: '5901522149285533025181',
          tokenName: 'Maker',
          tokenSymbol: 'MKR',
          tokenDecimal: '18',
          transactionIndex: '81',
          gas: '940000',
          gasPrice: '32010000000',
          gasUsed: '77759',
          cumulativeGasUsed: '2523379',
          input: 'deprecated',
          confirmations: '7968350',
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EtherscanService,
        ConfigService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EtherscanService>(EtherscanService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokenTransferEvents', () => {
    it('should return token transfer events when correct values are passed', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValueOnce(mockTokenTransferResponse);

      const result = await service.getTokenTransferEvents({
        contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        address: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
        startBlock: 4730000,
        endBlock: 4770000,
      });

      expect(result.total).toEqual(1);
      expect(result.events).toHaveLength(1);
      expect(result.isTrimmed).toBe(false);
      expect(result.events[0].blockNumber).toEqual('4730207');
    });

    it('should handle trimming when the response contains 10,000 events', async () => {
      const trimmedResponse = JSON.parse(
        JSON.stringify(mockTokenTransferResponse),
      );

      // Fill the response with 9999 events having the same block number
      trimmedResponse.data.result = new Array(9999).fill({
        blockNumber: '4764972',
      });

      // Add one event with the last block number, which should be trimmed
      trimmedResponse.data.result.push({
        blockNumber: '4764973', // Last block number (should be trimmed)
      });

      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValueOnce(trimmedResponse);

      const result = await service.getTokenTransferEvents({
        contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        address: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
        startBlock: 4730000,
        endBlock: 4770000,
      });

      expect(result.total).toBeLessThan(10000);
      expect(result.isTrimmed).toBe(true);
      expect(
        result.events.every((e) => e.blockNumber.toString() !== '4764973'),
      ).toBe(true);
    });

    it('should throw an error if the Etherscan API call fails', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockRejectedValueOnce(new Error('API Error'));

      await expect(
        service.getTokenTransferEvents({
          contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          address: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
          startBlock: 4730000,
          endBlock: 4770000,
        }),
      ).rejects.toThrow('API Error');
    });

    it('should handle empty results gracefully', async () => {
      // Mock Axios response to return an empty result array
      jest.spyOn(httpService.axiosRef, 'get').mockResolvedValueOnce({
        data: {
          status: '1',
          message: 'OK',
          result: [], // Empty result array
        },
      });

      const result = await service.getTokenTransferEvents({
        contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        address: '0x4e83362442b8d1bec281594cea3050c8eb01311c',
        startBlock: 4730000,
        endBlock: 4770000,
      });

      // Assertions
      expect(result.total).toEqual(0); // Total events should be 0
      expect(result.events).toHaveLength(0); // Events array should be empty
      expect(result.isTrimmed).toBe(false); // No trimming should have occurred
    });
  });
});
