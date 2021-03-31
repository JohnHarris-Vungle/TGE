/**
 <p>The Stage class represents the main drawing area.
 It inherits from {@link TGE.DisplayObjectContainer}, which allows you to add child objects using the addChild method.
 To redraw the contents of the stage you must make a call to {@link TGE.FullStage.draw}.</p>
 <p>If your game is built off of the {@link TGE.Game} class you do not need to manually manage or draw a stage object as this is done for you by {@link TGE.Game}.</p>

 * @class
 * @param {HTMLDivElement} canvasDiv The div element to be used as the canvas rendering context.
 * @param {Number} [initialWidth] If a initialWidth value is specified, the stage will be considered to be this width, regardless of the actual size of the canvasDiv.
 * @param {Number} [initialHeight] If a initialHeight value is specified, the stage will be considered to be this height, regardless of the actual size of the canvasDiv.
 * @extends TGE.DisplayObjectContainer
 * @constructor
 * @ignore
 */
TGE.FullStage = function(canvasDiv,initialWidth,initialHeight)
{
    TGE.FullStage.superclass.constructor.call(this);

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

    TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "TGE.FullStage initialized with dimensions: " + this.width + "x" + this.height);

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

	// We need to be able to rely on an object's stage member to reflect whether it is a descendent of the game stage (TGE.GameStage)
	// or if it is outside the game stage. For this reason the full stage's stage member references itself so that any descendents
	// outside the game stage know they are not on the game stage.
	this.stage = this._mFullStage = this;

	// Create the "game stage", which is the stage visible to users.
	this.gameStage = this.addChild(new TGE.GameStage(this));

	// A special case here - adding the game stage as a child of the full stage would correctly set the stage to the
	// full stage instance. However we want the game stage to act as the virtual root of the entire game scene so we
	// need to force its stage member to be itself, otherwise its children would also think they are directly descendents
	// of the full stage.
	this.gameStage.stage = this.gameStage;

    return this;
}

