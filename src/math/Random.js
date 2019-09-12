/**
 * Pseudo-Random Number Generator
 * @param {*} [seed] The seed can be any value. Uses the current date/time by default.
 * @constructor
 */
TGE.Random = function (seed)
{
	this.setSeed(seed);
}

TGE.Random.prototype = {
	/**
	 * Initializes the PRNG with a given seed. Can be used to reinitialize the PRNG with a new seed.
	 * Implements the Alea algorithm by Johannes Baagøe. https://github.com/coverslide/node-alea/blob/master/alea.js
	 * @param {*} [seed] Used as a base to determine what numbers are "randomly" generated. Uses the current date/time by default.
	 * @return {TGE.Random} Returns this PRNG instance.
	 */
	setSeed: function (seed)
	{
		this._boolMask = null;

		this._s0 = 0;
		this._s1 = 0;
		this._s2 = 0;
		this._c = 1;

		if (typeof(seed) === "number")
		{
			seed = [seed];
		}
		else if (!seed)
		{
			seed = [+new Date];
		}

		this._seed = seed;

		var mash = this._mash();
		this._s0 = mash(" ");
		this._s1 = mash(" ");
		this._s2 = mash(" ");
		for (var i = 0; i < seed.length; i++)
		{
			this._s0 -= mash(seed[i]);
			if (this._s0 < 0)
			{
				this._s0 += 1;
			}
			this._s1 -= mash(seed[i]);
			if (this._s1 < 0)
			{
				this._s1 += 1;
			}
			this._s2 -= mash(seed[i]);
			if (this._s2 < 0)
			{
				this._s2 += 1;
			}
		}
		return this;
	},

	/**
	 * Returns the seed that was used to generate this PRNG.
	 * @return {*}
	 */
	getSeed: function ()
	{
		return this._seed;
	},

	/**
	 * The core function of the PRNG. Generates and returns random value between 0 and 1.
	 * @return {Number} A random number between 0 and 1.
	 */
	next: function ()
	{
		var t = 2091639 * this._s0 + this._c * 2.3283064365386963e-10; // 2^-32
		this._s0 = this._s1;
		this._s1 = this._s2;
		return this._s2 = t - (this._c = t | 0);
	},

	/**
	 * Get a random floating point value between 0 and `max`.
	 * @param {Number} [max=Math.MAX_VALUE] Maximum range number. The returned value will be less than this max.
	 * @return {Number} A random floating point value, excluding `max`.
	 */
	nextFloat: function (max)
	{
		if (max && typeof(max) === "number")
		{
			return this.next() * max;
		}
		return this.next() * Math.MAX_VALUE;
	},

	/**
	 * Get a random integer between 0 and `max`.
	 * @param {Number} [max=2^32] Maximum range number. The returned value will be less than this max.
	 * @return {Number} A random integer, excluding the max range number.
	 */
	nextInt: function (max)
	{
		if (max && typeof(max) === "number")
		{
			return Math.floor(this.next() * max);
		}
		return this.next() * 0x100000000;   // 2^32
	},

	/**
	 * Get a random float between `min` (inclusive) and `max` (inclusive).
	 * @param {Number|{min:Number, max:Number}} min - Minimum possible value OR an object with min and max properties.
	 * @param {Number} [max] - Maximum possible value
	 * @return {Number} A random floating point number
	 */
	range: function (min, max)
	{
		if (typeof min === "object")
		{
			min = min["min"];
			max = min["max"];
		}
		min = min || 0;
		max = max || 0;
		return min + (max - min) * this.next();
	},

	/**
	 * Get a random integer between `min` (inclusive) and `max` (exclusive).
	 * @param {Number|{min:Number, max:Number}} min - Minimum possible value OR an object with min and max properties.
	 * @param {Number} [max] - One plus the maximum possible value
	 * @return {Number} A random integer
	 */
	rangeInt: function (min, max)
	{
		return Math.floor(this.range(min, max));
	},

	/**
	 * Get a random boolean value.
	 * @return {Boolean} A random boolean value.
	 */
	nextBoolean: function ()
	{
		//Only call the next() function occasionally.
		//Save the results from one call to the _boolBuffer.
		//When we run out of bits (after using the bit at the first space), only then do we call next() again.
		if (!this._boolMask || this._boolMask === 1)
		{
			this._boolBuffer = this.nextInt();  //Get 32 bits.
			this._boolMask = 0x10000000;    //Start at the max 32-bit int.
		}
		this._boolMask >>= 1;   //Shift the bit one to the right.
		return (this._boolBuffer & this._boolMask) !== 0;
	},

	/**
	 * Get a random boolean value with a given % chance
	 * @param {Number} chance A number between 0 and 1, representing the percentage possibility of this returning true.
	 * @return {Boolean} A random boolean value.
	 */
	nextChance: function (chance)
	{
		return this.next() < chance;
	},

	/**
	 * Pass in an array of objects with "weight" and "value" properties.
	 * Returns the value of a random object, with preference given to objects with higher weight.
	 * @param {Array.<{weight: Number, value: *}>} params An array of weighted objects.
	 * @return {*} A random value of any type that was passed into the function.
	 */
	getWeightedElement: function (params)
	{
		var sum = 0, i;

		for (i = 0; i < params.length; i++)
		{
			sum += params[i].weight;
		}

		var random = this.nextFloat(sum);

		for (i = 0; i < params.length; i++)
		{
			if (random < params[i].weight)
			{
				return params[i].value;
			}
			random -= params[i].weight;
		}
		return null;
	},

	/**
	 * Get a single random element from a source array.
	 * @param {Array} array The source array.
	 * @return {*} Random value from of the array
	 */
	getElementInArray: function (array)
	{
		if (!Array.isArray(array))
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Cannot get random element from an object that is not an array.");
		}
		else
		{
			return array[this.nextInt(array.length)];
		}
	},

	/**
	 * Generate a random hsl, hsla, or hex color.
	 * @param {Number} [params] Optional parameters.
	 * @param {Number} [params.minH=0] Minimum hue, value from 0-1.
	 * @param {Number} [params.maxH=1] Maximum hue, value from 0-1.
	 * @param {Number} [params.minS=0] Minimum saturation, value from 0-1.
	 * @param {Number} [params.maxS=1] Maximum saturation, value from 0-1.
	 * @param {Number} [params.minL=0] Minimum lightness, value from 0-1.
	 * @param {Number} [params.maxL=1] Maximum lightness, value from 0-1.
	 * @param {Number} [params.minA=0] Minimum alpha, value from 0-1. Alpha will be 1 if this and maxA are undefined.
	 * @param {Number} [params.maxA=1] Maximum alpha, value from 0-1. Alpha will be 1 if this and minA are undefined.
	 * @return {String} A hsl, hsla, or hex color string.
	 */
	getColor: function (params)
	{
		if (params)
		{
			// Hue, between 0 and 360
			var h = TGE.Math.Clamp01(this.range(params.minH || 0, params.maxH || 1)) * 360;
			// Saturation, between 1 and 100
			var s = TGE.Math.Clamp01(this.range(params.minS || 0, params.maxS || 1)) * 100;
			// Lightness, between 1 and 100
			var l = TGE.Math.Clamp01(this.range(params.minL || 0, params.maxL || 1)) * 100;
			// Alpha, between 0 and 1. Ignored if both minA and maxA are undefined.
			if (typeof params.minA !== "undefined" || typeof params.maxA !== "undefined")
			{
				var a = TGE.Math.Clamp01(this.range(params.minA || 0, params.maxA || 1));
				return "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
			}
			return "hsl(" + h + "," + s + "%," + l + "%)";

		}
		else
		{
			return "#" + Math.floor(this.next() * 0x1000000).toString(16);
		}
	},

	/**
	 * Gets a random p oint within a circle.
	 * @param {Number} [x=0] The radius of the circle.
	 * @param {Number} [y=0] The radius of the circle.
	 * @param {Number} [radius=1] The radius of the circle.
	 * @return {TGE.Vector2} A random point within the given circle.
	 */
	getPointInCircle: function (x, y, radius)
	{
		x = x || 0;
		y = y || 0;
		radius = radius || 1;
		radius *= Math.sqrt(this.next());
		var angle = Math.PI * 2 * this.next();
		return new TGE.Vector2(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
	},

	/**
	 * Finds a random point within a rectangular area.
	 * @param {Number} [x=0] The x of the upper left point of the rectangle.
	 * @param {Number} [y=0]  The y of the upper left point of the rectangle.
	 * @param {Number} [width=1] The width of the rectangle.
	 * @param {Number} [height=1] The height of the rectangle.
	 * @return {TGE.Vector2} A random point within the given rectangle.
	 */
	getPointInRectangle: function (x, y, width, height)
	{
		x = x || 0;
		y = y || 0;
		width = width || 1;
		height = height || 1;
		return new TGE.Vector2(this.range(x, x + width), this.range(y, y + height));
	},

	/**
	 * Used to hash the _seed into values usable by the RNG.
	 * @ignore
	 * @private
	 */
	_mash: function ()
	{
		var n = 0xefc8249d;

		return function (data)
		{
			data = data.toString();
			for (var i = 0; i < data.length; i++)
			{
				n += data.charCodeAt(i);
				var h = 0.02519603282416938 * n;
				n = h >>> 0;
				h -= n;
				h *= n;
				n = h >>> 0;
				h -= n;
				n += h * 0x100000000; // 2^32
			}
			return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
		};
	}
}

