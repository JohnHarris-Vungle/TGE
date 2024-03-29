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
    if(window.TGS && !TGS.Analytics)
    {
        TGE.SetupTGSProxy();
    }

    // Document div's
	this.mCanvasDiv = null;

    // Loading & Assets
    this.mLoadingScreen = null;
    this._mAssetListLoaded = {};
    this._mWaitingForAssets = [];
    this._mBuffering = false;
	this._mShowBuffering = false;
	this._mBufferingScreen = null;
    this._mBufferingOccurrences = {};

	// User engagement for playable ad games
    this._mNumInteractions = 0;
    this._mLastInteraction = new Date().getTime();
	this._mGameViewableReceived = false;
	this._mAdInactivityTimeLimit = 0;
	this._mAdInactivityTimer = 0;
    this._mCompletionCount = 0;

    // Final game score (if applicable)
    this._mFinalScore = null;

    // Ensure that GameConfig and GameConfig.REMOTE_SETTINGS exist
	window.GameConfig = window.GameConfig || {};
	GameConfig.REMOTE_SETTINGS = GameConfig.REMOTE_SETTINGS || {};

    // Deal with deprecated TGS.Languages supported languages array (but only if languages haven't already been define in GameConfig)
    if(window.TGS && TGS.Language.SupportedLanguages && !GameConfig.REMOTE_SETTINGS["lang"])
    {
        // We have to create a remote setting that specifies a "lang" setting with this list as the available options
        GameConfig.REMOTE_SETTINGS["lang"] = {
            type: "string", 
            default: "en", 
            options: TGS.Language.SupportedLanguages
        };
    }

    // PAN-1594 dump raw initial settings if tgedebug=6
    if (getQueryString()["tgedebug"]==="6")
    {
        this._printRemoteSettings();
    }

    // Initialize remote settings before AudioManager
    this._initializeRemoteSettings();

    this.stage = null; // The public game stage
    this._mFullStage = null; // The private true stage
    this.assetManager = new TGE.AssetManager();
	if (TGE.AudioManager) this.audioManager = new TGE.AudioManager(this.assetManager);

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

	this._mActive = {       // tracks the different causes for TGE to be in an active/inactive state
	    running: true,      // pause/resume
        activated: true,    // activate/deactivate
	    panel: true         // AdFooter panel
    };
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
    this._mTestGameViewable = parseInt(queryParams["testgameviewable"]) || 0;
    this._mPoliteLoadingLevel = parseInt(queryParams["politeload"]) || 0;
    this._mPoliteLoadCallback = null;
    this._mPortraitGame = null; // Determined on first viewport resize

    // Determine the desired language
    this.setLanguage(this.preferredLanguage());
}

/**
 * The TGE.LoadingWindow static variable defines the window that will be used during the initial asset loading phase.
 * The TGE.LoadingWindow must be a subclass of TGE.Window. If no value is set, no loading screen will be displayed.
 * @constant
 * @ignore
 */
TGE.LoadingWindow = null;

/**
 * The TGE.FirstGameWindow static variable defines the window that will be launched once the initial asset loading phase is complete.
 * The TGE.FirstGameWindow must be a subclass of TGE.Window. This would typically be the first view in the game, however during
 * development it could be set to launch directly a different screen to facilitate development.
 * @constant
 */
TGE.FirstGameWindow = null;

/**
 * Used to specify an optional parameter into the game viewable/visible event. The most common use case for this would be for
 * indicating a level parameter when the game can start with different/random levels.
 * @constant
 * @ignore
 */
TGE.GameViewableParameter = null;

/**
 * @constant {number} Time window for detecting a down/up mouse event sequence on the same object as a "click"
 * @ignore
 */
TGE.CLICK_TIME = 1;

/**
 * Distance threshold for detecting a "click" event, the up/down events must be within this distance
 * @constant {number} percentage of the stage major axis
 * @ignore
 */
TGE.CLICK_DISTANCE_FRACTION = 0.025;

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
 * @ignore
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
 * Returns whether the game is viewable to the user
 * (versus still in pre-fetch)
 * @return {Boolean} game viewable state
 */
