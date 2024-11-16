/**
 * Interface for pool handlers to support multiple blockchains.
 */
export interface PoolHandlerInterface<T, U> {
  /**
   * Validates the address based on the blockchain-specific requirements.
   * @param dto - Blockchain-specific DTO containing the address and chain ID.
   * @returns A boolean indicating whether the address is valid.
   * @throws An error if validation fails.
   */
  validateAddress(dto: T): boolean;

  /**
   * Retrieves the current block associated with the pool.
   * @param address - The address of the pool.
   * @param chainId - The blockchain chain ID.
   * @returns A promise that resolves to the current block number.
   * @throws An error if the pool or block cannot be found.
   */
  getCurrentBlock(address: U, chainId: number): Promise<number>;

  /**
   * Updates the current block associated with the pool.
   * Ensures the new block number is not lower than the existing one.
   * @param address - The address of the pool.
   * @param chainId - The blockchain chain ID.
   * @param blockNumber - The new block number to set.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  setCurrentBlock(
    address: U,
    chainId: number,
    blockNumber: number,
  ): Promise<boolean>;
}
