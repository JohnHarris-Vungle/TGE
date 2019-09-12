/** @ignore */
TGE.Game.prototype._mRemoteSettings = null;

/**
 * Returns the value of a remote setting.
 * This is a wrapper for the actual remote settings functionality in TGE.Game.
 * If the remote setting was overwritten with a query string or by a placement variant, it will return that value, otherwise will return default.
 * @param {String} [settingName] The name of the remote setting to access the value of.
 * @returns {*} The value of the specified remote setting.
 */
TGE.RemoteSettings = function (settingName)
{
    return TGE.Game.GetInstance()._getRemoteSetting(settingName);
}

// PAN-1120
/** @ignore */
/* Set a default value for audio based on distribution partner */
TGE.RemoteSettings._getDefaultAudioSetting = function ()
{
    var audioEnabled = false;
    switch ( getDistributionPartner () )
    {
        case "B0135": // Snapchat
        case "B0149": // Web links
        case "B0154": // Creative Builder
        case "B0003": // Facebook
        case "B0159": // ironSource DAPI
            audioEnabled = true;
            break;
        case "B0094": // Beeswax RTB
        default:
            audioEnabled = false;
            break;
    }
    return audioEnabled;
};

/** @ignore */
/*Persistent Settings are remote settings that are automatically included/setup for every game, without needing to specify in GameConfig*/
TGE.RemoteSettings._persistentSettings = null;

/** @ignore */
/*Persistent Settings are sometimes environment dependent and therefore need an explicit initialization call*/
TGE.RemoteSettings._initPersistentSettings = function()
{
    TGE.RemoteSettings._persistentSettings = {
        "audio": {type: "boolean", default: TGE.RemoteSettings._getDefaultAudioSetting(), description: "enable audio", persistent: true},
        "lang": {type: "string", default: "en", description: "game language", options: ["en"], persistent: true}
    };
};


/**
 * Returns an object full of all remote settings data.
 * @returns {Object} An object full of remote settings.  Each key of this object has these properties
 * <ul>
 *     <li> name: name of the remote setting </li>
 *     <li> type: javascript type that the remote setting should expect/convert to </li>
 *     <li> value: current value of the remote setting, that is applied to the game </li>
 *     <li> default: whatever remote setting defaults to if no querystring is passed in </li>
 *     <li> options: optional, an array of the allowed values this setting can be set to </li>
 *     <li> debug: defaults to false, a flag that is only checked true if the remote setting should not be visible/settable publicly
 *     <li> persistent: default false, a flag that is only checked true if this remote setting is a Persistent TGE Remote Setting </li>
 *     * </ul>
 */
TGE.RemoteSettings.GetSettings = function ()
{
    return TGE.Game.GetInstance()._mRemoteSettings;
}

/**
 * Prints a summary of all Remote Setting names, values, and options.
 */
TGE.RemoteSettings.Print = function ()
{
    return TGE.Game.GetInstance()._printRemoteSettings();
}

/**
 * Tells you whether a remote setting exists or not.
 * @param {String} [settingName] The name of the remote setting.
 * @returns {Boolean} does remote setting exist in GameConfig or as a Persistent Remote Setting?
 */
TGE.RemoteSettings.HasSetting = function (settingName)
{
    if (typeof settingName === "string")
    {
        var settings = TGE.Game.GetInstance()._mRemoteSettings;
        return (settings && !!settings[settingName]);
    }
    else
    {
        return false;
    }
}

/**
 * Add a new setting to GameConfig.RemoteSettings
 * @param {String} [settingName] The name of the remote setting.
 * @param {Object} [settingObject] The remote settings info object
 * <ul>
 *     <li> name: name of the remote setting </li>
 *     <li> type: javascript type that the remote setting should expect/convert to </li>
 *     <li> value: current value of the remote setting, that is applied to the game </li>
 *     <li> default: whatever remote setting defaults to if no querystring is passed in </li>
 *     <li> options: optional, an array of the allowed values this setting can be set to </li>
 *     <li> debug: defaults to false, a flag that is only checked true if the remote setting should not be visible/settable publicly
 *     <li> persistent: default false, a flag that is only checked true if this remote setting is a Persistent TGE Remote Setting </li>
 *     * </ul>
 */
TGE.RemoteSettings.AddSetting = function (settingName, settingObject)
{
    if (typeof settingName === "string" && typeof settingObject === "object")
    {
	    TGE.Game.GetInstance()._initRemoteSetting(settingName, settingObject);
	    TGE.Game.GetInstance()._mRemoteSettings[settingName] = settingObject;
    }
}

/**
 * Returns true if the specified remote setting is valid and was given a value, either by the querystring or placement settings. Returns false otherwise.
 * @param {String} settingName The name of the remote setting.
 */
TGE.RemoteSettings.WasSet = function (settingName)
{
    if (typeof settingName === "string")
    {
        var settings = TGE.Game.GetInstance()._mRemoteSettings;
        return (settings && settings[settingName].wasSet);
    }
    
    return false;
}

