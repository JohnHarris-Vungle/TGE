/**
 * @class
 * Placeholder for the static TGE.Math class.
 */
TGE.Math = {}

/**
 * This function clamps a number between a minimum and maximum limit and returns the result.
 * @param {Number} value The number to clamp.
 * @param {Number} min The lower limit.
 * @param {Number} max The upper limit.
 * @returns {Number} If the value is less than min, min is returned.  If the value is greater than max, max is returned.  Otherwise, the original value is returned.
 */
TGE.Math.Clamp = function (value, min, max)
{
	return Math.min(Math.max(value, min), max);
}

/**
 * This function clamps a number between 0 and 1 and returns the result.
 * @param {Number} value The number to clamp.
 * @returns {Number} If the value is less than 0, 0 is returned.  If the value is greater than 1, 1 is returned.  Otherwise, the original value is returned.
 */
TGE.Math.Clamp01 = function (value)
{
	return TGE.Math.Clamp(value, 0, 1);
}

/**
 * Linearly interpolates between two numbers by a specified 0-1 amount.
 * @param {Number} fromValue The origin number that we are interpolating from.
 * @param {Number} toValue The target vector that we are interpolating towards.
 * @param {Number} t The decimal fraction (0-1) of the way from the origin to the target.
 * @return {Number} A number that is t of the way between the two values.
 */
TGE.Math.Lerp = function (fromValue, toValue, t)
{
	return fromValue + TGE.Math.Clamp01(t) * (toValue - fromValue);
}

/**
 * Inverse of lerping, returns a scalar representing how far a value falls between two other values.
 * @param {Number} fromValue The origin number that we are interpolating from.
 * @param {Number} toValue The target vector that we are interpolating towards.
 * @param {Number} value The target number that falls between fromValue and toValue.
 * @return {Number} The decimal fraction (0-1) of how far the value is between fromValue and toValue.
 */
TGE.Math.InverseLerp = function (fromValue, toValue, value)
{
	return TGE.Math.Clamp01((value - fromValue) / (toValue - fromValue));
}

/**
 * Returns whether two numbers have identical signs (positive, negative, or zero) or not.
 * @param {Number} x The first value.
 * @param {Number} y The second value.
 * @return {Boolean} If true, the numbers have identical signs, or are both zero.
 */
TGE.Math.IsSameSign = function (x, y)
{
	return Math.sign(x) === Math.sign(y);
}

/**
 * Returns the n-root of a number.
 * @param {Number} r The radicand, this is the number that we are finding the n-root of.
 * @param {Number} n=2 The index of the root itself. 2 is a square root, 3 is a cube root, etc.
 * @return {Number} The root value.
 */
TGE.Math.Root = function (r, n)
{
	var num = Math.pow(Math.abs(r), 1 / (n || 2)); //Just r^1/n gives you the root value.
	return r < 0 ? -num : num;
}

/**
 * Performs a modulo operation on a target value.
 * @param {Number} x The source value being operated on.
 * @param {Number} m The modulus value.
 * @return {Number} The result of the modulus operation. Will be a value between 0 and m (non-inclusive).
 */
TGE.Math.Mod = function (x, m)
{
	return ((x % m) + m) % m;
}

/**
 * Performs a modulo operation on a target value and loops the result between min (inclusive) and max (exclusive).
 * The max value is excluded to achieve parity with TGE.Math.Mod, and for better accuracy with each loop.
 * @example
 * // returns 0
 * TGE.Math.ModRange(360, 0, 360);
 *  * @example
 * // returns -90
 * TGE.Math.ModRange(270, -180, 180);
 * @param {Number} x The source degree value.
 * @param {Number} min The lower range that the number loops between.
 * @param {Number} max The upper range that the number loops between. Not inclusive.
 * @return {Number} The result of the modulus operation.
 */