TGE.Game.IsViewable = function()
{
    return TGE.Game.GetInstance()._mGameViewableReceived;
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
		game._mFullStage._mCanvas.style.display = on ? "none" : "block";

		// Block the scenegraph from doing any processing at all
		game.halt = on;
	}
}


TGE.Game.prototype =
{
	halt: false,
    _mPauseObject: null,
    _mViewportScale: 1,

	/**
	 * Sets the desired language to be used by the asset manager and TGE.Text class for localized content.
	 * @param {String} lang A two-character ISO-639-1 language code.
	 */
	setLanguage: function(lang)
	{
	    TGE.RemoteSettings.GetSettings()["lang"].value = lang;

	    // Deprecated, but we're keeping this around just in case an old game references it
        TGE.Text.Language = lang;
	},

    /**
     * Returns the language code that TGE is using to try and fulfill any language specific text or assets.
     * @returns {String} A two-character ISO-639-1 language code.
     */
    getLanguage: function()
    {
        return TGE.RemoteSettings("lang");
    },

    /**
     * Enabling polite loading will limit the number of asset lists that are loaded before a user interaction. A value
     * of 1 will allow one asset list to load before waiting for interaction, 2 will allow two lists to load, etc.
     * Setting to a value of zero (0) will disable polite loading and allow all asset lists to load without interaction,
     * and setting a value of -1 will disable polite loading permanently (subsequent setPoliteLoading calls will be ignored).
     * @param {Number} level A number indicating how aggressive the polite loading should be.
     */
    setPoliteLoading: function(level)
    {
        // If the polite loading level was set to -1, this means it can never be enabled
        if (this._mPoliteLoadingLevel !== -1)
        {
            this._mPoliteLoadingLevel = level;
        }
    },

    /**
     * Sets the final score achieved by the player in the game.
     * @param {Number} score The score achieved by the player at the end of the game.
     */
    setFinalScore: function(score)
    {
        this._mFinalScore = score;
    },

    /**
     * Retrives the final score achieved by the player in the game (if applicable).
     * @returns {null|Number} The final score achieved by the player, or null if none was set.
     */
    getFinalScore: function()
    {
        // If a score hasn't been formally set, see if we can find it in the PromoBuilder
        if (this._mFinalScore === null && window.PromoBuilder && PromoBuilder._sInstance &&
            typeof PromoBuilder._sInstance.score === "number")
        {
            return PromoBuilder._sInstance.score;
        }

        return this._mFinalScore;
    },

    pause: function()
    {
        if (this._mPauseObject)
        {
            // Already paused
            return;
        }

        // Create an invisible update root that will suspend all game updates and video playback, and cover the screen
        // to absorb any user input.
        this._mPauseObject = this._mFullStage.addChild(new TGE.DisplayObject().setup({
            layout: "match",
            mouseEnabled: true
        }));
        this._mPauseObject.previousUpdateRoot = TGE.Game.GetUpdateRoot();
        TGE.Game.SetUpdateRoot(this._mPauseObject);

        this._active("running", false);
    },

    resume: function()
    {
        if (!this._mPauseObject)
        {
            // We're not paused
            return;
        }

        // Restore the previous update root and remove the temporary pause object
        TGE.Game.SetUpdateRoot(this._mPauseObject.previousUpdateRoot);
        this._mPauseObject.markForRemoval();
        this._mPauseObject = null;

        this._active("running", true);
    },

    /**
     * Waits until the specified asset list has finished loading. In the event that the asset list is not ready,
     * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
     * @param {String} listName Specifies which asset list to check for completion.
     * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
     * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
     * @returns {Boolean} Whether or not the specified asset list has completed loading.
     * @deprecated
     * @ignore
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
     * @ignore
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
    	if (id)
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
	    }
    	else
	    {
		    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "attempting to check for a  null asset id");
	    	return "required";
	    }
    },

	/** @ignore */
    _showBufferingScreen: function()
    {
        if(this._mBufferingScreen)
        {
            return;
        }

        // If polite loading has paused, resume it
        this._checkOnPoliteLoading();

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
    	// PAN-1508 return 0 if there have been no interactions, and otherwise ensure a >0 result
        return this._mNumInteractions ? Math.max(Number.MIN_VALUE, ((new Date().getTime())-this._mLastInteraction)/1000) : 0;
    },

    /**
     * Provides information about video assets, such as keyframe locations, audio, recommended sizes, etc.
     * Games will override this function to provide that info, as needed.
     * @returns {Object} An object where the keys are video asset IDs, and each entry is an object with corresponding video info
     */
    getVideoInfo: function()
    {
        var ret = {};
        var keyframes = this.getVideoKeyframes();
        for (var id in keyframes)
        {
            ret[id] = {keyframes: keyframes[id]}
        }
        return ret;
    },

    /**
     * @deprecated - use getVideoInfo
     */
    getVideoKeyframes: function()
    {
        return {};
    },

    /**
     * Launching point for the entire game. Calling this function will initialize the game environment and begin downloading required assets.
     * @param {Object} gameParameters Information about how the game should be setup.
     * @param {String} gameParameters.gameDiv ID of the game canvas div element.
     * @param {Number} [gameParameters.width] An optional parameter to specify the desired width of the game canvas. If unspecified, the current gameDiv dimensions will be used.
     * @param {Number} [gameParameters.height] An optional parameter to specify the desired height of the game canvas. If unspecified, the current gameDiv dimensions will be used.
     * @return {Boolean} False if the game canvas could not be found.
     */
    launch: function(gameParameters)
    {
		// Read in the setup parameters
        var gameDiv = typeof gameParameters.gameDiv === "string" ? gameParameters.gameDiv : null;
        var width = typeof gameParameters.width === "number" ? gameParameters.width : -1;
        var height = typeof gameParameters.height === "number" ? gameParameters.height : -1;
        var initialWidth = typeof gameParameters.initialWidth === "number" ? parseInt(gameParameters.initialWidth) : -1;
        var initialHeight = typeof gameParameters.initialHeight === "number" ? parseInt(gameParameters.initialHeight) : -1;

        // Check if there's a request to simulate a banner size
        var simulateBanner = getQueryString()["simulateBanner"];
        switch(simulateBanner)
        {
            case "mrec":    width = 300; height = 250;
                break;
        }

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
        var tgedebug = getQueryString()["tgedebug"];
	    if(tgedebug && tgedebug !== 5)
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
				    str += (game._mFullStage ? game._mFullStage.numChildren(true) : 0) + " scene objects<br>" +
					    (game._mFullStage ? game._mFullStage.numVisibleObjects() : 0) + " visible objects<br>" +
					    (game._mFullStage ? game._mFullStage.numDrawnObjects() : 0) + " drawn objects<br>" +
					    (game._mFullStage ? game._mFullStage._mUpdateGroup.length : 0) + " updating objects<br>";

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
	    if(!window.TreSensa)
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

        // Begin the asset loading process. First we set the asset manager's root location. This is passed in
        // by the ad container as it is platform dependent. Also note the concept of image vs audio roots is
        // deprecated. This was only necessary years back for native packaging on CocoonJS.
        this.assetManager._setRootLocation(gameParameters.imageRoot);
        this._beginLoad();

        return true;
    },

    /** @ignore */
    gameMadeViewable: function()
    {
        if(!this._mGameViewableReceived)
        {
            this._mGameViewableReceived = true;

            document.dispatchEvent(new Event("tgeGameViewable"));

            // Fire the callback if one was set
            if(TGE.GameViewableCallback)
            {
                TGE.Debug.Log(TGE.Debug.LOG_WARNING,"game is using deprecated TGE.GameViewableCallback, use TGE.Game.AddEventListener('tgeGameViewable') instead");
                TGE.GameViewableCallback.call();
            }

            // Some platforms don't have a valid viewport size until the ad is viewable
            if(window.applovinMraid || this._mSnapchatSession)
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
        var supportedLanguages = TGE.RemoteSettings.GetSettings()["lang"].options || [];
        if(supportedLanguages.indexOf(firstPick) !== -1)
        {
            res = firstPick;
        }
        else if(supportedLanguages.indexOf(coreLang) !== -1)
        {
            res = coreLang;
        }
        else
        {
            res = TGE.RemoteSettings("lang");
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

        // Applovin (note that even outside the Applovin DST we could still be in an Applovin container (ie: Lifestreet)
        if(window.applovinMraid && applovinMraid.getMaxSize)
        {
            return applovinMraid.getMaxSize().width;
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

        if (dst==="B0119") { return document.body.clientWidth; }
        // JH: window.innerWidth/Height was returning bad values on Chrome iOS 10.3.2 (a mix of portrait innerWidth and landscape innerHeight)
        if (window.innerWidth && !TGE.BrowserDetect.oniOS) { return window.innerWidth; }
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

        // Applovin (note that even outside the Applovin DST we could still be in an Applovin container (ie: Lifestreet)
        if(window.applovinMraid && applovinMraid.getMaxSize)
        {
            return applovinMraid.getMaxSize().height;
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
        
        if (dst==="B0119") { return document.body.clientHeight; }
        if (window.innerWidth && !TGE.BrowserDetect.oniOS) { return window.innerHeight; }
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
        // Some platforms work better using the MRAID sized changed event. The new dimensions aren't always
        // available until this is fired.
        if(window.applovinMraid || getDistributionPartner()==="B0099" || getDistributionPartner()==="B0159")
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

	    if(!this._mFullStage)
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
        paddingTop = isNaN(paddingTop) ? 0 : parseInt(paddingTop);

        var gameWidth = this._mFullStage._mOriginalWidth;
        var gameHeight = this._mFullStage._mOriginalHeight;
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

	    // Do we want the canvas to be resized to fill the entire available viewport?
	    if(this._mResizeCanvasToFit)
	    {
		    var oldGameWidth = gameWidth;
		    var oldGameHeight = gameHeight;

		    var maxWidth = TGE.BrowserDetect.isMobileDevice ? Number.MAX_VALUE : this.desktopMaxCanvasWidth;
		    var minWidth = 0;
		    var maxHeight = TGE.BrowserDetect.isMobileDevice ? Number.MAX_VALUE : this.desktopMaxCanvasHeight;
		    var minHeight = 0;

		    var pixelRatio = window.devicePixelRatio || 1;
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
            // We used to check for 736 here (a common iPhone height), but found that on MoPub/iPhone X it was reduced to 734 which caused a massive canvas and problems when it was scaled
            // down to fit. So lowering this to 700 to be safe.
            else if(TGE.BrowserDetect.isMobileDevice && (screenWidth>=700 || screenHeight>=700))
		    {
                TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "clamping large screen game size...");

			    // These magic sizes (640 and 1024) are not science, they were eyeballed on iPhone 6 Plus when it first came out,
                // and seemed to be optimal to maintain performance and not degrade quality more than necessary.
			    if(gameWidth<gameHeight)
			    {
				    gameHeight = Math.round(gameHeight * 640/gameWidth);
				    gameWidth = 640;
			    }
			    else
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
			    if(this._mFullStage)
			    {
                    // See if there is a preferred orientation, and lock to it if necessary
                    var preferredOrientation = TGE.RemoteSettings("orientationLock");
                    var currentOrientation = screenHeight < screenWidth ? "landscape" : "portrait";

                    // Do we need to lock to the opposite orientation?
                    this._mFullStage.forceOrientationLock(preferredOrientation !== "responsive"
                        && currentOrientation !== preferredOrientation);

                    // Calling this function on the full stage will automatically dispatch a resize event
                    this._mFullStage.setSize(gameWidth,gameHeight);
			    }
		    }
            else
            {
                TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "no change in game size detected");
            }

			this._mDivResized = true;
	    }
	    else
        {
            // PAN-1603 make sure _ResizeEvent has correct w/h (since we're not calling setSize above)
            if (TGE._ResizeEvent.width !== this._mFullStage.width || TGE._ResizeEvent.height !== this._mFullStage.height)
            {
                this._mFullStage.dispatchResize();
            }
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
            if(this._mResizeCanvasToFit || this.scaleToFitOnDesktop)
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

	/**
	 * Change the game state to active or deactivated and send corresponding events
     * @param {String} type
     * @param {Boolean} active
     * @ignore
     */
	_active: function(type, active)
	{
	    var prevActive = this._isActive();
        this._mActive[type] = active;

		if(prevActive === this._isActive())
		{
			// No change in state
			return;
		}

        // Clear the single-touch tracking (PAN-1426)
        this._mCurrentPointer = -1;

        if (active)
        {
            // Resume any audio
            this.audioManager.resume();
        }
        else
        {
            // Pause any audio
            this.audioManager.pause();
        }

        // Fire an event so the game can do custom handling like creating/closing a pause screen
		if(this._mFullStage)
		{
			this._mFullStage.dispatchEvent({type: active ? "activate" : "deactivate"});
		}
	},

    _isActive: function()
    {
        for (var key in this._mActive)
        {
            if (!this._mActive[key])
            {
                return false;
            }
        }
        return true;
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

        // Update the internal active state and send a corresponding event to the scene
        this._active("activated", false);
    },

	/** @ignore */
	_onActivate: function()
	{
		TGE.Debug.Log(TGE.Debug.LOG_INFO, "game has been put to foreground, restoring audio and sending activate event...");

		// Update the internal active state and send a corresponding event to the scene
		this._active("activated", true);
	},


    /** @ignore */
    _initializeRenderer: function(width,height)
    {
        // Create the full stage object
        this._mFullStage = new TGE.FullStage(this.mCanvasDiv,width,height);

        // Set the public stage object that games treat as the root stage (can be a subset of the full stage)
        this.stage = this._mFullStage.gameStage;

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
        TGE.Debug.Log(TGE.Debug.LOG_INFO, "Finished loading " + listName);
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

            var inAdContainer = window.TreSensa && TreSensa.Playable.sessionID;
            if(this._mTestGameViewable > 0)
            {
                if(inAdContainer)
                {
                    TGE.Debug.Log(TGE.Debug.LOG_ERROR, "the testgameviewable parameter is not supported in production");
                }
                else
                {
                    setTimeout(this.gameMadeViewable.bind(this), this._mTestGameViewable * 1000);
                }
            }
            // Outside of the ad container environment we can safely signal viewability now, as we'll never get
            // notification from the ad container.
            else if(!inAdContainer)
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
            var nextLoad = this._loadRequiredAssetList.bind(this, nextList);

            if (this._mPoliteLoadingLevel > 0 && this._mNumInteractions === 0 &&
                nextList === this._mPoliteLoadingLevel)
            {
                TGE.Debug.Log(TGE.Debug.LOG_INFO,"waiting for user interaction before loading more assets");
                this._mPoliteLoadCallback = nextLoad;
                return;
            }

            if(!this._mTestBuffering)
            {
                nextLoad.call();
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

    /** @ignore */
    _update: function()
    {
	    // PAN-527 If the game is halted, do NOTHING.
	    if (this.halt)
	    {
		    // Still need to continue the RAF loop...
		    requestAnimationFrame(this._update.bind(this));
		    return;
	    }

	    // Calculate the elapsed time since the last update
	    var elapsedTime = (this._mThisLoop = new Date().getTime()) - this._mLastLoop;
	    this._mFrameTime += (elapsedTime - this._mFrameTime) / this._mFilterStrength;
	    this._mLastLoop = this._mThisLoop;

	    if (this._mUpdateSkips < 0)
	    {
	    	// used for video recording, and allows for deferring the _doUpdate() call until after the video frame is ready
	    	return;
	    }

	    if (this._mUpdateSkips > 0)
	    {
		    if (this._mUpdateSkips-- > 0)
		    {
			    requestAnimationFrame(this._update.bind(this));
			    return;
		    }
	    }
	    this._mUpdateSkips = this.slowMotion;
	    this._doUpdate(elapsedTime);
    },

	_doUpdate: function(elapsedTime)
	{
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
            // UI objects need to be notified of mouse activity even when paused, but not while buffering
		    if (!this._mBufferingScreen)
		    {
			    this._mFullStage._updateObjectMouseOverStates(this._mPointerX, this._mPointerY);
		    }

		    var updateEvent = { type:"update",elapsedTime:elapsedTime };

            // Make sure the update root is still valid
            if(!this._mUpdateRoot || this._mUpdateRoot.markedForRemoval() || this._mUpdateRoot.parent===null)
            {
                // The default update root will be the game stage (TGE.GameStage) as opposed to _mFullStage (TGE.FullStage).
                // Games need the ability to inspect and change the update root, and to them the game stage is the root
                // of the scene graph. The update is dispatched from the full stage anyways, and it will account for its
                // own existence (and descendents) there.
                this._mUpdateRoot = this.stage;
            }
            this._mFullStage.dispatchUpdate(updateEvent, this._mUpdateRoot);
	    }

        this._mFullStage._emptyTrash();
	    this._mFullStage._pruneListeners();

        // Do this before rendering - http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        requestAnimationFrame(this._update.bind(this));

        // Draw our renderable entities
        this._mFullStage.draw();
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
        this._mPointerX = x;
        this._mPointerY = y;

        // If our orientation lock is active, we need to adjust the stage-relative mouse position so that
        // it isn't relative to the true stage, but instead the rotated game stage.
        if (TGE.GameStage._sOrientationLock.active)
        {
            var lockObj = TGE.GameStage._sOrientationLock;
            if (lockObj.gameHeight < lockObj.gameWidth)
            {
                // Game is locked to landscape
                this._mPointerX = y;
                this._mPointerY = lockObj.gameHeight * this._mViewportScale - x;
            }
            else
            {
                // Game is locked to portrait
                this._mPointerX = lockObj.gameWidth * this._mViewportScale - y;
                this._mPointerY = x;
            }
        }

        this._mPointerX /= this._mViewportScale;
        this._mPointerY /= this._mViewportScale;
    },


    _preventBehavior: function(e)
    {
        e.stopPropagation();
        e.preventDefault();
    },

    _handleMouseEvent: function(type, e)
    {
        var x,y;
        var num = e.changedTouches ? e.changedTouches.length : 0;
        for( ; ; )
        {
            var rect = e.target.getBoundingClientRect();
            if(--num >= 0)
            {
                // Touch
                x = e.changedTouches[num].clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                y = e.changedTouches[num].clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            else
            {
                // Mouse
                x = e.clientX;
                y = e.clientY;
            }

            x -= rect.left;
            y -= rect.top;

            var identifier = (e.changedTouches && num>=0) ? e.changedTouches[num].identifier : e.button;

            // If we aren't allowing multitouch, and this input doesn't match the current finger down, don't process it
            if(this.allowMultitouch || this._mCurrentPointer<0 || identifier===this._mCurrentPointer)
            {
                this._processMousePosition(x,y);
                this._mFullStage._notifyObjectsOfMouseEvent(type,this._mPointerX,this._mPointerY,identifier);

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
		    this._mFullStage._notifyObjectsOfKeyEvent("keydown", e.keyCode);
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
		    this._mFullStage._notifyObjectsOfKeyEvent("keyup", e.keyCode);
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
			// Send an event to our own scenegraph (likely deprecated)
			this._mFullStage.dispatchEvent({type:"engagement",name:"primary"});

			TGE.Events.logInteraction();

			// If polite loading has paused, resume it
            this._checkOnPoliteLoading();
		}
	},

    /** @ignore */
    _checkOnPoliteLoading: function()
    {
        if (this._mPoliteLoadCallback)
        {
            TGE.Debug.Log(TGE.Debug.LOG_INFO,"resuming asset loading...");
            this._mPoliteLoadCallback.call();
            this._mPoliteLoadCallback = null;
        }
    }
}


/**
 * @member
 * @constant
 * Javascript character code for left arrow (37).
 */
TGE.KEY_ARROW_LEFT = 37;

/**
 * @member
 * Javascript character code for right arrow (39).
 */
TGE.KEY_ARROW_RIGHT = 39;

/**
 * Javascript character code for up arrow (38).
 */
TGE.KEY_ARROW_UP = 38;

/**
 * Javascript character code for down arrow (40).
 */
TGE.KEY_ARROW_DOWN = 40;

/**
 * Javascript character code for space bar (32).
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
 * @deprecated Use TGE.Analytics.Completion(reason)
 * @ignore
 */
TGE.Completion = function(reason)
{
    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGE.Completion is deprecated, use TGE.Analytics.Completion");
    TGE.Analytics.Completion(reason);
}

/** @ignore */
TGE._DefaultTimeBetweenClicks = 1;

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