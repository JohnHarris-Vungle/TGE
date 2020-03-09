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
            audioEnabled = true;
            break;
        case "B0003": // Facebook
            {
                // We use the FetchAPI to load inlined audio, but this was only supported from iOS 10.3 on. Facebook
                // makes this test difficult because they wrap the native window.fetch function.
                audioEnabled = true;
                try { window.fetch("data:@file/x-empty;base64,"); } catch (e) {
                    TGE.Debug.Log(TGE.Debug.LOG_WARNING, "Fetch API not supported, disabling audio");
                    audioEnabled = false;
                }
            }
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
    if (this._mRemoteSettings && this._mRemoteSettings[settingName])
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
    var logLevel = (getQueryString()["env"] === "qa") ? TGE.Debug.LOG_WARNING : TGE.Debug.LOG_ERROR;

    // Initialize the setting:  add the name property and value property, check for dashboard overrides, check for querystring overrides
    settingObject.name = settingName;

    // Set default values
    settingObject.description = settingObject.description || "";

    // For some use cases (like languages) it is important to know whether the current setting was specified or the default was used
    settingObject.wasSet = false;

    // Before attempting an override, verify that the config settings as defined in the GameConfig are valid
    this._errorHandleRemoteSettings(settingObject);

    settingObject.value = settingObject.default;

    // The existence of any variant settings from the dashboard should preclude any querystring overrides - don't mix them
    var overrideValue;
    var playableSettings = window.TreSensa && window.TreSensa.Playable.getSetting("remoteSettings");
    if (playableSettings)
    {
        overrideValue = playableSettings[settingObject.name];
    }
    else
    {
        // Allow passed in query string parameters to overwrite remote settings values
        var queryStringParam = getQueryString()[settingObject.name];
        if (queryStringParam !== undefined)
        {
            overrideValue = this._convertStringToType(queryStringParam, settingObject.type);
        }
    }

    if (overrideValue != null && this.validateSettingValue(overrideValue, settingObject) === overrideValue)
    {
        settingObject.value = overrideValue;
        settingObject.wasSet = true;
    }
}

/** @ignore */
TGE.Game.prototype._errorHandleRemoteSettings = function (config)
{
    // Check for a duplicate of a persistent setting name, but allow for "lang" to be overriden in GameConfig
    if (config.name!=="lang" && !config.persistent && TGE.RemoteSettings._persistentSettings[config.name])
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" is reserved as a persistent TGE setting');
        return true;
    }

    var validValue = this.validateSettingValue(config.default, config);
    var hasErrors = validValue !== config.default;      // if the validation had to change the value, the original was not valid
    config.default = validValue;

    return hasErrors;
}

TGE.Game.prototype.validateSettingValue = function (value, config)
{
    var defaultRangeValue;

    // ensure the value type matches the setting type
    if (typeof value !== config.type && value != null)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" has a value that does not match the required data type');

        // PAN-1450 substitute a suitable default value in the correct type
        switch (config.type)
        {
            case "string":
                value = "";
                break;
            case "number":
                value = 0;
                break;
            case "boolean":
                value = false;
                break;

            // NOTE: if we want to support additional types here, we also need to change _convertStringToType
        }
    }

    // validate the options array, if it exists
    if (Array.isArray(config.options) && config.options.length)
    {
        var typeError = false;
        var validated = false;

        // first check if the value exists directly as an options element
        if (config.options.indexOf(value) >= 0 || value == null)
        {
            validated = true;
        }

        // check each option for valid type, and number ranges
        for (var i = config.options.length; --i >= 0; )
        {
            if (typeof config.options[i].min == "number" || typeof config.options[i].max == "number")
            {
                if (config.type !== "number")
                {
                    typeError = true;
                }
                else
                {
                    validated = validated || this._numberExistsInRange(config.options[i].min, config.options[i].max, value, config.options[i].interval);
                    defaultRangeValue = config.options[i].min || 0;  // save a valid default value
                }
            }
            else
            {
                typeError = typeError || typeof config.options[i] !== config.type;
            }
        }

        if (typeError)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" has an option that is not the correct data type');
        }

        if (!validated)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, 'remote setting "' + config.name + '" has a default value that is not in the valid options array');
            value = defaultRangeValue !== undefined ? defaultRangeValue : config.options[0];     // PAN-1450 substitute a valid range value, or the first options element
        }
    }
    return value;
};

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
        // NOTE: if we want to support additional types here, we also need to change validateSettingValue
    }

    return newVar;
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

        printedString += "\nDescription: " + settingInfo.description;

        printedString += "\n";
    }

    console.log("%c " + printedString, "color: green");

    return "";
}
