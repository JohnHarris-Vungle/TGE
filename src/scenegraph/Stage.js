/**
 <p>The Stage class represents the main drawing area.
 It inherits from {@link TGE.DisplayObjectContainer}, which allows you to add child objects using the addChild method.
 To redraw the contents of the stage you must make a call to {@link TGE.Stage.draw}.</p>
 <p>If your game is built off of the {@link TGE.Game} class you do not need to manually manage or draw a stage object as this is done for you by {@link TGE.Game}.</p>

 * @class
 * @param {HTMLDivElement} canvasDiv The div element to be used as the canvas rendering context.
 * @param {Number} [initialWidth] If a initialWidth value is specified, the stage will be considered to be this width, regardless of the actual size of the canvasDiv.
 * @param {Number} [initialHeight] If a initialHeight value is specified, the stage will be considered to be this height, regardless of the actual size of the canvasDiv.
 * @extends TGE.DisplayObjectContainer
 * @constructor
 */
TGE.Stage = function(canvasDiv,initialWidth,initialHeight)
{
    TGE.Stage.superclass.constructor.call(this);

    // Private members
	this._mRenderer = null;
    this._mMouseTargets = [];
    this._mListenerRemovals = [];
    this._mObjectTrash = [];
	this._mUpdateGroup = [];
	this._mUpdateCycle = 0;
	this._mNumVisibleObjects = 0;
	this._mNumDrawnObjects = 0;
	this._mMaxDrawnObjects = 0;
	this._mTotalDrawnObjects = 0;
	this._mTotalFramesDrawn = 0;

	// PAN-604 - We're going to use this for instances were older game code is calling deprecated private draw
	// methods (like _drawClass) from before there was a plugin renderer architecture.
	this._mSpareCanvasRenderer = new TGE.CanvasRenderer();

    this.stage = this;
    this.mouseEnabled = true;
	this._mAddedToStage = true;

    // Make sure we have a valid canvas regardless of what type of div was passed in
    var isCanvas = false;
    if(canvasDiv)
    {
        if(canvasDiv instanceof HTMLDivElement)
        {
            isCanvas = false;
        }
        else if(canvasDiv instanceof HTMLCanvasElement)
        {
            isCanvas = true;
        }
        else
        {
            canvasDiv = document.body;
        }
    }

    var actualCanvas;
    if(isCanvas)
    {
        actualCanvas = canvasDiv;
    }
    else
    {
        actualCanvas = document.createElement('canvas');
        canvasDiv.appendChild(actualCanvas);
    }

    this.registrationX = 0;
    this.registrationY = 0;

    // Set the size of the actual canvas to the size of the div that was passed in (PAN-424)
    actualCanvas.width = canvasDiv.clientWidth;
    actualCanvas.height = canvasDiv.clientHeight;

    // Default is to initialize the stage to the canvasDiv's dimensions
    var canvasWidth = canvasDiv.clientWidth;
    var canvasHeight = canvasDiv.clientHeight;

    // But if initialWidth/Height were explicitly passed in, then use them even if they are zero (likely tgedebug=4)
    if(typeof(initialWidth)==="number" || typeof(initialHeight)==="number")
    {
        canvasWidth = initialWidth;
        canvasHeight = initialHeight;
    }
    else if(canvasDiv.clientWidth==0 || canvasDiv.clientHeight==0)
    {
        // If *either* clientWidth or clientHeight are zero, then fallback to a reasonable viewport size
        canvasWidth = 640;
        canvasHeight = 1138;
    }

    // If initial width/height values were set, assign them now
    this.width = this._mOriginalWidth = canvasWidth;
    this.height = this._mOriginalHeight = canvasHeight;

    TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "TGE.Stage initialized with dimensions: " + this.width + "x" + this.height);

	this._mAABB.x = this._mAABB.y = 0;
	this._mAABB.width = this.width;
	this._mAABB.height = this.height;

    // Get the canvas context
    this._mScale = 1;
    this._mCanvas = actualCanvas;

	// We need to create the renderer which can be WebGL or Canvas. Currently we will prefer canvas unless
	// WebGL is forced via the querystring.
	var useWebGL = getQueryString()["renderer"]==="webgl";
	if(useWebGL)
	{
		if(!window.TGE.WebGLRenderer)
		{
			TGE.Debug.Log(TGE.Debug.LOG_INFO, "WebGL is not available in this build of TGE.");
		}
		else if("file:"!=document.location.protocol)
		{
			this._mRenderer = new TGE.WebGLRenderer(this._mCanvas);
		}
		else
		{
			TGE.Debug.Log(TGE.Debug.LOG_INFO, "WebGL can only be used when running on a webserver!");
		}
	}

	// Create a canvas renderer if the WebGL one doesn't work or was bypassed
	if(!this._mRenderer || !this._mRenderer.functional())
	{
		this._mRenderer = new TGE.CanvasRenderer(this._mCanvas,false);
	}

	TGE.Debug.Log(TGE.Debug.LOG_INFO, "created " + this._mRenderer.type() + " renderer.");

	// Get the renderer to initialize based on the canvas size
	this._mRenderer.resizedGameDiv();

    return this;
}