TGE.Math.ModRange = function (x, min, max)
{
	var rangeSpan = max - min;
	var mod = (x - min) % rangeSpan;
	if (mod < 0)
	{
		mod += rangeSpan;
	}
	return min + mod;
}

/**
 * Get the smallest angle difference between two angles, in radians.
 * @param {Number} fromAngle The first angle, in radians.
 * @param {Number} toAngle The second angle, in radians.
 * @return {Number} The smallest angle, in radians.
 */
TGE.Math.GetAngleDifference = function (fromAngle, toAngle)
{
	return Math.atan2(Math.sin(toAngle - fromAngle), Math.cos(toAngle - fromAngle));
}

/**
 * Sorts the array passed in. Will modify the original array.
 * @param {Array} array - The array that needs to be sorted
 * @param {Function} [compareFunction] - The way in which the array is sorted
 */
TGE.Math.Sort = function(array, compareFunction, low, high)
{
	low = typeof(low) === "number" ? low : 0;
    high = typeof(high) === "number" ? high : array.length - 1;

    if(!compareFunction)
    {
        if(typeof array[0] === "number")
        {
            compareFunction = function(a, b) {return a - b};
        }
        else
        {
            compareFunction = function(a, b) {return ('' + a).localeCompare(b)};
        }
    }

    var pivot = null;

    if(low < high)
    {
        pivot = array[high];
        var i = low - 1;

        for(var j = low; j <= high - 1; j++)
        {
            if(compareFunction(array[j], pivot) <= 0)
            {
                i += 1;
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }

        var temp = array[i+1];
        array[i+1] = array[high];
        array[high] = temp;
        pivot = (i + 1);

        TGE.Math.Sort(array, compareFunction, low, pivot - 1);
        TGE.Math.Sort(array, compareFunction, pivot + 1, high);
    }
}

/**
 * Constant: Pi (π).
 * @constant
 */
TGE.Math.PI = Math.PI;
TGE.PI = TGE.Math.PI;

/**
 * Constant: Tau (τ) or 2 Pi (2π)
 * @constant
 */
TGE.Math.TWO_PI = 6.2831853072;
TGE.TWO_PI = TGE.TAU = TGE.Math.TWO_PI;

/**
 * Constant: Radians to Degrees conversion (57.2957795).
 * @constant
 */
TGE.Math.RAD2DEG = 57.2957795;
TGE.RAD2DEG = TGE.Math.RAD2DEG;

/**
 * Constant: Degrees to Radians conversion (0.0174532925).
 * @constant
 */
TGE.Math.DEG2RAD = 0.0174532925;
TGE.DEG2RAD = TGE.Math.DEG2RAD;

/**
 * Constant: TGE.Matrix().
 * @constant
 */
TGE.Math.IDENTITY = new TGE.Matrix();
TGE.IDENTITY = TGE.Math.IDENTITY;

/**
 * Constant: TGE.Vector2(1,0).
 * @constant
 */
TGE.Math.POSITIVE_X_VECTOR = new TGE.Vector2(1, 0);
TGE.POSITIVE_X_VECTOR = TGE.Math.POSITIVE_X_VECTOR;

/**
 * Constant: TGE.Vector2(-1,0).
 * @constant
 */
TGE.Math.NEGATIVE_X_VECTOR = new TGE.Vector2(-1, 0);
TGE.NEGATIVE_X_VECTOR = TGE.Math.NEGATIVE_X_VECTOR;

/**
 * Constant: TGE.Vector2(0,1).
 * @constant
 */
TGE.Math.POSITIVE_Y_VECTOR = new TGE.Vector2(0, 1);
TGE.POSITIVE_Y_VECTOR = TGE.Math.POSITIVE_Y_VECTOR;

/**
 * Constant: TGE.Vector2(0,-1).
 * @constant
 */
TGE.Math.NEGATIVE_Y_VECTOR = new TGE.Vector2(0, -1);
TGE.NEGATIVE_Y_VECTOR = TGE.Math.NEGATIVE_Y_VECTOR;
