/** @ignore */
TGE.Mixpanel = 
{
    initialized: false,
    
    initialize: function()
    {
        window.mixpanel = 
        {
            _sharedProps: {
                $browser: TGE.BrowserDetect.browser,
                $current_url: location.href,
                $os: TGE.BrowserDetect.platform,
                $screen_height: screen.height,
                $screen_width: screen.width,
                mp_lib: "tresensa",
                $lib_version: "tresensa-1.0"
            },
            
            init: function(token)
            {
                this._sharedProps.token = token;
                try 
                {
                    // HAVE TO DEAL WITH THESE LOCAL STORAGE REFERENCES!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

                    this._sharedProps.distinct_id = (window.localStorage && window.localStorage.getItem("tresensa_mpid")) || generateUuid(),
                    window.localStorage && window.localStorage.setItem("tresensa_mpid", this._sharedProps.distinct_id);
                } 
                catch (e)
                {
                    this._sharedProps.distinct_id = generateUuid();
                }
            },

            get_distinct_id: function()
            {
                return this._sharedProps.distinct_id;
            },
            
            register_once: function(props)
            {
                merge(this._sharedProps, props);
            },
            
            register: function(props)
            {
                merge(this._sharedProps, props);
            },
            
            track: function(eventName, props)
            {
                // Don't send events to Mixpanel if the ad container thinks the session has ended
                if(window.TreSensa && window.TreSensa.Playable.sessionEnded)
                {
                    TGE.Debug.Log(TGE.Debug.LOG_INFO,"session considered finished, blocking Mixpanel event: " + eventName);
                    return;
                }

                TGE.Debug.Log(TGE.Debug.LOG_INFO, "Mixpanel event: " + eventName + ", props: " + JSON.stringify(props));

                var mpData = {
                    event: eventName,
                    properties: merge({}, this._sharedProps, props)
                };

                var pipe = "https://mixpanel.tresensa.com";
                var url = pipe + "/track/?ip=1&image=1&data=" + window.btoa(JSON.stringify(mpData));
                (new Image()).src = url;

                TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "mixpanel.track: ", JSON.stringify(mpData));
            }
        };

        // If the ad container is present we should use that as the source of the Mixpanel token. If no token is present it
        // should be assumed that Mixpanel analytics are to be disabled.
        var token = window.GameConfig && window.GameConfig.MixPanel ? GameConfig.MixPanel.TOKEN : "";
        if(window.TreSensa)
        {
            token = TreSensa.Playable.getSetting("mpToken");
            if(typeof(token)!="string" || token.length==0)
            {
                TGE.Debug.Log(TGE.Debug.LOG_INFO,"no Mixpanel token");
                return;
            }
        }

        window.mixpanel.init(token);

        // Included with all events, but only saves first value
        mixpanel.register_once({
            "Acquisition Source": getDistributionPartner()
        });

        var querystring = getQueryString();

        // Make a guesstimate at the iOS device
        var iOSDevice = "";
        if(TGE.BrowserDetect.oniOS)
        {
            iOSDevice = this.iOSType(window.screen.height);

            // MixPanel ios_model parameter doesn't work on ironSource
            if(iOSDevice==="" && getDistributionPartner()==="B0099" && window.mraid && mraid.getScreenSize &&
                mraid.getScreenSize().height)
            {
                var height = Math.max(mraid.getScreenSize().width,mraid.getScreenSize().height);
                iOSDevice = this.iOSType(height);
            }
        }
        
        // Included with all events
        mixpanel.register({
            "version": window.GameConfig ? GameConfig.VERSION : "",
            "dst": querystring["dst"],
            "gid": window.GameConfig ? GameConfig.GAME_ID : "",
            "sandbox": window.GameConfig ? !GameConfig.PROD_ENV : "",
            "site_id": querystring["publisher"] ? querystring["publisher"] : "",
            "line_item_id": querystring["line"] ? querystring["line"] : "",
            "tresensa_campaign_id": querystring["campaign"] ? querystring["campaign"] : "",
            "ios_model": iOSDevice,
            "placement_id": window._TRESETTINGS ? window._TRESETTINGS.placementId : ""
        });

        this.initialized = true;
    },

    trackEvent: function (category, name, value, params) 
    {
        if(!this.initialized)
        {
            return;
        }

        params = params || {};
        var eventName;

        // Dynamic properties to include with all events, static ones are setup in init
        var props = {
            "category": category,
            "value": value
        };

        // Event name mapping
        if (category === "game") 
        {
            eventName = category + " " + name;
        } 
        else if (category === "custom") 
        {
            eventName = name;
        } 
        else 
        {
            eventName = category;
        }

        if(eventName === "game visible" && TGE.GameViewableParameter) 
        {
            props["level"] = TGE.GameViewableParameter;
        }

        if(category=="engagement") 
        {
            if(name !== "primary") 
            {
                eventName += " " + name.replace(" of gameplay", "")
            }
        }

        // Merge together props and params and send to MixPanel with eventName
        mixpanel.track(eventName, merge(props, params));
    },

    trackScreen: function (name, params) 
    {
        if(!this.initialized)
        {
            return;
        }

        params = params || {};

        mixpanel.track("screen", merge({
            "category": "screen",
            "screen name": name
        }, params));
    },

    iOSType: function(screenHeight) 
    {
        var iOSDevice = "";
        switch(screenHeight)
        {
            case 1024: iOSDevice = (window.devicePixelRatio>1 ? "iPad 3 or higher" : "iPad 1 or 2"); break;
            case 480: iOSDevice = (window.devicePixelRatio>1 ? "iPhone 4|S" : "iPhone 3S or below"); break;
            case 568: iOSDevice = "iPhone 5|S"; break;
            case 667: iOSDevice = "iPhone 6|S"; break;
            case 736: iOSDevice = "iPhone 6|S Plus"; break;
        }

        return iOSDevice;
    }
};


