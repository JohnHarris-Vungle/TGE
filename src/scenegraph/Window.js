/**
 * <p>The Window class is a top level display object primarily used for displaying user interface elements.
 * Typical examples would be full screen displays like the main menu and pause screen, as well as smaller,
 * non-fullscreen dialog box notifications. A window object blocks all user input from passing below it.</p>
 * @class
 * @extends TGE.Sprite
 * @param {Number} width Indicates the desired width of the window in pixels.
 * @param {Number} height Indicates the desired height of the window in pixels.
 * @constructor
 */
TGE.Window = function(width,height)
{
	// The screen object is basically just a TGE.Sprite. It doesn't necessarily
	// have to have an image or even a background color
	TGE.Window.superclass.constructor.call(this);

	// Private members
	this._mLayers = {};
	this._mFadeDuration = 0;
	this._mFadeColor = null;
	this._mFadePanel = null;
	this._mFadingOut = false;
	this._mCallback = null;
	this._mUpdateListenerID = null;

	// Register to the top left
	this.registrationX = 0;
	this.registrationY = 0;
	this.width = width;
	this.height = height;

	// Set the screen as mouse enabled so that no mouse input passes below it
	this.mouseEnabled = true;
}

// For debugging active windows

/**
 * Used for debugging active windows
 * @ignore
 */
TGE.Window._sTrackWindows = false;

/**
 * Used for debugging active windows
 * @ignore
 */
TGE.Window._sActiveWindows = [];


