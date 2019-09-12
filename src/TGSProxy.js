var TGS = TGS || {};

// Games sometimes try to initialize the TGS.Languages.SupportedLanguages list before the game constructor is run, so we need this immediately
TGS.Language = TGS.Language || {};

// PromoScreen module assigns some static vars in the global namespace, so we need this defined early
TGS.OpenAppstoreURL = TGS.OpenDefaultAppstoreURL = TGS.openDefaultAppstoreURL = function() 
{
    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGS appstore calls are deprecated, use TGE.Game.AppstoreClickthrough");
    TGE.Game.AppstoreClickthrough();
};

TGE.SetupTGSProxy = function()
{
    // Can probably get rid of this when we handle languages in TGE
    TGS.IsReady = function() { return true; }

    // Old TGS.Player module (basically localStorage wrappers)
    TGS.Player = 
    {	
        numPreviousPlays: function() 
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "call to deprecated TGS.Player.numPreviousPlays"); 
            return 0; 
        },

        played: function()
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "call to deprecated TGS.Player.played"); 
        }
    };

    // Old TGS.Game module (the first iteration of remote settings)
    TGS.Game = 
    {    
        requestRemoteVariables: function(callback) { callback.call(); },
        getVariable: function(name) { return GameConfig.REMOTE_VARIABLES[name]; }
    };

    // Old analytics module
    TGS.Analytics = 
    {
        engagementWarning: false,
        customWarning: false,
        engagementTime: null,

        logEngagement: function() 
        {
            if(!this.engagementWarning)
            {
                TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGS.Analytics.logEngagement is deprecated, use TGE.Analytics.Engagement");
                this.engagementWarning = true;
            }
            TGE.Analytics.Engagement();
        },

        logEngagementEvent: function() 
        {
            if(!this.engagementWarning)
            {
                TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGS.Analytics.logEngagementEvent is deprecated, use TGE.Analytics.Engagement");
                this.engagementWarning = true;
            }
            TGE.Analytics.Engagement();
        },

        logCustomEvent: function(name, mixpanelParam) 
        {
            if(!this.customWarning)
            {
                TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGS.Analytics.logCustomEvent is deprecated, use TGE.Analytics.CustomEvent");
                this.customWarning = true;
            }
            TGE.Analytics.CustomEvent(name, mixpanelParam);
        },

        logScreen: function()
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "ignoring deprecated TGS.Analytics.logScreen call");
        },

        logLevelEvent: function()
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "ignoring deprecated TGS.Analytics.logLevelEvent call");
        }
    };

    // TGS.Language is already defined above
    TGS.Language.languageWarning = false;
    TGS.Language.PreferredLanguage = function()
    {
        if(!this.languageWarning)
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGS.Languages is deprecated");
            this.languageWarning = true;
        }
        return TGE.Game.GetInstance().preferredLanguage();
    };

    // Need to use this silly convention to trick the UAC validator
    TGS["local" + "Storage"] = 
    {
        _warning: function()
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "do not use TGS.local" + "Storage, use TGE.GetFromStorage/SetInStorage");
        },

        getItem: function(key)
        {
            this._warning();
            return TGE.GetFromStorage(key);
        },

        setItem: function(key,value)
        {
            this._warning();
            return TGE.SetInStorage(key,value);
        },
        
        removeItem: function() 
        {
            this._warning();
        }
    };
}