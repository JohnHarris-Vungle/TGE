/**
 * TGE.Tracking is used to track and call tracking URLs for game events.
 * Events that can be tracked include impression, interaction, engagement, completion (when the promoscreen appears), and clickthrough.
 * Custom events can also be tracked.
 * @class
 * @constructor
 */
TGE.Tracking = function()
{
    // Do we already have an instance?
    if(TGE.Tracking._sTrackingInstance!==null)
    {
        return TGE.Tracking._sTrackingInstance;
    }
    TGE.Tracking._sTrackingInstance = this;

    // Read in any tracking URLs that are handed in via the ad container. Only use this if the ad container
    // tracking code doesn't exist.
    if(window.TreSensa && !TreSensa.Playable.fireTrackingUrls)
    {
        var trackingUrls = TreSensa.Playable.getSetting("trackingUrls");
        if(trackingUrls)
        {
            try
            {
                for(var i=0; i<trackingUrls.length; i++)
                {
                    var trackingUrl = trackingUrls[i];
                    switch (trackingUrl.eventType)
                    {
                        case "GAMEVIEWABLE":
                            TGE.Tracking.FireOnImpression(trackingUrl.url);
                            break;
                        case "INTERACTION":
                            TGE.Tracking.FireOnInteraction(trackingUrl.url);
                            break;
                        case "ENGAGEMENT":
                            TGE.Tracking.FireOnEngagement(trackingUrl.url);
                            break;
                        case "COMPLETION":
                            TGE.Tracking.FireOnCompletion(trackingUrl.url);
                            break;
                        case "CLICK":
                            TGE.Tracking.FireOnClickThrough(trackingUrl.label, trackingUrl.url);
                            break;
                        case "CUSTOM":
                            TGE.Tracking.FireOnCustomEvent(trackingUrl.label, trackingUrl.url);
                            break;
                    }
                }
            }
            catch(e)
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "tracking URLs could not be parsed: " + e);
            }
        }
    }

    // Enable the deprecation warning now that we've processed the tracking URLs passed in by the ad container.
    TGE.Tracking._sDeprecationEnabled = true;

    return this;
}

/** @ignore */
TGE.Tracking._sTrackingInstance = null;
TGE.Tracking._sDeprecationEnabled = false;

/** @ignore */
TGE.Tracking._sfireOnImpressionUrls = [];
TGE.Tracking._sfireOnInteractionUrls = [];
TGE.Tracking._sfireOnEngagementUrls = [];
TGE.Tracking._sfireOnCompletionUrls = [];
TGE.Tracking._sfireOnClickThroughUrls = [];
TGE.Tracking._sfireOnCustomEventUrls = [];

/** @ignore */
TGE.Tracking._sEventsFired = {};

/** @ignore */
TGE.Tracking._sSupportedMacroFormats = [
    {open:"{", close:"}"},
    {open:"[", close:"]"}
];

/** @ignore */
TGE.Tracking.DeprecationEnabled = function()
{
    if(TGE.Tracking._sDeprecationEnabled)
    {
        TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGE.Tracking URLs can no longer be set in game code");
    }

    return TGE.Tracking._sDeprecationEnabled;
}

/**
 * Stores the specified url (or campaignID url bundle) so that it can be called later when the Impression event happens.
 * @param {String} url The url or campaignID url bundle that should be called when the Impression event happens.
 */
TGE.Tracking.FireOnGameViewable = function(url)
{
    if(!TGE.Tracking.DeprecationEnabled() && (typeof(url)==="string" || typeof(url)==="object"))
    {
        TGE.Tracking._sfireOnImpressionUrls.push(url);
    }
}

// "impression" isn't the correct term here, as the best we can do from the client is fire on game viewable. However we'll
// need to retain this reference to firing on impression for backwards compatibility.
/** @deprecated */
TGE.Tracking.FireOnImpression = TGE.Tracking.FireOnGameViewable;

/**
 * Stores the specified url (or campaignID url bundle) so that it can be called later when the Interaction event happens.
 * @param {String} url The url or campaignID url bundle that should be called when the Interaction event happens.
 */
TGE.Tracking.FireOnInteraction = function(url)
{
    if(!TGE.Tracking.DeprecationEnabled() && (typeof(url)==="string" || typeof(url)==="object"))
    {
        TGE.Tracking._sfireOnInteractionUrls.push(url);
    }
}

