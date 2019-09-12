/**
 * Returns the integer part of a number by removing any fractional digits.
 * Polyfill for Math.trunc(x) from ES6 that isn't present in ES5
 * @param {Number} x A given number
 * @return {Number} The integer part of the given number.
 */
Math.trunc = Math.trunc || function (x)
{
	return x < 0 ? Math.ceil(x) : Math.floor(x);
}

/**
 * Returns returns the sign of a number, indicating whether the number is positive, negative or zero.
 * Polyfill for Math.sign(x) from ES6 that isn't present in ES5.
 * @param {Number} x A given number
 * @return {Number} A number representing the sign of the given argument. 1 if positive, -1 if negative, 0 if 0, NaN if NaN.
 */
Math.sign = Math.sign || function (x)
{
	x = +x; //Casts the value as a double
	if (x === 0 || isNaN(x))
	{
		return Number(x);
	}
	return x > 0 ? 1 : -1;
}

/**
 * Returns the cube root of a number.
 * Polyfill for Math.cbrt(x) from ES6 that isn't present in ES5.
 * @param {Number} r The radicand, this is the number that we are finding the cube root of.
 * @return {Number} The cube root value.
 */
Math.cbrt = Math.cbrt || function (r)
{
	var y = Math.pow(Math.abs(r), 1/3);
	return r < 0 ? -y : y;
}
/**
 * Determines whether a given value is a number or not.
 * @param x The value being tested as a number
 * @return {Boolean} If true, the x parameter is a number.
 */
Number.isNaN = Number.isNaN || function isNaN(x)
{
	return typeof x === "number" && x !== x;    // NaN is the only Javascript object such that x !== x
}

/**
 * Determines whether a given value is an integer or not.
 * @param x The value being tested as an integer
 * @return {Boolean} If true, the x parameter is an integer.
 */
Number.isInteger = Number.isInteger || function (value)
{
	return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
}

/**
 * Determines whether a given value is a safe integer or not.
 * @param x The value being tested as a safe integer
 * @return {Boolean} If true, the x parameter is a safe integer.
 */
Number.isSafeInteger = Number.isSafeInteger || function (value)
{
	return Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
}

/**
 * Constant: The maximum safe integer in JavaScript (2^53 - 1).
 * Polyfill
 * @constant
 */
Number.MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Constant: The minimum safe integer in JavaScript (-(2^53 - 1)).
 * Polyfill
 * @constant
 */
Number.MIN_SAFE_INTEGER = -9007199254740991;

/**
 * Constant: Epsilon (ε).
 * Polyfill
 * @constant
 */
Number.EPSILON = 2.2204460492503130808472633361816e-16;