/**
 * Static instance of the PRNG. Used by all TGE.Random static functions.
 * @protected
 * @ignore
 */
TGE.Random._sInstance = null;

/**
 * Returns the static instance of the PRNG.
 * @static
 * @return {TGE.Random}
 */
TGE.Random.GetInstance = function ()
{
	//If no static instance exists yet, generate one the first time a static TGE.Random function is called.
	if (!TGE.Random._sInstance)
	{
		TGE.Random._sInstance = new TGE.Random();
	}
	return TGE.Random._sInstance;
}

/**
 * Reinitialize the static PRNG with a given seed.
 * @static
 */
TGE.Random.SetSeed = function (seed)
{
	TGE.Random.GetInstance().setSeed(seed);
}

/**
 * Returns the seed that was used to generate the static PRNG.
 * @return {*}
 */
TGE.Random.GetSeed = function ()
{
	return TGE.Random.GetInstance().getSeed();
}

/**
 * Generates a random value between 0 and 1.
 * @static
 * @return {number}
 */
TGE.Random.Next = function ()
{
	return TGE.Random.GetInstance().next();
}

/**
 * Get a random floating point value between 0 and `max`.
 * @static
 * @param {Number} [max] Maximum range number. The returned value will be less than this max.
 * @return {Number} A random floating point value, excluding `max`.
 */
