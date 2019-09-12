/**
 * RectMask is a class for rectangular masking.
 *
 * There are two general methods for using this:
 *
 * 1. width/height masking
 *
 * // creates a 300x200 mask
 * var mask = this.addChild(new TGE.RectMask().setup({
 *     width: 300,
 *     height: 200
 * });
 *
 *  // any children of the mask will be clipped to its w/h
 *  mask.addChild(something);
 *
 * 2. Masking a portion of a Sprite
 *
 * // this creates a mask that is initially the size of the 'image' loaded
 * var mask = this.addChild(new TGE.RectMask().setup({
 *     image: "something"
 * });
 *
 * // This would display only Y coords from 10 to 60 from the image
 * mask.maskY = 10;
 * mask.maskHeight = 50;
 *
 * @class
 * @extends TGE.Sprite
 * @constructor
 */
TGE.RectMask = function ()
{
	TGE.RectMask.superclass.constructor.apply ( this, arguments );
};

TGE.RectMask.prototype =
{
	/**
	 * The setup method can be used initialize multiple parameters of an object with a single call.
	 * @param {String} [params.image] optional Sprite image to load into the mask
	 * @param {Number} [params.maskX=0] offset for where masking effect begins
	 * @param {Number} [params.maskY=0]
	 * @param {Number} [params.maskWidth] optional override of the size of the mask
	 * @param {Number} [params.maskHeight]
	 */
	setup: function ( params )
	{
		TGE.RectMask.superclass.setup.call ( this, params );
		this.maskX = params.maskX || 0;
		this.maskY = params.maskY || 0;
		this.maskWidth = params.maskWidth;
		this.maskHeight = params.maskHeight;
		return this;
	},

	/** @ignore */
	_objectDraw: function (renderer)
	{
		var context = renderer._mCanvasContext;
		context.save();
		context.beginPath();
		context.rect(this.maskX, this.maskY, this.maskWidth !== undefined ? this.maskWidth : this.width, this.maskHeight !== undefined ? this.maskHeight : this.height);
		context.clip();

		TGE.RectMask.superclass._objectDraw.call ( this, renderer );

		context.restore();
	},

    /** @ignore */
    /** override _updateAABB in order to only define its bounds as its own width/height, ignoring children*/
    _updateAABB: function()
    {
        TGE.DisplayObject.prototype._updateAABB.call(this);
    }
};
extend ( TGE.RectMask, TGE.Sprite );
