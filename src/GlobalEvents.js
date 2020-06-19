/**
 * The optional TGE.GameReadyCallback callback, if set, will defer starting the game when all required assets are finished
 * loading and instead fire this callback function. If this callback is set, you must manually call TGE.Game.GetInstance().StartGame()
 * to launch the game, as it will no longer happen automatically.
 * @deprecated
 */
TGE.GameReadyCallback = null;

/**
 * The optional TGE.GameViewableCallback callback, if set, will fire the specified callback function when the ad container
 * indicates that the game is in a user viewable state.
 * @deprecated
 */
TGE.GameViewableCallback = null;

/**
 * The optional TGE.SessionEndedCallback callback, if set, will fire the specified callback function when the ad container
 * indicates that the game session has been ended. This could be from a user closing an ad, clicking out of the ad, or the
 * container believing that the session has been abandoned. The callback will contain a single argument which is a true or
 * false value indicating whether the session was considered abandoned.
 * @deprecated
 */
TGE.SessionEndedCallback = null;

/**
 * The optional TGE.StageReady callback, if set, will call the specified function as soon as the game's TGE.GameStage instance is created.
 * @deprecated
 */
TGE.StageReady = null;

/**
 * @ignore Track all the event listeners so we can do a remove all
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
    var game = TGE.Game.GetInstance();
    if(type==="tgeGameReady" && game._mAssetListLoaded["required"]==="loaded")
    {
        listener.call();
    }
    else if(type==="tgeGameViewable" && game._mGameViewableReceived)
    {
        listener.call();
    }
    else if(type==="tgeStageReady" && game.stage)
    {
        listener.call();
    }
    else if(type==="tgeAssetListsLoaded" && game.assetManager.allLoaded)
    {
        listener.call();
    }
    else if(type==="tresensaSessionEnded" && window.TreSensa && TreSensa.Playable.sessionEnded)
    {
        listener.call();
    }
}

/**
 * Removes from the event target (document) an event listener previously registered with TGE.Game.AddEventListener().
 * @param {String} type A string which specifies the type of event for which to remove an event.
 * @param {Function} listener The event listener function of the event handler to remove from the event target.
 */
TGE.Game.RemoveEventListener = function(type, listener)
{
    document.removeEventListener(type, listener);

    // Remove it from our tracked list
    var listeners = TGE.Game._sEventListeners[type];
    var lStr = listener.toString();
    for (var i=0; listeners && i<listeners.length; i++)
    {
        if (listeners[i].toString() ===  lStr)
        {
            listeners.splice(i, 1);
            return;
        }
    };
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