import { Test, TestingModule } from '@nestjs/testing';
import { PoolHandlerFactory } from './pool-handler.factory';
import { EthereumPoolHandler } from './handlers/ethereum-pool.handler';
import { SolanaPoolHandler } from './handlers/solana-pool.handler';
import { ChainType } from './constants/pools.enums';

describe('PoolHandlerFactory', () => {
  let factory: PoolHandlerFactory;
  let ethereumHandler: EthereumPoolHandler;
  let solanaHandler: SolanaPoolHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolHandlerFactory,
        {
          provide: EthereumPoolHandler,
          useValue: {
            validateAddress: jest.fn(),
            getCurrentBlock: jest.fn(),
            setCurrentBlock: jest.fn(),
          },
        },
        {
          provide: SolanaPoolHandler,
          useValue: {
            validateAddress: jest.fn(),
            getCurrentBlock: jest.fn(),
            setCurrentBlock: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<PoolHandlerFactory>(PoolHandlerFactory);
    ethereumHandler = module.get<EthereumPoolHandler>(EthereumPoolHandler);
    solanaHandler = module.get<SolanaPoolHandler>(SolanaPoolHandler);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
    expect(ethereumHandler).toBeDefined();
    expect(solanaHandler).toBeDefined();
  });

  describe('getHandler', () => {
    it('should return the Ethereum handler for ChainType.ETHEREUM', () => {
      const handler = factory.getHandler(ChainType.ETHEREUM);
      expect(handler).toBe(ethereumHandler);
    });

    // it('should return the Solana handler for ChainType.SOLANA', () => {
    //   const handler = factory.getHandler(ChainType.SOLANA);
    //   expect(handler).toBe(solanaHandler);
    // });

    it('should throw NotFoundException for an unsupported chain type', () => {
      expect(() => factory.getHandler(999 as any)).toThrowError(
        `Handler not found for chain type: 999`,
      );
    });
  });

  describe('handler integration', () => {
    it('should allow Ethereum handler to validate address', () => {
      const handler = factory.getHandler(ChainType.ETHEREUM);
      const validateSpy = jest.spyOn(handler, 'validateAddress');
      const dto = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      };

      handler.validateAddress(dto);

      expect(validateSpy).toHaveBeenCalledWith(dto);
    });

    // it('should allow Solana handler to validate address', () => {
    //   const handler = factory.getHandler(ChainType.SOLANA);
    //   const validateSpy = jest.spyOn(handler, 'validateAddress');
    //   const dto = {
    //     address: '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH',
    //     chainId: 101,
    //   };

    //   handler.validateAddress(dto);

    //   expect(validateSpy).toHaveBeenCalledWith(dto);
    // });
  });
});
