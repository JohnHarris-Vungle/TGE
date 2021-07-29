/**
 * @deprecated - use Get instead (same function, more appropriate name)
 * @ignore
 */
TGE.AssetManager.GetImage = function(id)
{
    return TGE.AssetManager.Get(id);
}

TGE.AssetManager.prototype.loadAssets = function (assetGroupArray)
{
    if (this._mGroupToListKey !== null)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "assetManager.loadAssets() should only be called once");
        return;
    }
    if (!Array.isArray(assetGroupArray) || assetGroupArray.length === 0)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Parameter passed into loadAssets() must be an array and can't be an empty array");
        return;
    }

    this._buildAssetGroupListAssociations(assetGroupArray);

    if (getQueryString()["assetLoaderDebug"])
    {
        this._printAssetManagerDebug();
    }

    var assetManagerSettings = ["assetGroup", "tinypng", "googleuac", "facebook", "assetName", "fileName", "fileType"];// asset settings that appear in GameConfig.ASSETS but should be stripped before passing to asset loading
    var listName, assetConfig, assetGroup, fileType;

    // LOAD ASSETS
    for (var i in this._assetConfigs)
    {
        assetConfig = this._assetConfigs[i];
        assetGroup = assetConfig.assetGroup;
        fileType = this._getFileTypeFromAssetConfig(assetConfig);
        listName = this.getAssetListFromGroup(assetConfig.assetGroup);

        if (listName)
        {
            // CLEAN ASSET CONFIG OF ALL UNNEEDED PROPS
            for (var j in assetManagerSettings)
            {
                delete assetConfig[assetManagerSettings[j]];
            }

            // ACTUALLY LOAD ASSET!
            fileType === "sheet" ? this.addSheetImages(listName, assetConfig) : this.addAsset(listName, assetConfig);
        }
    }
};

/**
 * Part of the deprecated asset manager: adds extra properties to an asset object defined in GameConfig.ASSETS
 * must be called BEFORE loadAssets() to have any affect!!
 * doesn't allow you to *modify* properties already defined in GameConfig.ASSETS, just add new ones
 * @param {String} assetName name of asset you want to add properties to
         * assetName is usually just the file name (Ex. background)
         * assetName can also be defined explicitly inside the asset object.  If this is the case, this name takes precedence over the file name
 * @param {Object} obj an object filled with any new properties you want to add to the asset object
 */
TGE.AssetManager.prototype.addAssetSettings = function (assetName, newAssetSettings)
{
    if (!this._assetConfigs[assetName])
    {
        // error message, asset doesn't exist
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AssetManager can't find asset '" + assetName + "' to change its settings");

        return;
    }
    for (var setting in newAssetSettings)
    {
        if (!this._assetConfigs[assetName].hasOwnProperty(setting))
        {
            this._assetConfigs[assetName][setting] = newAssetSettings[setting];
        }
        else
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "assetManager.addAssetSettings can only be add new settings, not modify ones defined in GameConfig. '" + setting + "' was previously defined in GameConfig, therefore cannot be modified using 'addAssetSettings'");
        }
    }
};

/**
 * Part of the deprecated asset manager: reads the GameConfig.ASSET object
 * @ignore
 */
