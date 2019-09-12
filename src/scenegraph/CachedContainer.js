/**
 * The CachedContainer works exactly like a TGE.DisplayObjectContainer, but will cache all of its children into a single offscreen image that can be drawn as one object instead of the individual parts.
 * This can greatly reduce drawn object counts which increases performance, though it only works well when the child objects are static or updated very infrequently.
 * @class
 * @extends TGE.DisplayObjectContainer
 * @constructor
 */
TGE.CachedContainer = function()
{
	TGE.CachedContainer.superclass.constructor.apply(this,arguments);

	this.canvas = document.createElement('canvas');
	this.offscreenRenderer = new TGE.CanvasRenderer(this.canvas);
	this.canvasScale = 1;
};

TGE.CachedContainer.prototype =
{
	/**
	 * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
	 * @param {Object} params Information used to initialize the object.
	 * @param {Number} [params.canvasScale=1] A scaling factor that can be used to increase the clarity of the offscreen render. Note that using any value above the default 1 will incur additional memory and performance cost. A maximum value of 2 is recommended.
	 * @return {TGE.CachedContainer} Returns this object.
	 */
	setup: function(params)
	{
		TGE.CachedContainer.superclass.setup.call(this,params);

		// Width/height are required
		if(!params.width || !params.height)
		{
			this.width = this.height = 100;
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"width and height need to be defined for cached containers. Cached containers will clip any child that's outside of its width and height bounds.");
		}
		else
		{
			this.width = params.width;
			this.height = params.height;
		}

        this.centerRegistration = params.centerRegistration ? params.centerRegistration : false;
        this.canvasScale = params.canvasScale ? params.canvasScale : 1;

		return this;
	},

	/**
	 * The cache method should be manually called anytime a child object has been updated in a way that would affect
	 * the visual appearance of the container object as a whole. The cache method should also be called if the dimensions
	 * (width/height) of the container object are changed. Note that if the container is setup with a layout property,
	 * the cache call will be made automatically when the stage changes size. The cache method incurs the overhead of
	 * drawing all of the children in the container, so it should not be used frequently or it will defeat the purpose of
	 * caching in the first place.
	 */
	cache: function()
	{
        // Do not let the position of this object affect where the children are drawn
        var oldXform = this._mWorldTransform;
        var oldWXformNoReg = this._mWorldTransformNoReg;
        this._mWorldTransform = TGE.IDENTITY;
        this._mWorldTransformNoReg = TGE.IDENTITY;

		// Reset the canvas size in case it changed
		this.canvas.width = this.width*this.canvasScale;
		this.canvas.height = this.height*this.canvasScale;

		// Clear the offscreen canvas
		this.offscreenRenderer.getCanvasContext().clearRect(0,0,this.width,this.height);

		// This is a dirty hack - but we can force the global stage rendering scale using the private _mScale property
		this.stage._mScale = this.canvasScale;

		// Draw all the children into the offscreen canvas
		for(var i=0; i<this.numChildren(); ++i)
		{
			var obj = this.getChildAt(i);

            // CachedContainers draw children in their top left corner instead of their center, so this corrects that
            if (this.centerRegistration && !obj._centeredRegistration)
            {
                if (this.width == 0 || this.height == 0)
                {
                    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "width and height were not defined when the cache function was called on a cached container.");
                }
                else
				{
                    obj.x += this.width * this.registrationX;
                    obj.y += this.height * this.registrationY;
                    obj._centeredRegistration = true;
                }
            }

			obj._draw(this.offscreenRenderer);
		}

		// Restore everything
		this.stage._mScale = 1;
        this._mWorldTransform = oldXform;
        this._mWorldTransformNoReg = oldWXformNoReg;
	},

	/** @ignore */
	_objectDraw: function(renderer)
	{
		// Don't draw the children, just draw the cached offscreen canvas
		var cc = renderer.getCanvasContext();
		if(cc)
		{
			cc.drawImage(this.canvas,0,0,this.canvas.width,this.canvas.height,0,0,this.width,this.height);
		}
	},

	/** @ignore */
	_updateAABB: function()
	{
		// Update this object's AABB
		TGE.DisplayObject.prototype._updateAABB.call(this);

		// Do NOT merge in the children! They are problematic since they do not go through a normal draw
		// cycle properly. As well, the cached container will clip anything outside of its defined width/height,
		// so it is enough to treat that as the only relevant object in the bounds calculation.
	}
};
extend(TGE.CachedContainer,TGE.DisplayObjectContainer);