TGE.FullStage.prototype =
{
	/**
	 * The game stage can be resized so that it does not match exactly the true stage size. Currently it is only possible
	 * to adjust the height so that it is less than the true stage, leaving empty space at the bottom for something like
	 * a persistent footer panel.
	 * @param {Number} height The desired height of the game stage, expressed as a percentage of the true stage's height.
	 */
	setGameStageHeight: function(height)
	{
		this.gameStage.setHeight(height);
	},

	forceOrientationLock: function(on)
	{
		this.gameStage.forceOrientationLock(on);
	},

	/**
     * Tells the stage to draw all of its visible children. The background will only be cleared if the backgroundColor property has been set to a color.
     */
    draw: function()
    {
		// If we've locked orientation, we only want the GameStage to respect the lock. Everything else on the
		// FullStage should be ignoring the lock (legal footer, ad header/close button, etc). The GameStage
		// will turn the lock on in its _draw call.
		TGE.Renderer._sIgnoreOrientationLock = true;

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

		// Setup the global resize event and dispatch it
		this.dispatchResize();
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
     * (documented in superclass)
     * @ignore
     */
	getBounds: function()
	{
		// PAN-354 overriding this function to always return the intended stage dimensions without querying children
		return this._mAABB;
	},

	/**
	 * Dispatches an update event to the scene, and makes sure any objects that are not part of the game stage will
	 * still be updated in the event that the update root isn't the game stage itself.
	 * @ignore
	 */
	dispatchUpdate: function(event, updateRoot)
	{
		// If the update root is the game stage, then this is a regular update and we pass the event to all objects.
		// Note that the update root will never be the full stage, as we default it to game stage.
		if(updateRoot === this.gameStage)
		{
			// Normal update
			this._updateAllObjects(event);
		}
		else
		{
			// Here we want to ensure the objects that aren't on the game stage get updated
			var gameStage = this.gameStage;
			this.eachChild(function() {
					if(this !== gameStage)
					{
						this.dispatchEvent(event);
					}
				}
			);

			// And now we can dispatch the update event to the temporary update root. Don't do this if the object
			// isn't a child of the game stage, as it will have already been updated above.
			if(updateRoot.stage !== this)
			{
				updateRoot.dispatchEvent(event);
			}
		}
	},

	/**
	 * Dispatches ???
	 * @ignore
	 */
	dispatchResize: function()
	{
		// Here we want to ensure the objects that aren't on the game stage get the resize event, but that
		// it's using the full stage dimensions, and not the game stage dimensions.
		TGE._ResizeEvent.width = TGE._ResizeEvent.endEvent.width = this.width;
		TGE._ResizeEvent.height = TGE._ResizeEvent.endEvent.height = this.height;
		var gameStage = this.gameStage;
		this.eachChild(function() {
				if(this !== gameStage)
				{
					this.dispatchEvent(TGE._ResizeEvent);
				}
			}
		);

		// Now we can dispatch to the game stage, which will use the game stage dimensions
		this.gameStage.dispatchResize();
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
	    while (this._mObjectTrash.length)
	    {
		    this._mObjectTrash.pop().removeFromScene();
	    }
    },

	/**
	 * @ignore
	 */
	_notifyObjectsOfMouseEvent: function(event,mouseX,mouseY,identifier)
	{
		// Setup the event
		var eventName = "mouse"+event;
		var mouseEvent = {type:eventName, x:mouseX, y:mouseY, stageX:mouseX, stageY:mouseY, identifier:identifier};

		// The full stage always get the mouse event, regardless of any hits to objects above or the current update
		// root. Full stage mouse handlers are reserved for TGE and perform critical tasks like enabling audio and video.
		this._handleMouseEvent(mouseEvent);

		// The update root will never be the TGE.FullStage, its default value is the TGE.GameStage. We will handle
		// the full stage at the bottom as it is a special case and game code would never add mouse listeners to it.
		var updateRoot = TGE.Game.GetUpdateRoot();

		// Required TGE 1.1 method: ------------------------------------------------------------------------------------

		// Always send events to the update root first (children cannot block input)
		if(updateRoot.mouseEnabled && updateRoot.visible)
		{
			this._processMouseTarget(updateRoot, mouseEvent);
		}

		// We are going to loop through all the potential mouse targets, front to back (reverse order of the array).
		var handleEvent = true;
		for(var i=this._mMouseTargets.length; --i >= 0; )
		{
			var dispObj = this._mMouseTargets[i];

			// PAN-490 Don't send double mouse events to update root, and don't send events to stage when it's not the root
			// (If stage _is_ the root, then events were sent in the 'Always send' section above the loop).
			if(dispObj !== updateRoot && dispObj !== this)
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

		// Preferred method for TGE 2.0: -------------------------------------------------------------------------------

		// We were unable to use this approach because it makes the stage/update root get the mouse events last. There
		// was at least one game (twistbuilder) that broke when scene objects got mouse events before the stage.

		/*
		// We are going to loop through all the potential mouse targets, front to back (reverse order of the array).
		// The update root always needs to receive the mouse event.
		var handleEvent = true;
		for(var i=this._mMouseTargets.length; --i >= 0; )
		{
			var dispObj = this._mMouseTargets[i];
			if((handleEvent || dispObj===updateRoot) && this._processMouseTarget(dispObj, mouseEvent))
			{
				// This object will block the event from continuing to any object beneath it
				handleEvent = false;
			}
		}

		// The full stage always get the mouse event, regardless of any hits to objects above or the current update
		// root. Full stage mouse handlers are reserved for TGE and perform critical tasks like enabling audio and video.
		this._handleMouseEvent(mouseEvent);
		*/
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
			else if (mouseEvent.type === "mouseup" && dispObj._mMouseDown)
			{
				// for an "up" event that occurs outside of an object that received the mousedown, send a mouseupoutside event
				mouseEvent.type = "mouseupoutside";
				dispObj._handleMouseEvent(mouseEvent);

				// restore the "up" event type
				mouseEvent.type = "mouseup";
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
extend(TGE.FullStage, TGE.DisplayObjectContainer);