TGE.AssetManager.prototype._parseAssets = function ()
{
    this._assetConfigs = [];

    var isPackagedBuild = window.TreSensa && TreSensa.Playable.packagedBuild;

    if (window.GameConfig && GameConfig.ASSETS)
    {
        // PAN-1436 ASSETS loading is now deprecated
        TGE.Debug.Log(TGE.Debug.LOG_WARNING,"GameConfig.ASSETS is no longer supported, switch to code-based asset loading");

        // BUILD ASSET CONFIG OBJECT
        for (var i = 0; i < GameConfig.ASSETS.length; i++)
        {
            var assetConfig = GameConfig.ASSETS[i];

            // ENSURE ALL ASSETS HAVE A URL AND ASSET GROUP
            if (!assetConfig.url || !assetConfig.assetGroup)
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "every asset object in GameConfig.ASSETS must have 'url' and 'assetGroup' properties");
                continue;
            }

            // IF THE ASSET IS DEPENDENT ON A REMOTE SETTING AND THAT REMOTE SETTING VALUE ISN'T SET, DON'T QUEUE
            if (assetConfig.remoteSetting)
            {
                var rsName = assetConfig.remoteSetting.name;
                var rsOptions = assetConfig.remoteSetting.options;

                var remoteSettingValue = TGE.RemoteSettings(rsName);
                var existsInOptions = rsOptions.indexOf(remoteSettingValue) !== -1;

                if (!existsInOptions)
                {
                    continue;
                }
            }

            // IF THE ASSET SHOULDN'T BE LOADED DURING A PACKAGE BUILD AND YOU'RE IN A PACKAGE BUILD, DON'T QUEUE
            if (isPackagedBuild && assetConfig.packageBuild === false)
            {
                continue;
            }

            // DO REMOTE SETTING STRING REPLACE
            assetConfig.url = this._doRemoteSettingStringReplace(assetConfig.url);
            if (typeof assetConfig.subsheetURL === "string")
            {
                assetConfig.subsheetURL = this._doRemoteSettingStringReplace(assetConfig.subsheetURL);
            }
            else if (Array.isArray(assetConfig.subsheetURL))
            {
                for (var j in assetConfig.subsheetURL)
                {
                    assetConfig.subsheetURL[j] = this._doRemoteSettingStringReplace(assetConfig.subsheetURL[j]);
                }
            }
            if (assetConfig.layoutURL)
            {
                assetConfig.layoutURL = this._doRemoteSettingStringReplace(assetConfig.layoutURL);
            }

            // GET THE TRUE NAME OF THE ASSET
            assetConfig.id = assetConfig.assetName ? assetConfig.assetName : trimmedFilename(assetConfig.url);

            // QUEUE ASSET FOR LOADING
            this._assetConfigs.push(assetConfig);
        }

        // Invalidate the original settings defined in GameConfig so a bad dev doesn't try to access them from there,
        // they should only ever access settings via this class
        GameConfig.ASSETS = null;
    }
};

/**
 * Part of the deprecated asset manager: returns the file type of an asset url based on common known file extensions
 * @ignore
 */
TGE.AssetManager.prototype._getFileTypeFromAssetConfig = function (assetConfig)
{
    var fileType = null;
    var extension = assetConfig.url ? assetConfig.url.split('.').pop().toLowerCase() : null;

    var fileTypes = {
        "image": ["png", "jpg"],
        "audio": ["ogg", "mp3"],
        "font": ["ttf", "woff", "woff2", "otf"],
        "script": ["js"],
        "video": ["mp4"],
    };

    if (extension)
    {
        for (var i in fileTypes)
        {
            if (fileTypes[i].indexOf(extension) !== -1)
            {
                fileType = i;
                break;
            }
        }

        // is the image a spritesheet?
        if (fileType === "image" && (TGE.AssetManager.SpriteSheets[trimmedFilename(assetConfig.url)] || assetConfig.layoutURL || assetConfig.subsheetURL))
        {
            fileType = "sheet";
        }
    }

    return fileType;
};

/**
 * Part of the deprecated asset manager: print debug for new asset manager.  To turn on, use querystring assetLoaderDebug=true
 * @ignore
 */
TGE.AssetManager.prototype._printAssetManagerDebug = function ()
{
    var a = this._mListToGroupKey;
    var str = "\n\nASSET LIST TO ASSET GROUP KEY\n";
    for (var i in a)
    {
        str += i + ":";
        for (var j in a[i])
        {
            str += " " + a[i][j] + ",";
        }
        str = str.slice(0, -1);
        str += "\n";
    }
    str += "\n\nASSET INFO";

    var assetConfig, fileType, listName;
    for (var i in this._assetConfigs)
    {
        assetConfig = this._assetConfigs[i];
        fileType = this._getFileTypeFromAssetConfig(assetConfig);
        listName = this.getAssetListFromGroup(assetConfig.assetGroup);

        if (listName)
        {
            var numSpaces = Math.max(0, 25 - assetConfig.id.length);
            str += "\n" + (assetConfig.id + ":" + Array(numSpaces).join(" ") + "list=" + listName + ", type=" + fileType + ", group=" + assetConfig.assetGroup + ", url=" + assetConfig.url);
        }
    }

    str += "\n\n\n";

    console.log(str);
};

/**
 * Part of the deprecated asset manager: finds the remote settings in an asset url and replaces them with the remote setting values
 * @ignore
 */