/** @ignore */
TGE.Game.prototype._getRemoteSetting = function (settingName)
{
    if (this._mRemoteSettings && this._mRemoteSettings[settingName] && typeof(this._mRemoteSettings[settingName].value) !== "undefined")
    {
        return this._mRemoteSettings[settingName].value;
    }
    else
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "remote setting [" + settingName + "] does not exist");
        return null;
    }
}

/** @ignore */
TGE.Game.prototype._initializeRemoteSettings = function ()
{
    var configInfo = GameConfig.REMOTE_SETTINGS;

    TGE.RemoteSettings._initPersistentSettings();

    // Invalidate the original settings defined in GameConfig so a bad dev doesn't try to access them from there,
    // they should only ever access settings via this class
	GameConfig.REMOTE_SETTINGS = null;

    // Combine GameConfig user-defined settings with persistent settings
    for (var settingName in TGE.RemoteSettings._persistentSettings)
    {
        if (!configInfo[settingName])
        {
            configInfo[settingName] = TGE.RemoteSettings._persistentSettings[settingName];
        }
    }

    // PAN-1126 For dashboard supplied overrides we can (and should) verify that the settings specified actually exists. We can't do
    // this in the main loop below because there we are simply looping through the GameConfig specified settings and checking for
    // overrides. Here we need to loop through the overrides and make sure they all have corresponding settings.
    if (window.TreSensa && window.TreSensa.Playable.getSetting("remoteSettings"))
    {
        var dashOverrides = window.TreSensa.Playable.getSetting("remoteSettings");
        for (var setting in dashOverrides)
        {
            if (typeof(configInfo[setting]) == "undefined")
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "dashboard specified remote setting \"" + setting + "\" is invalid");
            }
        }
    }

    // PAN-1189 check to see if debug settings are allowed
    // Debug settings should be disabled in prod unless debugSettings=true is set
    // debugSettings itself cannot be a remote setting because it needs to be checked inside this function
    var debugSettingsAllowed = (!GameConfig.PROD_ENV || getQueryString()["env"] === "qa" || getQueryString()["debugSettings"] === "true");

    // Initialize the settings:  add the name property and value property, check for dashboard overrides, check for querystring overrides
    for (var settingName in configInfo)
    {
        this._initRemoteSetting(settingName, configInfo[settingName]);
    }

    this._mRemoteSettings = configInfo;
}

/** @ignore */

// **NOTE: CBD-291 any changes to this process might require updating creative builder addSettingStep(),
// which uses this object when persisting dynamically-added settings to GameConfig, and needs to clean it up first

TGE.Game.prototype._initRemoteSetting = function (settingName, settingObject)
{
    // PAN-1189 check to see if debug settings are allowed
    // Debug settings should be disabled in prod unless debugSettings=true is set
    // debugSettings itself cannot be a remote setting because it needs to be checked inside this function
    var debugSettingsAllowed = (!GameConfig.PROD_ENV || getQueryString()["env"] === "qa" || getQueryString()["debugSettings"] === "true");
	var logLevel = (getQueryString()["env"] === "qa") ? TGE.Debug.LOG_WARNING : TGE.Debug.LOG_ERROR;

    // Initialize the setting:  add the name property and value property, check for dashboard overrides, check for querystring overrides
    settingObject.name = settingName;

    // PAN-1189, set default values for debug and description
    settingObject.debug = (settingObject.debug === true);
    settingObject.description = settingObject.description || "";

    // For some use cases (like languages) it is important to know whether the current setting was specified or the default was used
    settingObject.wasSet = false;

    // Before attempting an override, verify that the config settings as defined in the GameConfig are valid
    if (this._errorHandleRemoteSettings(settingObject))
    {
        settingObject.value = null;
    }
    else
    {
        settingObject.value = settingObject.default;        

        // The existence of any variant settings from the dashboard should preclude any querystring overrides - don't mix them
        if (window.TreSensa && window.TreSensa.Playable.getSetting("remoteSettings"))
        {
            var variantOverwrite = this._checkForVariantOverwrite(settingObject);
            if (variantOverwrite !== null)
            {
                // PAN-1189
                if (!debugSettingsAllowed && settingObject.debug)
                {
                    TGE.Debug.Log(logLevel, "dashboard value disabled in production for debug setting " + settingObject.name);
                }
                else
                {
                    settingObject.value = variantOverwrite;
                    settingObject.wasSet = true;
                }
            }
        }
        else
        {
            // Allow passed in query string parameters to overwrite remote settings values
            var queryStringOverwrite = this._checkForQueryStringOverwrite(settingObject);
            if (queryStringOverwrite !== null)
            {
                // PAN-1189
                if (!debugSettingsAllowed && settingObject.debug)
                {
                    TGE.Debug.Log(logLevel, "query string value disabled in production for debug setting " + settingObject.name);
                }
                else
                {
                    settingObject.value = queryStringOverwrite;
                    settingObject.wasSet = true;
                }
            }
        }
    }
}

