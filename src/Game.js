/**
 * The core client-side game component: create a subclass of TGE.Game to define your own game.
 * @property {Boolean} scaleToFitOnDesktop If true, the game canvas will automatically scale to fit the available viewport area on desktop, like it does on mobile devices (default is false).
 * @property {String} horizontalAlignment Indicates how the canvas should align itself horizontally within the viewport. Values can be "left", "center", "right", and "none" (default is "center"). If "none", the canvas will respect whatever layout is defined for it via css.
 * @property {String} verticalAlignment Indicates how the canvas should align itself horizontally within the viewport. Values can be "top", "middle", "bottom", and "none" (default on mobile is "middle", and "top" on desktop). If "none", the canvas will respect whatever layout is defined for it via css.
 * @property {Boolean} resizeCanvasToFit If true, the game canvas will automatically resize to fill the entire viewport area (default is false). Use the TGE.DisplayObjectContainer.layout property to define how scene objects respond to different viewport sizes.
 * @property {Number} maxCanvasWidth If resizeCanvasToFit is true, maxCanvasWidth defines the maximum width the canvas can be resized to.
 * @property {Number} maxCanvasHeight If resizeCanvasToFit is true, maxCanvasWidth defines the maximum height the canvas can be resized to.
 * @property {Number} desktopMaxCanvasWidth If resizeCanvasToFit is true, desktopMaxCanvasWidth defines the maximum width the canvas can be resized to on desktop.
 * @property {Number} desktopMaxCanvasHeight If resizeCanvasToFit is true, desktopMaxCanvasWidth defines the maximum height the canvas can be resized to on desktop.
 * @property {Boolean} allowMultitouch If set to false, all touch input received while another finger is down will be ignored.
 * @property {Boolean} blockBrowserKeys When true, keys that can affect browser behavior (like arrows, spacebar, etc) will be prevented from passing through to the browser.
 * @constructor
 */
TGE.Game = function()
{
    // Assign the singleton
    if(TGE.Game._sInstance!==null)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "you can only create one instance of a TGE.Game object");
        return this;
    }
    TGE.Game._sInstance = this;

    // Do we need the TGS proxy?
    if(!TGS.Analytics)
    {
        TGE.SetupTGSProxy();
    }

    // Document div's
	this.mCanvasDiv = null;
    this.mReorientationDiv = null;

	// Scene graph and rendering
	this.mCanvasPosition = null;

    // Loading & Assets
    this.mLoadingScreen = null;
    this._mAssetListLoaded = {};
    this._mWaitingForAssets = [];
    this._mBuffering = false;
	this._mShowBuffering = false;
	this._mBufferingScreen = null;
    this._mBufferingOccurrences = {};
    this._mLanguage = "en";

	// User engagement for playable ad games
    this._mNumInteractions = 0;
    this._mLastInteraction = new Date().getTime();
	this._mGameViewableReceived = false;
    this._mGameViewablePending = false;
	this._mAdInactivityTimeLimit = 0;
	this._mAdInactivityTimer = 0;
    this._mCompletionCount = 0;

    // Ensure that GameConfig and GameConfig.REMOTE_SETTINGS exist
	window.GameConfig = window.GameConfig || {};
	GameConfig.REMOTE_SETTINGS = GameConfig.REMOTE_SETTINGS || {};

    // Deal with deprecated TGS.Languages supported languages array
    if(TGS.Language.SupportedLanguages)
    {
        // We have to create a remote setting that specifies a "lang" setting with this list as the available options
        GameConfig.REMOTE_SETTINGS["lang"] = {
            type: "string", 
            default: "en", 
            options: TGS.Language.SupportedLanguages
        };
    }

    // Initialize remote settings before AudioManager
    this._initializeRemoteSettings();

    this.stage = null;
    this.assetManager = new TGE.AssetManager();
	if (TGE.AudioManager) this.audioManager = new TGE.AudioManager(this.assetManager);
    this.tracking = new TGE.Tracking();
	this._mUnmuteOnActivate = false;

    this.onLoad = null;

	// Framerate and time tracking (code from: http://stackoverflow.com/questions/4787431/check-fps-in-js)
	this.mGameTime = 0;
	this._mFilterStrength = 10;
	this._mFrameTime = 0;
	this._mLastLoop = new Date().getTime();
	this._mLastDisplay = new Date().getTime();
	this._mThisLoop = 0;
	this._mCurrentFPS = 0;
    this._mLaunchTime = 0;
    this.slowMotion = 0;        // set to non-zero value to delay this many frames each update cycle
	this._mUpdateSkips = 0;

	// Caps for update interval - set a minimum value to prevent your
	// simulation from processing too large an update in a single frame.
	// For realistic physics simulations that require a constant tick
	// time, set the min and max value to be the same.
	this.mMaxTickTime = 0.25;
	this.mMinTickTime = Number.MIN_VALUE;

    // User input handling
    this._mPointerX = 0;
    this._mPointerY = 0;
    this._mPointerDown = false;
    this._mCurrentPointer = -1; // For single-touch limiting
    this._mKeysDown = {};

	this._mActive = true;
    this._mUpdateRoot = null;

    this.canvasWidth = 0;
    this.canvasHeight = 0;

    this._isiFramed = window.self != window.top;

    this.scaleToFitOnDesktop = this._isiFramed;
	this.horizontalAlignment = "center";
    this.verticalAlignment = isNaN(getQueryString()["padding-top"]) ? (TGE.BrowserDetect.isMobileDevice || this.scaleToFitOnDesktop ? "middle" : "top")  : "bottom";
    this.resizeCanvasToParent = false;
	this.desktopMaxCanvasWidth = Number.MAX_VALUE;
	this.desktopMaxCanvasHeight = Number.MAX_VALUE;
	this.maxCanvasWidth = Number.MAX_VALUE;
	this.maxCanvasHeight = Number.MAX_VALUE;
	this.blockBrowserKeys = true;
	this.blockTGEKeys = false;
    this.allowMultitouch = true;    

    this._mResizeCanvasToFit = false;
    this._mViewportScale = 1;
    this._mDivResized = false;
    this._mOldScreenWidth = -1; // For ironSource
    this._mOldScreenHeight = -1;

    // Snapchat needs a lot of special handling
    this._mSnapchatSession = getDistributionPartner()==="B0135";
    this._mSnapchatImmersive = this._mSnapchatSession && window.TreSensa && window.TreSensa.Playable.getSetting &&
        window.TreSensa.Playable.getSetting("snapchatImmersive")===true;

	// PAN-435 Windows Phone 8 doesn't support devicePixelRatio
	if(TGE.BrowserDetect.onWindowsMobile)
	{
		// http://msdn.microsoft.com/en-us/library/windows/apps/dn252558.aspx
		window.devicePixelRatio = window.screen.deviceXDPI / window.screen.logicalXDPI;

		// Lumia 920 reports 96dpi for both logical and device :P
		if(navigator.userAgent.indexOf("Lumia 920")!==-1)
		{
			window.devicePixelRatio = 2;
		}
	}

    var queryParams = getQueryString();

    this._mAdInactivityTimeLimit = parseInt(queryParams["adanimation"]) || 0;
	this.debugResizeMode = this._mDebugResize = queryParams["tgedebug"]==="4";
	this._mTestBuffering = parseInt(queryParams["testbuffering"]) || (queryParams["tgedebug"]==="3" ? 1 : 0);
    this._mPreviewMode = queryParams["simulateBanner"] ? 1 : (parseInt(queryParams["previewMode"]) || 0);
    this._mTestAdHeader = parseInt(queryParams["testadheader"]) || 0;
    this._mCustomLoader = parseInt(queryParams["customloader"]) || 0;
    this._mPortraitGame = null; // Determined on first viewport resize
    this._ignoreOrientation = queryParams["ignoreOrientation"] === "true" || // querystring override
        this._mPreviewMode===1 || // banner ads
        (window.GameConfig && !(GameConfig.ORIENTATION==="portrait" || GameConfig.ORIENTATION==="landscape" || GameConfig.ORIENTATION==="initial")); // via GameConfig

    // Determine the desired language
    this.setLanguage(this.preferredLanguage());
}

/**
 * The TGE.LoadingWindow static variable defines the window that will be used during the initial asset loading phase.
 * The TGE.LoadingWindow must be a subclass of TGE.Window. If no value is set, no loading screen will be displayed.
 * @constant
 */
TGE.LoadingWindow = null;

/**
 * The TGE.FirstGameWindow static variable defines the window that will be launched once the initial asset loading phase is complete.
 * The TGE.FirstGameWindow must be a subclass of TGE.Window. The most common example would be a main menu class, however during
 * development it could be set to launch directly to a game screen to facilitate development.
 * @constant
 */
TGE.FirstGameWindow = null;

/**
 * Used to specify an optional parameter into the game viewable/visible event. The most common use case for this would be for
 * indicating a level parameter when the game can start with different/random levels.
 * @constant
 */
TGE.GameViewableParameter = null;

/**
 * TGE.OnUnsupportedPlatform can be set to a user defined function that will be called when the platform does not support HTML5 canvas.
 * <strong>Only works only in conjunction with the deprecated TGL game loader</strong>. A common tactic for this callback would be to redirect to another page
 * with an error message. Keep in mind if this function is called there will be no TGE.Game object and you cannot use any TGE features. 
 * Assume only basic DOM/CSS operations are available.
 * @deprecated
 */
TGE.OnUnsupportedPlatform = null;


/** @ignore */
TGE._ResizeEvent = {
    type:"resize",
    width:0,
    height:0,
    endEvent: {
        type: "resizeEnd",
        width: 0,
        height: 0
    }
};

/** @ignore */
TGE._AddedToStageEvent = {type:"addedToStage"};

TGE.DisableViewportResizing = false;
TGE.DisableLostFocusPause = false;

TGE.Game._sInstance = null;

/**
 * Returns the single instance of your TGE.Game object (or TGE.Game subclass).
 * TGE games follow the <a href="http://en.wikipedia.org/wiki/Singleton_pattern">singleton pattern</a>.
 * Using TGE.Game.GetInstance() allows you to retrieve your game object from anywhere in the code.
 * @returns {TGE.Game|null} The single instance of your TGE.Game object, or null if an instance of the game has not been created yet.
 */
TGE.Game.GetInstance = function()
{
    return TGE.Game._sInstance;
}

/**
 * @deprecated
 */
TGE.Game.OpenURL = function(url)
{
    TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.Game.OpenURL is deprecated, use TGE.Game.Clickthrough");
	TGE.Game.Clickthrough("deprecated", url);
}

/**
 * Returns the HTMLDivElement that is being used for the game engine's HTML5 canvas.
 * @return {HTMLDivElement} The HTMLDivElement that is being used for the game engine's HTML5 canvas.
 */
TGE.Game.GameDiv = function()
{
    return TGE.Game.GetInstance().mCanvasDiv;
}

/**
 * Typically the game dispatches an "update" event to the stage, which propagates through the entire scenegraph and causes all objects to be updated each frame.
 * Calling SetUpdateRoot allows you to change the object that receives the initiating update event so that you can block update events from
 * getting through to all objects behind it in the scenegraph. This is useful for something like a pause screen, where you want the screen itself to
 * receive updates, but everything below it (the game) should be frozen. If the object is later removed from the scene, the update root will automatically be set back to the stage.
 * @param {TGE.DisplayObject} obj The display object that will receive the initiating "update" event from the game.
 */