TGE.Stage.prototype =
{
    /**
     * Tells the stage to draw all of its visible children. The background will only be cleared if the backgroundColor property has been set to a color.
     */
    draw: function()
    {
        // We'll gather objects that need to be tested against mouse events. They'll get added to the
        // array in bottom to top order. Hidden objects cannot be mouse targets.
        this._mMouseTargets = [];

	    // Prep the scene for a new draw pass
	    this._mRenderer.beginScene(this.backgroundColor);

	    this._mNumVisibleObjects = 0;
	    this._mNumDrawnObjects = 0;

	    // Draw the scene
        this._draw(this._mRenderer);

	    // Tell the renderer there is nothing else for it to draw this frame
	    this._mRenderer.endScene();

	    this._mTotalDrawnObjects += this._mNumDrawnObjects;
	    this._mTotalFramesDrawn++;
	    if(this._mNumDrawnObjects>this._mMaxDrawnObjects)
	    {
		    this._mMaxDrawnObjects = this._mNumDrawnObjects;
	    }
    },

	/**
	 * For debugging, this method can be used to determine the number of scene objects that were visible during the last rendered frame. This will include objects that have children but may not doing any drawing themselves.
	 * @returns {number} The number of scene objects that were visible during the last rendered frame.
	 */
	numVisibleObjects: function()
	{
		return this._mNumVisibleObjects;
	},

	/**
	 * For debugging, this method can be used to determine the number of visible objects that preformed some sort of drawing during the last rendered frame (ie: images, text, something with backgroundColor).
	 * @returns {number} The number of scene objects that were determined to be visible and drawn during the last rendered frame.
	 */
	numDrawnObjects: function()
	{
		return this._mNumDrawnObjects;
	},

	/**
	 * For debugging, this method can be used to determine the maximum number of objects that were drawn during any frame since startup (ie: images, text, something with backgroundColor).
	 * @returns {number} The maximum number of objects that were drawn in any frame since startup.
	 */
	maxDrawnObjects: function()
	{
		return this._mMaxDrawnObjects;
	},

	/**
	 * For debugging, this method provides the average number of objects drawn every frame since startup (ie: images, text, something with backgroundColor).
	 * @returns {number} The average number of objects drawn every frame since startup.
	 */
	averageDrawnObjects: function()
	{
		return Math.round(this._mTotalDrawnObjects/this._mTotalFramesDrawn);
	},

    /**
     * Applies a uniform scale to the stage. This should really only be used when the containing div is scaled by the same amount.
     * @param {Number} scale The scaling factor to apply to the stage (1=100%)
     */
    setScale: function(scale)
    {
        this._mScale = scale;

        // Make sure the actual canvas size matches the new div size
        this._mCanvas.width = this._mOriginalWidth*scale;
        this._mCanvas.height = this._mOriginalHeight*scale;

	    // Make sure the stage thinks it's still the original size
	    this.width = this._mAABB.width = this._mOriginalWidth;
	    this.height = this._mAABB.height = this._mOriginalHeight;
    },
	
	/**
     * Sets this size of the stage. This should really only be used when the containing div is resized by the same amount.
     * @param {Number} width The new width of the stage in pixels
	 * @param {Number} height The new height of the stage in pixels
     */
	setSize: function(width,height)
	{
		this._mScale = 1;

		// Make sure the actual canvas size matches the new div size
		this._mCanvas.width = width;
		this._mCanvas.height = height;

		// Make sure the stage thinks it's still the original size
		this.width = this._mAABB.width = width;
		this.height = this._mAABB.height = height;

		// Tell the renderer
		this._mRenderer.resizedGameDiv();
	},

	/**
	 * Indicates whether or not the mouse (or other user input device) is currently down.
	 * @return {Boolean} Whether or not the mouse (or other user input device) is currently down.
	 */
	isMouseDown: function()
	{
		return this._mMouseDown;
	},

	/**
	 * Indicates whether the game view is currently in landscape orientation
	 * @returns {Boolean} Returns true if the game is in landscape
	 */
	isLandscape: function ()
	{
		return this.height < this.width;
	},

	/**
     * (documented in superclass)
     * @ignore
     */
	getBounds: function()
	{
		// PAN-354 overriding this function to always return the intended stage dimensions without querying children
		return this._mAABB;
	},

    /**
     * (documented in superclass)
     * @ignore
     */
	dispatchEvent: function(event)
	{
		// PAN-343
		if(event.type==="update")
		{
			this._updateAllObjects(event);
		}
		else
		{
			TGE.Stage.superclass.dispatchEvent.call(this,event);
		}
	},

    /**
     * (documented in superclass)
     * @ignore
     */
    removeChildren: function()
    {
        TGE.Stage.superclass.removeChildren.call(this);

        // If there was an ad header or footer we need to make sure they get added back in
        if(TGE.AdHeader.GetInstance())
        {
            TGE.AdHeader.Create(TGE.AdHeader.GetInstance().closeFunction,TGE.AdHeader.GetInstance().closeButton.visible);
        }
    },

    /**
     * Prunes all inactive listeners (ones with id=0)
     * @ignore
     */
    _pruneListeners: function()
    {
	    var i = this._mListenerRemovals.length;
	    if (i)
	    {
		    while (--i >= 0)
		    {
			    var obj = this._mListenerRemovals[i];
			    for (var type in obj._mEventListeners)
			    {
				    var listeners = obj._mEventListeners[type];
				    for (var j = listeners.length; --j >= 0; )
				    {
					    if (!listeners[j].id)
					    {
						    listeners.splice(j, 1);
					    }
				    }
			    }
		    }
		    this._mListenerRemovals = [];
	    }
    },

	/** @ignore */
	_updateAllObjects: function(event)
	{
		// Loop through the group of objects that need updating
		for(var i=this._mUpdateGroup.length; --i>=0; )
		{
			var obj = this._mUpdateGroup[i];

			// Remove duplicates and inactive objects
			if(obj._mMarkedForRemoval || obj._mLastUpdate===this._mUpdateCycle)
			{
				this._mUpdateGroup.splice(i,1);
			}
			else
			{
				obj.handleEvent(event);
				obj._mLastUpdate = this._mUpdateCycle;
			}
		}

		this._mUpdateCycle++;
	},

	/** @ignore */
	_addUpdateObj: function(obj)
	{
		this._mUpdateGroup.push(obj);
	},

    /** @ignore */
    _trashObject: function(obj)
    {
        this._mObjectTrash.push(obj);
    },

    /** @ignore */
    _emptyTrash: function()
    {
        len = this._mObjectTrash.length;
        for(i=0; i<len; i++)
        {
            this._mObjectTrash[i].removeFromScene();
        }
        this._mObjectTrash = [];
    },

    /**
     * @ignore
     */
	_notifyObjectsOfMouseEvent: function(event,mouseX,mouseY,identifier)
	{
		// Setup the event
		var eventName = "mouse"+event;
		var mouseEvent = {type:eventName, x:mouseX, y:mouseY, stageX:mouseX, stageY:mouseY, identifier:identifier};
		var updateRoot = TGE.Game.GetUpdateRoot();

		// Always send events to the update root first (children cannot block input)
		if(updateRoot.mouseEnabled && updateRoot.visible)
		{
			this._processMouseTarget(updateRoot, mouseEvent);
		}

		// Loop through the mouse targets from front to back (reverse order of the array)
		for(var i=this._mMouseTargets.length; --i >= 0; )
		{
			var dispObj = this._mMouseTargets[i];

			// PAN-490 Don't send double mouse events to update root, and don't send events to stage when it's not the root
			// (If stage _is_ the root, then events were sent in the 'Always send' section above the loop).
			if (dispObj !== updateRoot && dispObj !== this)
			{
				if (this._processMouseTarget(dispObj, mouseEvent))
				{
					// This object will block the event from continuing to any object beneath it
					return;
				}
			}
			else if (dispObj !== this && dispObj.hitTestPoint(mouseX, mouseY))
			{
				// PAN-1442 need to block mouse events below the update root, which gets skipped above due to having already been processed in the "always send" section
				return;
			}
		}
	},

	/**
	 * @ignore
	 */
	_processMouseTarget: function(dispObj, mouseEvent)
	{
		if (dispObj === this)
		{
			dispObj._handleMouseEvent(mouseEvent);
		}
		else
		{
			// Set the public pointer location properties
			this._setPointerPositionsForObject(dispObj, mouseEvent.x, mouseEvent.y);

			// First do a quick axis-aligned bounding box test
			if(dispObj.hitTestPoint(mouseEvent.x, mouseEvent.y))
			{
				// Now do a more precise oriented bounding box check
				if(true)
				{
					dispObj._handleMouseEvent(mouseEvent);

					// This object will block the event from continuing to any object beneath it
					return true;
				}
			}
			else if (event === "up" && dispObj._mMouseDown)
			{
				// for an "up" event that occurs outside of an object that received the mousedown, send a mouseupoutside event
				mouseEvent.type = "mouseupoutside";
				dispObj._handleMouseEvent(mouseEvent);

				// restore the "up" event type
				mouseEvent.type = "up";
			}
		}
		return false;
	},

    /**
     * @ignore
     */
    _updateObjectMouseOverStates: function(mouseX,mouseY)
    {
        // Loop through the mouse targets from front to back (reverse order of the array)
        for(var i=this._mMouseTargets.length; --i>=0;)
        {
            var dispObj = this._mMouseTargets[i];
            var mouseEvent = {x:mouseX, y:mouseY, stageX:mouseX, stageY:mouseY};
	        var mouseOver = (!TGE.BrowserDetect.isMobileDevice || this._mMouseDown) && dispObj.hitTestPoint(mouseX,mouseY);
	        if (mouseOver !== dispObj._mMouseOver)
	        {
		        dispObj._mMouseOver = mouseOver;
		        mouseEvent.type = mouseOver ? "mouseover" : "mouseout";
		        dispObj.handleEvent(mouseEvent);
	        }

            // Set the public pointer location properties
            this._setPointerPositionsForObject(dispObj,mouseX,mouseY);
        }
    },

    /**
     * @ignore
     */
    _setPointerPositionsForObject: function(dispObj,pointerX,pointerY)
    {
        // Make sure world transform is updated
        if(dispObj._mLocalTransformDirty)
        {
            dispObj._updateTransforms();
        }

        // Set the public pointer location properties
        dispObj.pointerLocal.setTo(pointerX, pointerY);
        dispObj._mWorldTransform.inverseTransformPoint(dispObj.pointerLocal);
        dispObj.pointerStage.x = pointerX;
        dispObj.pointerStage.y = pointerY;

        // Deprecated
        dispObj.mouseX = dispObj.pointerLocal.x;
        dispObj.mouseY = dispObj.pointerLocal.y;
    },

    /**
     * @ignore
     */
    _notifyObjectsOfKeyEvent: function(eventType,keyCode)
    {
        var keyEvent = {type:eventType,keyCode:keyCode};
        this.dispatchEvent(keyEvent);
    }
}
extend(TGE.Stage, TGE.DisplayObjectContainer);