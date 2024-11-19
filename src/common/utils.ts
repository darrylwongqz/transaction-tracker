import BigNumber from 'bignumber.js';

/**
 * Computes 10 raised to the power of the given exponent using the BigNumber library.
 *
 * @param {number} n - The exponent to which 10 should be raised. It can be a positive, negative, or zero value.
 * @returns {BigNumber} - A BigNumber instance representing the value of 10^n.
 *
 * @example
 * // Example 1: Positive exponent
 * const result1 = pow10(3); // Returns BigNumber representing 1000
 * console.log(result1.toString()); // Output: "1000"
 *
 * @example
 * // Example 2: Zero exponent
 * const result2 = pow10(0); // Returns BigNumber representing 1
 * console.log(result2.toString()); // Output: "1"
 *
 * @example
 * // Example 3: Negative exponent
 * const result3 = pow10(-2); // Returns BigNumber representing 0.01
 * console.log(result3.toString()); // Output: "0.01"
 */
export function pow10(n: number): BigNumber {
  return new BigNumber(10).pow(n);
}
