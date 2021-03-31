/**
 * The Vector2 object represents a location or vector in a two-dimensional coordinate system, where x represents the horizontal axis and y represents the vertical axis.
 * @class
 * @property {Number} x The horizontal coordinate of the vector.
 * @property {Number} y The vertical coordinate of the vector.
 * @param {Number} x The horizontal coordinate.
 * @param {Number} y The vertical coordinate.
 * @constructor
 */
TGE.Vector2 = function (x, y)
{
	this.x = x || 0;
	this.y = y || 0;

	return this;
}

/**
 * Linearly interpolates between two vectors by a decimal fraction scalar (0-1).
 * @param {TGE.Vector2} fromVector The origin vector. A t of 0 will return a copy of this.
 * @param {TGE.Vector2} toVector The target vector. A t of 1 will return a copy of this.
 * @param {Number} t A decimal fraction (0-1) representing the proportion of the way between fromVector and toVector.
 * @return {TGE.Vector2} A new vector that is t of the way between the two vectors.
 */
TGE.Vector2.Lerp = function (fromVector, toVector, t)
{
	if (t <= 0)
	{
		return new TGE.Vector2(fromVector.x, fromVector.y);
	}
	else if (t >= 1)
	{
		return new TGE.Vector2(toVector.x, toVector.y);
	}
	return new TGE.Vector2(fromVector.x + t * (toVector.x - fromVector.x),
						   fromVector.y + t * (toVector.y - fromVector.y));
}

/**
 * Calculates and returns the distance between two vectors.
 * @param {TGE.Vector2} fromVector The origin vector.
 * @param {TGE.Vector2} toVector The target vector.
 * @return {Number} The distance between the two vectors.
 */
TGE.Vector2.Distance = function (fromVector, toVector)
{
	return Math.abs(fromVector.subtract(toVector).magnitude());
}

/**
 * Calculates and returns the distance between two vectors, without using a square root calculation.
 * Useful when you just need to compare two distances without needing the actual number.
 * @param {TGE.Vector2} fromVector The origin vector.
 * @param {TGE.Vector2} toVector The target vector.
 * @return {Number} The distance between the two vectors, without using a square root calculation.
 */
TGE.Vector2.SqrDistance = function (fromVector, toVector)
{
	return Math.abs(fromVector.subtract(toVector).sqrMagnitude());
}

/**
 * Get the scalar (dot product) between two vectors.
 * Returns 1 if two normalized vectors are vectoring in the same direction, -1 if they are in opposite directions, 0 if perpendicular.
 * @param {TGE.Vector2} fromVector The origin vector.
 * @param {TGE.Vector2} toVector The target vector.
 * @return {Number} The distance between the two vectors.
 */
TGE.Vector2.Dot = function (fromVector, toVector)
{
	return fromVector.dotProduct(toVector);
}

/**
 * The cross product of 2D vectors results in a 3D vector with only a z component.
 * This function returns the magnitude of the z value.
 * @param {TGE.Vector2} fromVector The origin vector.
 * @param {TGE.Vector2} toVector The vector to cross with the fromVector.
 * @return {Number} The magnitude of the z vector resulting from the cross product.
 */
TGE.Vector2.Cross = function (fromVector, toVector)
{
	return fromVector.crossProduct(toVector);
}