TGE.AssetManager.prototype._doRemoteSettingStringReplace = function (url)
{
    var remoteSetting = this._getNextRemoteSettingToStringReplace(url);

    while (remoteSetting)
    {
        if (TGE.RemoteSettings.HasSetting(remoteSetting))
        {
            url = url.replace("[" + remoteSetting + "]", TGE.RemoteSettings(remoteSetting));

            // Show warning of remote setting doesn't have an options array
            if (!TGE.RemoteSettings.GetSettings()[remoteSetting].options)
            {
                TGE.Debug.Log(TGE.Debug.LOG_WARNING, "remote setting' " + remoteSetting + "' is mentioned in an asset url, but doesn't have an 'options' array passed in.  An options array is required for remote settings refrenced in asset urls so the grunt script knows what assets to package during deploy.");
            }
        }
        else
        {
            url = url.replace("[" + remoteSetting + "]", remoteSetting);

            // Show error if remote setting doesn't exist
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "remote setting'" + remoteSetting + "' mentioned in asset url '" + url + "' doesn't exist");
        }

        // Get next remote setting
        remoteSetting = this._getNextRemoteSettingToStringReplace(url);
    }

    return url;
};

/**
 * Part of the deprecated asset manager: finds the first remote setting in a url and returns its name
 * remote settings are contained within the '[' and ']' characters
 * @ignore
 */
TGE.AssetManager.prototype._getNextRemoteSettingToStringReplace = function (url)
{
    var regex = /\[[^\[]*\]/g;
    var next = regex.exec(url);

    if (next)
    {
        next = next[0];
        next = next.substring(1, next.length - 1);
    }

    return next;
};

/**
 * Part of the deprecated asset manager: reformats data passed into loadAssets.  Removes all asset groups that aren't utilized by any assets in GameConfig.ASSETS
 * @ignore
 */
TGE.AssetManager.prototype._cleanAssetGroupArray = function (assetGroupArray)
{
    var a = [];
    var b = [];
    var utilizedGroups = [];

    // build list of all *utilized* assetGroup names.  We need to skip the ones that are never utilized, when assigning asset lists
    for (var i in this._assetConfigs)
    {
        var groupName = this._assetConfigs[i].assetGroup;
        if (utilizedGroups.indexOf(groupName) === -1)
        {
            utilizedGroups.push(groupName);
        }
    }

    // shave out any groups not being utilized by any assets in _assetConfigs;
    for (var i = 0; i < assetGroupArray.length; i++)
    {
        a[i] = [];
        var subArray = assetGroupArray[i];

        // put it in a sub-array if it isn't already, for consistency
        subArray = Array.isArray(subArray) ? subArray : [subArray];

        for (var j in subArray)
        {
            if (utilizedGroups.indexOf(subArray[j]) !== -1)
            {
                a[i].push(subArray[j]);
            }
        }
    }

    // clear out any empty arrays
    for (var i in a)
    {
        if (a[i].length > 0)
        {
            b.push(a[i]);
        }
    }

    return b;
};

/**
 * Part of the deprecated asset manager: hook up all asset groups to be associated with an asset list and vice versa, so that they know about each other and can be accessed later
 * @ignore
 */
TGE.AssetManager.prototype._buildAssetGroupListAssociations = function (assetGroupArray)
{
    this._mGroupToListKey = {};
    this._mListToGroupKey = {};

    assetGroupArray = this._cleanAssetGroupArray(assetGroupArray);

    // build the associations between groups and assetList names, so that you have a record from now on
    var listName, groupName;
    for (var i = 0; i < assetGroupArray.length; i++)
    {
        listName = this.getAssetListFromNumber(i + 1);

        for (var j in assetGroupArray[i])
        {
            groupName = assetGroupArray[i][j];

            this._buildAssetGroupListAssociation(groupName, listName);
        }
    }
};

/**
 * Part of the deprecated asset manager: make an asset group associated with an asset list and vice versa, so that they know about each other and can be accessed later
 * @ignore
 */
TGE.AssetManager.prototype._buildAssetGroupListAssociation = function (groupName, listName)
{
    this._mGroupToListKey[groupName] = listName;
    !this._mListToGroupKey[listName] ? this._mListToGroupKey[listName] = [] : null;
    this._mListToGroupKey[listName].push(groupName);
};

/**
 * @deprecated - use addAssets instead
 * @ignore
 */
TGE.AssetManager.prototype.assignImageAssetList = function(assetListName,assetList)
{
    this._verifyAssetListExists(assetListName);
    this._mAssetLists[assetListName] = {loaded: false, list: assetList};
};

/**
 * @deprecated - use getAsset instead
 * @ignore
 */
TGE.AssetManager.prototype.getImage = function(id,errorCheck)
{
    return this.getAsset(id,errorCheck);
};

/**
 * Converts an asset group name to an asset list name
 * @param {String} groupName group name you want to convert to a list name
 * @returns {String} the asset list name
 */
TGE.AssetManager.prototype.getAssetListFromGroup = function (groupName)
{
    return this._mGroupToListKey[groupName];
};

/**
 * Converts an asset list name to an asset group name
 * @param {String} listName list name you want to convert to a list group, Ex. "required2"
 * @returns {String} the asset group name
 */
TGE.AssetManager.prototype.getAssetGroupsFromList = function (listName)
{
    return this._mListToGroupKey ? this._mListToGroupKey[listName] : [];
};

TGE.AssetManager.prototype.loadAssetGroup = function (assetGroupName, updateCallback, completeCallback)
{
    var assetListName = this.getAssetListFromGroup(assetGroupName);
    this.loadAssetList(assetListName, updateCallback, completeCallback);
};



// From TGE.Game:

/**
 * Waits until the specified required asset list has finished loading. In the event that the asset list is not ready,
 * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
 * @param {Number} listNumber Specifies which required asset list to check for completion. For instance, a listNumber of 3 will check whether the asset list "required3" is ready yet.
 * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
 * @returns {Boolean} Whether or not the specified required asset list has completed loading.
 * @deprecated
 * @ignore
 */
TGE.Game.prototype.requiredAssetsAvailable = function(listNumber, callback, showBuffering)
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
};

