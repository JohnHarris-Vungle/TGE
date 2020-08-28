// Don't document this class, ideally devs should be using the static TGE.Analytics wrappers.
/** @ignore */
TGE.Events =
{
    debugMode: true,
    engagements: 0,
    countedEvents: {},
    customEventWarnings: {},

    _notifyAdContainer: function()
    {
        return typeof(window.TreSensa)!=="undefined";
    },

    logInteraction: function()
    {
        TGE.Debug.Log(TGE.Debug.LOG_INFO, "first user interaction");

        // TreSensa event
        if (this._notifyAdContainer())
        {
            TreSensa.Playable.interaction();
        }

        // Hack to deal with the fact that at least one game (Bud Light 2018) was relying on TGS.Analytics.engagementTime
        if(window.TGS)
        {
            TGS.Analytics.engagementTime = new Date().getTime();
        }        
    },

    logEngagement: function()
    {
        this.engagements++;

        // (cap to one here to avoid a flood of warnings - deal with this better later)
        if (this.engagements===1)
        {
            TGE.Debug.Log(TGE.Debug.LOG_INFO, "user engagement event triggered");

            // TreSensa event
            if (this._notifyAdContainer())
            {
                TreSensa.Playable.engagement();
            }
        }
    },

    logCompletion: function(reason)
    {
        if (!reason)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "completion events require a reason parameter");
            
            // We will let this pass through, as missing completion events can be damaging to performance analysis
            reason = "unknown";
            //return;
        }
        
        TGE.Debug.Log(TGE.Debug.LOG_INFO, "completion event triggered, reason is: " + reason);
        
        var game = TGE.Game.GetInstance();

        game._mCompletionCount++;

        // TreSensa event
        if (this._notifyAdContainer())
        {
            TreSensa.Playable.promoScreenShown(reason);
        }
    },

    logReplay: function()
    {
        TGE.Debug.Log(TGE.Debug.LOG_INFO, "replay event triggered");

        // TreSensa event
        this._sendAdContainerEvent("replay", {});
    },

    logCustomEvent: function(name, mixpanelParam)
    {
        if (!name || name.length > 50)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "custom events require a name parameter of 50 or fewer characters");
            return;
        }

        if (name==="replay")
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "do not log replay as a custom event, use TGE.Analytics.Replay instead");
        }

        // For reducing the number of events generated for high-frequency game actions, only send after each 'interval' occurrences
	    if (this.countedEvents.hasOwnProperty(name))
	    {
		    var countedEvent = this.countedEvents[name];
		    if (++countedEvent.counted % countedEvent.interval !== 0)
            {
			    return;
		    }
	    }

	    // We no longer support Mixpanel so output a warning for any subparameters that are defined
        if (this.customEventWarnings[name]!==true && typeof(mixpanelParam)!=="undefined")
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "sub-parameters are no longer supported on custom events: " + name);
            this.customEventWarnings[name] = true;
        }

	    TGE.Debug.Log(TGE.Debug.LOG_INFO, "custom event triggered: " + name);

        // TreSensa event
        this._sendAdContainerEvent("custom", {
            name: name
        });
    },

	setEventInterval: function (name, interval) {
		var ce = this.countedEvents[name];
		interval = interval || (ce && ce.interval) || 1;
		this.countedEvents[name] = {interval: interval, counted: 0};
	},

    logVideoProgress: function(progress)
    {
        var validProgress = [0,25,50,75,100];
        if (validProgress.indexOf(progress) === -1 )
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "video progress events must specify progress of either 0, 25, 50, 75, or 100");
            return;
        }

        TGE.Debug.Log(TGE.Debug.LOG_INFO, "video progress: " + progress + "%");

        // TreSensa event
        this._sendAdContainerEvent("video", {
            progress: progress
        });
    },

    doClickthrough: function(label, url)
    {
        if (window.TreSensa)
        {
            // Send the click to the ad container
            TreSensa.Playable.clickthrough(label, url);
        }
        else
        {
            // Do the redirect here in the uncommon situations where there is no ad container
            if(window.mraid)
            {
                window.mraid.open(url);
            }
            else
            {
                window.open(url,"_blank");
            }
        }
    },

    doAppstoreClickthrough: function()
    {
        this.doClickthrough("default");
    },

    _sendAdContainerEvent: function(name, params) 
    {
        // TreSensa analytics
        if (this._notifyAdContainer())
        {
            TreSensa.Playable.logEvent(name, params);
        }
    }
}


// Static wrappers

/** @ignore */
TGE.Analytics = {};

/** @ignore */
TGE.Analytics.Interaction = function()
{
    // There's a couple of games firing this for some reason, but they shouldn't be
    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "games should not be calling TGE.Analytics.Interaction");
}

/**
 * Make this call when a user first definitively engages with a game.
 */
TGE.Analytics.Engagement = function()
{
    TGE.Events.logEngagement.call(TGE.Events);
}

 /**
  * Make this call when the user reaches a state of completion in the game. Note this does mean that a user cannot continue further, 
  * for instance by proceeding to a subsequent level, or replaying the original experience.
  * @param {String} reason A one word description of why the completion state was reached, ie: won, lost, finished. This is required.
  */
TGE.Analytics.Completion = function(reason)
{
    TGE.Events.logCompletion.call(TGE.Events, reason);
}

/**
 * Make this call when a user chooses to replay the game within the same session.
 */
TGE.Analytics.Replay = function()
{
    TGE.Events.logReplay.call(TGE.Events);
}

/**
 * Make this call when a user triggers a custom event in the game that needs to be tracked in analytics.
 * @param {String} name A label for the custom event. Required, and must be 50 characters or less.
 * @param {String} [mixpanelParam] Optional parameter, no longer supported. Using it will produce a warning.
 */
TGE.Analytics.CustomEvent = function(name, mixpanelParam)
{
    // Note that the mixpanelParam is deprecated and only maintained for backwards compatibility
    TGE.Events.logCustomEvent.call(TGE.Events, name, mixpanelParam);
}

/**
 * Sets how oftn a counted event fires.
 * This will automatically set subsequent calls to logCustomEvent to increment a counter.
 * The event will only fire when the counter reaches the specified interval.
 * @param name
 * @param [interval] if not specified, it will reset to the previously-defined value
 */
TGE.Analytics.SetEventInterval = function(name, interval)
{
	TGE.Events.setEventInterval(name, interval);
}

/** @ignore */
TGE.Analytics.VideoProgress = function(progress)
{
    TGE.Events.logVideoProgress.call(TGE.Events, progress);
}