TGE.Game.SetUpdateRoot = function(obj)
{
    TGE.Game.GetInstance()._mUpdateRoot = obj;
}

/**
 * Returns the current target of the game "update" event.
 * @return {TGE.DisplayObject}
 */
TGE.Game.GetUpdateRoot = function()
{
    return TGE.Game.GetInstance()._mUpdateRoot;
}

/** @ignore */
TGE.Game.Hibernate = function(on)
{
	var game = TGE.Game.GetInstance();

	if(game)
	{
		TGE.Debug.Log(TGE.Debug.LOG_INFO, (on ? "hibernating" : "waking up") + " game...");

		// Hide the canvas div completely
		game.stage._mCanvas.style.display = on ? "none" : "block";

		// Block the scenegraph from doing any processing at all
		game.halt = on;
	}
}


TGE.Game.prototype =
{
	halt: false,

    _mViewportScale: 0,

	/**
	 * Sets the desired language to be used by the asset manager and TGE.Text class for localized content.
	 * @param {String} lang A two-character ISO-639-1 language code.
	 */
	setLanguage: function(lang)
	{
		this._mLanguage = lang;

		// Set the language in the asset manager
		this.assetManager.currentLanguage = lang;

		// Set the language for the TGE.Text lookups
		TGE.Text.Language = lang;
	},

    /**
     * Returns the language code that TGE is using to try and fulfill any language specific text or assets.
     * @returns {String} A two-character ISO-639-1 language code.
     */
    getLanguage: function()
    {
        return this._mLanguage;
    },

    /**
     * Waits until the specified required asset list has finished loading. In the event that the asset list is not ready,
     * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
     * @param {Number} listNumber Specifies which required asset list to check for completion. For instance, a listNumber of 3 will check whether the asset list "required3" is ready yet.
     * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
     * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
     * @returns {Boolean} Whether or not the specified required asset list has completed loading.
     * @deprecated
     */
    requiredAssetsAvailable: function(listNumber, callback, showBuffering)
    {
        if(!isNaN(parseInt(listNumber)))
        {
            var listName = this.assetManager.getAssetListFromNumber(listNumber);
            return this.waitForAssetList(listName, callback, showBuffering);
        }
        else
        {
            console.error("A number must be passed into requiredAssetsAvailable");
        }
    },

	/**
	 * Waits until the specified asset list has finished loading. In the event that the asset list is not ready,
	 * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
	 * @param {String} listName Specifies which asset list to check for completion.
	 * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
	 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
	 * @returns {Boolean} Whether or not the specified asset list has completed loading.
	 * @deprecated
	 */
	assetListAvailable: function(listName, callback, showBuffering)
    {
        showBuffering = showBuffering!==false;
	    var listNumber = this.assetManager._mLoadingOrder.indexOf(listName);

        // If we're test buffering, we should start loading the list now
	    // (listNumber > 0 means a list in our loading order array, other than "required", which is always in index 0)
        if (this._mTestBuffering === 1 && callback !== undefined && listNumber > 0)
        {
            // Make sure all previous asset lists are tagged for loading before loading this list
            // (The actual loading takes places in _update() method)
            for (var i=1; i<=listNumber; i++)
            {
	            var name = this.assetManager._mLoadingOrder[i];
                if (!this._mAssetListLoaded[name])
                {
                    this._mAssetListLoaded[name] = "queued";
                }
            }
        }

        // Has the list been loaded already?
        var isAssetListLoaded = this._mAssetListLoaded[listName]==="loaded";
        var isTestBufferingHappening = this._mTestBuffering==1 && listName !== "required" && (!this._mBufferingOccurrences[listName] || this._mBufferingOccurrences[listName].testTimer>0);
        if(isAssetListLoaded && !isTestBufferingHappening)
        {
            if(callback)
            {
                callback.call();
            }
            return true;
        }

        // The list isn't loaded, at this point we show the buffering screen (or do an invisible buffering if requested)
        this._mBuffering = true;

        // Is this the first occurrence of buffering for this asset list?
        if(!this._mBufferingOccurrences[listName])
        {
            this._mBufferingOccurrences[listName] = {
                completeFired: false,
                callbacks: callback ? [callback] : [],
                testTimer: 0.5,
                showBuffering: showBuffering
            };

            // Fire an event so we can track the frequency a user encounters a buffering screen for this list
            if(this._mTestBuffering!=1 && showBuffering)
            {
                TGE.Analytics.CustomEvent("buffering_" + listName);
            }
        }
        else if(callback)
        {
            var bo = this._mBufferingOccurrences[listName];
            bo.callbacks.push(callback);
            bo.showBuffering = showBuffering || bo.showBuffering;
        }

        // Show the buffering screen if requested
        if(showBuffering)
        {
	        TGE.Debug.Log(TGE.Debug.LOG_INFO, "buffering, waiting for assetList: " + listName);
	        this._mShowBuffering = true;
	        this._showBufferingScreen();
        }

        return false;
    },

	/**
	 * Waits until a specified individual asset has finished loading.
	 * (Same behavior and options as assetListAvailable, but for single assets).
	 * @param {String} id Specifies which AssetManager id to check.
	 * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
	 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
	 * @returns {Boolean} Whether or not the specified asset list has completed loading.
	 * @deprecated
	 */
	assetAvailable: function(id, callback, showBuffering)
    {
        var listName = this.getAssetList(id);
        if (listName)
        {
            return this.waitForAssetList(listName, callback, showBuffering);
        }
        else if (callback != null)
        {
	        // PAN-1038 asset not part of a list yet, so save for future tests with new localized asset lists
	        this._mWaitingForAssets.push({id:id, callback:callback, showBuffering:showBuffering});

	        // When testbuffering=1, nothing triggers the load of a localized asset list itself.
	        // Normally, that happens inside of assetListAvailable to queue up to the one we're waiting for.
	        // In this case however, we won't know what list that is until *after* it's loaded,
	        // thus no way to request that list ahead of time.
	        // So we'll queue those up one at a time, in numbered order, until finding those assets.
	        // (The process continues in AssetManager._processSheetLayouts)
	        if (this._mTestBuffering === 1)
	        {
	        	this._loadNextAssetList();
	        }
        }
	    return false;
    },

	/**
	 * Checks whether the specified asset list has finished loading.
	 * (Same behavior and options as isAssetListLoaded, but for single assets).
	 * @param {String} id Specifies which AssetManager id to check.
	 * @returns {Boolean} Whether or not the specified asset has completed loading.
	 */
    isAssetLoaded: function(id)
    {
	    return this.assetAvailable(id, undefined, false);
    },

    /**
     * Checks whether a specified asset list has finished loading.
     * @param {String} listName Specifies which asset list to check for completion.
     * @returns {Boolean} Whether or not the asset list has completed loading.
     */
    isAssetListLoaded: function(listName)
    {
	    return this.assetListAvailable(listName, undefined, false);
    },

    /**
     * Checks whether a specified asset group has finished loading.
     * @param {String} groupName Specifies which asset group to check for completion.
     * @returns {Boolean} Whether or not the asset group has completed loading.
     */
    isAssetGroupLoaded: function(groupName)
    {
        var listName = this.assetManager.getAssetListFromGroup(groupName);

        return this.assetListAvailable(listName, undefined, false);
    },

	/**
	 * Checks whether the specified required asset list has finished loading.
	 * @param {Number} listNumber Specifies which required asset list to check for completion. For instance, a listNumber of 3 will check whether the asset list "required3" is ready yet.
	 * @returns {Boolean} Whether or not the specified asset has completed loading.
	 */
	isRequiredAssetsLoaded: function(listNumber)
    {
	    return this.requiredAssetsAvailable(listNumber, undefined, false);
    },

	/**
	 * Waits until a specified individual asset has finished loading.
	 * (Same behavior and options as assetListAvailable, but for single assets).
	 * @param {String} id Specifies which AssetManager id to check.
	 * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
	 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
	 * @returns {Boolean} Whether or not the specified asset list has completed loading.
	 */
	waitForAsset: function(id, callback, showBuffering)
	{
		return this.assetAvailable(id, callback || null, showBuffering)
	},

	/**
	 * Waits until the specified asset list has finished loading. In the event that the asset list is not ready,
	 * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
	 * @param {String} listName Specifies which asset list to check for completion.
	 * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
	 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
	 * @returns {Boolean} Whether or not the specified asset list has completed loading.
	 */
	waitForAssetList: function(listName, callback, showBuffering)
	{
		return this.assetListAvailable(listName, callback || null, showBuffering)
	},

    /**
     * Waits until the specified asset group has finished loading. In the event that the asset list is not ready,
     * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
     * @param {String} groupName Specifies which asset group to check for completion.
     * @param {Function} callback A callback function to be fired when the specified asset list has finished loading and the assets are available for use.
     * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
     * @returns {Boolean} Whether or not the specified asset list has completed loading.
     */
    waitForAssetGroup: function(groupName, callback, showBuffering)
    {
        var listName = this.assetManager.getAssetListFromGroup(groupName);

        if (listName)
        {
            return this.waitForAssetList(listName, callback, showBuffering);
        }
        else
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "waitForAssetGroup() could not find asset group '" + groupName + "'.  It was never queued for load OR it was never used in GameConfig.ASSETS");
            return false;
        }
    },

    /**
	 * Waits until the specified required asset list has finished loading. In the event that the asset list is not ready,
	 * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
	 * @param {Number} listNumber Specifies which required asset list to check for completion. For instance, a listNumber of 3 will check whether the asset list "required3" is ready yet.
	 * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
	 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
	 * @returns {Boolean} Whether or not the specified required asset list has completed loading.
	 */
	waitForRequiredAssets: function(listNumber, callback, showBuffering)
	{
		return this.requiredAssetsAvailable(listNumber, callback || null, showBuffering)
	},

	/**
	 * @ignore
	 */
	_loadNextAssetList: function()
	{
		for (var listNumber = 1; listNumber < this.assetManager._mLoadingOrder.length; ++listNumber)
		{
			var listName = this.assetManager._mLoadingOrder[listNumber];
			var status = this._mAssetListLoaded[listName];
			if (status !== "loaded" && status !== "loading")
			{
				this.waitForAssetList(listName, null, false);
				break;
			}
		}
	},

	/**
     * Determines which asset list contains a specific asset
     * @param {String} id Specifies which AssetManager id to check.
     * @returns {String} The name of the asset list the AssetManager id belongs to. Undefined when not found.
     */
    getAssetList: function (id)
    {
        for (var listName in this.assetManager._mAssetLists)
        {
            var list = this.assetManager._mAssetLists[listName].list;
            for (var i = 0; i < list.length; i++)
            {
	            if (list[i].id === id || (list[i].sheet && trimmedFilename(list[i].sheet) === id))
                {
                    return listName;
                }
            }
        }
    },

	/** @ignore */
    _showBufferingScreen: function()
    {
        if(this._mBufferingScreen)
        {
            return;
        }

        this._mBufferingScreen = this.stage.addChild(new TGE.DisplayObjectContainer().setup({
            layout: "match",
            registrationX: 0,
            registrationY: 0,
            mouseEnabled: true
        }));
        this._mBufferingScreen.addChild(new TGE.DisplayObjectContainer().setup({
            backgroundColor: "#fff",
            alpha: 0.4,
            layout: "match"
        }));

        var spinner = this._mBufferingScreen.addChild(new TGE.DisplayObject().setup({
            width: 25,
            height: 25,
            layout: {
                xPercentage: 0.5,
                yPercentage: 0.5,
                scaleToWidth: 0.25
            }
        }));
        spinner.addEventListener("drawend",function(event) {
            var context = event.canvasContext;
            var lines = 16;
            context.translate(this.width / 2, this.height / 2);
            for (var i = 0; i < lines; i++)
            {
                context.beginPath();
                context.rotate(Math.PI * 2 / lines);
                context.moveTo(this.width / 6, 0);
                context.lineTo(this.width / 4, 0);
                context.lineWidth = this.width / 30;
                context.strokeStyle = "rgba(255, 0, 0," + i / lines + ")";
                context.stroke();
            }
        });

        spinner.tweenTo({
            rotation: 360,
            duration: 1.2,
            loop: true,
            repeat: true
        });

        TGE.Game.SetUpdateRoot(this._mBufferingScreen);
    },

    /** @ignore */
    _closeBufferingScreen: function()
    {
        if(!this._mBufferingScreen)
        {
            return;
        }

        this._mBufferingScreen.markForRemoval();
        this._mBufferingScreen = null;
    },

    /**
     * Indicates whether the game is a package build
     * @returns {Boolean} Returns true if the game is a package build.
     */
    isPackageBuild: function ()
    {
        return window.TreSensa ? window.TreSensa.Playable.packagedBuild : false;
    },

    /**
     * Indicates whether the game is being played as an ad.
     * @returns {Boolean} Returns true if the game is being played as an ad, and false otherwise.
     */
    gameAsAd: function()
    {
        return this._mPreviewMode>0;
    },

    /**
     * Indicates whether the game is being played as an ad, and the ad unit is a banner ad (not fullscreen interstitial).
     * @returns {Boolean} Returns true if the game is being played in a banner ad format, and false otherwise.
     */
    gameAsBannerAd: function()
    {
        return this._mPreviewMode===1;
    },

    /**
     * Gets the ID of the campaign this session is trafficked under.
     * @returns {String} Returns the campaign ID if there is one.
     */
    getCampaignID: function()
    {
        return getQueryString()["campaign"];
    },

    /**
     * Returns the number of seconds that have elapsed since the user last clicked the mouse, tapped on the screen, or entered a key.
     * @returns {Number} The number of seconds since the last user interaction.
     */
    timeSinceLastInteraction: function()
    {
        return ((new Date().getTime())-this._mLastInteraction)/1000;
    },

    /**
     * Launching point for the entire game. Calling this function will initialize the game environment and begin downloading required assets.
     * If you are using the TreSensa Game Loader (TGL) you do not need to call launch(), TGL will do this for you.
     * @param {Object} gameParameters Information about how the game should be setup.
     * @param {String} gameParameters.gameDiv ID of the game canvas div element.
     * @param {String} [gameParameters.orientation="unspecified"] The orientation the game is meant to be played in. Can be "portrait", "landscape", or "unspecified".
     * @param {String} [gameParameters.reorientDiv] ID of the div element to display if a users rotates their device to an orientation not intended for gameplay.
     * @param {Number} [gameParameters.width] An optional parameter to specify the desired width of the game canvas. If unspecified, the current gameDiv dimensions will be used.
     * @param {Number} [gameParameters.height] An optional parameter to specify the desired height of the game canvas. If unspecified, the current gameDiv dimensions will be used.
     * @return {Boolean} False if the game canvas could not be found.
     */
    launch: function(gameParameters)
    {
		// Read in the setup parameters
        var gameDiv = typeof gameParameters.gameDiv === "string" ? gameParameters.gameDiv : null;
        var reorientDiv = typeof gameParameters.reorientDiv === "string" ? gameParameters.reorientDiv : null;
        var width = typeof gameParameters.width === "number" ? gameParameters.width : -1;
        var height = typeof gameParameters.height === "number" ? gameParameters.height : -1;
        var initialWidth = typeof gameParameters.initialWidth === "number" ? parseInt(gameParameters.initialWidth) : -1;
        var initialHeight = typeof gameParameters.initialHeight === "number" ? parseInt(gameParameters.initialHeight) : -1;
        var resizeForNative = typeof gameParameters.resizeForNative === "undefined" ? false : gameParameters.resizeForNative;

        // Check if there's a request to simulate a banner size
        var simulateBanner = getQueryString()["simulateBanner"];
        switch(simulateBanner)
        {
            case "mrec":    width = 300; height = 250;
                break;
        }

        this._sConfig = gameParameters;

        this.onLoad = typeof gameParameters.onLoad === "function" ? gameParameters.onLoad : this.onLoad;

        // Get the canvas div
        this.mCanvasDiv = document.getElementById(gameDiv);
        if(this.mCanvasDiv == null)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Could not find canvas div '" + gameDiv + "'");
            return false;
        }

        // Enforce some necessary css styles
        var style = this.mCanvasDiv.getAttribute('style') || '';
        // AppLovin tester has a dumb bug where the click confirmation popup goes under the creative, and their QA then flags our creatives as having non-functioning click-throughs
        // (arguably we don't need to set z-index anyways, but it would be a risky change)
        var zIndex = getDistributionPartner()==="B0039" ? "" : "z-index: 1; ";
        this.mCanvasDiv.setAttribute('style', style + ' ' + zIndex + 'overflow: hidden; touch-action: none; -webkit-user-select: none; -ms-touch-action:none; -webkit-tap-highlight-color: transparent; -moz-tap-highlight-color: transparent; -webkit-transform: translateZ(0);');

        if(width>0 && height>0)
        {
            this.mCanvasDiv.style.width = width+"px";
            this.mCanvasDiv.style.height = height+"px";
        }

        this.canvasWidth = this.mCanvasDiv.clientWidth;
        this.canvasHeight = this.mCanvasDiv.clientHeight;

        // Get the div to show when the orientation is wrong
        this.mReorientationDiv = document.getElementById(reorientDiv);

        // Determine the position of the canvas for mouse events
        this._determineCanvasPosition();

        // Add the resize event for orientation and screen size changes
        window.addEventListener('resize', this._onResize.bind(this), false);

	    // Add events to auto-pause the game when deactivated on mobile
        if(!TGE.DisableLostFocusPause)
        {
			// Lots of different ways to handle changes in focus...
			var visEvent;
	        if(typeof document.hidden !== "undefined")
	        {
	            // Opera 12.10 and Firefox 18 and later support
		        visEvent = "visibilitychange";
	        }
	        else if(typeof document.mozHidden !== "undefined")
	        {
		        visEvent = "mozvisibilitychange";
	        }
	        else if(typeof document.msHidden !== "undefined")
	        {
		        visEvent = "msvisibilitychange";
	        }
	        else if(typeof document.webkitHidden !== "undefined")
	        {
		        visEvent = "webkitvisibilitychange";
	        }

			// If a modern method isn't supported, fallback on an older method
			if(visEvent)
			{
				TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "using " + visEvent + " visibility change event");
				document.addEventListener(visEvent, this._onVisibilityChange.bind(this), false);

                // PAN-842 if the game is loaded in a hidden state, make sure we're not considered active (only applying to Snapchat for now)
                if(this._mSnapchatSession && (document.hidden || document.mozHidden || document.msHidden || document.webkitHidden))
                {
                    this._onDeactivate();
                }
			}
			else
	        {
		        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "using blur/focus and pagehide/show for visibility change events");
		        window.addEventListener("blur", this._onDeactivate.bind(this), false);
		        window.addEventListener("focus", this._onActivate.bind(this), false);
		        window.addEventListener("pagehide", this._onDeactivate.bind(this), false);
		        window.addEventListener("pageshow", this._onActivate.bind(this), false);
	        }
        }

        // Input handlers
	    if("ontouchstart" in window)
        {
            this.mCanvasDiv.addEventListener("touchstart", this._mouseDown.bind(this), false);
            this.mCanvasDiv.addEventListener("touchmove", this._mouseMove.bind(this), false);
            this.mCanvasDiv.addEventListener("touchend", this._mouseUp.bind(this), false);
        }
        else
        {
            this.mCanvasDiv.addEventListener("click", this._preventBehavior.bind(this), false);
            this.mCanvasDiv.addEventListener("mousedown", this._mouseDown.bind(this), false);
            this.mCanvasDiv.addEventListener("mouseup", this._mouseUp.bind(this), false);
            this.mCanvasDiv.addEventListener("mousemove", this._mouseMove.bind(this), false);
        }

        // Keyboard events
        document.addEventListener("keydown", this._keyDown.bind(this), false);
        document.addEventListener("keyup", this._keyUp.bind(this), false);

	    // Setup a debug widget if requested
	    if(getQueryString()["tgedebug"])
	    {
		    var debugWidget = document.createElement("div");
		    debugWidget.id = "debug_widget";
		    debugWidget.style.backgroundColor = "#0c0";
		    debugWidget.style.position = "absolute";
		    debugWidget.style.display = "block";
		    debugWidget.style.top = 0;
		    debugWidget.style.padding = "6px";
		    debugWidget.style.zIndex = 200;
		    document.body.insertBefore(debugWidget,document.body.firstChild);

		    // Do we need to enable TGE.Window logging?
		    if(getQueryString()["tgedebug"]==="2")
		    {
			    TGE.Window._sTrackWindows = true;
		    }

		    var updateDebugWidget = function() {
			    var game = TGE.Game.GetInstance();
			    var str = "<div style='font-weight: bold; font-size: 14px; padding-bottom: 3px;'>" +
				    game._mCurrentFPS + " fps</div>";
			    if(getQueryString()["tgedebug"]==="2")
			    {
				    // List entity counts
				    str += (game.stage ? game.stage.numChildren(true) : 0) + " scene objects<br>" +
					    (game.stage ? game.stage.numVisibleObjects() : 0) + " visible objects<br>" +
					    (game.stage ? game.stage.numDrawnObjects() : 0) + " drawn objects<br>" +
					    (game.stage ? game.stage._mUpdateGroup.length : 0) + " updating objects<br>";

				    // List the active TGE.Window objects
				    str += "<div style='font-weight: bold; font-size: 14px; padding-top: 4px; padding-bottom: 2px;'>Active Windows:</div>";
				    for(var w=0; w<TGE.Window._sActiveWindows.length; w++)
				    {
					    str += TGE.Window._sActiveWindows[w]+"<br>";
				    }
			    }
                else if(getQueryString()["tgedebug"]==="3")
                {
                    // Show if the completion event has been fired
                    if(game._mCompletionCount>0)
                    {
                        str += "<div style='font-weight: normal; font-size: 12px; padding-bottom: 3px;'>COMPLETION FIRED</div>";
                    }

                    var res = TGE.TestPlayableAdRequirements("code");
                    if(res===0)
                    {
                        // Red background
                        debugWidget.style.backgroundColor = "#c00";

                        var errors = TGE.TestPlayableAdRequirements("errors");
                        var plural = errors.length>1 ? "s" : "";
                        str += "<div style='font-weight: bold; font-size: 12px; padding-top: 4px; padding-bottom: 2px;'>Playable Ad Violation" + plural + " Detected!</div>";
                        for(var e=0; e<errors.length; e++)
                        {
                            str += "<div style='font-weight: normal; font-size: 10px;'>" + errors[e] + "</div>";
                        }
                    }
                    else if(res===2)
                    {
                        // Orange background
                        debugWidget.style.backgroundColor = "#fa0";

                        var errors = TGE.TestPlayableAdRequirements("errors");
                        var plural = errors.length>1 ? "s" : "";
                        str += "<div style='font-weight: bold; font-size: 12px; padding-top: 4px; padding-bottom: 2px;'>Playable Ad Warning" + plural + " Detected</div>";
                        for(var e=0; e<errors.length; e++)
                        {
                            str += "<div style='font-weight: normal; font-size: 10px;'>" + errors[e] + "</div>";
                        }
                    }
                }
			    debugWidget.innerHTML = str;
		    };

		    updateDebugWidget();
		    setInterval(updateDebugWidget,250);
	    }

        // Now we can initialize the renderer (do this before we setup the OrientationChanged callback!)
        if(this._mDebugResize)
        {
            this._initializeRenderer(this._innerWidth(),this._innerHeight());
        }
        else if(initialWidth>0 && initialHeight>0)
        {
            this._initializeRenderer(initialWidth,initialHeight);
        }
        else
        {
            this._initializeRenderer();
        }

	    // Resize the viewport for the device
	    TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "game launch calling _resizeViewport");
        this._resizeViewport();

        // Setup the callback for detecting orientation change events
	    // JH: was firing early in Chrome on iOS 10.3.2, yielding the previous values of the W/H before the device rotation was updated
	    // window.addEventListener("orientationchange", this._onOrientationChanged.bind(this));

	    // Prevent page scroll. If we're in an ad container this will have been done already. If not, take care of it now.
        // Note, do not trap native gestures on Snapchat.
	    if(!window.TreSensa && (!this._mSnapchatSession || this._mSnapchatImmersive))
	    {
		    var _onReady = function () {
			    document.addEventListener('touchmove', function (event) {
				    event.preventDefault();
			    }, false);
		    };

		    if (document.readyState === 'loading') {
			    document.addEventListener('DOMContentLoaded', function () {
				    _onReady();
			    }, false);
		    } else {
			    _onReady();
		    }
	    }

        // Begin the asset loading process
        this._beginLoad();

        return true;
    },

    /** @ignore */
    gameMadeViewable: function()
    {
        // PAN-842 - don't consider the game viewable if the page is hidden/inactive (only on Snapchat for now)
        if(this._mSnapchatSession && !this._mActive)
        {
            this._mGameViewablePending = true;
            return;
        }

        if(!this._mGameViewableReceived)
        {
            this._mGameViewableReceived = true;
            this._mGameViewablePending = false;

            // Fire the game viewable analytic events
            TGE.Events.logGameViewable();

            // Notify TGE.Tracking that the game was made viewable
            this.tracking.trackEvent("impression");

            document.dispatchEvent(new Event("tgeGameViewable"));

            // Fire the callback if one was set
            if(TGE.GameViewableCallback)
            {
                TGE.Debug.Log(TGE.Debug.LOG_WARNING,"game is using deprecated TGE.GameViewableCallback, use TGE.Game.AddEventListener('tgeGameViewable') instead");
                TGE.GameViewableCallback.call();
            }

            // PAN-807 ironSource doesn't have a valid viewport size until mraid viewable (Snapchat is potentially weird too)
            if(this._mSnapchatSession)
            {
                this._resizeViewport();
            }
        }
    },

    /**
     * Get the preferred ISO-639-1 language code based on browser/device language settings or remote settings (querystring params).
     * If the preferred language is not available in the supported languages list, the first supported language will be returned instead.
     * @return {string} an ISO-639-1 language code
     */
    preferredLanguage: function()
    {
        var browserLanguage = navigator.language || navigator.userLanguage || "en";
        var remoteSettingLanguage = TGE.RemoteSettings.WasSet("lang") ? TGE.RemoteSettings("lang") : null;

        // Determine the ideal language (whether supported or not)
        var firstPick = (remoteSettingLanguage || browserLanguage).toLowerCase();
        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE,"language first pick is: " + firstPick);

        // See if the exact language code is supported. If not, see if the core language is supported. Otherwise take the first supported language.
	    var res = "en";
        var coreLang = firstPick.split("-")[0];
        var supportedLanguages = TGE.RemoteSettings.GetSettings()["lang"].options || ["en"];
        if(supportedLanguages.indexOf(firstPick) !== -1)
        {
            res = firstPick;
        }
        else if(supportedLanguages.indexOf(coreLang) !== -1)
        {
            res = coreLang;
        }
        else if(supportedLanguages.length > 0)
        {
            res = supportedLanguages[0];
        }

        res = res.toLowerCase();
        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE,"language best fit is: " + res);

        return res;
    },

    /** @ignore */
    _updateFPS: function()
    {
        // Only update the display once per second
        var lastDisplay = this._mThisLoop - this._mLastDisplay;
        if(lastDisplay < 500)
        {
            return;
        }
        this._mLastDisplay = this._mThisLoop;

        if(this._mFrameTime>0)
        {
            this._mCurrentFPS = Math.floor(1000 / this._mFrameTime).toFixed(0);
        }
    },

    /**
     * Call this function if the position of the game canvas is ever moved. It is called automatically for browser resize events, but may be necessary to call manually if the canvas position is changed by other means.
     * @ignore
     */
    _determineCanvasPosition: function()
    {
        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "_determineCanvasPosition");
        this.mCanvasPosition = getElementPosition(this.mCanvasDiv);
    },

    /** @ignore */
    _onResize: function()
    {
        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "_onResize");

        // Fire the resize immediately (PAN-815)
        this._resizeViewport();
    },

    /**
     * Scales the game by using a CSS 2D transform on the canvas div
     * @ignore 
     */
    _scaleByCSS2D: function(scale)
    {
        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "resizing game using a 2D CSS transform");

        this._mViewportScale = scale;
        var style = this.mCanvasDiv.getAttribute('style') || '';
        this.mCanvasDiv.setAttribute('style', style + ' ' + '-ms-transform-origin: 0% 0%; -webkit-transform-origin: 0% 0%; -moz-transform-origin: 0% 0%; -o-transform-origin: 0% 0%; transform-origin: 0% 0%; -ms-transform: scale(' + scale + '); -webkit-transform: scale(' + scale + '); -moz-transform: scale(' + scale + '); -o-transform: scale(' + scale + '); transform: scale(' + scale + ');');
        this._mDivResized = false;
    },

    /**
     * Scales the game by using a CSS 3D transform on the canvas div
     * @ignore 
     */
    _scaleByCSS3D: function(scale)
    {
        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "resizing game using a 3D CSS transform");

        var scaleString = scale + ',' + scale;
        this._mViewportScale = scale;
        var style = this.mCanvasDiv.getAttribute('style') || '';
        this.mCanvasDiv.setAttribute('style', style + ' ' + '-webkit-transform: rotateZ(360deg); -ms-transform-origin: left top; -webkit-transform-origin: left top; -moz-transform-origin: left top; -o-transform-origin: left top; transform-origin: left top; -ms-transform: scale(' + scaleString + '); -webkit-transform: scale3d(' + scaleString + ', 1); -moz-transform: scale(' + scaleString + '); -o-transform: scale(' + scaleString + '); transform: scale(' + scaleString + ');');
        this._mDivResized = false;
    },

    /** @ignore */
    _innerWidth: function()
    {
	    if (this._mDebugResize) return getQueryString()["debug_resize_width"] ? parseInt(getQueryString()["debug_resize_width"]) : 1;    // testing code to simulate Mopub's initial bogus screen size

	    var dst = getDistributionPartner();

        // For Creative Builder editor
        if(this._mResizeCanvasToFit && this.resizeCanvasToParent && this.mCanvasDiv.parentNode)
        {
            return this.mCanvasDiv.parentNode.offsetWidth;
        }

        // ironSource MRAID
        // PAN-1321 - the ironSource ad tester can often return undefined for width/height values here on iOS
        if(dst==="B0099" && window.mraid && mraid.getMaxSize && mraid.getMaxSize().width)
        {
            return Math.min(mraid.getMaxSize().width, document.documentElement.clientWidth);
        }

        // ironSource DAPI
        // If dapi isn't viewable it will return 0x0
        if(dst==="B0159" && window.dapi && dapi.getScreenSize && dapi.isViewable() && dapi.getScreenSize().width)
        {
            return dapi.getScreenSize().width;
        }

        if (TGE.BrowserDetect.onAndroid && (dst==="B0134")) { return window.outerWidth; }
        if (dst==="B0119") { return document.body.clientWidth; }
        // JH: window.innerWidth/Height was returning bad values on Chrome iOS 10.3.2 (a mix of portrait innerWidth and landscape innerHeight)
        if (window.innerWidth && (!TGE.BrowserDetect.oniOS || window.applovinMraid)) { return window.innerWidth; }
        if (document.documentElement && document.documentElement.clientWidth != 0) { return document.documentElement.clientWidth; }
        if (document.body) { return document.body.clientWidth; }
        return 0;
    },

    /** @ignore */
    _innerHeight: function()
    {
        if (this._mDebugResize) return getQueryString()["debug_resize_height"] ? parseInt(getQueryString()["debug_resize_height"]) : 1;    // testing code to simulate Mopub's initial bogus screen size

	    var dst = getDistributionPartner();

        // For Creative Builder editor
        if(this._mResizeCanvasToFit && this.resizeCanvasToParent && this.mCanvasDiv.parentNode)
        {
            return this.mCanvasDiv.parentNode.offsetHeight;
        }

        // ironSource MRAID
        if(dst==="B0099" && window.mraid && mraid.getMaxSize && mraid.getMaxSize().height)
        {
            return Math.min(mraid.getMaxSize().height, document.documentElement.clientHeight);
        }

        // ironSource DAPI
        if(dst==="B0159" && window.dapi && dapi.getScreenSize && dapi.isViewable() && dapi.getScreenSize().height)
        {
            return dapi.getScreenSize().height;
        }

        if (TGE.BrowserDetect.onAndroid && (dst==="B0134")) { return window.outerHeight; }
        if (dst==="B0119") { return document.body.clientHeight; }
        if (window.innerWidth && (!TGE.BrowserDetect.oniOS || window.applovinMraid)) { return window.innerHeight; }
        if (document.documentElement && document.documentElement.clientHeight != 0) { return document.documentElement.clientHeight; }
        if (document.body) { return document.body.clientHeight; }
        return 0;
    },

    /** @ignore */
    _getBrowserWidth: function()
    {
        return this._innerWidth();
    },

    /** @ignore */
    _getBrowserHeight: function()
    {
        return this._innerHeight();
    },

    /** @ignore */
    mraidResized: function(width, height)
    {
        // IronSource relies on mraid.getMaxSize() or dapi.getScreenSize() for the correct viewport size, and those
        // values aren't set in time for the browser resize event. Instead we need to trigger it from the mraid.sizeChanged event.
        if(getDistributionPartner()==="B0099" || getDistributionPartner()==="B0159")
        {
            this._resizeViewport();
        }
    },

    /**
     * Centers the canvas div horizontally and/or vertically
     * @ignore 
     */
    _centerCanvasDiv: function(width,height,hAlign,vAlign)
    {
	    var yo = 1;

        // In banner ad mode we need to force the ad to the upper left
	    var h = hAlign ? hAlign : (this._mPreviewMode===1 ? "left" : this.horizontalAlignment);
	    var v = vAlign ? vAlign : (this._mPreviewMode===1 ? "top" : this.verticalAlignment);

	    var left = 0;
	    if(h==="center")
	    {
		    left = Math.floor((this._getBrowserWidth()/2) - (width/2));
	    }
	    else if(h==="right")
	    {
		    left = Math.floor(this._getBrowserWidth() - width);
	    }

	    if(h!=="none")
	    {
		    this.mCanvasDiv.style.position = "absolute";
		    this.mCanvasDiv.style.align = "left";
	        this.mCanvasDiv.style.left = left + "px";

		    // Try to override any viewporter div alignment settings - deprecated, games shouldn't use viewporter div anymore
	        var vpDiv = document.getElementById("viewporter");
	        if(vpDiv)
	        {
	            vpDiv.style.align = "left";
	        }
	    }

	    var top = 0;
        if(v==="middle")
	    {
		    top = Math.floor((this._getBrowserHeight()/2) - (height/2));
	    }
        else if(v==="bottom")
        {
	        top = Math.floor(this._getBrowserHeight() - height);
        }

	    if(v!=="none")
	    {
		    this.mCanvasDiv.style.position = "absolute";
	        this.mCanvasDiv.style.top = top+"px";
	    }
    },

    /** @ignore */
    _resizeViewport: function()
    {
        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "_resizeViewport");

        if(TGE.DisableViewportResizing)
        {
	        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "abandoning _resizeViewport - viewport resizing disabled");
            return;
        }

	    if(!this.stage)
	    {
		    TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "abandoning _resizeViewport - stage not ready");
		    return;
	    }

	    // Attempt to maximize the viewport?
	    maximize = typeof maximize === "boolean" ? maximize : true;

        var canvas = this.mCanvasDiv;
        var style = canvas.getAttribute('style') || '';

        // PAN-702
        var paddingTop = getQueryString()["padding-top"];
        var paddingTop = isNaN(paddingTop) ? 0 : parseInt(paddingTop);

        var gameWidth = this.stage._mOriginalWidth;
        var gameHeight = this.stage._mOriginalHeight;
        var screenWidth = this._innerWidth();
        var screenHeight = this._innerHeight()-paddingTop;

        // Don't let things go any further if we have invalid dimensions
        if(screenWidth==0 || screenHeight==0)
        {
            TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "_resizeViewport abandoned due to invalid screen dimensions: " + screenWidth + "x" + screenHeight);
            return;
        }

        this._mOldScreenWidth = screenWidth;
        this._mOldScreenHeight = screenHeight;

        // What orientation is the device currently in?
        var portraitOrientation = screenWidth<=screenHeight;

        // Determine whether this game prefers to be played in portrait or landscape
        if(typeof(this._mPortraitGame)!="boolean")
        {
            if(window.GameConfig)
            {
                switch(GameConfig.ORIENTATION)
                {
                    case "landscape": this._mPortraitGame = false;
                        break;
                    case "initial": this._mPortraitGame = portraitOrientation; // Prefer whatever the current device orientation is
                        break;
                    case "portrait":
                    default: this._mPortraitGame = true;
                        break;
                }
            }
            else
            {
                this._mPortraitGame = true;
            }
        }

        // Are we in the correct orientation?
        var correctOrientation = portraitOrientation===this._mPortraitGame;

	    // Do we want the canvas to be resized to fill the entire available viewport?
	    if(this._mResizeCanvasToFit)
	    {
		    var oldGameWidth = gameWidth;
		    var oldGameHeight = gameHeight;

		    var maxWidth = TGE.BrowserDetect.isMobileDevice ? Number.MAX_VALUE : this.desktopMaxCanvasWidth;
		    var minWidth = 0;
		    var maxHeight = TGE.BrowserDetect.isMobileDevice ? Number.MAX_VALUE : this.desktopMaxCanvasHeight;
		    var minHeight = 0;

		    var pixelRatio = TGE.BrowserDetect.isMobileDevice ? window.devicePixelRatio : 1;
            // pixelRatio = 1;
		    gameWidth = Math.min(Math.max(screenWidth*pixelRatio,minWidth),maxWidth);
		    gameHeight = Math.min(Math.max(screenHeight*pixelRatio,minHeight),maxHeight);

		    // PAN-582 Dev can specify a capped canvas size
		    if(gameWidth>this.maxCanvasWidth || gameHeight>this.maxCanvasHeight)
		    {
			    // Pick the dimension that is farther over the limit
			    if(this.maxCanvasWidth/gameWidth <= this.maxCanvasHeight/gameHeight)
			    {
				    gameHeight = Math.round(gameHeight * this.maxCanvasWidth/gameWidth);
				    gameWidth = this.maxCanvasWidth;
			    }
			    else
			    {
				    gameWidth = Math.round(gameWidth * this.maxCanvasHeight/gameHeight);
				    gameHeight = this.maxCanvasHeight;
			    }
		    }
		    // Clamp webview dimensions. Problems first seen with the iPhone 6 Plus (PAN-562) and later with Samsung Galaxy line (PAN-1322) Fillrate performance on devices like
            // this drops exponentially if the canvas dimesions are too large. It is also a waste since we would never include image assets to support canvas sizes in the thousands by thousands.
            else if(TGE.BrowserDetect.isMobileDevice && (screenWidth>=736 || screenHeight>=736))
		    {
                TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "clamping large screen game size...");

			    // In portrait, capping to 640px width seems to net out as the best visually while still being able to maintain 60fps
			    if(gameWidth<gameHeight)
			    {
				    gameHeight = Math.round(gameHeight * 640/gameWidth);
				    gameWidth = 640;
			    }
			    else // Landscape looks a little grungy, but going higher quickly drops the fps from 60 to 30. Needs more experimentation with a proper landscape game.
			    {
				    gameHeight = Math.round(gameHeight * 1024/gameWidth);
				    gameWidth = 1024;
			    }
		    }

            var dst = getDistributionPartner();

            // Ultimately I think I'd like to try removing this check, but that's a heavier change that would require
            // thorough QA on multiple platforms/devices. For now we know it doesn't behave well with ironSource so
            // we'll do it conditionally. I'm not sure exactly why it's causing the intermittent orientation change issues
            // on ironSource, but I assume it's related to the fact that the viewport size is retrieved via their own API
            // (either MRAID or DAPI), and this does not always update in time for this _resizeViewport call.
		    if((dst==="B0099" || dst==="B0159") ||
                (gameWidth!==oldGameWidth || gameHeight!==oldGameHeight))
		    {
			    TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "resizing canvas to: " + gameWidth + "x" + gameHeight + "...");

			    this.mCanvasDiv.style.width = gameWidth + "px";
			    this.mCanvasDiv.style.height = gameHeight + "px";

			    this.canvasWidth = gameWidth;
			    this.canvasHeight = gameHeight;

			    // Need to tell the game...
			    if(this.stage)
			    {
				    this.stage.setSize(gameWidth,gameHeight);

				    TGE._ResizeEvent.width = TGE._ResizeEvent.endEvent.width = gameWidth;
				    TGE._ResizeEvent.height = TGE._ResizeEvent.endEvent.height = gameHeight;
				    this.stage.dispatchEvent(TGE._ResizeEvent);
			    }
		    }
            else
            {
                TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "no change in game size detected");
            }

			this._mDivResized = true;
	    }

        TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "_resizeViewport::game size: " + gameWidth + "x" + gameHeight + ", \nscreen size: " + screenWidth + "x" + screenHeight);

        var finalScale = this._determineViewportScale(gameWidth,gameHeight,screenWidth,screenHeight);
        var finalWidth = gameWidth*finalScale;
        var finalHeight = gameHeight*finalScale;

        // Mobile web...
        if(TGE.BrowserDetect.isMobileDevice)
        {
            if( (TGE.BrowserDetect.onAndroid && parseInt(TGE.BrowserDetect.OSversion.charAt(0))<4) )
            {
                this._scaleByCSS2D(finalScale);
                this._centerCanvasDiv(finalWidth,finalHeight);
            }
            else
            {
                this._scaleByCSS3D(finalScale);
                this._centerCanvasDiv(finalWidth,finalHeight);
            }
        }
        else
        {
            // Desktop
            if(this.scaleToFitOnDesktop)
            {
                // Scale canvas using css 2D transform
                this._scaleByCSS2D(finalScale);
                this._centerCanvasDiv(finalWidth,finalHeight);
            }
            else
            {
                // Center the game horizontally
                this._centerCanvasDiv(gameWidth,gameHeight);
            }
        }

        // Handle device orientation
        this._handleOrientation(correctOrientation);

        // Now that we've resized the screen, recalculate the canvas position
        this._determineCanvasPosition();
    },

    /** @ignore */
    _determineViewportScale: function(gameWidth,gameHeight,screenWidth,screenHeight)
    {
        var scale = {x: 1, y: 1};
        scale.x = screenWidth/gameWidth;
        scale.y = screenHeight/gameHeight;

        // Round up to 3 decimal places on desktop for best accuracy, mobile rounds up to 2 places to avoid borders (PAN-464)
	    var round = (TGE.BrowserDetect.isMobileDevice && !(TGE.BrowserDetect.onAndroid && TGE.BrowserDetect.browser.toLowerCase()==="chrome")) ? 100 : 1000;
        scale.x = Math.ceil(scale.x*round)/round;
        scale.y = Math.ceil(scale.y*round)/round;

        var finalScale = 1;
        if(scale.x < scale.y)
        {
            finalScale = scale.x;
        }
        else
        {
            finalScale = scale.y;
        }

        // If it's close enough to 1:1 scale, prevent unnecessary scaling
        if(Math.abs(1-finalScale)<=0.01)
        {
            finalScale = 1;
        }

        return finalScale;
    },

	/** @ignore */
	_handleOrientation: function(correctOrientation)
	{
		if(this.mReorientationDiv!==null)
		{
			if(this._ignoreOrientation || !TGE.BrowserDetect.isMobileDevice || correctOrientation)
			{
				// Hide the reorientation div and show the game div
				this.mReorientationDiv.style.display = 'none';
				this.mCanvasDiv.style.display = 'block';

                // PAN-842 don't force the game into an active state if it's currently inactive due to being hidden.
                // We'll restrict this logic to only Snapchat for now...
                if(this._mSnapchatSession)
                {
                    if(!(document.hidden || document.mozHidden || document.msHidden || document.webkitHidden))
                    {
                        this._active(true);
                    }
                }
                else
                {
                    // The game is returning to an active state
                    this._active(true);
                }
			}
			else
			{
				// Hide the game div and show the reorientation div
				this.mCanvasDiv.style.display = 'none';
				this.mReorientationDiv.style.display = 'block';

				// The game is going into a deactivated state
				this._active(false);
			}
		}
	},

	/**
	 * Change the game state to active or deactivated and send corresponding events
	 * @ignore
	 */
	_active: function(active)
	{
		if(active===this._mActive)
		{
			// No change in state
			return;
		}

		this._mActive = active;

		// Fire an event so the game can do custom handling like creating/closing a pause screen, pausing or resuming audio
		if(this.stage)
		{
			this.stage.dispatchEvent({type: active ? "activate" : "deactivate"});
		}
	},

	/** @ignore */
	_onVisibilityChange: function(event)
	{
		TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "game visibility has changed");

		// We only care about deactivation events
		if(document.hidden || document.mozHidden || document.msHidden || document.webkitHidden)
		{
			this._onDeactivate();
		}
		else
		{
			this._onActivate();
		}
	},

    /** @ignore */
    _onDeactivate: function()
    {
	    TGE.Debug.Log(TGE.Debug.LOG_INFO, "game has been put in the background, killing audio and sending deactivate event...");

        // Clear the single-touch tracking (PAN-1426)
        this._mCurrentPointer = -1;

        // Update the internal active state and send a corresponding event to the scene
        this._active(false);

        // Force an audio mute
        if(this.audioManager && !this.audioManager.isMuted())
        {
	        this.audioManager.Mute();
	        this._mUnmuteOnActivate = true;
        }
    },

	/** @ignore */
	_onActivate: function()
	{
		TGE.Debug.Log(TGE.Debug.LOG_INFO, "game has been put to foreground, restoring audio and sending activate event...");

		// Clear the single-touch tracking (PAN-1426)
        this._mCurrentPointer = -1;

		// Update the internal active state and send a corresponding event to the scene
		this._active(true);

        // If we had a game viewable notification that we suppressed because we were inactive, fire it now
        if(this._mGameViewablePending)
        {
            this.gameMadeViewable();
        }

		// Un-mute the audio if we forced it off
		if(this.audioManager && this._mUnmuteOnActivate)
		{
			this.audioManager.Unmute();
			this._mUnmuteOnActivate = false;
		}
	},


    /** @ignore */
    _initializeRenderer: function(width,height)
    {
        this.stage = new TGE.Stage(this.mCanvasDiv,width,height);

         // PAN-574
        if (!this.audioManager.canPlayAudio())
        {
            this.audioManager._unlockAudioOnTouch();
        }

        document.dispatchEvent(new Event("tgeStageReady"));

	    if(TGE.StageReady)
	    {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"game is using deprecated TGE.StageReadyCallback, use TGE.Game.AddEventListener('tgeStageReady') instead");
		    TGE.StageReady.call();
	    }
    },

    /** @ignore */
    _beginLoad: function()
    {
        // PAN-658
        if(this.gameAsAd() && this._mCustomLoader===0)
        {
            // No loading screen or loading screen assets allowed in ad mode
            this._loadRequiredAssets();
        }
        else
        {
            // Load the assets required for the loading screen
            this.assetManager.loadAssetList("loading", null, this._loadRequiredAssets.bind(this));
        }
    },

    /** @ignore */
    _loadRequiredAssets: function()
    {
    	// If the game didn't set the loading order with registerAssetLists(), default to "required", "required2", etc.
	    if (!this.assetManager._mLoadingOrder.length)
	    {
		    for (var listNumber = 1 ; ; ++listNumber)
		    {
			    var listName = this.assetManager.getAssetListFromNumber(listNumber);
			    if (!this.assetManager._assetListExists(listName))
			    {
			    	break;
			    }
			    this.assetManager._mLoadingOrder.push(listName);
		    }
	    }

	    // If a loading screen has been defined, show it
        var updateCallback = null;

        // PAN-658 - in game-as-ad use a generic asset-less loading screen
        TGE.LoadingWindow = this.gameAsAd() && this._mCustomLoader===0 ? TGE.GenericLoadingWindow : (TGE.LoadingWindow || TGE.GenericLoadingWindow);

        if(TGE.LoadingWindow)
        {
            this.mLoadingScreen = new TGE.LoadingWindow(this.stage.width,this.stage.height).setup({});
	        this.mLoadingScreen.show(this.stage);
        }
        else
        {
            this.mLoadingScreen = this.showManagedScreen("loading");
        }

        if(this.mLoadingScreen!==null)
        {
            // Setup a callback so we can display the progress
            updateCallback = this._loadRequiredAssetsCallback.bind(this);
        }

        // Start the engine update loop now that we have stuff to draw
        this._update();

        // Kick off the loading
        this.assetManager.loadAssetList("required", updateCallback, this._finishedLoadingRequiredAssets.bind(this, 0));
    },

    /** @ignore */
    _loadRequiredAssetsCallback: function(percentComplete)
    {
        // If there is a loading screen, update it's progress
        if(this.mLoadingScreen!==null)
        {
            this.mLoadingScreen.handleEvent( {type:"progress",percentComplete:percentComplete} );
        }
    },

    /** @ignore */
    _logFinishedLoadingRequiredAssets: function (listName)
    {
        var logMessage = "Finished loading " + listName;
        var assetGroups = this.assetManager.getAssetGroupsFromList(listName);

        if (assetGroups.length)
        {
            logMessage += " groups: ";
            for (var i in assetGroups)
            {
                logMessage += assetGroups[i];

                if (i != assetGroups.length - 1)
                {
                    logMessage += ", "
                }
            }
        }

        TGE.Debug.Log(TGE.Debug.LOG_INFO, logMessage);
    },

	/** @ignore */
	_finishedLoadingRequiredAssets: function(listNumber)
	{
		var listName = this.assetManager._mLoadingOrder[listNumber];
		this._mAssetListLoaded[listName] = "loaded";

        this._logFinishedLoadingRequiredAssets(listName);

        // Special case for the primary asset list
        if(listNumber===0)
        {
            // Game is considered to be in a ready and user viewable state as soon as the first "required" asset list has loaded
            document.dispatchEvent(new Event("tgeGameReady"));

            // PAN-835 - if the game is not running in an MRAID ad container then the game viewable event will
            // never fire. In order to assist in testing TGE.GameViewableCallback features like impression tracking,
            // we'll make this callback fire now when MRAID isn't detected.
            if(!window.mraid && !window.dapi)
            {
                this.gameMadeViewable();
            }

            if(TGE.GameReadyCallback!==null)
            {
                TGE.Debug.Log(TGE.Debug.LOG_WARNING,"game is using deprecated TGE.GameReadyCallback, use TGE.Game.AddEventListener('tgeGameReady') instead");
                TGE.GameReadyCallback.call();
            }
            else
            {
                this._startGame();
            }
        }

        // Automatically start the next staggered asset lists
        var nextList = listNumber+1;
        if(nextList < this.assetManager._mLoadingOrder.length)
        {
            if(!this._mTestBuffering)
            {
                this._loadRequiredAssetList(nextList);
            }
        }
        else
        {
            // We're done
	        this.assetManager.allLoaded = true;

	        // see if we have a pending request for the list of loaded assets
	        if (this.assetManager._mLoadedAssetsCallback)
	        {
		        TGE.AssetManager.GetLoadedAssets(this.assetManager._mLoadedAssetsCallback);
	        }

	        document.dispatchEvent(new Event("tgeAssetListsLoaded"));

	        // Release the debugging responsive resize hack
            if (getQueryString()["tgedebug"]==="4")
            {
                // Apply a delay to releasing the debug resize mode to: a) attempt to overlap tweens applied to objects
                // upon creation, b) aggravate hacks that try to fix responsive issues simply by imposing slight delays.
                setTimeout(function() {
                    var game = TGE.Game.GetInstance();
                    game._mDebugResize = false;
                    game._onResize();
                }, (getQueryString()["debug_resize_delay"] ? parseInt(getQueryString()["debug_resize_delay"]) : 250));
            }

            if (this._mWaitingForAssets.length)
            {
            	var assetIds = "";
	            for (var i = 0; i < this._mWaitingForAssets.length; ++i)
	            {
	            	if (i)
		            {
		            	assetIds += ", ";
		            }
		            assetIds += this._mWaitingForAssets[i].id;
	            }
	            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "These assetAvailable() ids were not found in any asset list: " + assetIds);
            }
        }
	},

    /** @ignore */
    _loadRequiredAssetList: function(listNumber)
    {
	    var listName = this.assetManager._mLoadingOrder[listNumber];

        // Make sure we don't try loading a list that has already been told to load
        if(this._mAssetListLoaded[listName]==="loading" || this._mAssetListLoaded[listName]==="loaded")
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING,"attempted to load asset list "+listName+" more than once");
            return;
        }

        if(this.assetManager._assetListExists(listName))
        {
            TGE.Debug.Log(TGE.Debug.LOG_INFO,"loading asset list "+listName+"...");
            this._mAssetListLoaded[listName] = "loading";
            this.assetManager.loadAssetList(listName,null,this._finishedLoadingRequiredAssets.bind(this,listNumber));
        }
    },

    // Still need this because it's what TGL calls
    /** @deprecated */
    Launch: function(gameParameters)
    {
        this.launch(gameParameters);
    },

    // Still need this because it's what TGL calls
    /** @deprecated */
    IsPlatformAcceptable: function()
    {
        return true;
    },

    /** @ignore */
    _update: function()
    {
	    // PAN-527 If the game is halted, do NOTHING.
	    if(this.halt)
	    {
		    // Still need to continue the RAF loop...
		    requestAnimationFrame(this._update.bind(this));
		    return;
	    }

	    // Calculate the elapsed time since the last update
	    var elapsedTime = (this._mThisLoop = new Date) - this._mLastLoop;
	    this._mFrameTime += (elapsedTime - this._mFrameTime) / this._mFilterStrength;
	    this._mLastLoop = this._mThisLoop;

        if(this._mUpdateSkips>0)
        {
            if(this._mUpdateSkips-- > 0)
            {
	            requestAnimationFrame(this._update.bind(this));
	            return;
            }
        }
	    this._mUpdateSkips = this.slowMotion;

        // Hack - intentionally slow down the framerate for testing
        //var start = new Date().getTime();
        //var delay = 22;
        //while (new Date().getTime() < start + delay);

        // Update the frame rate display
        this._updateFPS();

        // Convert to seconds
        elapsedTime = elapsedTime / 1000;

        // PAN-657 - If there is a buffering screen up, check if we can remove it
        if(this._mBuffering)
        {
        	// These two flags get preset to false, but get set back to true if we detect additional callbacks, or add new ones
	        this._mBuffering = false;       // if callbacks still need to fire
	        this._mShowBuffering = false;   // if buffering screen needs to stay up

            for(var listName in this._mBufferingOccurrences)
            {
                var bo = this._mBufferingOccurrences[listName];

                // Account for test mode
                if(this._mTestBuffering == 1)
                {
                    bo.testTimer -= elapsedTime;
                }
                var testDone = this._mTestBuffering!=1 || bo.testTimer<=0;
                var status = this._mAssetListLoaded[listName];

                // If we're waiting on this list to load, make sure all previous required lists get loaded first
                if(status === "queued")
                {
                    var listNumber = this.assetManager._mLoadingOrder.indexOf(listName);
                    for (var i=1; i<=listNumber; i++)
                    {
                        var status2 = this._mAssetListLoaded[this.assetManager._mLoadingOrder[i]];
                        if (status2 === "queued")
                        {
                            this._loadRequiredAssetList(i);
                        }
                        // Stop checking for queued lists if one is already loading (only load one list at a time)
                        if (status2 === "loading")
                        {
                            break;
                        }
                    }
                }

                // Is this list done now?
                if(status!=="loaded" || !testDone)
                {
	                this._mBuffering = true;
	                this._mShowBuffering = this._mShowBuffering || bo.showBuffering;
                }
                else
                {
                    // This list is done, fire its callbacks
                    if(!bo.completeFired)
                    {
                        // Fire the buffering complete analytic event
                        if(!this._mTestBuffering && bo.showBuffering)
                        {
                            TGE.Analytics.CustomEvent("buffering_complete_" + listName);
                        }

                        // Fire any callbacks waiting on these assets
                        for(var c=0; c<bo.callbacks.length; c++)
                        {
                            bo.callbacks[c].call();
                        }
                        bo.completeFired = true;
                    }
                }
            }

            // If nothing is left buffering we can close the buffering window (if it's up)
            if(!this._mShowBuffering)
            {
                this._closeBufferingScreen();
            }
        }

        // Check the tick interval caps
        elapsedTime = Math.max(this.mMinTickTime, elapsedTime);
        elapsedTime = Math.min(this.mMaxTickTime, elapsedTime);

	    // PAN-645 - Ability to freeze game updates on user inactivity for Google ADX (probably broken since TGE won't get game viewable event in direct mode)
	    this._mAdInactivityTimer += (!this._mGameViewableReceived || this._mNumInteractions>0) ? 0 : elapsedTime;
	    var freezeSceneGraph = this._mNumInteractions===0 && this._mAdInactivityTimeLimit>0 && this._mAdInactivityTimer>=this._mAdInactivityTimeLimit;

        // Track the running game time
        if(this._mLaunchTime>0)
        {
            this.mGameTime += elapsedTime;
        }

	    if(!freezeSceneGraph)
	    {
            // UI objects need to be notified of mouse activity even when paused
		    this.stage._updateObjectMouseOverStates(this._mPointerX, this._mPointerY);

		    var updateEvent = { type:"update",elapsedTime:elapsedTime };

            // Make sure the update root is still valid
            if(!this._mUpdateRoot || this._mUpdateRoot.markedForRemoval() || this._mUpdateRoot.parent===null)
            {
                this._mUpdateRoot = this.stage;
            }
            this._mUpdateRoot.dispatchEvent(updateEvent);

            // If the ad header is active we have to make sure it gets an update event (PAN-745)
            if(TGE.AdHeader.GetInstance()!==null && this._mUpdateRoot!==this.stage)
            {
                TGE.AdHeader.GetInstance().dispatchEvent(updateEvent);
            }
	    }

        this.stage._emptyTrash();
	    this.stage._pruneListeners();

        // Do this before rendering - http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        requestAnimationFrame(this._update.bind(this));

        // Draw our renderable entities
        this.stage.draw();
    },

	/**
	 * Resets the scene and launches the first window in the game, as specified in the TGE.FirstGameWindow parameter.
     * @ignore
	 */
    _startGame: function()
    {
        TGE.Debug.Log(TGE.Debug.LOG_INFO,"starting game...");

        this._mLaunchTime = new Date().getTime();

        // Reset the scene
        this._resetGame();

        // If an onLoad function was setup, fire it now (deprecated)
        if(this.onLoad!==null)
        {
            this.onLoad.call(this);
        }

        // Tell the ad container that the initial load is complete and the game is starting
        if(window.TreSensa)
        {
            TreSensa.Playable.initialGameLoadComplete();
        }
        else if(window.TGL)
        {
            TGL.gameLaunched(); // (deprecated)
        }

        // Simulate ad header if specified
        if(this._mTestAdHeader===1)
        {
            TGE.AdHeader.Create(function(){alert("AD CLOSE")});
            TGE.AdHeader.ShowCountdown(5);
            setTimeout(function() {
                TGE.AdHeader.ShowClose();
            },5000);
        }
        else if (this._mTestAdHeader===2)
        {
            TGE.AdHeader.Create(function(){alert("AD CLOSE")});
            TGE.AdHeader.ShowCountdown(30);
            TGE.AdHeader.ShowRewardedPlayableOverlay();
            setTimeout(function() {
                TGE.AdHeader.ShowClose();
            },5000);
        }
    },

    /** @ignore */
    _resetGame: function()
    {
        // Clear the scene graph
        this.stage.removeChildren();

        // Launch the first window of the game
        if(TGE.FirstGameWindow)
        {
            var s = new TGE.FirstGameWindow(this.stage.width,this.stage.height);
            s.setup({});
            s.show(this.stage);
        }
    },

    _processMousePosition: function(x,y)
    {
        if(this.mCanvasPosition===null)
        {
            this._determineCanvasPosition();
        }

        this._mPointerX = x - this.mCanvasPosition.x;
        this._mPointerY = y - this.mCanvasPosition.y;

        this._mPointerX /= this._mViewportScale;
        this._mPointerY /= this._mViewportScale;
    },


    _preventBehavior: function(e)
    {
        // Do not trap native gestures on Snapchat
        if(!this._mSnapchatSession || this._mSnapchatImmersive)
        {
            e.stopPropagation();
            e.preventDefault();
        }
    },

    _handleMouseEvent: function(type, e)
    {
        var x,y;
        var num = e.changedTouches ? e.changedTouches.length : 0;
        for( ; ; )
        {
            if(--num >= 0)
            {
                // Touch
                x = e.changedTouches[num].clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                y = e.changedTouches[num].clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            else
            {
                // Mouse
                x = e.pageX;
                y = e.pageY;
            }

            var identifier = (e.changedTouches && num>=0) ? e.changedTouches[num].identifier : e.button;

            // If we aren't allowing multitouch, and this input doesn't match the current finger down, don't process it
            if(this.allowMultitouch || this._mCurrentPointer<0 || identifier===this._mCurrentPointer)
            {
                this._processMousePosition(x,y);
                this.stage._notifyObjectsOfMouseEvent(type,this._mPointerX,this._mPointerY,identifier);

                // Account for single touch filtering
                if(!this.allowMultitouch)
                {
                    if(type==="down" && this._mCurrentPointer<0)
                    {
                        this._mCurrentPointer = identifier;
                    }
                    else if(type==="up" && identifier===this._mCurrentPointer)
                    {
                        this._mCurrentPointer = -1;
                    }
                }
            }

            if(num <= 0)
            {
                break;
            }
        }

        this._preventBehavior(e);
    },

	_mouseDown: function(e)
	{
		// PAN-570
		this._interaction();

		// PAN-424
		window.focus();
		
		this._mPointerDown = true;
        this._handleMouseEvent("down", e);
    },

    _mouseUp: function(e)
    {
        this._mPointerDown = false;
        this._handleMouseEvent("up", e);
    },

    _mouseMove: function(e)
    {
        this._handleMouseEvent("move", e);
    },

    _keyDown: function(e)
    {
    	if (!this.blockTGEKeys)
	    {
		    // PAN-570
		    this._interaction();

		    this._mKeysDown[e.keyCode] = true;

		    // Notify stage objects of key events
		    this.stage._notifyObjectsOfKeyEvent("keydown", e.keyCode);
	    }

	    // PAN-410, 436, 475
	    if(this.blockBrowserKeys && [8, 32, 37, 38, 39, 40].indexOf(e.keyCode) > -1)
	    {
		    e.preventDefault();
	    }
    },


    _keyUp: function(e)
    {
	    if (!this.blockTGEKeys)
	    {
		    this._mKeysDown[e.keyCode] = false;

		    // Notify stage objects of key events
		    this.stage._notifyObjectsOfKeyEvent("keyup", e.keyCode);
	    }

	    // PAN-410, 436, 475
	    if(this.blockBrowserKeys && [8, 32, 37, 38, 39, 40].indexOf(e.keyCode) > -1)
	    {
		    e.preventDefault();
	    }
    },

	/**
	 * Indicates whether or not the key associated with the specified ASCII code is currently being held in the down state.
	 * @param {Number} keyCode And ASCII key code.
	 * @returns {Boolean} Whether or not the key specified is currently in the down state.
	 */
    isKeyDown: function(keyCode)
    {
        return this._mKeysDown[keyCode]===true;
    },

	/** @ignore */
	_interaction: function()
	{
        this._mNumInteractions++;

        // For tracking inactivity
        this._mLastInteraction = new Date().getTime();

        // For firing primary engagement
		if(this._mNumInteractions===1)
		{
			// Send an event to our own scenegraph
			this.stage.dispatchEvent({type:"engagement",name:"primary"});

			TGE.Events.logInteraction();
		}
	}
}


