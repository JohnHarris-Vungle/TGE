/**
 * The Matrix class represents a 2D transformation matrix that determines how to map points from one coordinate space to another. These transformation functions include translation (x and y repositioning), rotation, scaling, and skewing.
 * @param {Number} a The value that affects the positioning of pixels along the x axis when scaling or rotating an image.
 * @param {Number} b The value that affects the positioning of pixels along the y axis when scaling or rotating an image.
 * @param {Number} c The value that affects the positioning of pixels along the x axis when rotating or skewing an image.
 * @param {Number} d The value that affects the positioning of pixels along the y axis when scaling or rotating an image.
 * @param {Number} tx The distance by which to translate each point along the x axis.
 * @param {Number} ty The distance by which to translate each point along the y axis.
 * @constructor
 */
TGE.Matrix = function (a, b, c, d, tx, ty)
{
	a = typeof a !== 'undefined' ? a : 1;
	d = typeof d !== 'undefined' ? d : 1;

	this._internal = [a, c || 0, tx || 0, b || 0, d, ty || 0];
}

/**
 * Creates a new Matrix object initialized as a rotation transformation using the specified angle in radians.
 * @param {Number} angleRadians The angle of the desired rotation, in radians.
 * @return {TGE.Matrix} A new matrix object initialized to the desired rotation.
 */
TGE.Matrix.RotationMatrix = function (angleRadians)
{
	var m = new TGE.Matrix();

	m._internal[0] = Math.cos(angleRadians);
	m._internal[1] = -Math.sin(angleRadians);
	m._internal[3] = Math.sin(angleRadians);
	m._internal[4] = Math.cos(angleRadians);

	return m;
}

/**
 * Creates a new Matrix object initialized as a scale transformation using the specified sx and sy values.
 * @param {Number} sx The desired horizontal scaling factor.
 * @param {Number} sy The desired vertical scaling factor.
 * @return {TGE.Matrix} A new matrix object initialized to the desired scaling factors.
 */
TGE.Matrix.ScaleMatrix = function (sx, sy)
{
	return new TGE.Matrix().scale(sx, sy);
}

/**
 * Creates a new Matrix object initialized as a translation using the specified dx and dy values.
 * @param {Number} dx The desired horizontal displacement in pixels.
 * @param {Number} dy The desired vertical displacement in pixels.
 * @return {TGE.Matrix} A new matrix object initialized to the desired translation.
 */
TGE.Matrix.TranslationMatrix = function (dx, dy)
{
	return new TGE.Matrix().translate(dx, dy);
}

