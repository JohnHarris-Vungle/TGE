/**
 * Given a value and an input range, remap the value to be within an output range.
 * @param {Number} value The value to map to the new range defined by outputMin to outputMax.
 * @param {Number} inputMin The starting value of the original range the value is mapped to.
 * @param {Number} inputMax The ending value of the original range the value is mapped to.
 * @param {Number} outputMin The starting value of the range to map the value to.
 * @param {Number} outputMax The ending value of the range to map the value to.
 * @param {Boolean} [clamp=false] If true, will constrain the results between outputMin and outputMax.
 * @returns {Number} The original values mapped to the range defined by outputMin and outputMax.
 */
TGE.MapValue = function (value, inputMin, inputMax, outputMin, outputMax, clamp)
{
	var res = ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin);
	if (clamp)
	{
		res = outputMax > outputMin ? Math.min(Math.max(res, outputMin), outputMax) :
			Math.min(Math.max(res, outputMax), outputMin);
	}

	return res;
};

/**
 * A safe substitute for eval() that returns a class from a string, if one exists. The string may contain dot accessors.
 * @param {String} className The full name of the class that is being looked for.
 * @return {*} Will return the class if there is one that matches the className parameter.
 */
TGE.GetClass = function (className)
{
	if (typeof (className) === "string")
	{
		var target = window;
		var splitName = className.split(".");
		for (var i = 0, iMax = splitName.length; i < iMax; i++)
		{
			target = target[splitName[i]];
			if (!target)
			{
				return null;
			}
		}
		return target;
	}
	return null;
};

/**
 * Creates a deep clone of an object, making copies of all internal objects and arrays
 * Optionally can specify a secondary object to base the iteration keys from (typically, a subset of the complete object)
 * @param {Object} sourceObject
 * @param {Object} [keyObject]
 * @returns {Object}
 */
TGE.DeepClone = function (sourceObject, keyObject)
{
	if (!keyObject) keyObject = sourceObject;

	if (sourceObject && typeof sourceObject === "object")
	{
		if (Array.isArray(sourceObject))
		{
			var a = [];
			for (var i = 0; i < sourceObject.length; ++i)
			{
				a.push(TGE.DeepClone(sourceObject[i], keyObject[i]));
			}
			return a;
		}
		else
		{
			var obj = {};
			for (var key in keyObject)
			{
				if (keyObject.hasOwnProperty(key))
				{
					obj[key] = TGE.DeepClone(sourceObject[key], keyObject[key]);
				}
			}
			return obj;
		}
	}
	else
	{
		return sourceObject;
	}
};

/**
 * Copy properties of one object to another, cloning all internal objects and arrays
 * Optionally can specify a secondary object to base the top-level iteration keys from (typically, a subset of the complete object)
 * @param {Object} sourceObject
 * @param {Object} destObject
 * @param {Object} [keyObject]
 * @returns {Object}
 */
TGE.DeepCopy = function (sourceObject, destObject, keyObject)
{
	if (!keyObject) keyObject = sourceObject;

	for (var key in keyObject)
	{
		if (keyObject.hasOwnProperty(key))
		{
			destObject[key] = TGE.DeepClone(sourceObject[key]);
		}
	}
};

//
// stubs for lower-case named versions of static functions
//

/**
 * @deprecated Use TGE.GetClass
 * @ignore
 */
TGE.getClass = function (className)
{
	return TGE.GetClass(className);
};

/**
 * @deprecated Use TGE.MapValue
 * @ignore
 */
TGE.mapValue = function (value, inputMin, inputMax, outputMin, outputMax, clamp)
{
	return TGE.MapValue(value, inputMin, inputMax, outputMin, outputMax, clamp);
};

// this one was deprecated already, so I didn't bother creating an upper-case version
/**
 * This function clamps a number between a minimum and maximum limit and returns the result.
 * @param {Number} value The number to clamp.
 * @param {Number} min The lower limit.
 * @param {Number} max The upper limit.
 * @returns {Number} If the value is less than min, min is returned.  If the value is greater than max, max is returned.  Otherwise, the original value is returned.
 * @deprecated Use TGE.Math.Clamp
 * @ignore
 */
TGE.clamp = function (value, min, max)
{
	return TGE.Math.Clamp(value, min, max);
};