/**
 * Checks whether the specified required asset list has finished loading.
 * @param {Number} listNumber Specifies which required asset list to check for completion. For instance, a listNumber of 3 will check whether the asset list "required3" is ready yet.
 * @returns {Boolean} Whether or not the specified asset has completed loading.
 */
TGE.Game.prototype.isRequiredAssetsLoaded = function(listNumber)
{
    return this.requiredAssetsAvailable(listNumber, undefined, false);
};

/**
 * Waits until the specified required asset list has finished loading. In the event that the asset list is not ready,
 * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
 * @param {Number} listNumber Specifies which required asset list to check for completion. For instance, a listNumber of 3 will check whether the asset list "required3" is ready yet.
 * @param {Function} [callback=null] An optional callback function to be fired if the specified asset list has finished loading and the assets are available for use.
 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
 * @returns {Boolean} Whether or not the specified required asset list has completed loading.
 */
TGE.Game.prototype.waitForRequiredAssets = function(listNumber, callback, showBuffering)
{
    return this.requiredAssetsAvailable(listNumber, callback || null, showBuffering)
};

/**
 * Waits until the specified asset group has finished loading. In the event that the asset list is not ready,
 * calling this function will by default freeze the game and display a buffering overlay window that remains on screen until the assets are finally available.
 * @param {String} groupName Specifies which asset group to check for completion.
 * @param {Function} callback A callback function to be fired when the specified asset list has finished loading and the assets are available for use.
 * @param {Boolean} [showBuffering=true] In the case where the specified asset list has not finished loading yet, the wait parameter indicates whether to freeze gameplay and display a buffering screen until the requested list is available (defaults to true).
 * @returns {Boolean} Whether or not the specified asset list has completed loading.
 */
TGE.Game.prototype.waitForAssetGroup = function(groupName, callback, showBuffering)
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
};

/** @ignore */
TGE.Game.prototype._logFinishedLoadingRequiredAssets = function (listName)
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
};

/**
 * Checks whether a specified asset group has finished loading.
 * @param {String} groupName Specifies which asset group to check for completion.
 * @returns {Boolean} Whether or not the asset group has completed loading.
 */
TGE.Game.prototype.isAssetGroupLoaded = function(groupName)
{
    var listName = this.assetManager.getAssetListFromGroup(groupName);

    return this.assetListAvailable(listName, undefined, false);
};