/**
 * Constant: Javascript character code for left arrow (37).
 * @constant
 */
TGE.KEY_ARROW_LEFT = 37;

/**
 * Constant: Javascript character code for right arrow (39).
 * @constant
 */
TGE.KEY_ARROW_RIGHT = 39;

/**
 * Constant: Javascript character code for up arrow (38).
 * @constant
 */
TGE.KEY_ARROW_UP = 38;

/**
 *Constant: Javascript character code for down arrow (40).
 */
TGE.KEY_ARROW_DOWN = 40;

/**
 * Constant: Javascript character code for space bar (32).
 * @constant
 */
TGE.KEY_SPACEBAR = 32;

/** @ignore */
TGE.TestCPIRequirements = function(returnType)
{
    TGE.Debug.Log(TGE.Debug.LOG_WARNING,"TGE.TestCPIRequirements is deprecated, use TGE.TestPlayableAdRequirements instead.");
}

/** @ignore */
TGE.TestPlayableAdRequirements = function(returnType)
{
    // To do the asset footprint test we need to be running on a webserver and with the trackassets=1 flag set
    if(!TGE.AssetManager.TrackAssets || document.location.protocol==="file:")
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR,"TestPlayableAdRequirements can only be run from a webserver and with the trackassets querystring parameter set, tgedebug=3, or TGE.AssetManager.TrackAssets set to true in code.");
        return;
    }

    if(window.console)
    {
        var game = TGE.Game.GetInstance();
        var pass = true;
        var warnings = false;
        var errors = [];
        var consoleFunc = typeof returnType === "undefined" ? function(s,c) {console.log(s, c);} : function(s,c) {};

        consoleFunc("","");
        consoleFunc("%cTEST RESULTS FOR PLAYABLE AD REQUIREMENTS:", "font-weight: bold");
        consoleFunc("","");

        var colors = {
            pass: "#00aa00",
            warn: "#f69c00",
            fail: "#ff0000"
        };

        var conclusion = {
            pass: "pass",
            fail: "fail",
            warn: "warn"
        };

        var testResponsiveLayout = function ()
        {
            var result = {};
            if (game.resizeCanvasToFit)
            {
                result.message = "#1 Responsive Layout: PASS (note this does not guarantee layouts are visually acceptable across all screen sizes)";;
                result.conclusion = conclusion.pass;
            }
            else
            {
                result.message = "#1 Responsive Layout: FAIL";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testTotalFootprint = function ()
        {
            var result = {};
            var totalFootprint = Math.round ( game.assetManager.totalAssetFootprint(true) / 1024 );

            if(totalFootprint < 200)
            {
                result.message = "#2 Asset Footprint: PASS (" + totalFootprint + " KB)";
                result.conclusion = conclusion.pass;
            }
            else if (totalFootprint === 200)
            {
                result.message = "#2 Asset Footprint: PASS with warning (" + totalFootprint + " KB)";
                result.conciseMessage = "Asset Footprint: WARNING ("+totalFootprint+" KB)";
                result.conclusion = conclusion.warn;
            }
            else
            {
                result.message = "#2 Asset Footprint: FAIL (" + totalFootprint + " KB)";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testInitialLoadImages = function ()
        {
            var result = {};
            var maxInitialLoadImages = 3;
            var numInitialLoadImages = game.assetManager.totalImagesLoadedBeforeStart();

            if(numInitialLoadImages <= maxInitialLoadImages)
            {
                result.message = "#3 Initial Load Image Count: PASS (" + numInitialLoadImages + " images, max " + maxInitialLoadImages + ")";
                result.conclusion = conclusion.pass;
            }
            else
            {
                result.message = "#3 Initial Load Image Count: FAIL (" + numInitialLoadImages + " images, max " + maxInitialLoadImages + ")";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testProgressiveLoadImages = function ()
        {
            var result = {};
            var maxProgressiveLoadImages = 8;
            var numProgressiveLoadImages = game.assetManager.totalImagesLoadedAfterStart();

            if(numProgressiveLoadImages <= maxProgressiveLoadImages)
            {
                result.message = "#4 Progressive Load Image Count: PASS (" + numProgressiveLoadImages + " images, max " + maxProgressiveLoadImages + ")";
                result.conclusion = conclusion.pass;
            }
            else
            {
                result.message = "#4 Progressive Load Image Count: FAIL (" + numProgressiveLoadImages + " images, max " + maxProgressiveLoadImages + ")";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testInitialLoadFonts = function ()
        {
            var result = {};
            var maxInitialLoadFonts = 1;
            var numInitialLoadFonts = game.assetManager.totalFontsLoadedBeforeStart();

            if(numInitialLoadFonts <= maxInitialLoadFonts)
            {
                result.message = "#5 Initial Load Font Count: PASS (" + numInitialLoadFonts + " fonts, max " + maxInitialLoadFonts + ")"
                result.conclusion = conclusion.pass;
            }
            else
            {
                result.message = "#5 Initial Load Font Count: FAIL (" + numInitialLoadFonts + " fonts, max " + maxInitialLoadFonts + ")";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testProgressiveLoadFonts = function ()
        {
            var result = {};
            var maxProgressiveLoadFonts = 1;
            var numProgressiveLoadFonts = game.assetManager.totalFontsLoadedAfterStart();

            if(numProgressiveLoadFonts <= maxProgressiveLoadFonts)
            {
                result.message = "#6 Progressive Load Font Count: PASS (" + numProgressiveLoadFonts + " fonts, max " + maxProgressiveLoadFonts + ")";
                result.conclusion = conclusion.pass;
            }
            else
            {
                result.message = "#6 Progressive Load Font Count: FAIL (" + numProgressiveLoadFonts + " fonts, max " + maxProgressiveLoadFonts + ")";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testImageDimensions = function ()
        {
            var result = {};
            var largestDimension = game.assetManager.largestImageDimension();

            if(largestDimension <= 1024)
            {
                result.message = "#7 Image Dimension Cap: PASS";
                result.conclusion = conclusion.pass;
            }
            else
            {
                result.message = "#7 Image Dimension Cap: FAIL (an image exists that has width/height greater than 1024px)";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testSecondaryEngagement = function ()
        {
            var result = {};

            // Use TGE.Events.engagements if it is active, with a fall-back to TGS since old games still call old TGS engagement functions
			// NOTE: In the pre-engagement period, numEngagements will end up -1, since both TGE.Events.engagements and TGS version will return 0 (and we -1 from the latter)
	        var numEngagements = TGE.Events.engagements || (TGS.Analytics.engagementLevel && TGS.Analytics.engagementLevel()-1);
            if (game._mNumInteractions === 0 || numEngagements >= 1)
            {
                result.message = ("#8 Secondary Engagement: PASS " + (game._mNumInteractions === 0 ? "(not required yet)" : "(event was fired)"));
                result.conclusion = conclusion.pass;
            }
            else if (game._mNumInteractions <= 2 && numEngagements < 1)
            {
                result.message = "#8 WARNING: Secondary engagement event has not been fired yet";
                result.conclusion = conclusion.warn;
            }
            else
            {
                result.message = "#8 FAIL: Secondary engagement event has not been fired";
                result.conclusion = conclusion.fail;
            }
            return result;
        };

        var testCustomCloseButton = function ()
        {
            var result = {};
            var isCustomCloseRequired = Object.keys(TGE.AdHeader._sCustomSettings).length !== 0;

            if (isCustomCloseRequired)
            {
                var customCloseImage = game.assetManager.getAsset(TGE.AdHeader._sCustomSettings.closeImage, false);
                if (customCloseImage)
                {
                    result.message = "#9 Custom Close Button: PASS (asset was loaded)";
                    result.conclusion = conclusion.pass;
                }
                else
                {
                    result.message = "#9 Custom Close Button: FAIL (custom close image not loaded)";
                    result.conclusion = conclusion.fail;
                }
            }
            else
            {
                result.message = "#9 Custom Close Button: PASS (asset not required)";
                result.conclusion = conclusion.pass;
            }
            return result;
        };

        var checkFontLoader = function ()
        {
            var result = {};

            if (game._mLaunchTime > 0 && window.GameConfig && GameConfig.TGE.FONT_LOADER && TGE.AssetManager._sTotalFonts === 0)
            {
                result.message = "WARNING: No fonts have been loaded but FONT_LOADER is true";
                result.conclusion = conclusion.warn;
            }
            return result;
        };

        var testTinyPng = function ()
        {
            var result = {};
            var assetsOver = TGE.AssetManager._sTotalAssetsOverFootprintLimit;

            if (assetsOver > 0)
            {
                result.message = "WARNING: " + assetsOver + " image" + (assetsOver > 1 ? "s" : "") + " over 400KB.  Check if all images are getting TinyPNGed.";
                result.conclusion = conclusion.warn;
            }

            return result;
        };

        var testRequirement = function (requirementFunc)
        {
            var result = requirementFunc();
            if (result.message)
            {
                consoleFunc("%c" + result.message, "color: " + colors[result.conclusion]);
            }
            if (typeof(result.conclusion) === "string" && result.conclusion !== conclusion.pass)
            {
                pass = false;
                if (result.conciseMessage)
                {
                    errors.push(result.conciseMessage);
                }
                else if (result.message)
                {
                    var messageWithoutNumbering = result.message.replace(/^#[0-9]+\s+(.*)/, '$1');
                    errors.push(messageWithoutNumbering);
                }
            }
            if (result.conclusion === conclusion.warn)
            {
                warnings = true;
            }
        };

        var tests = [
            testResponsiveLayout,
            testTotalFootprint,
            testInitialLoadImages,
            testProgressiveLoadImages,
            testInitialLoadFonts,
            testProgressiveLoadFonts,
            testImageDimensions,
            testSecondaryEngagement,
            testCustomCloseButton,
            checkFontLoader,
            testTinyPng,
            // Add more here
        ];

        // TEST ALL REQUIREMENTS!
        for (var i = 0; i < tests.length; i++)
        {
            testRequirement(tests[i]);
        }

        consoleFunc("","");

        if(!pass)
        {
            consoleFunc("%cThis game does not meet Playable Ad Technical Requirements and is NOT production ready!", "color: " + colors.fail + "; font-weight: bold");
            consoleFunc("","");
        }

        if(returnType==="errors")
        {
            return errors;
        }
        else if(returnType==="code")
        {
            return pass ? (warnings ? 2 : 1) : 0;
        }
        else
        {
            return pass ? "PASS" : "FAIL";
        }
    }
}

/**
 * TGE.Completion should be called when the game reaches an end state that is typically associated with the game being finished and accompanied by the option to click-through.
 * @param {String} reason The reason parameter is used in analytics calls to indicate what triggered the completion state. For example, reason could be either "won" or "lost" on an end game screen.
 */
TGE.Completion = function(reason)
{
    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGE.Completion is deprecated, use TGE.Analytics.Completion");
    TGE.Analytics.Completion(reason);
}

/** @ignore */
TGE._DefaultTimeBetweenClicks = 3;

/** @ignore */
TGE._ReadyForNextClick = {};

/**
 * Executes a click through to a url.
 * @param {String} name to be associated with this click through event.
 * @param {String} url to be opened.
 * @param {Number} optional,  delay before another click through is allowed to go through, default is 3 seconds.
 */
TGE.Game.Clickthrough = function (name, url, timeBeforeNextClick)
{
	// Validate the required parameters
	if (!name || (!url && name!=="default"))
	{
		TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.Game.Clickthrough requires name and URL parameters");
		return;
	}
	
    // Don't execute click through if click through with same name just happened
    if (TGE._ReadyForNextClick[name] === false)
    {
        return;
    }

    // Disable click throughs with that name for a set number of seconds
    TGE._ReadyForNextClick[name] = false;
    timeBeforeNextClick = (typeof(timeBeforeNextClick) === "number" ? timeBeforeNextClick : TGE._DefaultTimeBetweenClicks);
    var enableClicks = function () { TGE._ReadyForNextClick[name] = true };
    setTimeout(enableClicks, timeBeforeNextClick * 1000);

    if (typeof(url)==="object")
    {
        var campaignID = TGE.Game.GetInstance().getCampaignID();

        if (typeof(url[campaignID])==="string")
        {
            url = url[campaignID];
        }
        else if (typeof(url["default"])==="string")
        {
            url = url["default"];
        }
        else
        {
            return;
        }
    }
    else if (typeof(url)==="string")
    {
        // Autopopulate [timestamp] macros
        var timestamp = Math.round(new Date().getTime()/1000);
        url = url.replace("=[timestamp]", "=" + timestamp);
    }

    TGE.Events.doClickthrough.call(TGE.Events, name, url);
}

/**
 * Redirects the user to the appstore. No arguments required, the appropriate store landing page is determined by the click-through server.
 */
TGE.Game.AppstoreClickthrough = function()
{
    TGE.Game.Clickthrough("default");
}

/**
 * Returns the data stored at the specified key. Returns null if no data was found or storage is unavailable. Uses localStorage when available on session platform.
 * @param {String} key The key the data is stored under.
 */
TGE.GetFromStorage = function(key)
{
    try
    {
        return getDistributionPartner()==="B0153" ? null : window["local"+"Storage"].getItem(key);
    }
    catch(e) 
    {
        return null;
    }
}

/**
 * Stores the provided data string under the key specified. Uses localStorage when available on session platform.
 * @param {String} key The key to store the data under.
 * @param {String} value The value to store at the specified key.
 */
TGE.SetInStorage = function(key,value)
{
    try
    {
        return getDistributionPartner()==="B0153" ? null : window["local"+"Storage"].setItem(key,value);
    }
    catch(e) {}
}

/**
 * Documented in the constructor property list
 * @ignore
 */
Object.defineProperty(TGE.Game.prototype, 'resizeCanvasToFit', {
    get: function()
    {
        return this._mResizeCanvasToFit;
    },

    set: function(flag)
    {
        // Do not allow responsive layouts if the game is set to banner ad display mode
        this._mResizeCanvasToFit = this._mPreviewMode===1 ? false : flag;
    }
});



// *****************************************************************************************
// Below are stubs for removed features, kept for backwards compatibility

/** @ignore */
TGE.RedirectUser = TGE.ClickThrough = function(name, url, timeBeforeNextClick)
{
    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGE.ClickThrough and TGE.RedirectUser are deprecated, use TGE.Game.Clickthrough");
    TGE.Game.Clickthrough(name, url, timeBeforeNextClick);
}

/** @ignore */
TGE.GameState = {
    PROMO: "promo",
    GAME: "game",
    TUTORIAL: "tutorial",
    _mState: getQueryString ()[ "state" ],
    RegisterStates: function () {},
    GetInstance: function () {return TGE.GameState},
    GetState: function () {return TGE.GameState._mState}
};