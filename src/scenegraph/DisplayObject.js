/**
 * The DisplayObject class is the base class for all visual objects that can be placed on the stage.
 * The DisplayObject class is the base class for all visual objects that can be placed on the stage.
 * The DisplayObject class supports basic functionality like the x and y position of an object, rotation, and scaling, as well as more advanced properties of the object such as its transformation matrix.
 * Typically you would not instantiate a TGE.DisplayObject directly - it would be more common to use {@link TGE.DisplayObjectContainer} or {@link TGE.Sprite}.
 * @property {Number} x Indicates the x coordinate of the display object relative to the local coordinates of the parent TGE.DisplayObjectContainer.
 * @property {Number} y Indicates the y coordinate of the display object relative to the local coordinates of the parent TGE.DisplayObjectContainer.
 * @property {Number} worldX The x coordinate of the display object in world space.
 * @property {Number} worldY The y coordinate of the display object in world space.
 * @property {Number} scaleX Indicates the horizontal scale percentage of the display object as applied from the registration point.
 * @property {Number} scaleY Indicates the vertical scale percentage of the display object as applied from the registration point.
 * @property {Number} scale A write-only property that indicates a uniform scale percentage to apply to the display object. This property is WRITE-ONLY - setting it will modify scaleX and scaleY accordingly, and any attempt to read the property will be undefined.
 * @property {Number} rotation Indicates the rotation of the display object in degrees.
 * @property {Number} alpha Indicates the alpha transparency value of the display object (valid values are from 0-1).
 * @property {String} backgroundColor Specifies the background color of the display object's bounding area as a hex value string (ie: "#ff0000").
 * @property {Object} backgroundGradient an oject containing multiple parameters that define the qualities of a gradient applied to the display object's bounding area.  Parameters are:
 * <ul>
 *     <li>direction: Specifies what direction the gradient should extend in.  Options are "horizontal", "vertical", "rightDiagonal", "leftDiagonal", or "circular".</li>
 *     <li>color1:  Indicates the first color used in the 2 color gradient.</li>
 *     <li>color2:  Indicates the second color used in the 2 color gradient.</li>
 *     <li>transitionPoint:  Indicates at what percentage of the length of the gradient should the transition between the two colors happen. (ie: transitionPoint: 0.5 transitions the two colors at the center of the Display Object.</li>
 * </ul>
 * @property {Boolean} visible Whether or not the display object is visible.
 * @property {Number} width Indicates the width of the display object in pixels.
 * @property {Number} height Indicates the height of the display object in pixels.
 * @property {Number} registrationX Indicates the horizontal registration point for the display object as a percentage (ie: 0=far left, 0.5=center, 1=far right). Default is 0.5.
 * @property {Number} registrationY Indicates the vertical registration point for the display object as a percentage (ie: 0=top, 0.5=middle, 1=bottom). Default is 0.5.
 * @property {TGE.DisplayObjectContainer} parent Indicates the TGE.DisplayObjectContainer object that contains this display object as a child.
 * @property {TGE.GameStage} stage The TGE.GameStage instance that this display object is on.
 * @property {Boolean} mouseEnabled Determines whether or not the display object responds to mouse actions. Default is false.
 * @property {TGE.Vector2} pointerLocal Indicates the coordinates of the user input pointer (touch, mouse, etc.), in pixels, relative to the top left corner of the display object. This value is only accurate when mouseEnabled = true.
 * @property {TGE.Vector2} pointerStage Indicates the coordinates of the user input pointer (touch, mouse, etc.), in pixels, relative to the top left corner of the stage. This value is only accurate when mouseEnabled = true.
 * @property {String} cameraShakeTag A descriptor that is used by camera shake effects.
 * @property {String} instanceName An optional name you can provide to the display object.
 * @property {String|Object|Function} layout Defines how the object behaves with a responsive layout (when the the TGE.Game.resizeCanvasToFit property is true). The layout property can be one of three different types:
 * <ul>
 * <li>String - a single string to define common presets for sizing background images. Options are "match", "fill", "aspect-fill", "best-fit", "fit-width", or "fit-height".
 *     The "match" setting is unique in that it works by changing the object's width and height (and forcing scale to 1), whereas the other options shape the element by changing the scaleX and scaleY properties.</li>
 * <li>Object - an object containing multiple parameters that define how an object positions and scales itself relative to the stage size. Parameters are:
 *  <ul>
 *      <li>scaleToWidth, scaleToHeight: Scales the object to the percentage of the parent's width/height specified. If both scaleToWidth and scaleToHeight are specified, useMinScale indicates which scale factor will be used.</li>
 *      <li>useMinScale: When values for both scaleToWidth and scaleToHeight are provided, use the smaller value. Default is true.</li>
 *      <li>matchWidth, matchHeight: Sets dimensions of object without scaling it.</li>
 *      <li>xPercentage, yPercentage: Indicates where to position the object as a percentage of the stage width and/or height (ie: xPercentage: 0.5 centers the object horizontally).</li>
 *      <li>anchorTop, anchorBottom, anchorLeft, anchorRight: Positions the object a fixed distance from the top/bottom/left/right respectively. Distance is specified as a percentage of the greater of the parent's width or height.</li>
 *      <li>allowSubPixel: Whether to allow the final position of the object to fall in between exact pixel coordinates. Default is false.</li>
 *      <li>custom: A function that will be called in addition to applying any of the other parameters whenever the stage size changes. The caller will automatically be bound to 'this' object.</li>
 *      <li>pickLayout: A function that will be called to decide which subset of layout rules to use.  Passes in the aspect ratio.</li>
 *      <li>portrait: An object containing standard layout parameters that are used when the screen height is greater or equal to the screen width.</li>
 *      <li>landscape: An object containing standard layout parameters that are used when the screen height is less than the screen width.</li> *  </ul>
 * </li>
 * <li>Function - a function that will be called whenever the stage size changes. The caller will automatically be bound to 'this' object.</i></li>
 * </ul>
 * @constructor
 */
TGE.DisplayObject = function()
{
    // Public members
    this.x = 0;
    this.y = 0;
    this.worldX = 0;
    this.worldY = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    this.alpha = 1;
    this.colorDef = null;
    this.backgroundColor = null;
    this.visible = true;
    this.width = 0;
    this.height = 0;
    this.registrationX = TGE.DisplayObject.DefaultRegistrationX;
    this.registrationY = TGE.DisplayObject.DefaultRegistrationY;
    this.parent = null;
	this.stage = TGE.Game.GetInstance() ? TGE.Game.GetInstance().stage : null;
    this.mouseEnabled = false;
    this.cameraShakeTag = "DEFAULT";
    this.instanceName = "";
    this.pointerLocal = new TGE.Vector2(0,0);
    this.pointerStage = new TGE.Vector2(0,0);

    // Deprecated
    this.mouseX = 0;
    this.mouseY = 0;

    // Private members
    this._mPreviousX = 0;
    this._mPreviousY = 0;
    this._mPreviousScaleX = 1;
    this._mPreviousScaleY = 1;
    this._mPreviousRotation = 0;
    this._mPreviousRegistrationX = 0;
    this._mPreviousRegistrationY = 0;
    this._mPreviousWidth = 0;
    this._mPreviousHeight = 0;
    this._mPreviousVisibility = false;
	this._mPreviousAlpha = 1;
	this._mRegistrationOffset = new TGE.Vector2(0,0);
    this._mLocalTransformNoReg = new TGE.Matrix();
    this._mLocalTransformDirty = true;
    this._mWorldTransform = new TGE.Matrix();
    this._mWorldTransformNoReg = new TGE.Matrix();
    this._mWorldTransformUpdated = true;
    this._mTopLeft = new TGE.Vector2();
    this._mTopRight = new TGE.Vector2();
    this._mBottomLeft = new TGE.Vector2();
    this._mBottomRight = new TGE.Vector2();
    this._mAABB = new TGE.Rectangle();
    this._mBoundingInfoDirty = true;
    this._mWorldAlpha = 1;
    this._mIgnoreProperties = false;
    this._mMouseDown = false;
	this._mMouseDownX = 0;
	this._mMouseDownY = 0;
	this._mMouseDownTime = 0;
	this._mMouseOver = null; // Undefined state until we test
    this._mVisibilityChanged = false;
    this._mMarkedForRemoval = false;
    this._mEventListeners = {};
	this._mUseDrawEvents = false;
	this._mLastUpdate = -1;
	this._mViewportCulling = null;
	this._mWorldPositionListener = -1;
	this._mTweens = [];
	this._mTweenListener = null;
    this._mShakes = [];
    this._mShakeListener = null;
	this._mActions = [];
	this._mActionsListener = null;
	this._mBackgroundGradient = null;
	this._mAddedToStage = false;
    this._mPreviousParent = null;
    this._mLayoutResizeListener = null;
    this._mLayout = null;
    this._mFullStage = this.stage ? this.stage._mFullStage : null;

    return this;
};

/**
 * The initial implementation of the new anchoring strategies have incorrect behavior when the parent's
 * registration is non-zero. This flag provides backward compatibility, and can be set to true to provide
 * correct anchoring regardless of the parent's registration. (Will default to true in TGE 2.0).
 * @property {boolean} Anchor layout methods provide consistent results, regardless of parent registration
 */