TGE.Vector2.prototype =
{
	toString: function()
	{
		return "(" + this.x + "," + this.y + ")";
	},

	/**
	 * Sets the members of Point to the specified values.
	 * @param {Number} x The new x value for the vector.
	 * @param {Number} y The new y value for the vector.
	 */
	setTo: function (x, y)
	{
		this.x = x;
		this.y = y;
	},

	/**
	 * Copies all of the vector data from the source Point object into the calling Point object.
	 * @param {TGE.Vector2} sourcePoint The Point object from which to copy the data.
	 * @return {TGE.Vector2} This vector object.
	 */
	copyFrom: function (sourcePoint)
	{
		this.x = sourcePoint.x;
		this.y = sourcePoint.y;
		return this;
	},

	/**
	 * Adds the coordinates of another vector to the coordinates of this vector to create a new vector.
	 * @param {TGE.Vector2} p The vector to be added.
	 * @return {TGE.Vector2} A new vector set to the result of the calculation.
	 */
	add: function (p)
	{
		return new this.constructor(this.x + p.x, this.y + p.y);
	},

	/**
	 * Subtracts the coordinates of another vector to the coordinates of this vector to create a new vector.
	 * @param {TGE.Vector2} p The vector to be subtracted.
	 * @return {TGE.Vector2} A new vector set to the result of the calculation.
	 */
	subtract: function (p)
	{
		return new this.constructor(this.x - p.x, this.y - p.y);
	},

	/**
	 * Multiplies the coordinates of this vector by a number or by the coordinates of another vector.
	 * @param {Number} p The scalar number that this vector is multiplied by.
	 * @return {TGE.Vector2} A new vector set to the result of the calculation.
	 */
	multiplyNumber: function (p)
	{
		if (typeof(p) !== "number")
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Only a number type is accepted as a scalar when multiplying a vector.");
		}
		return new this.constructor(this.x * p, this.y * p);
	},

	/**
	 * Divides the coordinates of this vector by a number or by the coordinates of another vector.
	 * @param {Number} p The scalar number that this vector is divided by.
	 * @return {TGE.Vector2} A new vector set to the result of the calculation.
	 */
	divideNumber: function (p)
	{
		if (typeof(p) !== "number")
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Only a number type is accepted as a scalar when dividing a vector.");
		}
		return new this.constructor(this.x / p, this.y / p);
	},

	/**
	 * Offsets the Point object by the specified amount.
	 * The value of dx is added to the original value of x to create the new x value.
	 * The value of dy is added to the original value of y to create the new y value.
	 * @param {Number} dx The amount by which to offset the horizontal coordinate, x.
	 * @param {Number} dy The amount by which to offset the vertical coordinate, y.
	 * @return {TGE.Vector2} This vector object.
	 */
	offset: function (dx, dy)
	{
		this.x += dx;
		this.y += dy;
		return this;
	},

	/**
	 * Rotates the vector around the origin to create a new vector.
	 * @param {Number} angle The angle in degrees to rotate the vector by.
	 * @return {TGE.Vector2} A new vector set to the result of the rotation.
	 */
	rotate: function (angle)
	{
		var r = angle * TGE.DEG2RAD;
		return new this.constructor(this.x * Math.cos(r) - this.y * Math.sin(r), this.y * Math.cos(r) + this.x * Math.sin(r));
	},

	/**
	 * Modifies the value of this vector by rotating it around the origin by the specified angle (in degrees).
	 * @param {Number} angle The angle in degrees to rotate the vector by.
	 * @return {TGE.Vector2} This vector object.
	 */
	rotateThis: function (angle)
	{
		var r = angle * TGE.DEG2RAD;
		var x2 = this.x * Math.cos(r) - this.y * Math.sin(r);
		var y2 = this.y * Math.cos(r) + this.x * Math.sin(r);
		this.setTo(x2, y2);

		return this;
	},

	/**
	 * Returns the length of the vector from the origin (0,0).
	 * @return {Number} The magnitude of the vector.
	 */
	magnitude: function ()
	{
		return Math.sqrt(this.sqrMagnitude());
	},

	/**
	 * Returns the squared length of this vector. Should be faster than using the actual magnitude.
	 * For when you just need to compare two magnitudes without needing to know the proper distance.
	 * @return {Number} The calculated distance without using the square root function.
	 */
	sqrMagnitude: function ()
	{
		return this.x * this.x + this.y * this.y;
	},

	/**
	 * Returns the dot product of two vectors.
	 * @param {TGE.Vector2} v The vector to dot with this vector.
	 * @return {Number} The dot product of the two vectors.
	 */
	dotProduct: function (v)    //Move to vector, rename dot, keep a copy here
	{
		return this.x * v.x + this.y * v.y;
	},

	/**
	 * The cross product of 2D vectors results in a 3D vector with only a z component.
	 * This function returns the magnitude of the z value.
	 * @param {TGE.Vector2} v The vector to cross with this vector.
	 * @return {Number} The magnitude of the z vector resulting from the cross product.
	 */
	crossProduct: function (v)    //Move to vector, rename cross, keep a copy here
	{
		return this.x * v.y - this.y * v.x;
	},

	/**
	 * Calculates the angle between this vector object and the specified vector.
	 * @param {TGE.Vector2} v The vector to compare to this vector.
	 * @return {Number} The angle between the two vectors in degrees.
	 */
	angleBetween: function (v)
	{
		var mag = this.magnitude() * v.magnitude();
		if (mag === 0)
		{
			return 0;
		}
		return Math.acos(this.dotProduct(v) / mag) * TGE.RAD2DEG;
	},

	/**
	 * Returns a new vector with a magnitude of 1, based on the direction of the current vector.
	 * @return {TGE.Vector2} A new normalized vector.
	 */
	normalized: function ()
	{
		var magnitude = this.magnitude();
		if (magnitude !== 0)
		{
			return this.divideNumber(magnitude);
		}
		return new this.constructor(0, 0);
	}
}

/**
 * Original class for points
 * @deprecated
 * @ignore
 */
TGE.Point = function(x, y)
{
	TGE.Point.superclass.constructor.call(this, x, y);
}
extend(TGE.Point, TGE.Vector2);

/**
 * Original class for vector math, was a subclass of Point
 * @deprecated
 * @ignore
 */
TGE.Vector2D = function(x, y)
{
	TGE.Vector2D.superclass.constructor.call(this, x, y);
}
extend(TGE.Vector2D, TGE.Vector2);