/**
 * Stores the specified url (or campaignID url bundle) so that it can be called later when the Engagement event happens.
 * @param {String} url The url or campaignID url bundle that should be called when the Engagement event happens.
 */
TGE.Tracking.FireOnEngagement = function(url)
{
    if(!TGE.Tracking.DeprecationEnabled() && (typeof(url)==="string" || typeof(url)==="object"))
    {
        TGE.Tracking._sfireOnEngagementUrls.push(url);
    }
}

/**
 * Stores the specified url (or campaignID url bundle) so that it can be called later when the Completion event happens. Completion event happens on TGE.PromoScreen appear.
 * @param {String} url The url or campaignID url bundle that should be called when the Completion event happens.
 */
TGE.Tracking.FireOnCompletion = function (url)
{
    if(!TGE.Tracking.DeprecationEnabled() && (typeof(url)==="string" || typeof(url)==="object"))
    {
        TGE.Tracking._sfireOnCompletionUrls.push(url);
    }
}

/**
 * Stores the specified url (or campaignID url bundle) so that it can be called later when the ClickThrough event happens.
 * @param {String} name The name of the clickthrough event that TGE.Tracking should wait for before calling the specified tracking url.
 * @param {String} url The url or campaignID url bundle that should be called when the ClickThrough event happens.
 */
TGE.Tracking.FireOnClickThrough = function(name, url)
{
    if(!TGE.Tracking.DeprecationEnabled() && (typeof(name)==="string" && (typeof(url)==="string" || typeof(url)==="object")))
    {
        if (!TGE.Tracking._sfireOnClickThroughUrls[name])
        {
            TGE.Tracking._sfireOnClickThroughUrls[name] = [];
        }

        TGE.Tracking._sfireOnClickThroughUrls[name].push(url);
    }
}

/**
 * Stores the specified url (or campaignID url bundle) so that it can be called later when the specified Custom event happens.
 * @param {String} name The name of the custom event that TGE.Tracking should wait for before calling the specified tracking url.
 * @param {String} url The url or campaignID url bundle that should be called when the specified Custom event happens.
 */
TGE.Tracking.FireOnCustomEvent = function(name, url)
{
    if(!TGE.Tracking.DeprecationEnabled() && (typeof(name)==="string" && (typeof(url)==="string" || typeof(url)==="object")))
    {
        if (!TGE.Tracking._sfireOnCustomEventUrls[name])
        {
            TGE.Tracking._sfireOnCustomEventUrls[name] = [];
        }

        TGE.Tracking._sfireOnCustomEventUrls[name].push(url);
    }
}

