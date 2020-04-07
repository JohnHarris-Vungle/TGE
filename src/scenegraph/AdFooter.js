/**
 * <p>The TGE.AdFooter is used to display a persistent legal footer that will remain visible throughout the session above all screens.</p>
 * @class
 * @extends TGE.DisplayObjectContainer
 * @constructor
 */
TGE.AdFooter = function()
{
    // Assign the singleton
    TGE.AdFooter._sInstance = this;

    TGE.AdFooter.superclass.constructor.call(this);

    this.expandable = false;
    this.expanded = false;
    this.previousUpdateRoot = TGE.Game.GetUpdateRoot();
    this.htmlPanel = null;

    this.panelSettings = {
        collapsedSize: 0.25, // in percent
        expandedSize: 0.92, // in percent (leave some clearance so the ad close button isn't confused with panel close)
        padding: 4, // css percent. This is the padding around the text in the panel.
        primaryColor: "#41b5cd", // Ultimately we want this to be a CB color def
        toggleButtonRadius: 0.03
    }

    // Event listeners
    this.addEventListener("update", this._onUpdate);
    this.addEventListener("drawbegin", this._onDrawBegin);
    this.addEventListener("resize", this._onResize); // Necessary since responsive css behavior doesn't align with TGE responsive behavior
}

/** @ignore */
TGE.AdFooter._sInstance = null;

// This is a mess. The problem is a game restart (which the CB uses often) will remove all children from the game stage
// but not the true stage. The default ad footer is a child of the game stage, so it gets removed but the _sInstance
// static variable is not cleared. This caused a bug (can't remember what), so the CB sets _sInstance to null when it does
// a restart. However when a panel style footer is added, it isn't added to the game stage and isn't destroyed on a restart.
// But the _sInstance is still set to null which would prevent the panel footer from ever getting destroyed on a restart.
TGE.AdFooter._sInstanceNonGame = null;

/**
 * Creates an instance of the TGE.AdFooter object and adds it to the scene.
 * @returns {TGE.AdFooter|null} The instance of the TGE.AdFooter object, or null if it was too early to add it to the scene.
 */
TGE.AdFooter.Create = function()
{
    var game = TGE.Game.GetInstance();

    // We want this function to also add the text to the scene, so make sure the scene is ready
    if(!game || !game._mFullStage)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AdFooter.Create was called too early - wait until the TGE game object has been launched");
        return null;
    }

    // If there's any existing footer, destroy it
    TGE.AdFooter.Destroy();

    // Is this an expandable footer (ie: ISI panel)?
    var expandable = TGE.RemoteSettings.HasSetting("expandableLegalText") ? TGE.RemoteSettings("expandableLegalText") : false;

    // Create the instance and add it to the stage
    var adFooter = null;
    if(expandable)
    {
        TGE.AdFooter._sInstanceNonGame = adFooter = game._mFullStage.addChild(new TGE.AdFooter().setup({
            expandable: true
        }));
    }
    else
    {
        adFooter = game.stage.addChild(new TGE.AdFooter().setup({
            expandable: false
        }));
    }
}

/**
 * Returns the single instance of the TGE.AdFooter object.
 * @returns {TGE.AdFooter|null} The single instance of the TGE.AdFooter object, or null if an instance of the button has not been created yet.
 */
TGE.AdFooter.GetInstance = function()
{
    return TGE.AdFooter._sInstance;
}

TGE.AdFooter.Destroy = function()
{
    if(TGE.AdFooter._sInstance!==null)
    {
        TGE.AdFooter._sInstance.removeFromScene();
    }

    // If a footer panel exists outside of the game scene graph, then destroy it so we don't create a duplicate. A game restart
    // will have only cleared the game stage and not this object.
    if(TGE.AdFooter._sInstanceNonGame!=null)
    {
        TGE.AdFooter._sInstanceNonGame.removeFromScene();
        TGE.AdFooter._sInstanceNonGame = null;
    }
}