// Removed for the moment, but left for reference, since the fix really needs to be extended to other strategies like x/yPercentage
// Which also means that this name won't apply anyway.
// TGE.DisplayObject.UseAnchorRegistration = false;

/**
 * Defines the default registrationX property of a new TGE.DisplayObject. Initial default is 0.5 (50%).
 * @property {Number} The default horizontal registration point value used for a new display object (ie: 0=far left, 0.5=center, 1=far right). Default is 0.5.
 */
TGE.DisplayObject.DefaultRegistrationX = 0.5;

/**
 * Defines the default registrationY property of a new TGE.DisplayObject. Initial default is 0.5 (50%).
 * @property {Number} The default vertical registration point value used for a new display object (ie: 0=far left, 0.5=center, 1=far right). Default is 0.5.
 */
TGE.DisplayObject.DefaultRegistrationY = 0.5;

/** @ignore */
TGE.DisplayObject._sNextEventListenerID = 0;

TGE.DisplayObject.prototype =
{
    /**
     * The setup method can be used initialize multiple parameters of an object with a single call.
     * @param {Object} params Information used to initialize the object.
     * @param {String} [params.instanceName] An optional name you can provide to the display object.
     * @param {Boolean} [params.visible] Whether or not the display object is visible.
     * @param {Number} [params.x] Indicates the x coordinate of the display object relative to the local coordinates of the parent TGE.DisplayObjectContainer.
     * @param {Number} [params.y] Indicates the y coordinate of the display object relative to the local coordinates of the parent TGE.DisplayObjectContainer.
     * @param {Number} [params.worldX] The x coordinate of the display object in world space.
     * @param {Number} [params.worldY] The y coordinate of the display object in world space.
     * @param {Number} [params.width] Indicates the width of the display object in pixels.
     * @param {Number} [params.height] Indicates the height of the display object in pixels.
     * @param {String} [params.colorDef] index into GameConfig.COLOR_DEFS for runtime substitution of either backgroundColor or backgroundGradient (based on whether the lookup is a string, or an object)
     * @param {String} [params.backgroundColor] Specifies the background color of the display object's bounding area as a hex value string (ie: "#ff0000").
	 * @param {String} [params.backgroundGradient] Specifies the qualities of the background gradient of the display object's bounding area as an object. See the property description for more information.
	 * @param {Number} [params.alpha] Indicates the alpha transparency value of the display object (valid values are from 0-1).
	 * @param {Number} [params.scaleX] Indicates the horizontal scale percentage of the display object as applied from the registration point.
	 * @param {Number} [params.scaleY] Indicates the vertical scale percentage of the display object as applied from the registration point.
	 * @param {Number} [params.scale] Indicates a desired uniform scaling to apply to the display object (like setting the same value for both scaleX and scaleY).
     * @param {Number} [params.registrationX] Indicates the horizontal registration point for the display object as a percentage (ie: 0=far left, 0.5=center, 1=far right). Default is 0.5.
     * @param {Number} [params.registrationY] Indicates the vertical registration point for the display object as a percentage (ie: 0=top, 0.5=middle, 1=bottom). Default is 0.5.
	 * @param {Boolean} [params.mouseEnabled] Determines whether or not the display object responds to mouse actions. Default is false.
     * @param {String} [params.cameraShakeTag] Specifies a descriptor that can be used by camera shake effects
     * @param {TGE.DisplayObjectContainer} [params.parent] Indicates the TGE.DisplayObjectContainer object that this display object should be added to as a child.
     * @param {String|Object|Function} [params.layout] Defines how the object behaves with a responsive layout (when the the TGE.Game.resizeCanvasToFit property is true). See the property description for more information.
     * @return {TGE.DisplayObject} Returns this object.
     */
    setup: function(params)
    {
        // Instance name
        typeof(params.instanceName)==="string" ? this.instanceName = params.instanceName : null;

        // Visibility
        typeof(params.visible)==="boolean" ? this.visible = params.visible : null;

		// Mouse enabled
        typeof(params.mouseEnabled)==="boolean" ? this.mouseEnabled = params.mouseEnabled : null;

        // Screen Coordinates
        typeof(params.x)==="number" ? this.x = params.x : null;
        typeof(params.y)==="number" ? this.y = params.y : null;

        // World Coordinates
        typeof(params.worldX)==="number" ? this.worldX = params.worldX : null;
        typeof(params.worldY)==="number" ? this.worldY = params.worldY : null;

        // Size
        typeof(params.width)==="number" ? this.width = params.width : null;
        typeof(params.height)==="number" ? this.height = params.height : null;

		// Scale
        typeof(params.scaleX)==="number" ? this.scaleX = params.scaleX : null;
        typeof(params.scaleY)==="number" ? this.scaleY = params.scaleY : null;
		typeof(params.scale)==="number" ? this.scaleX = this.scaleY = params.scale : null;

        // Rotation
        typeof(params.rotation)==="number" ? this.rotation = params.rotation : null;

        // colorDef
        typeof(params.colorDef)==="string" ? this.colorDef = params.colorDef : null;

        // Color
        typeof(params.backgroundColor)==="string" ? this.backgroundColor = params.backgroundColor : null;

        // Gradient
        typeof(params.backgroundGradient)==="object" ? this._mBackgroundGradient = this._makeGradient(params.backgroundGradient) : null;

        // Alpha
        typeof(params.alpha)==="number" ? this.alpha = params.alpha : null;

        // Registration points
        typeof(params.registrationX)==="number" ? this.registrationX = params.registrationX : null;
        typeof(params.registrationY)==="number" ? this.registrationY = params.registrationY : null;

        // Camera Shake Tag
        typeof(params.cameraShakeTag)==="string" ? this.cameraShakeTag = params.cameraShakeTag : "DEFAULT";

        // Position in scenegraph
        typeof(params.parent)!=="undefined" ? params.parent.addChild(this) : null;

	    // Responsive layout handling
	    if(params.layout)
	    {
		    this._setLayout(params.layout);
	    }

	    // Deprecated - probably only used by Fairway Solitaire?
	    if(params.onResize)
	    {
		    this._setLayout(params.onResize);
	    }

	    return this;
    },

	/** @ignore */
	_setLayout: function(layout)
	{
        if (this._mLayoutResizeListener)
        {
            this.removeEventListener("resize", this._mLayoutResizeListener);
            this._mLayoutResizeListener = null;
			this._mLayout = null;
        }

		if(layout)
		{
			// Check for invalid conditions
			if(typeof layout === "object")
			{
				// Check substrategies
				var numSubStrategies = 0;
				for (var property in layout)
				{
					if(layout[property])
					{

						// Check layout if the substrategy is an object
						if(typeof layout[property] == "object")
						{
							this._checkLayout(layout[property], property.toString());
						}


						// Count substrategies
						if(typeof layout[property] == "object" || typeof layout[property] == "string" || typeof layout[property] == "function")
						{
							numSubStrategies++;
						}

					}
				}

				// If 2 or more substrategies, don't throw warnings for lack of default strategy
				if (numSubStrategies < 2)
				{
					this._checkLayout(layout, "default");
				}
			}

			this._mLayout = TGE.DeepClone(layout);  // PAN-1434 clone layout object so the original isn't affected by tweens, etc.

			this._mLayoutResizeListener = this.addEventListener("resize", this._resize.bind(this, null));

			// If the object is already in the scenegraph, update with the new layout
			if(this.parent)
			{
				this._resize(null, TGE._ResizeEvent);
			}
		}
	},

	/** @ignore */
	_checkLayout: function(layout, description)
	{
        var useCustomPosition = layout.useCustomPosition === true;
        var useCustomScale = layout.useCustomScale === true;
        var xPercentage = typeof layout.xPercentage === "number";
        var yPercentage = typeof layout.yPercentage === "number";
        var scaleToWidth = typeof layout.scaleToWidth === "number";
        var scaleToHeight = typeof layout.scaleToHeight === "number";
        var matchWidth = typeof layout.matchWidth === "number";
        var matchHeight = typeof layout.matchHeight === "number";
        var topAnchor = typeof layout.topAnchor === "number" || typeof layout.anchorTop === "number";
        var bottomAnchor = typeof layout.bottomAnchor === "number" || typeof layout.anchorBottom === "number";
        var leftAnchor = typeof layout.leftAnchor === "number" || typeof layout.anchorLeft === "number";
        var rightAnchor = typeof layout.rightAnchor === "number" || typeof layout.anchorRight === "number";

        // Horizontal specification
        if (!leftAnchor && !rightAnchor && !xPercentage && !useCustomPosition)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"no way to determine object's horizontal position in " + description + " responsive layout strategy");
            layout.xPercentage = 0;
        }
        // Vertical specification
        if (!topAnchor && !bottomAnchor && !yPercentage && !useCustomPosition)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"no way to determine object's vertical position in " + description + " responsive layout strategy");
            layout.yPercentage = 0;
        }

        // Scaling specification
        if(!scaleToWidth && !scaleToHeight && !matchWidth && !matchHeight && !useCustomScale)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"no way to determine object's scale in " + description + " responsive layout strategy");
            layout.scaleToWidth = layout.scaleToHeight = 1;
        }

        //Using deprecated layout code?
        if (typeof layout.anchorLeft == "number" || typeof layout.anchorRight == "number" || typeof layout.anchorTop == "number" ||
            typeof layout.anchorBottom == "number")
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"Using deprecated layout code! Use topAnchor, bottomAnchor, leftAnchor, and rightAnchor " +
                "instead of anchorTop, anchorBottom, anchorLeft, and anchorRight.");
        }

        // Using matchWidth with scaleToHeight?
        if(matchWidth && scaleToHeight)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"Using matchWidth with scaleToHeight. Use matchHeight with matchWidth");
        }
        // Using matchHeight with scaleToWidth?
        if(matchHeight && scaleToWidth)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"Using matchHeight with scaleToWidth. Use matchHeight with matchWidth");
        }

        // Using matchHeight with undefined width?
        if (this.width == 0 && matchHeight && !matchWidth)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "Using matchHeight without matchWidth or defining object’s width");
        }
        // Using matchWidth with undefined height?
        if (this.height == 0 && matchWidth && !matchHeight)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "Using matchWidth without matchHeight or defining object’s height");
        }
	},

	/** @ignore */
	_resize: function(layout, event)
	{
		if (!this.parent)
		{
			// resize is not valid, until the object is part of the scene hierarchy
			return;
		}

		if (!layout)
		{
			layout = this._mLayout;
		}

		if(typeof layout === "string")
		{
			var sx = this.parent.width/this.width;
			var sy = this.parent.height/this.height;

			if(layout==="match")
			{
				this.x = this.parent.percentageOfWidth(this.registrationX);
				this.y = this.parent.percentageOfHeight(this.registrationY);
				this.width = this.parent.width;
				this.height = this.parent.height;
				this.scale = 1;
			}
			else if(layout==="fill")
			{
				this.x = this.parent.percentageOfWidth(this.registrationX);
				this.y = this.parent.percentageOfHeight(this.registrationY);
				this.scaleX = sx;
				this.scaleY = sy;
			}
			else if(layout==="aspect-fill")
			{
				this.x = this.parent.percentageOfWidth(this.registrationX);
				this.y = this.parent.percentageOfHeight(this.registrationY);
				this.scale = Math.max(sx,sy);
			}
			else if(layout==="fit-width" || (layout==="best-fit" && sx<=sy))
			{
				this.x = this.parent.percentageOfWidth(this.registrationX);
				this.y = (this.parent.height-this.height*sx)/2 + this.registrationY*this.height*sx;
				this.scale = sx;
			}
			else if(layout==="fit-height" || (layout==="best-fit" && sy<sx))
			{
				this.x = (this.parent.width-this.width*sy)/2 + this.registrationX*this.width*sy;
				this.y = this.parent.percentageOfHeight(this.registrationY);
				this.scale = sy;
			}
		}
		else if(typeof layout === "function")
		{
			this._executeLayoutFunction(layout,event);
		}
		else if(typeof layout === "object")
		{
			// Positioning

			// Substrategies
			if(layout.pickLayout)
			{
				var subStrategy = layout.pickLayout.call(this,event.height/event.width);
				if (layout[subStrategy])
				{
					this._resize(layout[subStrategy], event);
					return;
				}
				else
				{
					TGE.Debug.Log(TGE.Debug.LOG_ERROR,subStrategy + " layout substrategy is not defined");
				}
			}
			else
			{
				if(layout.portrait && event.height >= event.width)
				{
					this._resize(layout.portrait, event);
					return;
				}
				if(layout.landscape && event.height < event.width)
				{
					this._resize(layout.landscape, event);
					return;
				}
			}

			// DEPRECATED
			if(typeof layout.percentageX === "number")
			{
				layout.xPercentage = layout.percentageX;
				layout.percentageX = undefined;
			}
			if(typeof layout.percentageY === "number")
			{
				layout.yPercentage = layout.percentageY;
				layout.percentageY = undefined;
			}
			if(typeof layout.scaleWidthToFit === "number")
			{
				layout.scaleToWidth = layout.scaleWidthToFit;
				layout.scaleWidthToFit = undefined;
			}
			if(typeof layout.scaleHeightToFit === "number")
			{
				layout.scaleToHeight = layout.scaleHeightToFit;
				layout.scaleHeightToFit = undefined;
			}

			// Percentage based
			if(typeof layout.xPercentage === "number")
			{
				this.x = this.parent.percentageOfWidth(layout.xPercentage);
			}
			if(typeof layout.yPercentage === "number")
			{
				this.y = this.parent.percentageOfHeight(layout.yPercentage);
			}

			// Anchoring
			var ab = this.parent.height>this.parent.width ? this.parent.height : this.parent.width;
			if(typeof layout.anchorTop === "number")
			{
				this.registrationY = 0;
				this.y = layout.anchorTop*ab;
			}
			if(typeof layout.anchorBottom === "number")
			{
				this.registrationY = 1;
				this.y = this.parent.height - layout.anchorBottom*ab;
			}
			if(typeof layout.anchorLeft === "number")
			{
				this.registrationX = 0;
				this.x = layout.anchorLeft*ab;
			}
			if(typeof layout.anchorRight === "number")
			{
				this.registrationX = 1;
				this.x = this.parent.width - layout.anchorRight*ab;
			}

			// Snap to nearest pixel?
			if(layout.allowSubPixel!==true)
			{
				this.x = Math.round(this.x);
				this.y = Math.round(this.y);
			}

            // Scaling
            if (!layout.useCustomScale)
            {
                var sx,sy;
                sx = sy = layout.useMinScale===false ? -Number.MAX_VALUE : Number.MAX_VALUE;
                if(typeof layout.scaleToWidth === "number")
                {
                    sx = this.parent.width/this.width * layout.scaleToWidth;
                }
                if(typeof layout.scaleToHeight === "number")
                {
                    sy = this.parent.height/this.height * layout.scaleToHeight;
                }

                this.scale = layout.useMinScale===false ? Math.max(Math.abs(sx), Math.abs(sy)) : Math.min(Math.abs(sx),Math.abs(sy));
                this.scaleX *= (sx<0 ? -1 : 1);
                this.scaleY *= (sy<0 ? -1 : 1);
            }

			// Execute a custom function if provided
			if(typeof layout.custom === "function")
			{
				this._executeLayoutFunction(layout.custom,event);
			}

            // Match width / height
            if (typeof layout.matchWidth === "number")
            {
                this.scale = 1;
                this.width = this.parent.width * layout.matchWidth;
            }
            if (typeof layout.matchHeight === "number")
            {
                this.scale = 1;
                this.height = this.parent.height * layout.matchHeight;

            }

            // New Anchoring
            if (typeof layout.topAnchor === "number")
            {
	            this.y = layout.topAnchor * this.parent.height + this.height * this.scaleY * this.registrationY;
	            // PAN-1107 removed for the moment, since the issue really extends to other strategies like xPercentage
/*
	            if (TGE.DisplayObject.UseAnchorRegistration)
	            {
		            this.y -= this.parent.height * this.parent.registrationY;
	            }
*/
            }
            if (typeof layout.bottomAnchor === "number")
            {
                this.y = this.parent.height * (1 - layout.bottomAnchor) - this.height * this.scaleY * (1 - this.registrationY);
/*
	            if (TGE.DisplayObject.UseAnchorRegistration)
	            {
		            this.y -= this.parent.height * this.parent.registrationY;
	            }
*/
            }
            if (typeof layout.leftAnchor === "number")
            {
                this.x = layout.leftAnchor * this.parent.width + this.width * this.scaleX * this.registrationX;
/*
	            if (TGE.DisplayObject.UseAnchorRegistration)
	            {
		            this.x -= this.parent.width * this.parent.registrationX;
	            }
*/
            }
            if (typeof layout.rightAnchor === "number")
            {
                this.x = this.parent.width * (1 - layout.rightAnchor) - this.width * this.scaleX * (1 - this.registrationX);
/*
	            if (TGE.DisplayObject.UseAnchorRegistration)
	            {
		            this.x -= this.parent.width * this.parent.registrationX;
	            }
*/
            }
		}
	},

	/** @ignore */
	_executeLayoutFunction: function(layout,event)
	{
		layout.call(this,event);
	},

	/** @ignore */
	_layoutHasDynamicDimensions: function(layout)
	{
		// Returns true if the object uses a layout strategy that would result in the width/height changing on resize.
		// Note this is a best guess as an object using a custom layout function, or substrategies,
		// cannot be accounted for.

		if(!layout)
		{
			return false;
		}

		if(layout==="match")
		{
			return true;
		}

		if(layout["matchWidth"] || layout["matchHeight"])
		{
			return true;
		}

		return this._layoutHasDynamicDimensions(layout["portrait"]) || this._layoutHasDynamicDimensions(layout["landscape"]);
	},

	/**
	 * Returns true if this object has a responsive layout strategy or listens to the resize event. If you have a custom object
	 * that behaves responsively but doesn't use a layout strategy or resize listener (or the resize listener is not added on setup),
	 * then you can override this function to return true to avoid false positive warnings in tgedebug=4 mode.
	 */
	isResponsive: function()
	{
		return this._mLayout!==null || (this._mEventListeners["resize"] && this._mEventListeners["resize"].length>0);
	},

    /**
     * This function simply applies the same layout the object was created with again.  If the object was moved at all from it's responsive position, it will snap back into place.
     */
    reapplyLayout: function()
    {
        this.dispatchEvent(TGE._ResizeEvent);
    },

    /**
     * This function will manually set the local transformation matrix of the DisplayObject.
     * Using this function will cause the x, y, scaleX, scaleY, and rotation properties of the DisplayObject to be ignored.
     * They will also no longer be kept updated with the current display settings of the object.
     * @param {Number} a The value that affects the positioning of pixels along the x axis when scaling or rotating an image.
     * @param {Number} b The value that affects the positioning of pixels along the y axis when scaling or rotating an image.
     * @param {Number} c The value that affects the positioning of pixels along the x axis when rotating or skewing an image.
     * @param {Number} d The value that affects the positioning of pixels along the y axis when scaling or rotating an image.
     * @param {Number} tx The distance by which to translate each point along the x axis.
     * @param {Number} ty The distance by which to translate each point along the y axis.
     */
    setLocalTransform: function(a,b,c,d,tx,ty)
    {
        var m = this._mLocalTransformNoReg._internal;
        m[0] = a;
        m[1] = c;
        m[2] = tx;
        m[3] = b;
        m[4] = d;
        m[5] = ty;

        // Once this function has been used we stop building the local
        // transformation matrix using x, y, scale, rotation, etc.
        this._mIgnoreProperties = true;
        this._mLocalTransformDirty = true;
    },

    /**
     * This function can be called to undo the effect of calling setLocalTransform.
     * Calling this function will cause the x, y, scaleX, scaleY, and rotation properties to be used for generating the local transformation matrix again.
     */
    useDisplayProperties: function()
    {
        this._mIgnoreProperties = false;
        this._mLocalTransformDirty = true;
    },

    /**
     * Returns a rectangle that defines the axis-aligned boundary of the DisplayObject.
     * @param {boolean} [ignoreChildren] If set to true, children won't be taken into account in the bounds calculation
     * @return {TGE.Rectangle}
     */
    getBounds: function(ignoreChildren)
    {
        ignoreChildren = ignoreChildren === true;

        this._checkVisibilityChange();

        if (this._mBoundingInfoDirty || ignoreChildren)
        {
            this._updateAABB(ignoreChildren);

            // If you used getBounds non-recursively, invalidate AABB so it gets reset to normal the next time it's needed
            if (ignoreChildren)
            {
                this._mBoundingInfoDirty = true;
            }
        }
        return this._mAABB;
    },

    /**
     * Evaluates the DisplayObject to see if it overlaps or intersects with the point specified by the x and y parameters.
     * @param {Number} x The x coordinate to test against this object.
     * @param {Number} y The y coordinate to test against this object.
     * @return {Boolean} True if the display object overlaps or intersects with the specified point; false otherwise.
     */
    hitTestPoint: function(x,y)
    {
        var bounds = this.getBounds();
        return (x > bounds.x && x < bounds.x+bounds.width &&
            y > bounds.y && y < bounds.y+bounds.height);
    },

    /**
     * Call this function to flag an object for removal from the game. It will be cleaned up and removed during the next update cycle.
     */
    markForRemoval: function()
    {
        this._mMarkedForRemoval = true;
        this._mFullStage._trashObject(this);
    },

    /**
     * Indicates whether an entity has been flagged for removal from the scene.
     * @return {Boolean} True if the entity has been flagged for removal, false otherwise.
     */
    markedForRemoval: function()
    {
        return this._mMarkedForRemoval;
    },

	/**
	 * Removes child display objects that match the specified name (either a String, or an Array of Strings).
	 * @param {String|Array} name The instance name[s] to search for.
	 */
	removeChildByName: function(name)
	{
		var i;
		if(typeof(name)==="string")
		{
			for(i=this._mChildren.length; --i>=0;)
			{
				var child = this._mChildren[i];
				if(child.instanceName===name)
				{
					this.removeChild(child);
				}
			}
		}
		else
		{
			for(i=name.length; --i>=0; )
			{
				this.removeChildByName(name[i]);
			}
		}
	},

    /**
     * Cleans up an object's ties to other objects before it is removed from the scene
     */
    removeFromScene: function()
    {
	    this.handleEvent({type:"remove"});

        this.clearEventListeners();

        // Remove this object from the parent
        if(this.parent!==null)
        {
	        this.parent._setBoundingInfoDirty();
	        this.parent.removeChild(this);
	        this.parent = null;
        }

	    this._mMarkedForRemoval = true;
    },

    /**
     * Provides the number of children of this object, and optionally all children's children as well.
     * @param {Boolean} recursive Whether or not to recursively count children (ie: children's children)
     * @return {Number} The number of children of this object.
     */
    numChildren: function(recursive)
    {
        return 0;
    },

	/**
	 * Returns whether the contents are currently cached.
	 * DisplayObject has no children, and is thus never cached.
	 * @returns {boolean}
	 */
	isCached: function()
	{
		return false;
	},

	/**
	 * Returns the index of this object in its parent's children array
	 * @return {Number} The index of this object.
	 */
	getIndex: function()
	{
		if(this.parent!==null)
		{
			return this.parent.getChildIndex(this);
		}
		return -1;
	},

    /**
     * Moves this display object ahead of the next object in the draw stack (within the children of this object's parent).
     */
    bringForward: function()
    {
        if(this.parent!==null)
        {
            var i = this.parent.getChildIndex(this);
            if(i<this.parent._mChildren.length-1)
            {
                var tmp = this.parent._mChildren[i+1];
                this.parent._mChildren[i+1] = this;
                this.parent._mChildren[i] = tmp;
            }
        }
    },

    /**
     * Moves this display object to be the most forefront of all this parents children.
     */
    bringToFront: function()
    {
        if(this.parent!==null)
        {
            var i = this.parent.getChildIndex(this);
            this.parent._mChildren.splice(i,1);
            this.parent._mChildren.push(this);
        }
    },

    /**
     * Moves this display object behind the previous object in the draw stack (within the children of this object's parent).
     */
    sendBackward: function()
    {
        if(this.parent!==null)
        {
            var i = this.parent.getChildIndex(this);
            if(i>0)
            {
                var tmp = this.parent._mChildren[i-1];
                this.parent._mChildren[i-1] = this;
                this.parent._mChildren[i] = tmp;
            }
        }
    },

    /**
     * Moves this display object to be the farthest in the background of all this parents children.
     */
    sendToBack: function()
    {
        if(this.parent!==null)
        {
            var i = this.parent.getChildIndex(this);
            this.parent._mChildren.splice(i,1);
            this.parent._mChildren.unshift(this);
        }
    },

	/**
	 * Indicates whether or not the mouse (or other user input device) is currently down.
	 * NOTE: Numberous games were already using `isMouseDown` properties, which conflicted with that name. Thus, the switch to 'Pointer'.
	 * @return {Boolean} Whether or not the mouse (or other user input device) is currently down.
	 */
	isPointerDown: function()
	{
		return this._mMouseDown;
	},

	/**
	 * Returns whether or not the mouse is currently over the object. This method will always return false unless this.mouseEnabled is set to true.
	 * (Added for namespace compatibility with isPointerDown)
	 * @return {Boolean}
	 */
	isPointerOver: function()
	{
		return this._mMouseOver===true;
	},

	/**
     * Returns whether or not the mouse is currently over the object. This method will always return false unless this.mouseEnabled is set to true.
     * @return {Boolean}
     */
    isMouseOver: function()
    {
	    return this._mMouseOver===true;
    },

    /**
     * Registers a single event listener on a single target.
     * @param {String} type A string representing the event type to listen for.
     * @param {Function} listener The object that receives a notification when an event of the specified type occurs. This must be a JavaScript function.
     * @return {Number} A unique id to identify the listener (used when calling removeEventListener).
     */
    addEventListener: function(type,listener)
    {
        // Does anything exist for this event yet?
        if(!this._mEventListeners[type])
        {
            this._mEventListeners[type] = [];
        }

        var newListener = {
            id: ++TGE.DisplayObject._sNextEventListenerID,
            listener: listener
        };
        this._mEventListeners[type].push(newListener);

        // Set some flags automatically
	    if(type.substring(0,5)==="mouse" || type==="click")
        {
            this.mouseEnabled = true;

	        if (this instanceof TGE.GameStage && TGE.Game.GetUpdateRoot() && TGE.Game.GetUpdateRoot() !== this && !TGE.Game.GetInstance()._mBufferingScreen)
            {
	            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"Adding mouse event listener to stage when SetUpdateRoot is pointing elsewhere. See PAN-1239.");
            }
        }
	    else if(type==="drawbegin" || type==="drawend")
        {
	        // PAN-353 (once this is set it stays set)
	        this._mUseDrawEvents = true;
        }
        else if(type==="update" && this.stage)
        {
	        // PAN-343
	        this._mFullStage._addUpdateObj(this);
        }

        return newListener.id;
    },

    /**
     * Allows the removal of specific event listeners from the event target.
     * @param {String} type A string representing the event type being removed.
     * @param {Number|Function} listener The listener is either a pointer to the function to be removed, or an id indicating which function to be removed (ids are returned by the addEventListener call).
     */
    removeEventListener: function(type,listener)
    {
        if(this._mEventListeners[type])
        {
            // Find it
            for(var i = this._mEventListeners[type].length; --i >= 0;)
            {
            	var l = this._mEventListeners[type][i];
                if(l.id===listener || l.listener===listener)
                {
                    // mark it for removal, and add to list for removal processing
	                l.id = 0;
	                if (this._mFullStage._mListenerRemovals.indexOf(this) < 0)
	                {
		                this._mFullStage._mListenerRemovals.push(this);
	                }
                    return;
                }
            }
        }

	    // If we got here the listener wasn't found... log a warning
	    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "removeEventListener could not find listener specified for "+type+" event");
    },

    /**
     * Allows the removal of all event listeners for a specific event.
     * @param {String} type A string representing the event type for which all listeners should be removed.
     */
    removeEventListenersFor: function(type)
    {
        if(this._mEventListeners[type])
        {
            this._mEventListeners[type] = [];
        }
    },

    /**
     * Removes all of an object's event listeners
     */
    clearEventListeners: function()
    {
        this._mEventListeners = {};
    },

    /**
     * Dispatches an event to the specified object in the scene graph. The event will also be propagated downward to all of the object's children.
     * However note that there is no 'bubbling' phase like js or actionscript events.
     * @param {Object} event An object containing information about the event.
     * @param {String} event.type A string indicating the event type to fire.
     * @param {TGE.DisplayObject} event.currentTarget A reference to the currently registered target for the event..
     * @param {TGE.DisplayObject} event.target A reference to the target to which the event was originally dispatched.
     */
    dispatchEvent: function(event)
    {
        // Set the target if this is the originating object
        if(typeof event.target === "undefined")
        {
            event.target = this;
        }

        // Set the current target
        event.currentTarget = this;

        this.handleEvent(event);
    },

    /**
     * This method will execute any functions for this object that are set to listen to the specified event.
     * @param {Object} event An object containing information about the event.
     * @param {String} event.type A string indicating the event type to fire.
     * @param {TGE.DisplayObject} event.currentTarget A reference to the currently registered target for the event..
     * @param {TGE.DisplayObject} event.target A reference to the target to which the event was originally dispatched.
     */
	handleEvent: function(event)
	{
		var listeners = this._mEventListeners[event.type];
		if(listeners && listeners.length)
		{
			// Set the current target
			event.currentTarget = this;

			// Fire every listener in the list
			var len = listeners.length;
			for(var i = 0; i < len; ++i)
			{
				if (listeners[i].id)    // if listener is still active (not marked for removal)
				{
					listeners[i].listener.call(this,event);
				}
				// Checking the validity of this._mEventListeners[event.type] feels hackish, but prevents the situation
				// where an event might trigger the listeners of this object to be cleared mid-loop
				if (!this._mEventListeners[event.type] || this._mMarkedForRemoval)
				{
					break;
				}
			}
		}
	},

	/**
	 * Takes care of mouse state flags, and sending the "click" event on mouseup, if conditions are met for it
	 * @param event
	 * @ignore
	 */
	_handleMouseEvent: function(event)
	{
		var wasDown = this._mMouseDown;     // save original state for "click: test
		switch (event.type)
		{
			case "mousedown":
				this._mMouseDown = true;
				this._mMouseDownX = event.x;
				this._mMouseDownY = event.y;
				this._mMouseDownTime = new Date();
				break;
			case "mouseup":
			case "mouseupoutside":
				this._mMouseDown = false;
				break;
		}

		this.handleEvent(event);

		if (event.type === "mouseup")
		{
			var majorAxis = Math.max(this.stage.width, this.stage.height);
			if (majorAxis)
			{
				var dx = Math.abs(event.x - this._mMouseDownX) / majorAxis;
				var dy = Math.abs(event.y - this._mMouseDownY) / majorAxis;
				if (wasDown && new Date() - this._mMouseDownTime < TGE.CLICK_TIME * 1000 && dx < TGE.CLICK_DISTANCE_FRACTION && dy < TGE.CLICK_DISTANCE_FRACTION)
				{
					event.type = "click";
					this.handleEvent(event);
					event.type = "mouseup";
				}
			}
		}
	},

    /**
     * Returns a horizontal pixel coordinate specified by a percentage of the object's width.
     * @param {Number} p The desired horizontal pixel coordinate specified as a percentage of the object's width.
     * @return {Number} The resulting x coordinate in pixels relative to the far left side of the object.
     */
    percentageOfWidth: function(p)
    {
        return this.width*p;
    },

    /**
     * Returns a vertical pixel coordinate specified by a percentage of the object's height.
     * @param {Number} p The desired vertical pixel coordinate specified as a percentage of the object's height.
     * @return {Number} The resulting y coordinate in pixels relative to the top of the object.
     */
    percentageOfHeight: function(p)
    {
        return this.height*p;
    },

    /**
     * Returns a horizontal pixel coordinate defined by the specified distance from the left side of the object.
     * @param {Number} p The number of pixels from the left side of the object.
     * @return {Number} The resulting x coordinate (in pixels) as defined by the specified distance from the left side of the object.
     */
    pixelsFromLeft: function(p)
    {
        return p;
    },

    /**
     * Returns a horizontal pixel coordinate defined by the specified distance from the right side of the object.
     * @param {Number} p The number of pixels from the right side of the object.
     * @return {Number} The resulting x coordinate (in pixels) as defined by the specified distance from the right side of the object.
     */
    pixelsFromRight: function(p)
    {
        return this.width-p;
    },

    /**
     * Returns a vertical pixel coordinate defined by the specified distance from the top of the object.
     * @param {Number} p The number of pixels from the top of the object.
     * @return {Number} The resulting y coordinate (in pixels) as defined by the specified distance from the top of the object.
     */
    pixelsFromTop: function(p)
    {
        return p;
    },

    /**
     * Returns a vertical pixel coordinate defined by the specified distance from the bottom of the object.
     * @param {Number} p The number of pixels from the bottom of the object.
     * @return {Number} The resulting y coordinate (in pixels) as defined by the specified distance from the bottom of the object.
     */
    pixelsFromBottom: function(p)
    {
        return this.height-p;
    },

	/**
	 * PAN-472 - removing this from docs, it is dependent on the deprecated 0.3 "mCameraPosition" concept.
	 * @ignore
	 */
	cullToViewport: function(top,right,bottom,left)
    {
        // If culling parameters haven't been set, setup a camera update event
        if(this._mViewportCulling===null)
        {
            this.addEventListener("camerachange",this._checkViewportCulling.bind(this));
        }
        this._mViewportCulling = [top,right,bottom,left];
    },

    /**
     * Specifies that you want the object's screen position to be updated automatically every frame to reflect the object's
     * world position (worldX, worldY) relative to the current position of the game camera.
     * @param {Boolean} b Whether to enable or disable automatic world-to-screen position updating.
     */
    useWorldPosition: function(b)
    {
        // If culling parameters haven't been set, setup a camera update event
        if(b && this._mWorldPositionListener===-1)
        {
            this._mWorldPositionListener = this.addEventListener("camerachange",this._updateScreenPosition.bind(this));
        }
        else if(!b && this._mWorldPositionListener!==-1)
        {
            this.removeEventListener("camerachange",this._mWorldPositionListener);
            this._mWorldPositionListener = -1;
        }
    },

	/**
	 * Tweens a set of properties for the display object from the current values to a new set of values.
	 * Any numerical property of the display object can be tweened (ie: x, y, rotation, alpha,..)
	 * @param {Object} params Information used to initialize the tween.
	 * @param {Number} [params.duration=1] The desired duration of the tween from start to finish (in seconds).
	 * @param {Function} [params.easing=TGE.Tween.Linear] The easing function to use for the tween. Built-in functions are:
	 * <ul>
	 *     <li>TGE.Tween.Linear</li>
	 *     <li>TGE.Tween.Quadratic.In, TGE.Tween.Quadratic.Out, TGE.Tween.Quadratic.InOut</li>
	 *     <li>TGE.Tween.Cubic.In, TGE.Tween.Cubic.Out, TGE.Tween.Cubic.InOut</li>
	 *     <li>TGE.Tween.Quartic.In, TGE.Tween.Quartic.Out, TGE.Tween.Quartic.InOut</li>
	 *     <li>TGE.Tween.Quintic.In, TGE.Tween.Quintic.Out, TGE.Tween.Quintic.InOut</li>
	 *     <li>TGE.Tween.Sine.In, TGE.Tween.Sine.Out, TGE.Tween.Sine.InOut</li>
	 *     <li>TGE.Tween.Exponential.In, TGE.Tween.Exponential.Out, TGE.Tween.Exponential.InOut</li>
	 *     <li>TGE.Tween.Circular.In, TGE.Tween.Circular.Out, TGE.Tween.Circular.InOut</li>
	 *     <li>TGE.Tween.Elastic.In, TGE.Tween.Elastic.Out, TGE.Tween.Elastic.InOut</li>
	 *     <li>TGE.Tween.Back.In, TGE.Tween.Back.Out, TGE.Tween.Back.InOut</li>
	 *     <li>TGE.Tween.Bounce.In, TGE.Tween.Bounce.Out, TGE.Tween.Bounce.InOut</li>
	 * </ul>
	 * If you want to use your own easing function it should accept a parameter for time (normalized to 0-1), and another optional parameter as specified in the easingParam parameter.
	 * @param {Number} [params.easingParam] An optional amplitude parameter for use when using TGE.Tween.Back or TGE.Tween.Elastic easing functions.
	 * @param {Number} [params.delay=0] A delay that can be applied before the tween starts (in seconds).
	 * @param {Boolean|Number} [params.loop=false] If true, the tween will start over once it is complete and loop infinitely. If specified as a numerical value, the tween will loop for only the number of times specified by the value. Use the loop parameter in conjunction with the rewind parameter to create a "yo-yo" loop.
	 * @param {Boolean} [params.rewind=false] If true, the tween will loop by progressing from start-to-end, then end-to-start, etc. (sometimes referred to as "yo-yo"). Only applicable if the loop parameter is true or a non-zero numerical value.
	 * @param {Function} [params.onComplete] An optional callback function that will be fired when the tween is complete.
	 * @param {Number|String} [params.id] id An optional user specified id value (typically a string or number) that can be used to later cancel the tween using the removeTween method.
	 * @returns {TGE.Tween} Returns the new tween object that was created. This can be used to chain new tweens using TGE.Tween.thenTweenTo.
	 */
	tweenTo: function(params)
	{
		params.target = params.target || this;
		var tween = new TGE.Tween().setup(params);
		this._mTweens.push(tween);

		// Make sure we have an event listener to update the tweens
		if(typeof this._mTweenListener!=="number") // PAN-575
		{
			this._mTweenListener = this.addEventListener("update",this._updateTweens.bind(this));
		}

		return tween;
	},

	/**
	 * Tweens a set of properties for the display object from the specified values to values currently set for the object.
	 * @param {Object} params Information used to initialize the tween. For a complete list of parameters, see TGE.DisplayObject.tweenTo.
	 * @returns {TGE.Tween} Returns the new tween object that was created. This can be used to chain new tweens using TGE.Tween.thenTweenTo.
	 */
	tweenFrom: function(params)
	{
		params.startFromEnd = true;
		return this.tweenTo(params);
	},

	/**
	 * Cancels a pending or currently running tween.
	 * @param {Number|String} id The id of the tween, as specified in the tween's setup parameters.
	 * @param {Boolean} [runChains=true] Indicates whether to start any tweens that are chained to this one (defaults to true).
	 * @param {Boolean} [fireCallback=true] Indicates whether to fire the onComplete callback if one was set (defaults to true).
	 */
	removeTween: function(id,runChains,fireCallback)
	{
		runChains = typeof runChains === "undefined" ? true : runChains;
		fireCallback = typeof fireCallback === "undefined" ? true : fireCallback;

		// Just have to brute force find it...
		for(var t=0; t<this._mTweens.length; t++)
		{
			if(this._mTweens[t].id===id)
			{
				// Tell the tween to stop, it will get cleaned up next update
				this._mTweens[t].endTween(runChains,fireCallback);
				return;
			}
		}

		// If we got here the tween wasn't found... log a warning
		TGE.Debug.Log(TGE.Debug.LOG_WARNING, "removeTween could not find tween with id: "+id);
	},

	/**
	 * Clears all active and pending tweens for the display object.
	 */
	clearTweens: function()
	{
		if(this._mTweens.length>0)
		{
			this._mTweens = [];
			this.removeEventListener("update",this._mTweenListener);
			this._mTweenListener = null;
		}
	},

    /**
     * Applies a shake effect to the display object
     * @param {Function} type The type of the camera shake to apply. Must extend TGE.CameraShake. TGE.NoiseShake & TGE.SpringShake are provided.
     * @param {Object} params Information used to initialize the shake.
     * @param {Function} [params.onComplete] An optional callback function that will be fired when the shake is complete.
     * @returns {TGE.CameraShake} Returns the new shake object that was created.
     */
    addCameraShake: function(type, params)
    {
        if (!(typeof(type)==="function")) //Invalid shake type
            return;

        params.target = this;
        var shake = new type().setup(params);
        this._mShakes.push(shake);

        //Make sure we have an event listener to update the shakes
        if(typeof this._mShakeListener!=="number") // PAN-575
        {
            this._mShakeListener = this.addEventListener("update", this._updateShakes.bind(this));
        }

        return shake;
    },

    /**
     * Clears all active and pending shakes for the display object.
     */
    clearCameraShakes: function()
    {
        if (this._mShakes.length > 0)
        {
            this._mShakes = [];
            this.removeEventListener("update", this._mShakeListener);
            this._mShakeListener = null;
        }
    },

	/**
	 * Calls a function after a specified delay. The function can also be called repeatedly, with a fixed time delay between each call.
	 * @param {Object} params Information used to initialize the action.
	 * @param {Function} [params.action] action The function to call. Unless bind is used to explicitly specify the function caller, this object will be used.
	 * @param {Number} [params.delay=0] delay The initial delay before the function is called for the first time.
	 * @param {Boolean|Number} [params.repeat=1] repeat Whether to call the function more than once. Default (and minimum) value is 1. Specifying a number will call the function a finite number of times. If 'true' the function will be repeated indefinitely.
	 * @param {Number} [params.interval=1] interval The number of seconds between each successive call to the action function. Only applicable if the repeat parameter is true or greater than 1.
	 * @param {Number|String} [params.id] id An optional user specified id value (typically a string or number) that can be used to later cancel the action using the removeAction method.
	 */
	performAction: function(actionParams)
	{
		actionParams._timer = 0;
		actionParams._prev = 0;
		actionParams.delay = typeof(actionParams.delay)==="number" ? actionParams.delay : 0;
		actionParams.interval = typeof(actionParams.interval)==="number" ? actionParams.interval : (actionParams.delay>0 ? actionParams.delay : 1);
		actionParams.repeat = typeof(actionParams.repeat)==="number" ? actionParams.repeat : (actionParams.repeat===true ? Number.MAX_VALUE : 1);

		this._mActions.push(actionParams);

		// Make sure we have an event listener to update the delayed actions
		if(typeof this._mActionsListener!=="number") // PAN-575
		{
			this._mActionsListener = this.addEventListener("update",this._updateActions.bind(this));
		}
	},

	/**
	 * Cancels a pending or currently running action.
	 * @param {Number|String} id The id of the action, as specified in the performAction call.
	 * @param {Boolean} [warning=false] If warning is true and an action with the specified id was not found, a warning will be logged.
	 */
	removeAction: function(id,warning)
	{
		// Just have to brute force find it...
		for(var a=0; a<this._mActions.length; a++)
		{
			if(this._mActions[a].id===id)
			{
				this._mActions.splice(a,1);

				// If there's no actions left, remove the listener
				if(this._mActions.length===0 && typeof this._mActionsListener==="number")
				{
					this.removeEventListener("update",this._mActionsListener);
					this._mActionsListener = null;
				}

				return;
			}
		}

		if(warning)
		{
			// If we got here the action wasn't found... log a warning
			TGE.Debug.Log(TGE.Debug.LOG_WARNING, "removeAction could not find action with id: "+id);
		}
	},

	/** @ignore */
	clearAction: function(id)
	{
		TGE.Debug.Log(TGE.Debug.LOG_WARNING, "clearAction is deprecated, use removeAction instead!");
		this.removeAction(id);
	},

	/**
	 * Clears all active and pending actions for the display object.
	 */
	clearActions: function()
	{
		if(this._mActions.length > 0)
		{
			this._mActions = [];
			this.removeEventListener("update", this._mActionsListener);
			this._mActionsListener = null;
		}
	},

	/**
	 * Returns true if the object does actual draw operations. Used for the TGE debug widget. If you define a TGE.DisplayObject subclass you can override this method to accurately reflect your object as something that "draws" or not.
	 * @returns {boolean} Whether or not the object does actual draw operations.
	 */
	doesDrawing: function()
	{
		// this._mUseDrawEvents does not necessarily mean the object is doing any canvas operations, but it's a good indicator
		return (this._mUseDrawEvents || this.backgroundColor || this._mBackgroundGradient || this._mRendererTexture || this._mPreviousText) ? true : false;
	},

    /**
     * Transforms a point local to this object into stage coordinates.
     * @param {TGE.Vector2} p A TGE.Point (or any object with x and y properties) to be assigned the transformed values.
     * @param {boolean=false} ignoreRegistration If true, will disregard the objects registration point when calculating the stage coordinates.
     * @returns {TGE.Vector2} Transformed point
     */
    localToStage: function(p, ignoreRegistration)
    {
    	if (!p)
	    {
		    p = new TGE.Vector2();
	    }

        // Make sure the world transform is up to date
	    this._updateWorldTransform();

        if(ignoreRegistration)
        {
            this._mWorldTransformNoReg.transformPoint(p);
        }
        else
        {
            this._mWorldTransform.transformPoint(p);
        }
        return p;
    },

    /**
     * Transforms a point in global stage coordinates into one that's local to this object.
     * @param {TGE.Vector2} p A TGE.Vector2 (or any object with x and y properties) to be assigned the transformed values.
     * @param {boolean=false} ignoreRegistration If true, will disregard the objects registration point when calculating the coordinates.
     * @returns {TGE.Vector2} Transformed point
     */
    stageToLocal: function(p, ignoreRegistration)
    {
	    if (!p)
	    {
		    p = new TGE.Vector2();
	    }

        // Make sure the world transform is up to date
	    this._updateWorldTransform();

	    if (ignoreRegistration)
	    {
		    this._mWorldTransformNoReg.inverseTransformPoint(p);
	    }
	    else
	    {
		    this._mWorldTransform.inverseTransformPoint(p);
	    }
	    return p;
    },

    /**
     * Transforms a point from the local space of one object to the local space of another.
     * @param {TGE.DisplayObject} targetObject the destination object to transform the point to
     * @param {TGE.Vector2} p A TGE.Vector2 (or any object with x and y properties) to be assigned the transformed values.
     * @param {boolean=false} ignoreRegistration If true, will disregard the objects registration point when calculating the coordinates.
     * @returns {TGE.Vector2} Transformed point
     */
    localToObject: function(targetObject, p, ignoreRegistration)
    {
    	p = this.localToStage(p, ignoreRegistration);
    	targetObject.stageToLocal(p, ignoreRegistration);
    	return p;
    },

	/**
	 * This was originally added with a typo in camelCase, so keep a stub until there are no references in live games
	 * @deprecated
	 */
    stageTolocal: function(p)
    {
    	this.stageToLocal(p);
    },

	/** @ignore */
	_injectTween: function(tween)
	{
		this._mTweens.push(tween);
	},

	/** @ignore */
	_updateTweens: function(event)
	{
		for(var t=this._mTweens.length-1; t>=0; t--)
		{
			var tween = this._mTweens[t];
			tween._update(event.elapsedTime);
			if(tween.finished() && tween===this._mTweens[t]) // Make sure the current tween is still the same in the list (an onComplete callback could have removed it)
			{
				this._mTweens.splice(t,1);
			}
		}

		// If there's no tweens left, remove the listener
		if(this._mTweens.length===0 && typeof this._mTweenListener==="number")
		{
			this.removeEventListener("update",this._mTweenListener);
			this._mTweenListener = null;
		}
	},

    /** @ignore */
    _updateShakes: function(event)
    {
        for(var s=this._mShakes.length-1; s>=0; s--)
        {
            var shake = this._mShakes[s];
            shake._update(event.elapsedTime);
            if (shake.finished() && shake===this._mShakes[s]) // Make sure the current shake is still the same in the list (an onComplete callback could have removed it)
            {
                this._mShakes.splice(s,1);
            }
        }

        //If there are no shakes left, remove the listener
        if(this._mShakes.length===0)
        {
            this.removeEventListener("update",this._mShakeListener);
            this._mShakeListener = null;
        }
    },

	/** @ignore */
	_updateActions: function(event)
	{
		for(var a=this._mActions.length-1; a>=0; a--)
		{
			var action = this._mActions[a];
			action._timer += event.elapsedTime;

			// Have we crossed an event interval?
			var e = TGE.clamp(Math.ceil(action._timer-action.delay),0,1) +
				Math.max(0,Math.floor((action._timer-action.delay)/action.interval));

			if(e!==action._prev)
			{
				// Fire the action
				action.action.call(this);
				action._prev = e;
			}

			// Is it done for good?
			if(e>=action.repeat)
			{
				this._mActions.splice(a,1);
			}
		}

		// If there's no actions left, remove the listener
		if(this._mActions.length===0 && typeof this._mActionsListener==="number")
		{
			this.removeEventListener("update",this._mActionsListener);
			this._mActionsListener = null;
		}
	},

    /** @ignore */
    _updateScreenPosition: function(event)
    {
        var x = (this.stage.width/2)+(this.worldX-event.cx);
        var y = (this.stage.height/2)-(this.worldY-event.cy);
        this.x = x;
        this.y = y;
    },

    /** @ignore */
    _checkViewportCulling: function(event)
    {
        if(this._mViewportCulling===null)
        {
            return;
        }

        // If the viewport culling sides are set and the object has passed
        // out of the camera's view on that side, it will be removed
        var aabb = this.getBounds();
        var remove = false;

        // Top
        if(this._mViewportCulling[0] && aabb.y+aabb.height<0)
        {
            remove = true;
        }

        // Right
        if(this._mViewportCulling[1] && aabb.x>this.stage.width)
        {
            remove = true;
        }

        // Bottom
        if(this._mViewportCulling[2] && aabb.y>this.stage.height)
        {
            remove = true;
        }

        // Left
        if(this._mViewportCulling[3] && aabb.x+aabb.width<0)
        {
            remove = true;
        }

        // Remove it?
        if(remove)
        {
            this.markForRemoval();
        }
    },

    /** @ignore */
    _draw: function(renderer)
    {
	    // PAN-609 - this could be deprecated game code calling this function directly and passing in a canvas context
	    // instead of a renderer object. If so, use our spare renderer and make the call properly
	    if(!renderer.isTGERenderer)
	    {
		    this._mFullStage._mSpareCanvasRenderer.swapContext(renderer); // Actually a context
		    return this._draw(this._mFullStage._mSpareCanvasRenderer);
	    }

        this._checkVisibilityChange();
        if(!this.visible)
        {
            return;
        }

        // Update this object transform (necessary before drawing children)
        this._updateTransforms();

        // Add it to the collection of mouse targets if it is mouseEnabled and visible
        if(this.stage!==null && this.mouseEnabled)
        {
            this._mFullStage._mMouseTargets.push(this);
        }

	    // Apply the world transform
	    var stageScale = (this.stage!==null && this._mFullStage._mScale!==1) ? this._mFullStage._mScale : 1;
	    renderer.setWorldTransform(this._mWorldTransform,stageScale);

        // Set the alpha for the object
	    renderer.setAlpha(this._mWorldAlpha);

	    if (this.colorDef && GameConfig.COLOR_DEFS)
	    {
	    	var def = GameConfig.COLOR_DEFS[this.colorDef];
		    if (typeof def === "string")
		    {
			    this.backgroundColor = def;
		    }
		    else
		    {
			    this._mBackgroundGradient = def;
		    }
	    }

	    // Draw the background gradient or color fill if there is one
        if (this._mBackgroundGradient)
        {
			var bg = this._mBackgroundGradient;
			renderer.gradientFill(bg.direction,bg.color1,bg.color2,bg.transitionPoint,this.width,this.height);
        }
        else if(this.backgroundColor)
        {
	        renderer.fillRectangle(0,0,this.width,this.height,this.backgroundColor);
        }

	    // Do the subclass specific drawing
	    if(this._mUseDrawEvents)
	    {
		    this.handleEvent({type:"drawbegin", renderer:renderer, canvasContext:renderer.getCanvasContext()});
		    this._objectDraw(renderer);
		    this.handleEvent({type:"drawend", renderer:renderer, canvasContext:renderer.getCanvasContext()});
	    }
	    else
	    {
		    this._objectDraw(renderer);
	    }

	    // Increment the visible objects count
	    this._mFullStage._mNumVisibleObjects++;

	    // Increment the drawn objects count
	    if(this.doesDrawing())
	    {
		    this._mFullStage._mNumDrawnObjects++;
	    }
    },

    /** @ignore */
    _objectDraw: function(renderer)
    {
        // PAN-604 - if this object contains a _drawClass method, then it was overriding the old version of _objectDraw
	    // and is expecting a single argument which is the canvas context.

	    this._drawClass(renderer.getCanvasContext(),true);
    },

	/** @ignore */
	_drawClass: function(canvasContext,internalCall)
	{
		if(!internalCall)
		{
			this._mFullStage._mSpareCanvasRenderer.swapContext(canvasContext);
			this._mFullStage._mSpareCanvasRenderer.deprecatedDrawCycle = true;
			this._objectDraw(this._mFullStage._mSpareCanvasRenderer);
		}
	},

    /** @ignore */
    _updateTransforms: function()
    {
		// Determine if the object's local transformation matrix needs to be updated
        this._mWorldTransformUpdated = false;
        var propertiesChanged = this.x!==this._mPreviousX || this.y!==this._mPreviousY ||
            this.scaleX!==this._mPreviousScaleX || this.scaleY!==this._mPreviousScaleY ||
            this.rotation!==this._mPreviousRotation || this._mVisibilityChanged;

        var parentChanged = this._mPreviousParent && this.parent != this._mPreviousParent;

        if(propertiesChanged && !this._mIgnoreProperties)
        {
            this._mVisibilityChanged = false;
            this._mPreviousX = this.x;
            this._mPreviousY = this.y;
            this._mPreviousScaleX = this.scaleX;
            this._mPreviousScaleY = this.scaleY;
            this._mPreviousRotation = this.rotation;
            this._mLocalTransformDirty = true;
        }

        // Do we need to update the registration point transformation matrix?
        if(this.registrationX!==this._mPreviousRegistrationX || this.registrationY!==this._mPreviousRegistrationY ||
            this.width!==this._mPreviousWidth || this.height!==this._mPreviousHeight)
        {
            this._mPreviousRegistrationX = this.registrationX;
            this._mPreviousRegistrationY = this.registrationY;
            this._mPreviousWidth = this.width;
            this._mPreviousHeight = this.height;
            this._mRegistrationOffset.x = -this.width*this.registrationX;
	        this._mRegistrationOffset.y = -this.height*this.registrationY;
	        this._mLocalTransformDirty = true;
        }

	    if(this.alpha!==this._mPreviousAlpha)
	    {
		    // Clamp alpha values - user error and tweening can lead to invalid values and the resulting behavior is pure madness.
		    this.alpha = Math.min(Math.max(this.alpha,0),1);
		    this._mPreviousAlpha = this.alpha;
	    }

        // Do we need to update the local transform?
        if(this._mLocalTransformDirty)
        {
            if(!this._mIgnoreProperties)
            {
                this._mLocalTransformNoReg.identity();
                var m = this._mLocalTransformNoReg._internal;

                // Apply the translation
                m[2] = this.x;
                m[5] = this.y;

                // Apply the rotation (if any)
                if(this.rotation!==0)
                {
                    this._mLocalTransformNoReg.rotate(this.rotation);
                }

                // Apply the scale (if any)
	            m[0] *= this.scaleX;
	            m[1] *= this.scaleY;
	            m[3] *= this.scaleX;
	            m[4] *= this.scaleY;
            }
        }

        // Apply the parent's transformation if it has been updated
        if(this.parent!==null)
        {
            if(this._mLocalTransformDirty || this.parent._mWorldTransformUpdated || parentChanged)
            {
                var m1 = this.parent._mWorldTransformNoReg._internal;
	            var m2 = this._mLocalTransformNoReg._internal;
	            var m3 = this._mWorldTransform._internal;
	            var m4 = this._mWorldTransformNoReg._internal;

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

	            var r1 = m20c*this._mRegistrationOffset.x + m21c*this._mRegistrationOffset.y;
	            var r2 = m23c*this._mRegistrationOffset.x + m24c*this._mRegistrationOffset.y;

	            m3[0] = m4[0] = m10c*m20c + m11c*m23c;
	            m3[1] = m4[1] = m10c*m21c + m11c*m24c;

	            m4[2] = m10c*m22c + m11c*m25c + m12c;
	            //m3[2] = m10c*(m22c+r1) + m11c*(m25c+r2) + m12c;
	            m3[2] = m4[2] + m10c*r1 + m11c*r2;

	            m3[3] = m4[3] = m13c*m20c + m14c*m23c;
	            m3[4] = m4[4] = m13c*m21c + m14c*m24c;

	            m4[5] = m13c*m22c + m14c*m25c + m15c;
	            //m3[5] = m13c*(m22c+r1) + m14c*(m25c+r2) + m15c;
	            m3[5] = m4[5] + m13c*r1 + m14c*r2;

                this._mWorldTransformUpdated = true;
                this._mPreviousParent = this.parent;
            }
        }
        else
        {
            this._mWorldTransformUpdated = this._mLocalTransformDirty;
        }

        // Update bounding info if required
        if(this._mWorldTransformUpdated)
        {
            this._setBoundingInfoDirty();
        }

        // Set the cumulative alpha for the object
        this._mWorldAlpha = this.parent!==null ? this.parent._mWorldAlpha*this.alpha : this.alpha;

        // Don't need to update again until things change
        this._mLocalTransformDirty = false;
    },

	_updateWorldTransform: function()
	{
		// NOTE: this should really be _mLocalTransformDirty, and implement setters to set that flag when local properties change
		if (this._mWorldTransformUpdated)
		{
			this._updateTransforms();
		}
	},