TGE.Random.NextFloat = function (max)
{
	return TGE.Random.GetInstance().nextFloat(max);
}

/**
 * Get a random integer between 0 and `max`.
 * @static
 * @param {Number} max Maximum range number. The returned value will be less than this max.
 * @return {Number} A random integer, excluding the max range number.
 */
TGE.Random.NextInt = function (max)
{
	return TGE.Random.GetInstance().nextInt(max);
}

/**
 * Get a random boolean value.
 * @static
 * @return {Boolean} A random boolean value.
 */
TGE.Random.NextBoolean = function ()
{
	return TGE.Random.GetInstance().nextBoolean();
}

/**
 * Get a random boolean value with a given % chance
 * @param {Number} chance A number between 0 and 1, representing the percentage possibility of this returning true.
 * @return {Boolean} A random boolean value.
 */
TGE.Random.NextChance = function (chance)
{
	return TGE.Random.GetInstance().nextChance(chance);
}

/**
 * Pass in an array of objects with "weight" and "value" properties.
 * Returns the value of a random object, with preference given to objects with higher weight.
 * @param {Array.<{weight: Number, value: *}>} params An array of weighted objects.
 * @return {*} A random value of any type that was passed into the function.
 */
TGE.Random.GetWeightedElement = function (params)
{
	return TGE.Random.GetInstance().getWeightedElement(params);
}

/**
 * Get a random float between `min` (inclusive) and `max` (inclusive).
 * @static
 * @param {Number|{min:Number, max:Number}} min - Minimum possible value OR an object with min and max properties.
 * @param {Number} [max] - Maximum possible value
 * @return {Number} A random floating point number
 */
TGE.Random.Range = function (min, max)
{
	return TGE.Random.GetInstance().range(min, max);
}

/**
 * Get a random integer between `min` (inclusive) and `max` (exclusive).
 * @static
 * @param {Number|{min:Number, max:Number}} min - Minimum possible value OR an object with min and max properties.
 * @param {Number} [max] - One plus the maximum possible value
 * @return {Number} A random integer
 */
TGE.Random.RangeInt = function (min, max)
{
	return TGE.Random.GetInstance().rangeInt(min, max);
}

/**
 * Get a single random element from a source array.
 * @static
 * @param {Array} array The source array.
 * @return {*} Random element from of the array
 */
TGE.Random.GetElementInArray = function (array)
{
	return TGE.Random.GetInstance().getElementInArray(array);
}

/**
 * Generate a random hsl, hsla, or hex color.
 * @param {Number} [params] Optional parameters.
 * @param {Number} [params.minH=0] Minimum hue, value from 0-1.
 * @param {Number} [params.maxH=1] Maximum hue, value from 0-1.
 * @param {Number} [params.minS=0] Minimum saturation, value from 0-1.
 * @param {Number} [params.maxS=1] Maximum saturation, value from 0-1.
 * @param {Number} [params.minL=0] Minimum lightness, value from 0-1.
 * @param {Number} [params.maxL=1] Maximum lightness, value from 0-1.
 * @param {Number} [params.minA=0] Minimum alpha, value from 0-1. Alpha will be 1 if this and maxA are undefined.
 * @param {Number} [params.maxA=1] Maximum alpha, value from 0-1. Alpha will be 1 if this and minA are undefined.
 * @return {String} A hsl, hsla, or hex color string.
 */
TGE.Random.Color = function (params)
{
	return TGE.Random.GetInstance().getColor(params);
}

/**
 * Gets a random point within a circle.
 * @param {Number} [x=0] The radius of the circle.
 * @param {Number} [y=0] The radius of the circle.
 * @param {Number} [radius=1] The radius of the circle.
 * @return {TGE.Vector2} A random point within the given circle.
 */
TGE.Random.GetPointInCircle = function (x, y, radius)
{
	return TGE.Random.GetInstance().getPointInCircle(x, y, radius);
}

/**
 * Finds a random point within a rectangular area.
 * @param {Number} [x=0] The x of the upper left point of the rectangle.
 * @param {Number} [y=0]  The y of the upper left point of the rectangle.
 * @param {Number} [width=1] The width of the rectangle.
 * @param {Number} [height=1] The height of the rectangle.
 * @return {TGE.Vector2} A random point within the given rectangle.
 */
TGE.Random.GetPointInRectangle = function (x, y, width, height)
{
	return TGE.Random.GetInstance().getPointInRectangle(x, y, width, height);
}