TGE.AdFooter.prototype =
{
    setup: function(params)
    {
        this.expandable = params.expandable;

        if(params.expandable)
        {
            var settings = this.panelSettings;

            // Push the game stage up to make room for the top of the panel
            TGE.Game.GetInstance()._mFullStage.setGameStageHeight(1 - settings.collapsedSize);

            params.backgroundColor = "#fff";
            params.registrationX = 0;
            params.registrationY = 0;
            params.layout = function() {
                this.adjustPanelPosition();
            };

            // Important Safety Information header
            this.addChild(new TGE.Text().setup({
                text: "Important Safety Information",
                textColor: settings.primaryColor,
                fontSize: 12,
                fontWeight: "bold",
                hAlign: "left",
                vAlign: "top",
                fontFamily: "Arial",
                layout: function() {
                    var d = this.parent._uiScalingDimension();
                    var p = d * (settings.padding/100);
                    this.x = p;
                    this.y = p;
                    this.scale = d / 300;
                }
            }));

            this.makeHtmlPanel();

            // The click listener will be for the upper right toggle button (as well as making the entire panel a click
            // target so clicks don't pass through).
            this.addEventListener("click", this._onClick);
        }
        else
        {
            // Reset the game stage size in case it was previously a panel footer
            TGE.Game.GetInstance()._mFullStage.setGameStageHeight(1);

            params.registrationX = 0.5;
            params.registrationY = 1;
            params.width = 125;
            params.height = 125;
            params.layout = function() {
                this.x = this.stage.width/2;
                this.y = this.stage.height*0.995;
                this.width = this.stage.width;
                this.height = this.stage.height*0.05;
            }

            this.addChild(new TGE.Text().setup({
                textDef: "tge_legal_footer",
                textColor: "#ffffff",
                fontSize: 6,
                text: "",
                hAlign: "center",
                vAlign: "bottom",
                fontFamily: "Arial",
                layout: function() {
                    // Here we are a) adjusting the wrapWidth so the text has as much room as possible, and
                    // b) scaling the text so that the size is consistent across different resolution devices.
                    // We also do a little magic number work to account for devices like iPhone X that have aspect
                    // ratios that could otherwise lead to excessively big text.
                    var aspect = Math.max(this.stage.width,this.stage.height)/Math.min(this.stage.width,this.stage.height);
                    var magic = 1 + Math.max(aspect-2,0);
                    var s = Math.max(this.stage.height,this.stage.width)/(640*magic);
                    this.scale = s;
                    this.wrapWidth = (this.parent.width * 0.96) * (1/s);
                }
            }));
        }

        TGE.AdFooter.superclass.setup.call(this, params);

        return this;
    },

    makeHtmlPanel: function()
    {
        this.expanded ? this.expandPanel() : this.collapsePanel();
    },

    togglePanel: function()
    {
        this.expanded ? this.collapsePanel() : this.expandPanel();
    },

    collapsePanel: function()
    {
        var settings = this.panelSettings;

        // Remove the old iframe
        this._removeIFrame();

        this.expanded = false;

        // Restore the update root
        TGE.Game.SetUpdateRoot(this.previousUpdateRoot || this._mFullStage);

        // Push the panel down to its collapsed position
        this.adjustPanelPosition();

        // Create an iframe to host the html. This is the only effective way to ignore any parent css rules.
        var shoulder = 1;
        var panelHeight = Math.floor(settings.collapsedSize * this.height);
        var panelWidth = Math.floor(this.width);
        var topClearance = Math.floor((settings.toggleButtonRadius * 3.5) * this._uiScalingDimension());
        this.htmlPanel = document.createElement('iframe');
        this.htmlPanel.setAttribute("style",
            //"background: red; " +
            "border: none; " +
            "margin: 0px; " +
            "padding: 0px; " +
            "position: absolute; " +
            "top: " + (this.height - panelHeight + topClearance) + "px; " +
            "left: " + shoulder + "px; " +
            "overflow: hidden; " +
            "width: " + (panelWidth - shoulder * 2) + "px; " +
            "height: " + (panelHeight - topClearance - shoulder) + "px;");
        TGE.Game.GameDiv().appendChild(this.htmlPanel);

        // Now write the legal text into its own div
        var doc = this.htmlPanel.contentWindow.document;
        doc.open();
        doc.write("<style>body {margin: 0px;}</style><div style='color: black; height: 96%; overflow: scroll; font-family: Arial; font-size: 18px; " +
            "padding: 0% " + this.panelSettings.padding + "% " + " 0% " + this.panelSettings.padding + "%;" +
            "'>" +
            GameConfig.TEXT_DEFS["tge_legal_footer"].text +
            "</div>");
        doc.close();
    },

    expandPanel: function()
    {
        var settings = this.panelSettings;

        // Remove the old iframe
        this._removeIFrame();

        this.expanded = true;

        // Freeze the game by setting the update root to the panel
        if(!TGE.Game.GetUpdateRoot() instanceof TGE.AdFooter)
        {
            // If a resize happens while the panel is expanded, we don't want to set the previous update root to the footer!
            this.previousUpdateRoot = TGE.Game.GetUpdateRoot();
        }
        TGE.Game.SetUpdateRoot(this);

        // Pull the panel up to its expanded position
        this.adjustPanelPosition();

        // Create an iframe to host the html. This is the only effective way to ignore any parent css rules.
        var shoulder = 1;
        var panelWidth = Math.floor(this.width);
        var topSpace = Math.floor(this.height - settings.expandedSize * this.height);
        var topClearance = Math.floor((settings.toggleButtonRadius * 3.5) * this._uiScalingDimension());
        var panelHeight = Math.floor(this.height - topSpace - topClearance);
        this.htmlPanel = document.createElement('iframe');
        this.htmlPanel.setAttribute("style",
            //"background: red; " +
            "border: none; " +
            "margin: 0px; " +
            "padding: 0px; " +
            "position: absolute; " +
            "top: " + (topSpace + topClearance) + "px; " +
            "left: " + shoulder + "px; " +
            "overflow: hidden; " +
            "width: " + (panelWidth - shoulder * 2) + "px; " +
            "height: " + (panelHeight - shoulder) + "px;");
        TGE.Game.GameDiv().appendChild(this.htmlPanel);

        // Now write the legal text into its own div
        var doc = this.htmlPanel.contentWindow.document;
        doc.open();
        doc.write("<style>body {margin: 0px;}</style><div style='color: black; height: 98%; overflow: scroll; font-family: Arial; font-size: 18px; " +
            "padding: 0% " + this.panelSettings.padding + "% " + " 0% " + this.panelSettings.padding + "%;" +
            "'>" +
            GameConfig.TEXT_DEFS["tge_legal_footer"].text +
            "</div>");
        doc.close();
    },

    adjustPanelPosition: function()
    {
        this.x = 0;
        this.y = this.stage._mFullStage.height * (1 - (this.expanded ? this.panelSettings.expandedSize : this.panelSettings.collapsedSize));
        this.width = this.stage._mFullStage.width;
        this.height = this.stage._mFullStage.height;
    },

    cleanup: function()
    {
        this._removeIFrame();
    },

    _removeIFrame: function()
    {
        if(this.htmlPanel)
        {
            this.htmlPanel.remove();
            this.htmlPanel = null;
        }
    },

    _onUpdate: function(event)
    {
        // Make sure the footer is always on top of the scene, only allow the TGE.AdHeader close button to be above it
        var top1 = this.stage._mChildren[this.stage._mChildren.length-1];
        var top2 = this.stage._mChildren.length>1 ? this.stage._mChildren[this.stage._mChildren.length-2] : null;
        if(!(top1===this || (top2===this && top1===TGE.AdHeader.GetInstance())))
        {
            this.bringToFront();
        }
    },

    _onDrawBegin: function(event)
    {
        // For expandable panels, draw the expand/collapse toggle button in the upper right
        if(this.expandable)
        {
            var ctx = event.canvasContext;

            var p = this._uiScalingDimension() * (this.panelSettings.padding/100);
            var radius = this._uiScalingDimension() * this.panelSettings.toggleButtonRadius;
            var centerX = this.width - p - radius;
            var centerY = p * 0.6 + radius;
            var lineLength = radius * 0.6;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = this.panelSettings.primaryColor;
            ctx.fill();

            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2 * window.devicePixelRatio;
            ctx.lineCap = "round";
            ctx.moveTo(centerX - lineLength, centerY);
            ctx.lineTo(centerX + lineLength, centerY);
            if(!this.expanded)
            {
                ctx.moveTo(centerX, centerY - lineLength);
                ctx.lineTo(centerX, centerY + lineLength);
            }
            ctx.stroke();
        }
    },

    _onClick: function(event)
    {
        if(this.expandable)
        {
            // Was the upper right expand/collapse toggle button clicked?
            var mx = event.x - this.x;
            var my = event.y - this.y;
            var size = this._uiScalingDimension() * 0.15;
            if(my <= size && mx >= this.width - size)
            {
                this.togglePanel();
            }
        }
    },

    _onResize: function(event)
    {
        // The way TGE elements behave responsively aren't in lock-step with the way the native html elements react
        // responsively, so it's easiest that we simply rebuild the whole html content on a resize.
        if(this.expandable)
        {
            this.makeHtmlPanel();
        }
    },

    _uiScalingDimension: function()
    {
        return Math.min(this.width, this.height);
    },

    /**
     * If the footer is removed we need to clear the singleton reference.
     */
    removeFromScene: function()
    {
        TGE.AdFooter.superclass.removeFromScene.call(this);

        this.cleanup();

        if(TGE.AdFooter._sInstance===this)
        {
            TGE.AdFooter._sInstance = null;
        }
    }
}
extend(TGE.AdFooter,TGE.DisplayObjectContainer);