TGE.Tracking.prototype =
{
    /**
	 * Function that TGS calls every time a TGS event is triggered.  Also can be (and is) called from within TGE for certain events that aren't funneled through TGS (like impression and clickthrough).
     * @param {String} category The event category. Ex. engagement, custom, etc.
	 * @param {String} name The event name. Ex. primary, secondary, etc.
     * @param {String} value The event value. Can be used for custom events to pass in things like level number.
     */
    trackEvent: function(category, name)
    {
        // See if the tracking URL code is active in the ad container. If so, we're not going to use TGE.Tracking.
        if (window.TreSensa && TreSensa.Playable.fireTrackingUrls)
        {
            return;
        }

        var eventKey = category + (name ? (" " + name) : "");

        // Have we already fired tracking for this event?
        if(TGE.Tracking._sEventsFired[eventKey]===true)
        {
            return;
        }

        switch (category)
        {
            case "impression":
                this._onImpression();
                break;

            case "engagement":
                if (name==="primary")
                {
                    this._onInteraction();
                }
                else if (name==="secondary")
                {
                    this._onEngagement();
                }
                break;

            case "custom":
                this._onCustomEvent(name);
                break;

            case "completion":
                this._onCompletion();
                break;

            case "clickthru":
                this._onClickThrough(name);
                break;
        }

        // Track that we fired these so we don't fire them again
        TGE.Tracking._sEventsFired[eventKey] = true;
    },

    /** @ignore */
    _onImpression: function()
    {
        this._fireTrackingUrls(TGE.Tracking._sfireOnImpressionUrls);
    },

    /** @ignore */
    _onInteraction: function()
    {
        this._fireTrackingUrls(TGE.Tracking._sfireOnInteractionUrls);
    },

    /** @ignore */
    _onEngagement: function()
    {
        this._fireTrackingUrls(TGE.Tracking._sfireOnEngagementUrls);
    },

    /** @ignore */
    _onCustomEvent: function(name)
    {
        this._fireTrackingUrls(TGE.Tracking._sfireOnCustomEventUrls[name]);
    },

    /** @ignore */
    _onCompletion: function () {
        this._fireTrackingUrls(TGE.Tracking._sfireOnCompletionUrls);
    },

    /** @ignore */
    _onClickThrough: function(name)
    {
        this._fireTrackingUrls(TGE.Tracking._sfireOnClickThroughUrls[name]);
    },

    /** @ignore */
    _fireTrackingUrls: function(urlsArray)
    {
        // I don't love that urlsArray can be undefined coming from _onClickThrough or _onCustomEvent, but Javascript doesn't complain...
        for (var i in urlsArray)
        {
            var url = urlsArray[i];
            if (typeof(url)==="string")
            {
                this._fireTrackingUrl(url);
            }
            else if (typeof(url)==="object")
            {
                var campaignID = TGE.Game.GetInstance().getCampaignID();

                if (campaignID && typeof(url[campaignID])==="string")
                {
                    this._fireTrackingUrl(url[campaignID]);
                }
                else if (typeof(url["default"])==="string")
                {
                    this._fireTrackingUrl(url["default"]);
                }
            }
        }
    },

    /** @ignore */
    _fireTrackingUrl: function (url)
    {
        var timestamp = Math.round(new Date().getTime()/1000);

        // Auto-insert our user ID (ADID) macro in DCM tags if it wasn't already done
        url = url.replace("dc_rdid=;", "dc_rdid={USER_ID};");

        // Now expand our supported macros

        // DST
        if(this._macroPresent(url, "DST"))
        {
            url = this._expandMacro(url, "DST", getDistributionPartner());
        }

        // SSP
        if(this._macroPresent(url, "SSP"))
        {
            var ssp = window.TreSensa ? (TreSensa.Playable.supplySidePlatform ? TreSensa.Playable.supplySidePlatform : "") : "";
            url = this._expandMacro(url, "SSP", ssp);
        }

        // PUBLISHER_BUNDLE_ID
        if(this._macroPresent(url, "PUBLISHER_BUNDLE_ID"))
        {
            var pid = window.TreSensa ? (TreSensa.Playable.publisherBundleID ? TreSensa.Playable.publisherBundleID : "") : "";
            url = this._expandMacro(url, "PUBLISHER_BUNDLE_ID", pid);
        }

        // USER_ID
        if(this._macroPresent(url, "USER_ID"))
        {
            var uid = window.TreSensa ? (TreSensa.Playable.userID ? TreSensa.Playable.userID : "") : "";
            url = this._expandMacro(url, "USER_ID", uid);
        }

        // USER_AGENT
        if(this._macroPresent(url, "USER_AGENT"))
        {
            url = this._expandMacro(url, "USER_AGENT", encodeURIComponent(navigator.userAgent));
        }

        // CREATIVE_ID
        if(this._macroPresent(url, "CREATIVE_ID"))
        {
            url = this._expandMacro(url, "CREATIVE_ID", window._TRESETTINGS ? _TRESETTINGS.gameId : "");
        }

        // CACHEBUSTER
        if(this._macroPresent(url, "CACHEBUSTER") || this._macroPresent(url, "TIMESTAMP"))
        {
            url = this._expandMacro(url, "CACHEBUSTER", timestamp);
            url = this._expandMacro(url, "TIMESTAMP", timestamp);
        }

        // Basic test to determine whether this is a javascript tracking tag or an actual pixel
        var isJavascriptUrl = url.indexOf('.js') !== -1;

        isJavascriptUrl ? this._fireJavascriptUrl(url) : this._firePixel(url);
    },

    /** @ignore */
    _macroPresent: function (url, macro)
    {
        var found = false;
        TGE.Tracking._sSupportedMacroFormats.forEach(function(format) {
            if(url.toLowerCase().indexOf(format.open + macro.toLowerCase() + format.close) !== -1)
            {
                found = true;
            }
        });

        return found;
    },

    /** @ignore */
    _expandMacro: function (url, macro, value)
    {
        TGE.Tracking._sSupportedMacroFormats.forEach(function(format) {
            var regex = new RegExp("\\" + format.open + macro + "\\" + format.close, "ig");
            url = url.replace(regex, value);
        });

        return url;
    },

    /** @ignore */
    _fireJavascriptUrl: function (url)
    {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    },

    /** @ignore */
    _firePixel: function (url)
    {
        (new Image()).src = url;
    }
}
