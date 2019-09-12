/**
 * A Rectangle object is an axis-aligned area defined by its position (as indicated by the top-left corner point) and by its width and its height.
 * @class
 * @property {Number} x The x coordinate of the top-left corner of the rectangle.
 * @property {Number} y The y coordinate of the top-left corner of the rectangle.
 * @property {Number} width The width of the rectangle, in pixels.
 * @property {Number} height The height of the rectangle, in pixels.
 * @param {Number} x The x coordinate of the top-left corner of the rectangle.
 * @param {Number} y The y coordinate of the top-left corner of the rectangle.
 * @param {Number} width The width of the rectangle, in pixels.
 * @param {Number} height The height of the rectangle, in pixels.
 * @constructor
 */
TGE.Rectangle = function (x, y, width, height)
{
	this.x = x || 0;
	this.y = y || 0;
	this.width = width || 0;
	this.height = height || 0;
}

TGE.Rectangle.prototype =
{
	toString: function ()
	{
		return "TGE.Rectangle[" + this.x + "," + this.y + "," + this.width + "," + this.height + "]";
	},

	/**
	 * Determines whether the rectangle specified in the toIntersect parameter intersects with this TGE.Rectangle object.
	 * Note that TGE.Rectangle objects are always axis-aligned.
	 * @param {TGE.Rectangle} toIntersect The TGE.Rectangle object to compare against this rectangle object.
	 * @param {Number} [scaleFactor1=1] Percentage of this rectangle size to check against. Optional, 1 by default.
	 * @param {Number} [scaleFactor2=1] Percentage of the toIntersect rectangle size to check against. Optional, 1 by default.
	 * @return {Boolean} Whether or not the two rectangles intersect.
	 */
	intersects: function (toIntersect, scaleFactor1, scaleFactor2)
	{
		scaleFactor1 = typeof scaleFactor1 === "undefined" ? 1 : scaleFactor1;
		scaleFactor2 = typeof scaleFactor2 === "undefined" ? 1 : scaleFactor2;

		var scaleFactorX = this.width * (1 - scaleFactor1) / 2;
		var scaleFactorY = this.height * (1 - scaleFactor1) / 2;
		var aminx = this.x + scaleFactorX;
		var aminy = this.y + scaleFactorY;
		var amaxx = this.x + this.width - scaleFactorX;
		var amaxy = this.y + this.height - scaleFactorY;

		scaleFactorX = toIntersect.width * (1 - scaleFactor2) / 2;
		scaleFactorY = toIntersect.height * (1 - scaleFactor2) / 2;
		var bminx = toIntersect.x + scaleFactorX;
		var bminy = toIntersect.y + scaleFactorY;
		var bmaxx = toIntersect.x + toIntersect.width - scaleFactorX;
		var bmaxy = toIntersect.y + toIntersect.height - scaleFactorY;

		if (bminx >= aminx && bmaxx <= amaxx && bminy >= aminy && bmaxy <= amaxy)
		{
			return true; // Inside
		}

		if ((amaxx < bminx || aminx > bmaxx) || (amaxy < bminy || aminy > bmaxy))
		{
			return false; // Outside
		}

		return true; // Intersects
	},

	/**
	 * Adds the rectangle specified in the toUnion parameter to this TGE.Rectangle object, by filling in the horizontal and vertical space between the two rectangles.
	 * @param {TGE.Rectangle} toUnion The TGE.Rectangle object to add to this rectangle object.
	 */
	union: function (toUnion)
	{
		var oldMaxX = this.x + this.width;
		var oldMaxY = this.y + this.height;
		var unionMaxX = toUnion.x + toUnion.width;
		var unionMaxY = toUnion.y + toUnion.height;

		this.x = Math.min(this.x, toUnion.x);
		this.y = Math.min(this.y, toUnion.y);

		var maxX = Math.max(oldMaxX, unionMaxX);
		var maxY = Math.max(oldMaxY, unionMaxY);

		this.width = maxX - this.x;
		this.height = maxY - this.y;
	},

	/**
	 * Returns true if the x and y coordinates of a point are inside this rectangle.
	 * @param {Number} x The x-coordinate of the point to test.
	 * @param {Number} y The y-coordinate of the point to test.
	 * @returns {Boolean} Whether or not the specified point lies inside the bounds of the rectangle.
	 */
	contains: function (x, y)
	{
		return (x >= this.x) && (x <= this.x + this.width) && (y >= this.y) && (y <= this.y + this.height);
	},

	/**
	 * Returns true if the line defined by two endpoints intersects this rectangle. Which endpoint is considered the start or end is only relevant if the intersection point is also requested.
	 * @param {Number} x1 The x coordinate of the starting point for the line to test.
	 * @param {Number} y1 The y coordinate of the starting point for the line to test.
	 * @param {Number} x2 The x coordinate of the ending point for the line to test.
	 * @param {Number} y2 The y coordinate of the ending point for the line to test.
	 * @param {Object|TGE.Vector2|TGE.DisplayObject} [intersectionPoint] An optional object (ie: TGE.Vector2, TGE.DisplayObject) that will have its x and y properties set to the coordinates where the line intersects the rectangle.
	 * @returns {Boolean} True if the specified line intersects this rectangle, false otherwise.
	 */
	lineIntersects: function (x1, y1, x2, y2, intersectionPoint)
	{
		// Simple case, check if the line segment originates in the box
		if (this.contains(x1, y1))
		{
			if (intersectionPoint)
			{
				intersectionPoint.x = x1;
				intersectionPoint.y = y1;
			}
			return true;
		}

		// Now we'll check each of the sides of the AABB for a penetration...
		var maxX = this.x + this.width;
		var maxY = this.y + this.height;
		var ratio, px, py;

		// Left
		if ((x2 >= this.x) && (x1 < this.x))
		{
			// Find the penetration point
			ratio = (this.x - x1) / (x2 - x1);
			px = this.x;
			py = y1 + ((y2 - y1) * ratio);
			// Check if its on the face
			if (py >= this.y && py <= maxY)
			{
				if (intersectionPoint)
				{
					intersectionPoint.x = px;
					intersectionPoint.y = py;
				}
				return true;
			}
		}

		// Right
		if ((x2 <= maxX) && (x1 > maxX))
		{
			// Find the penetration point
			ratio = (maxX - x1) / (x2 - x1);
			px = maxX;
			py = y1 + ((y2 - y1) * ratio);
			// Check if its on the face
			if (py >= this.y && py <= maxY)
			{
				if (intersectionPoint)
				{
					intersectionPoint.x = px;
					intersectionPoint.y = py;
				}
				return true;
			}
		}

		// Bottom
		if ((y2 <= maxY) && (y1 > maxY))
		{
			// Find the penetration point
			ratio = (maxY - y1) / (y2 - y1);
			px = x1 + ((x2 - x1) * ratio);
			py = maxY;
			// Check if its on the face
			if (px >= this.x && px <= maxX)
			{
				if (intersectionPoint)
				{
					intersectionPoint.x = px;
					intersectionPoint.y = py;
				}
				return true;
			}
		}

		// Top
		if ((y2 >= this.y) && (y1 < this.y))
		{
			// Find the penetration point
			ratio = (this.y - y1) / (y2 - y1);
			px = x1 + ((x2 - x1) * ratio);
			py = this.y;
			// Check if its on the face
			if (px >= this.x && px <= maxX)
			{
				if (intersectionPoint)
				{
					intersectionPoint.x = px;
					intersectionPoint.y = py;
				}
				return true;
			}
		}
		return false;
	}
}
