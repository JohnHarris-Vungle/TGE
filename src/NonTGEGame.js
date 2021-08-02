/**
 * A substitute for TGE.Game, containing the remote settings functionality, and minimal stubs for other components.
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

    // Document div's
    this.mCanvasDiv = null;

    // Ensure that GameConfig and GameConfig.REMOTE_SETTINGS exist
    window.GameConfig = window.GameConfig || {};
    GameConfig.REMOTE_SETTINGS = GameConfig.REMOTE_SETTINGS || {};

    // PAN-1594 dump raw initial settings if tgedebug=6
    if (getQueryString()["tgedebug"]==="6")
    {
        this._printRemoteSettings();
    }

    // Initialize remote settings before AudioManager
    this._initializeRemoteSettings();

    //
    // Operations normally in BuilderGame to initialize the CB BuilderConfig
    //

    // Add CreativeBuilder settings from BuilderConfig
    if (window.BuilderConfig)
    {
        for (var key in BuilderConfig)
        {
            GameConfig[key] = TGE.DeepClone(BuilderConfig[key]);
        }
    }

    if (window.__isLocal && window._selfServe && (!getQueryString()["reset"] || getQueryString()["reset"] === "false"))
    {
        // when running locally, GameConfig changes are persisted to localStorage, so we need to load them from there
        _selfServe.loadLocalGameConfig();
    }

    // ensure existence of ELX_DEFS and TEXT_DEFS
    GameConfig.ELX_DEFS = GameConfig.ELX_DEFS || {};
    GameConfig.TEXT_DEFS = GameConfig.TEXT_DEFS || {};
}

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

TGE.Game.prototype = {
    _startGame: function() {

    },

    // stub for assetManager
    assetManager: {
        Get: function () { return null }
    },

    // stub for AudioManager
    audioManager: {
        pluginType: function () {
            return "NoAudio";
        },
        _mPlugin: {
            mute: function() {
            }
        },
        mute: function() {
        }
    }
};

/**
 * Track all the event listeners so we can do a remove all
 * @ignore
 */
TGE.Game._sEventListeners = {};

/**
 * Adds the specified TGE specific event listener function to the list of event listeners for the specified event type.
 * Internally the document object is used as the event target. Recognized types are tgeGameReady, tgeGameViewable, tgeStageReady, and tgeAssetListsLoaded.
 * @param {String} type A string representing the event type to listen for.
 * @param {Function} listener A Javascript function which receives a notification when an event of the specified type occurs.
 */
TGE.Game.AddEventListener = function(type, listener)
{
    document.addEventListener(type, listener);

    // Track it
    if (!TGE.Game._sEventListeners[type])
    {
        TGE.Game._sEventListeners[type] = [];
    }
    TGE.Game._sEventListeners[type].push(listener);

    // Check if any of them need to be fired right away
    switch (type)
    {
        case "tgeGameReady":
        case "tgeGameViewable":
        case "tgeStageReady":
            listener.call();
            break;

        case "tgeAssetListsLoaded":
            setTimeout(function() {
                listener.call();
            }, 1000);
            break;
    }
}

/**
 * Removes from the event target (document) an event listener previously registered with TGE.Game.AddEventListener().
 * @param {String} type A string which specifies the type of event for which to remove an event.
 * @param {Function} listener The event listener function of the event handler to remove from the event target.
 */
TGE.Game.RemoveEventListener = function(type, listener)
{
    // Sometimes undefined gets passed in by sloppy game code
    if (!listener)
    {
        return;
    }

    document.removeEventListener(type, listener);

    // Remove it from our tracked list
    var listeners = TGE.Game._sEventListeners[type];
    if (listeners)
    {
        var lStr = listener.toString();
        for (var i=0; i<listeners.length; i++)
        {
            if (listeners[i].toString() ===  lStr)
            {
                listeners.splice(i, 1);
                return;
            }
        }
    }
}

/**
 * Clears all listeners for all TGE global events (tgeGameReady, tgeStageReady, tgeGameViewable, etc.)
 */
TGE.Game.RemoveAllListeners = function()
{
    // Remove all the tracked listeners
    for (var type in TGE.Game._sEventListeners) {
        TGE.Game._sEventListeners[type].forEach(function(listener) {
            document.removeEventListener(type, listener);
        });
    }

    TGE.Game._sEventListeners = {};
}

TGE.AdFooter = {
    __sInstance: null,
    GetInstance: function () {
        return TGE.AdFooter.__sInstance;
    }
}
