import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PricingFactory } from './pricing.factory';
import { PROVIDERS } from './constants/provider.constants';
import { PricingStrategy } from './interfaces/pricing-strategy.interface';

describe('PricingService', () => {
  let service: PricingService;
  let factory: PricingFactory;

  const mockStrategy: PricingStrategy = {
    getKlineData: jest.fn(),
  };

  const mockFactory = {
    getStrategy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: PricingFactory,
          useValue: mockFactory,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    factory = module.get<PricingFactory>(PricingFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKlineData', () => {
    it('should delegate to the correct strategy based on the provider', async () => {
      const mockProvider = PROVIDERS.BINANCE;
      const mockParams = { symbol: 'BTCUSDT', interval: '1m' };
      const mockResult = { total: 100, klines: [] };

      // Mock the factory and strategy behavior
      (mockFactory.getStrategy as jest.Mock).mockReturnValue(mockStrategy);
      (mockStrategy.getKlineData as jest.Mock).mockResolvedValue(mockResult);

      // Call the method
      const result = await service.getKlineData(mockProvider, mockParams);

      // Assertions
      expect(factory.getStrategy).toHaveBeenCalledWith(mockProvider);
      expect(mockStrategy.getKlineData).toHaveBeenCalledWith(mockParams);
      expect(result).toEqual(mockResult);
    });

    it('should throw an error if the provider is unsupported', async () => {
      const invalidProvider = 'unknown';
      const mockParams = { symbol: 'BTCUSDT', interval: '1m' };

      // Mock the factory to throw an error
      (mockFactory.getStrategy as jest.Mock).mockImplementation(() => {
        throw new Error(
          `Pricing provider "${invalidProvider}" is not supported.`,
        );
      });

      await expect(
        service.getKlineData(invalidProvider as any, mockParams),
      ).rejects.toThrow(
        `Pricing provider "${invalidProvider}" is not supported.`,
      );

      expect(factory.getStrategy).toHaveBeenCalledWith(invalidProvider);
    });

    it('should handle errors thrown by the strategy', async () => {
      const mockProvider = PROVIDERS.BINANCE;
      const mockParams = { symbol: 'BTCUSDT', interval: '1m' };
      const errorMessage = 'Error fetching Kline data';

      // Mock the factory and strategy behavior
      (mockFactory.getStrategy as jest.Mock).mockReturnValue(mockStrategy);
      (mockStrategy.getKlineData as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        service.getKlineData(mockProvider, mockParams),
      ).rejects.toThrow(errorMessage);

      expect(factory.getStrategy).toHaveBeenCalledWith(mockProvider);
      expect(mockStrategy.getKlineData).toHaveBeenCalledWith(mockParams);
    });

    it('should apply default parameters when optional fields are missing', async () => {
      const mockProvider = PROVIDERS.BINANCE;
      const mockParams = { symbol: 'BTCUSDT' }; // No interval, startTime, or endTime
      const mockResult = { total: 100, klines: [] };

      (mockFactory.getStrategy as jest.Mock).mockReturnValue(mockStrategy);
      (mockStrategy.getKlineData as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.getKlineData(mockProvider, mockParams);

      expect(mockStrategy.getKlineData).toHaveBeenCalledWith(mockParams);
      expect(result).toEqual(mockResult);
    });

    it('should throw an error if required parameters are missing', async () => {
      const mockProvider = PROVIDERS.BINANCE;
      const invalidParams = {}; // Missing required fields

      (mockFactory.getStrategy as jest.Mock).mockReturnValue(mockStrategy);

      // Mock the strategy to validate params
      (mockStrategy.getKlineData as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid parameters');
      });

      await expect(
        service.getKlineData(mockProvider, invalidParams),
      ).rejects.toThrow('Invalid parameters');
    });

    it('should propagate errors thrown by the strategy', async () => {
      const mockProvider = PROVIDERS.BINANCE;
      const mockParams = { symbol: 'BTCUSDT', interval: '1m' };
      const errorMessage = 'Strategy error';

      (mockFactory.getStrategy as jest.Mock).mockReturnValue(mockStrategy);
      (mockStrategy.getKlineData as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        service.getKlineData(mockProvider, mockParams),
      ).rejects.toThrow(errorMessage);

      expect(mockStrategy.getKlineData).toHaveBeenCalledWith(mockParams);
    });
  });
});
