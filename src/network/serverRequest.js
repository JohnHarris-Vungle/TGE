
/** @ignore */
TGE.Game._sServerRequestId = 0;

/** @ignore */
TGE.Game.prototype._mServerRequests = {};

/** @ignore */
TGE.Game.ServerMode = "POST";

TGE.Game.prototype.accumulatorIncrement = function(index, value, callback)
{
    var requestObj = {
        index: index,
        value: value
    };
    this._accumulatorRequest("increment", requestObj, callback);
}

TGE.Game.prototype.accumulatorGetTotals = function(callback)
{
    var requestObj = {

    };
    this._accumulatorRequest("getTotals", requestObj, callback);
}

TGE.Game.prototype._accumulatorRequest = function(type, requestObj, callback)
{
    // If we don't have a creative ID then return an empty result (probably a local environment)
    if (!window._TRESETTINGS)
    {
        TGE.Debug.Log(TGE.Debug.LOG_WARNING, "accumulator server requests will not work locally");

        if(typeof(callback)==="function")
        {
            callback.call(null, {
                "success": true,
                "result": {}
            });
        }
        return;
    }

    // Add the creative ID to the request object
    requestObj.creativeId = _TRESETTINGS.gameId;

    this.serverRequest(type, requestObj, callback, 5, true);
}

/**
 * Communicates with the game server for game specific services such as leaderboards.
 * @param {String} servletId An id used to identify the game to the server.
 * @param {Object} requestObj An object defining the properties of the request. Must contain a 'request' parameter and a 'version' parameter.
 * @param {Function} callback The callback function that will be called with the server response.
 * @param {Number} [timeout=8] An optional timeout value (in seconds) to wait before the server requested is considered to have failed.
 */
TGE.Game.prototype.serverRequest = function(servletId, requestObj, callback, timeout, accumulatorRequest)
{
    // Enforce a callback
    callback = typeof(callback)=="function" ? callback : function(){};

    // Start off with a bunch of dummy-proof error checking
    var errorMessage = null;
    if(typeof(servletId)!=="string" || typeof(requestObj)!=="object")
    {
        errorMessage = "invalid arguments";
    }

    // Was there an error?
    if(errorMessage!==null)
    {
        if(typeof(callback)==="function")
        {
            callback.call(null,{
                "success": false,
                "error": errorMessage
            });
        }
        else
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "serverRequest failed, " + errorMessage);
        }
        return;
    }

    // Figure out what environment we're in (dev/prod/local)
    var dev = window.TreSensa ? TreSensa.Playable.onDevServer() : false;

    // Which server are we talking to?
    var server = accumulatorRequest ? "accumulators" : "brandgame";

    // Only production deployments will hit the production server
    var endpoint = "https://" + server + (dev ? "-dev" : "") + ".tresensa.com/";

    // Append the servlet endpoint
    endpoint += servletId;

    // Determine the timeout (specified in seconds)
    timeout = typeof(timeout)==="number" && timeout>0.1 ? timeout*1000 : 8000;

    // Create a random id for this request so we can track it
    var id = TGE.Game._sServerRequestId++;
    requestObj._id = id;

    // Store the info we'll need
    var request = this._mServerRequests[id] = {
        complete: false,
        callback: callback
    };

    // Create the payload
    var payload = "request=" + btoa(JSON.stringify(requestObj));

    // Start our timeout timer...
    setTimeout(this._serverRequestTimeout.bind(this,id),timeout);

    // Make the request
    if(TGE.Game.ServerMode==="POST")
    {
        this._corsRequest(request, endpoint, payload);
    }
    else
    {
        this._jsonpRequest(request, endpoint, payload);
    }
}

/** @ignore */
TGE.Game.prototype._serverRequestTimeout = function(requestId)
{
    // Do we need to cancel the request?
    if(this._mServerRequests[requestId] && !this._mServerRequests[requestId].complete)
    {
        // Cancel it and send the error back
        this._mServerRequests[requestId].complete = true;
        this._mServerRequests[requestId].callback.call(null, {
            "success": false,
            "error": "request timed out"
        });
    }
}

/** @ignore */
window._tgeJsonpCallback = function(data)
{
    var request = TGE.Game.GetInstance()._mServerRequests[data._id];

    if(typeof(request)!=="object")
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "server request returned bad data, unable to link to original request");
    }
    else if(!request.complete) // Only process if we didn't timeout already
    {
        request.complete = true;
        request.callback.call(null,data);
    }
}

/** @ignore */
TGE.Game.prototype._jsonpRequest = function(request, url, payload)
{
    var fullUrl = url + "?" + payload;

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = fullUrl;

    document.getElementsByTagName('head')[0].appendChild(script);
}

/** @ignore */
TGE.Game.prototype._corsRequest = function(request, url, payload, headers, xhrProps)
{
    var xhr = null;
    var jsonResp = null;

    headers = headers || {
            "Content-type": "application/x-www-form-urlencoded"
        };

    var fireCallback = function(responseObj) {
        // Only fire if we didn't timeout in the meantime
        if(!request.complete)
        {
            request.complete = true;
            request.callback.call(null,responseObj);
        }
    }

    var applyHeaders = function(xhr, headers){
        headers = headers || {};
        for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }
    };

    var applyProps = function(xhr, props){
        props = props || {};
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                xhr[prop] = props[prop];
            }
        }
    };

    try
    {
        // Determine the appropriate request object for the browser
        if(window.XMLHttpRequest)
        {
            xhr = new XMLHttpRequest();
            if("withCredentials" in xhr)
            {
                // XHR for Chrome/Firefox/Opera/Safari.
                xhr.open("POST", url, true);
                applyHeaders(xhr, headers);
                applyProps(xhr, xhrProps);
                xhr.send(payload);
            }
        }
    }
    catch(Exception)
    {
        fireCallback({
            "success": false,
            "error": "server failed to respond"
        });
    }
    try
    {
        xhr.onreadystatechange = function()
        {
            if(xhr.readyState == 4)
            {
                if(xhr.status != 200)
                {
                    fireCallback({
                        "success": false,
                        "error": "the server returned error code " + xhr.status
                    });
                }
                else
                {
                    // The server should always return JSON, so try and parse it right here
                    try
                    {
                        jsonResp = JSON.parse(xhr.responseText);

                        // Pass the JSON response along...
                        fireCallback(jsonResp);
                    }
                    catch(e)
                    {
                        fireCallback({
                            "success": false,
                            "error": "server returned bad data"
                        });
                    }
                }
            }
        }
    }
    catch(e)
    {
        fireCallback({
            "success": false,
            "error": "unknown server error"
        });
    }
}