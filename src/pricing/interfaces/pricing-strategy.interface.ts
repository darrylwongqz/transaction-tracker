export interface PricingStrategy {
  getKlineData(params: object): Promise<object>;
}