/*
	_updateParentTransforms: function()
	{
		if (this._mWorldTransformUpdated)
		{
			// update the whole scene graph
			this._findTopParent()._updateSceneTransforms();
		}
	},

	_findTopParent: function()
	{
		return (this.parent === null || this.parent === this.stage) ? this : this.parent._findTopParent();
	},

	_updateSceneTransforms: function()
	{
		this._updateTransforms();

		for (var i = this.numChildren(); --i >= 0; )
		{
			this._mChildren[i]._updateSceneTransforms();
		}
	},
*/

    /** @ignore */
    _updateAABB: function()
    {
		// Make sure the world transform is up to date
	    this._updateWorldTransform();

        // Update the local bound extents
        this._mTopLeft.x = this._mBottomLeft.x = 0;
        this._mBottomRight.x = this._mTopRight.x = this.width;
        this._mTopLeft.y = this._mTopRight.y = 0;
        this._mBottomLeft.y = this._mBottomRight.y = this.height;

		// Need to check all 4 corners if the object has been rotated (and we don't know about the parent, so gotta do it PAN-477)

		// Transform the points into world space
		this._mWorldTransform.transformPoint(this._mTopLeft);
		this._mWorldTransform.transformPoint(this._mTopRight);
		this._mWorldTransform.transformPoint(this._mBottomLeft);
		this._mWorldTransform.transformPoint(this._mBottomRight);

		// Update the AABB
		var minX = Math.min(this._mTopLeft.x,this._mTopRight.x,this._mBottomLeft.x,this._mBottomRight.x);
		var maxX = Math.max(this._mTopLeft.x,this._mTopRight.x,this._mBottomLeft.x,this._mBottomRight.x);
		var minY = Math.min(this._mTopLeft.y,this._mTopRight.y,this._mBottomLeft.y,this._mBottomRight.y);
		var maxY = Math.max(this._mTopLeft.y,this._mTopRight.y,this._mBottomLeft.y,this._mBottomRight.y);

        this._mAABB.x = minX;
        this._mAABB.y = minY;
        this._mAABB.width = maxX-minX;
        this._mAABB.height = maxY-minY;

        this._mBoundingInfoDirty = false;
    },

    /** @ignore */
    _setBoundingInfoDirty: function()
    {
        this._mBoundingInfoDirty = true;
        if(this.parent!==null)
        {
            this.parent._setBoundingInfoDirty();
        }
    },

    /** @ignore */
    _checkVisibilityChange: function()
    {
        // Check if visibility changed, as that will required bounding info updates
        if(this.visible!==this._mPreviousVisibility)
        {
            this._mVisibilityChanged = true;
            this._mPreviousVisibility = this.visible;
            this._setBoundingInfoDirty();
        }
    },

    /** @ignore */
    _setStage: function(stage, addedToStage)
    {
        this.stage = stage;
        this._mFullStage = stage._mFullStage;
	    this._mAddedToStage = addedToStage;
    },

    _makeGradient: function(gradient)
    {
        var defaultDirection = "vertical";
        var defaultColor1 = "#fff";
        var defaultColor2 = "#000";
        var defaultTransitionPoint = 0.5;

        gradient.direction = typeof(gradient.direction)==="string" ? gradient.direction : defaultDirection;
        gradient.color1 = typeof(gradient.color1)==="string" ? gradient.color1 : defaultColor1;
        gradient.color2 = typeof(gradient.color2)==="string" ? gradient.color2 : defaultColor2;
        gradient.transitionPoint = typeof(gradient.transitionPoint)==="number" ? gradient.transitionPoint : defaultTransitionPoint;

        // Make sure 'direction' is valid
        if (gradient.direction != "vertical" && gradient.direction != "horizontal" && gradient.direction != "leftDiagonal" && gradient.direction != "rightDiagonal" && gradient.direction != "circular")
        {
            gradient.direction = defaultDirection;
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Invalid gradient direction.  Valid directions are 'circular', 'vertical', 'horizontal', 'rightDiagonal', and 'leftDiagonal'.");
        }

        // Make sure 'transitionPoint' is valid
        if (gradient.transitionPoint<0 || gradient.transitionPoint>1)
        {
            gradient.transitionPoint = Math.min(Math.max(gradient.transitionPoint, 0), 1);
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "Transition point must be between 0 and 1.");
        }

        return gradient;
    }
}

/**
 * Documented in the constructor property list
 * @ignore
 */
Object.defineProperty(TGE.DisplayObject.prototype, 'scale', {
	set: function(value)
	{
		this.scaleX = this.scaleY = value;
	}
});

/**
 * Documented in the constructor property list
 * @ignore
 */
Object.defineProperty(TGE.DisplayObject.prototype, 'layout', {
	get: function()
	{
		return this._mLayout;
	},
	set: function(layout)
	{
		this._setLayout(layout);
	}
});

/**
 * Documented in the constructor property list
 * @ignore
 */
Object.defineProperty(TGE.DisplayObject.prototype, 'backgroundGradient', {
	set: function(params)
	{
		this._mBackgroundGradient = this._makeGradient(params);
	}
});