TGE.Window.prototype =
{
	/**
	 * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
	 * @param {Object} params Information used to initialize the object.
	 * @return {TGE.Window} Returns this object.
	 */
	setup: function(params)
	{
		// Default behavior with a responsive layout is to match the TGE.Window to the current stage dimensions.
		// Only set this if a layout parameter was not defined, and if there is no existing resize event listener.
		if(typeof(params.layout)==="undefined" && typeof(params.onResize)==="undefined" &&
			(!this._mEventListeners["resize"] || this._mEventListeners["resize"].length===0))
		{
			params.layout = "match";
		}

		TGE.Window.superclass.setup.call(this,params);

		return this;
	},

	/**
	 * Creates a new TGE.Window object and displays it. Once the new window has fully transitioned in, the current window (this) is closed.
	 * Additional data can be assigned to the params object, which will be available in the window's setup call.
	 * @param {Object} params Information used to initialize the object.
	 * @param {Function} windowClass The class name of the TGE.Window subclass you wish to display.
	 * @param {Number} [params.fadeTime=0] The time the window takes to fade in.
	 * @return {TGE.Window} Returns the new window that was created.
	 */
	transitionToWindow: function(params)
	{
		var newWindow = this._createNewWindow(params);

		// Don't fade out this window - it will already be covered once the new one is in
		this._mFadeDuration = 0;

		// Show the new window and close this one when complete
		newWindow.show(this.stage,this.close.bind(this));

		return newWindow;
	},

	/**
	 * Creates a new TGE.Window object and displays it. The current window (this) remains active underneath.
	 * Additional data can be assigned to the params object, which will be available in the window's setup call.
	 * @param {Object} params Information used to initialize the object.
	 * @param {Function} windowClass The class name of the TGE.Window subclass you wish to display.
	 * @param {Number} [params.fadeTime=0] The time the window takes to fade in.
	 * @return {TGE.Window} Returns the new window that was created.
	 */
	overlayWindow: function(params)
	{
		var newWindow = this._createNewWindow(params);

		// Show the new window and add it on top of this one
		newWindow.show(this);

		return newWindow;
	},

	/**
	 * Clears the entire existing scene, and then creates a new TGE.Window object and displays it.
	 * Additional data can be assigned to the params object, which will be available in the window's setup call.
	 * @param {Object} params Information used to initialize the object.
	 * @param {Function} windowClass The class name of the TGE.Window subclass you wish to display.
	 * @return {TGE.Window} Returns the new window that was created.
	 */
	resetToWindow: function(params)
	{
		var newWindow = this._createNewWindow(params);

		// Clear the scene
		this.stage.removeChildren();

		// Show the new window
		newWindow.show(this.stage);

		return newWindow;
	},

	/**
	 * Layers provide a means to group scene objects within a window, similar to the functionality in Flash or Photoshop.
	 * Use the createLayer method to define layers (sorted back to front in the order they are created), and then the
	 * TGE.Window.getLayer method to access a layer and add entities to it. A layer is a TGE.DisplayObjectContainer.
	 * @param {String} layerName A unique name to represent the layer.
	 */
	createLayer: function(layerName)
	{
		var newLayer = this.addChild(new TGE.DisplayObjectContainer().setup({
			registrationX: 0,
			registrationY: 0,
			width: this.width,
			height: this.height,
			instanceName: layerName,
			layout: "match"
		}));

		this._mLayers[layerName] = newLayer;
	},

	/**
	 * Returns a layer (TGE.DisplayObjectContainer) previously created with the TGE.Window.createLayer method.
	 * @param {String} layerName The name indicating the layer you wish to retrieve.
	 * @return {TGE.DisplayObjectContainer} The display container represented specified by the layer name,
	 * or null if a layer with this name was never created.
	 */
	getLayer: function(layerName)
	{
		return (layerName in this._mLayers) ? this._mLayers[layerName] : null;
	},

	/**
	 * Adds the screen to the scene. If a fading transition effect has been setup via TGE.Window#setupFade,
	 * the optional showCallback function will be fired once the transition is complete and the screen is fully visible.
	 * @param {TGE.DisplayObjectContainer} parent The parent display object to display this window on.
	 * @param {Function} showCallback A callback function to be fired when the screen has completed its intro transition (usually used for closing the previous screen).
	 */
	show: function(parent,showCallback)
	{
		parent.addChild(this);

		this._mCallback = (typeof showCallback === "function") ? showCallback : null;

		// Setup an update listener to handle transitions
		if(this._mFadeDuration>0)
		{
			this.alpha = 0;
			this._mUpdateListenerID = this.addEventListener("update",this._updateTransitions.bind(this));
		}
		else
		{
			// PAN-332 - we're showing right away, so fire the show callback right away
			if(this._mCallback!==null)
			{
				this._mCallback.call();
				this._mCallback = null;
			}
		}

		// Add the window to the debug list
		if(TGE.Window._sTrackWindows)
		{
			var name = this._windowName();
			TGE.Window._sActiveWindows.push(name);

			// Setup a listener to remove the window from the stack when destroyed
			this.addEventListener("remove",this._removeFromDebugList.bind(this,name));
		}
	},

	/**
	 * Removes the screen from the scene. If a fading transition effect has been setup via TGE.Window#setupFade,
	 * then a fadeout is performed and the window is not actually removed until the fade is complete.
	 * When the window is removed from the scene the closeCallback function is fired if one was specified.
	 * @param {Function} closeCallback A callback function to be fired when the screen has been fully destroyed.
	 */
	close: function(closeCallback)
	{
		this._mCallback = (typeof closeCallback === "function") ? closeCallback : null;

		if(this._mFadeDuration>0)
		{
			this._mFadingOut = true;

			// Setup an update listener to handle transitions
			if(typeof this._mUpdateListenerID!=="number") // PAN-575
			{
				this._mUpdateListenerID = this.addEventListener("update",this._updateTransitions.bind(this));
			}
		}
		else
		{
			this._forceClose();
		}
	},

	/**
	 * Defines a fade in and out effect for the screen. If no color is specified the transition behaves like a crossfade
	 * and the window contents will fade to/from opaque to transparent. If a color is specified, the screen will fade
	 * in/out of that color, ie: "fade to black".
	 * @param {String} duration The desired duration of the fade effect in seconds.
	 * @param {String} [color=null] If a color is provided, the screen transition will fade into the specified color as defined as a hex value string (ie: "#ff0000")
	 */
	setupFade: function(duration,color)
	{
		this._mFadeColor = color || null;
		this._mFadeDuration = duration;

		// If a panel already exists and the fade is being set to no-color, then kill it
		if(this._mFadePanel!==null && this._mFadeColor===null)
		{
			this._destroyFadePanel();
		}

		// If a panel already exists and the color is just being switched, make sure to set it
		if(this._mFadePanel!==null)
		{
			this._mFadePanel.backgroundColor = this._mFadeColor;
		}
	},

	/** @ignore */
	_createNewWindow: function(params)
	{
		// Create the new window
		var newWindow = new params.windowClass(this.width,this.height);
		newWindow.setup(params);

		// Was a fade specified?
		if(typeof(params.fadeTime)==="number")
		{
			newWindow.setupFade(params.fadeTime);
		}

		return newWindow;
	},

	/** @ignore */
	_forceClose: function()
	{
		this.markForRemoval();

		if(this._mCallback!==null)
		{
			this._mCallback.call();
			this._mCallback = null;
		}
	},

	/**
	 * Note this is inefficient and not entirely reliable (only works without namespaces), only use for debugging
	 * @ignore
	 */
	_windowName: function()
	{
		// search through the global object for a name that resolves to this object's constructor
		for(var name in window)
		{
			if(window[name] == this.constructor)
			{
				return name;
			}
		}
		return "TGE.Window";
	},

	/** @ignore */
	_removeFromDebugList: function(name)
	{
		// Remove from the debug list (assume closest to the top is the one we want)
		if(TGE.Window._sTrackWindows)
		{
			for(var w=TGE.Window._sActiveWindows.length-1; w>=0; w--)
			{
				if(TGE.Window._sActiveWindows[w]===name)
				{
					TGE.Window._sActiveWindows.splice(w,1);
					return;
				}
			}
		}
	},

	/** @ignore */
	_updateTransitions: function(event)
	{
		var fireCallback = false;
		var elapsedTime = event.elapsedTime;

		// Make sure we have a fade panel if we need one
		if(this._mFadeColor!==null && this._mFadePanel===null)
		{
			this._setupFadePanel();
		}

		// Handle fades
		var alpha = this._mFadePanel===null ? this.alpha : 1-this._mFadePanel.alpha;
		if(this._mFadeDuration>0)
		{
			if(this._mFadingOut)
			{
				alpha -= (elapsedTime*(1/this._mFadeDuration));
				if(alpha<0)
				{
					alpha = 0;
					this._forceClose();
				}
			}
			else if(alpha<1)
			{
				alpha += (elapsedTime*(1/this._mFadeDuration));
				if(alpha>=1)
				{
					alpha = 1;
					fireCallback = true;
					this.removeEventListener("update",this._mUpdateListenerID);
					this._mUpdateListenerID = null;
				}
			}
		}
		else
		{
			alpha = 1;
			fireCallback = true;
		}

		if(this._mFadePanel===null)
		{
			this.alpha = alpha;
		}
		else
		{
			this._mFadePanel.visible = true;
			this._mFadePanel.alpha = 1-alpha;
			this.alpha = 1;
		}

		// Do we need to fire the onclose or onopen callback?
		if(fireCallback && this._mCallback!==null)
		{
			this._mCallback.call();
			this._mCallback = null;
		}
	},

	/** @ignore */
	_setupFadePanel: function()
	{
		// If we're fading to a color we'll actually just drop a colored panel on top and fade it in/out
		this._mFadePanel = new TGE.DisplayObjectContainer().setup({
			width:this.width,
			height:this.height,
			backgroundColor:this._mFadeColor
		});
		this._mFadePanel.registrationX = this._mFadePanel.registrationY = 0;

		this.addChild(this._mFadePanel);
	},

	/** @ignore */
	_destroyFadePanel: function()
	{
		if(this._mFadePanel!==null)
		{
			this._mFadePanel.markForRemoval();
			this._mFadePanel = null;
		}
	}

}
extend(TGE.Window, TGE.Sprite);