TGE.Matrix.prototype =
{
	_internal: null,

	/**
	 * Returns a string representation of the matrix, useful for logging and debugging.
	 * @returns {String} A string representation of the matrix.
	 */
	toString: function ()
	{
		var m = this._internal;
		return "TGE.Matrix[" + m[0] + "," + m[1] + "," + m[2] + "," + m[3] + "," + m[4] + "," + m[5] + "]";
	},

	/**
	 * Sets each matrix property to a value that causes a null transformation. An object transformed by applying an identity matrix will be identical to the original.
	 * After calling the identity() method, the resulting matrix has the following properties: a=1, b=0, c=0, d=1, tx=0, ty=0.
	 * @return {TGE.Matrix} This matrix object, modified by the operation.
	 */
	identity: function ()
	{
		var m = this._internal;
		m[1] = m[2] = m[3] = m[5] = 0;
		m[0] = m[4] = 1;
		return this;
	},

	/**
	 * Copies all of the matrix data from the source Matrix object into the calling Matrix object.
	 * @param {TGE.Matrix} sourceMatrix The matrix from which to copy the data.
	 * @return {TGE.Matrix} This matrix object, modified by the operation.
	 */
	copyFrom: function (sourceMatrix)
	{
		var m = this._internal;
		var sm = sourceMatrix._internal
		m[0] = sm[0];
		m[1] = sm[1];
		m[2] = sm[2];
		m[3] = sm[3];
		m[4] = sm[4];
		m[5] = sm[5];

		return this;
	},

	/**
	 * Concatenates a matrix with the current matrix, effectively combining the geometric effects of the two. In mathematical terms, concatenating two matrices is the same as combining them using matrix multiplication.
	 * This method replaces the source matrix with the concatenated matrix.
	 * @param {TGE.Matrix} matrix2 The matrix object to concatenate with this one.
	 * @return {TGE.Matrix} This matrix object, modified by the operation.
	 */
	concat: function (matrix2)
	{
		var m1 = this._internal;
		var m2 = matrix2._internal;

		var m10c = m1[0];
		var m11c = m1[1];
		var m12c = m1[2];
		var m13c = m1[3];
		var m14c = m1[4];
		var m15c = m1[5];
		var m20c = m2[0];
		var m21c = m2[1];
		var m22c = m2[2];
		var m23c = m2[3];
		var m24c = m2[4];
		var m25c = m2[5];

		m1[0] = m10c * m20c + m11c * m23c;
		m1[1] = m10c * m21c + m11c * m24c;
		m1[2] = m10c * m22c + m11c * m25c + m12c;
		m1[3] = m13c * m20c + m14c * m23c;
		m1[4] = m13c * m21c + m14c * m24c;
		m1[5] = m13c * m22c + m14c * m25c + m15c;

		return this;
	},

	/**
	 * Applies a rotation transformation to this matrix object.
	 * @param {Number} angle The angle to rotate in degrees.
	 * @return {TGE.Matrix} This matrix object, modified by the operation.
	 */
	rotate: function (angle)
	{
		return this.concat(TGE.Matrix.RotationMatrix(angle * TGE.DEG2RAD));
	},

	/**
	 * Applies a scaling transformation to the matrix. The x axis is multiplied by sx, and the y axis it is multiplied by sy.
	 * @param {Number} sx The horizontal scaling factor.
	 * @param {Number} sy The vertical scaling factor.
	 * @return {TGE.Matrix} This matrix object, modified by the operation.
	 */
	scale: function (sx, sy)
	{
		var m = this._internal;
		m[0] *= sx;
		m[1] *= sy;
		m[3] *= sx;
		m[4] *= sy;
		return this;
	},

	/**
	 * Translates the matrix along the x and y axes, as specified by the dx and dy parameters.
	 * @param {Number} dx The desired horizontal translation, in pixels.
	 * @param {Number} dy The desired vertical translation, in pixels.
	 * @return {TGE.Matrix} This matrix object, modified by the operation.
	 */
	translate: function (dx, dy)
	{
		this._internal[2] += dx;
		this._internal[5] += dy;
		return this;
	},

	/**
	 * Transform a 2D point using this transformation matrix. Modifies the actual point object.
	 * @param {TGE.Vector2} p The point to transform.
	 * @return {TGE.Vector2} The original point object, transformed by this matrix.
	 */
	transformPoint: function (p)
	{
		var m = this._internal;
		var x = p.x;
		var y = p.y;
		p.x = x * m[0] + y * m[1] + m[2];
		p.y = x * m[3] + y * m[4] + m[5];

		return p;
	},

	/**
	 * Does an inverse transform on a 2D point using this transformation matrix. Modifies the actual point object.
	 * @param {TGE.Vector2} p The point to transform.
	 * @return {TGE.Vector2} The original point object, transformed by this matrix.
	 */
	inverseTransformPoint: function (p)
	{
		var m = this._internal;
		var id = 1 / (m[0] * m[4] - m[3] * m[1]);
		var x = p.x;
		var y = p.y;
		p.x = m[4] * id * x + -m[1] * id * y + (m[5] * m[1] - m[2] * m[4]) * id;
		p.y = m[0] * id * y + -m[3] * id * x + (-m[5] * m[0] + m[2] * m[3]) * id;
		return p;
	}
}