/** @ignore */
TGE.Game.prototype._errorHandleRemoteSettings = function (config)
{
    var hasErrors = false;
    var defaultExistsInRange = false;

    // Does the type of 'default' match the 'type' passed in?
    if (typeof(config.default) != config.type)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" has a default value that does not match the required data type.');
        hasErrors = true;
    }

    // Does the type of each element in 'options' match the 'type' passed in?
    for (var i in config.options)
    {
        if (typeof config.options[i].min == "number" || typeof config.options[i].max == "number")
        {
            defaultExistsInRange = defaultExistsInRange || this._numberExistsInRange(config.options[i].min, config.options[i].max, config.default, config.options[i].interval);

            if (config.type !== "number")
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" has an option that is not of the correct data type.');
                hasErrors = true;
            }

        }
        else if (typeof(config.options[i]) != config.type)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" has an option that is not of the correct data type.');
            hasErrors = true;
        }
    }

    // Does the 'default' appear in the 'options' array?
    if (Array.isArray(config.options) && config.options.indexOf(config.default) === -1 && !defaultExistsInRange)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" has a default value that is not in the valid options array.');
        hasErrors = true;
    }

    // We're going to allow persistent settings to be redefined in GameConfig for the "lang" parameter, so devs can specify supported languages
    if (config.name!=="lang" && !config.persistent && TGE.RemoteSettings._persistentSettings[config.name])
    {
        TGE.Debug.Log(TGE.Debug.LOG_WARNING, 'remote setting "' + config.name + '" exists already as a persistent TGE remote setting and is not a valid name for a custom remote setting.');
        hasErrors = true;
    }

    return hasErrors;
}

/** @ignore */
TGE.Game.prototype._numberExistsInRange = function ( min, max, num, interval)
{
	if (typeof interval !== "number") interval = 1;
	if (typeof min !== "number") min = 0;
	if (typeof max !== "number") max = Number.MAX_SAFE_INTEGER;

	var rem = (num - min) % interval;
	var epsilon = Number.EPSILON * 1000;
	return num >= min && num <= max && (rem <= epsilon || interval - rem <= epsilon);
}

/** @ignore */
TGE.Game.prototype._checkForQueryStringOverwrite = function (config)
{
    var queryStringParam = getQueryString()[config.name];
    if (typeof(queryStringParam) !== "undefined")
    {
        queryStringParam = this._convertStringToType(queryStringParam, config.type);
        return this._validateOverwrite(queryStringParam, config);
    }

    return null;
}

/** @ignore */
TGE.Game.prototype._checkForVariantOverwrite = function (config)
{
    var variantParam = window.TreSensa.Playable.getSetting("remoteSettings")[config.name];
    if (typeof(variantParam) !== "undefined")
    {
        return this._validateOverwrite(variantParam, config);
    }

    return null;
}

/** @ignore */
TGE.Game.prototype._validateOverwrite = function (newParam, config)
{
    // Is the param of the right data type?
    if (newParam === null || !this._validateType(newParam, config.type))
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" must be a ' + config.type);
        return config.default;
    }
    else if (config.options)
    {
        var existsInOptions = false;
        // Does the querystring overwrite's type match the 'type' passed in?
        for (var i in config.options)
        {
            if (newParam == config.options[i])
            {
                existsInOptions = true;
            }
            if (typeof config.options[i].min == "number" || typeof config.options[i].max == "number" )
            {
                existsInOptions = existsInOptions || this._numberExistsInRange(config.options[i].min, config.options[i].max, newParam, config.options[i].interval);
            }
        }

        if (!existsInOptions)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" is set to an invalid value: ' + newParam);
            newParam = null;
        }
    }

    return newParam;
}

/** @ignore */
TGE.Game.prototype._convertStringToType = function (string, type)
{
    var newVar = null;

    switch (type)
    {
        case "string":
            newVar = string;
            break;
        case "number":
            if (!isNaN(string))
            {
                newVar = parseFloat(string);
            }
            break;
        case "boolean":
            if (string == "true")
            {
                newVar = true;
            }
            if (string == "false")
            {
                newVar = false;
            }
            break;
    }

    return newVar;
}

/** @ignore */
TGE.Game.prototype._validateType = function (param, type)
{
    return typeof(param)==type;
}

/** @ignore */
TGE.Game.prototype._printRemoteSettings = function ()
{
    var printedString = "\nREMOTE SETTINGS\n";

    for (var settingName in this._mRemoteSettings)
    {
        var settingInfo = this._mRemoteSettings[settingName];

        printedString += "\nName: " + settingName;
        printedString += "\nValue: " + settingInfo.value;

        if (settingInfo.options)
        {
            printedString += "\nOptions: ";
            for (var i = 0; i < settingInfo.options.length; i++)
            {
                var option = settingInfo.options[i];

                if (typeof option === "object" && (option.min || option.max))
                {
                    var min = typeof option.min === "number" ? option.min.toString() : "0";
                    var max = typeof option.max === "number" ? option.max.toString() : "infinity";

                    printedString += (min + "-" + max);
                }
                else
                {
                    printedString += option;
                }

                printedString += (i==settingInfo.options.length-1 ? "" : ", ");
            }
        }

        // PAN-1189
        printedString += "\nDebug: " + (settingInfo.debug === true);
        printedString += "\nDescription: " + settingInfo.description;

        printedString += "\n";
    }

    console.log("%c " + printedString, "color: green");

    return "";
}
