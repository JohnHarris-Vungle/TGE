/**
 * <p>The TGE.AdFooter is used to display a persistent legal footer that will remain visible throughout the session above all screens.</p>
 * @class
 * @extends TGE.DisplayObjectContainer
 * @constructor
 */
TGE.AdFooter = function()
{
    // Assign the singleton
    TGE.AdFooter.__sInstance = this;

    TGE.AdFooter.superclass.constructor.call(this);

    this.instanceName = "tge_isi_text";
    this.expandable = false;
    this.expanded = false;
    this.previousUpdateRoot = TGE.Game.GetUpdateRoot();
    this.htmlPanel = null;
    this.panelSettings = null;
    this.panelHeaderText = null;

    // A hack, if not obvious :P
    GameConfig.TEXT_DEFS["tge_isi_text"] = GameConfig.TEXT_DEFS["tge_isi_text"] || {};
    GameConfig.TEXT_DEFS["tge_isi_text"].text = "<div class=\"isi-mainbody\"><h3>Who should not take FARXIGA?</h3>\n" +
        "<h4>Do not take FARXIGA if you:</h4>\n" +
        "<ul class=\"orange-bulleted-list\">\n" +
        "<li>are allergic to dapagliflozin or any of the ingredients in FARXIGA. Symptoms of a serious allergic reaction may include skin rash, raised red patches on your skin (hives), swelling of the face, lips, tongue, and throat that may cause difficulty in breathing or swallowing. If you have any of these symptoms, stop taking FARXIGA and contact your healthcare provider or go to the nearest hospital emergency room right away</li>\n" +
        "<li>have severe kidney problems or are on dialysis. Your healthcare provider should do blood tests to check how well your kidneys are working before and during your treatment with FARXIGA</li>\n" +
        "</ul>\n" +
        "<h3>What are the possible side effects of FARXIGA?</h3>\n" +
        "<h4>FARXIGA may cause serious side effects including:</h4>\n" +
        "<ul class=\"orange-bulleted-list\">\n" +
        "<li><span class=\"bold-text\">Dehydration</span> (the loss of body water and salt), which may cause you to feel dizzy, faint, lightheaded, or weak, especially when you stand up (orthostatic hypotension). You may be at a higher risk of dehydration if you have low blood pressure; take medicines to lower your blood pressure, including water pills (diuretics); are 65 years of age or older; are on a low salt diet, or have kidney problems</li>\n" +
        "<li><span class=\"bold-text\">Ketoacidosis</span> occurred in people with type 1 and type 2 diabetes during treatment with FARXIGA. Ketoacidosis is a serious condition which may require hospitalization and may lead to death. Symptoms may include nausea, tiredness, vomiting, trouble breathing, and abdominal pain. If you get any of these symptoms, stop taking FARXIGA and call your healthcare provider right away. If possible, check for ketones in your urine or blood, even if your blood sugar is less than 250 mg/dL</li>\n" +
        "<li><span class=\"bold-text\">Kidney problems.</span> Sudden kidney injury occurred in people taking FARXIGA. Call your healthcare provider right away if you reduce the amount you eat or drink, or if you lose liquids; for example, from vomiting, diarrhea, or excessive heat exposure</li>\n" +
        "<li><span class=\"bold-text\">Serious urinary tract infections (UTI),</span> some that lead to hospitalization, occurred in people taking FARXIGA. Tell your healthcare provider if you have any signs or symptoms of UTI including a burning feeling when passing urine, a need to urinate often, the need to urinate right away, pain in the lower part of your stomach (pelvis), or blood in the urine with or without fever, back pain, nausea, or vomiting</li>\n" +
        "<li><span class=\"bold-text\">Low blood sugar (hypoglycemia)</span> can occur if you take FARXIGA with another medicine that can cause low blood sugar, such as sulfonylureas or insulin. Symptoms of low blood sugar include shaking, sweating, fast heartbeat, dizziness, hunger, headache, and irritability. Follow your healthcare provider's instructions for treating low blood sugar</li>\n" +
        "<li><span class=\"bold-text\">Bacterial infections under the skin of the genitals and areas around them.</span> Rare but serious infections that cause severe tissue damage under the skin of the genitals and areas around them have happened with FARXIGA. This infection has happened in women and men and may lead to hospitalization, surgeries and death. Seek medical attention immediately if you have fever or you are feeling very weak, tired or uncomfortable and you also develop any pain or tenderness, swelling, or redness of the skin in the genitals and areas around them</li>\n" +
        "<li><span class=\"bold-text\">Vaginal yeast infections</span> in women who take FARXIGA. Talk to your healthcare provider if you experience vaginal odor, white or yellowish vaginal discharge (discharge may be lumpy or look like cottage cheese), or vaginal itching</li>\n" +
        "<li><span class=\"bold-text\">Yeast infection of skin around the penis (balanitis)</span> in men who take FARXIGA. Talk to your healthcare provider if you experience redness, itching, or swelling of the penis; rash of the penis; foul smelling discharge from the penis; or pain in the skin around penis. Certain uncircumcised men may have swelling of the penis that makes it difficult to pull back the skin around the tip of the penis</li>\n" +
        "<!--li><span class=\"bold-text\">Increase in bad cholesterol (LDL-C).</span> Your healthcare provider should check your LDL-C during treatment with FARXIGA</li>\n" +
        "<li><span class=\"bold-text\">Bladder cancer.</span> In studies of FARXIGA in people with diabetes, bladder cancer occurred in a few more people who were taking FARXIGA than in people who were taking other diabetes medications. There were too few cases of bladder cancer to know if bladder cancer was related to FARXIGA. Tell your healthcare provider right away if you have blood or a red color in your urine or pain while you urinate</li-->\n" +
        "</ul>\n" +
        "<p><span class=\"bold-text\">The most common side effects of FARXIGA include</span> yeast infections of the vagina or penis, and changes in urination, including urgent need to urinate more often, in larger amounts, or at night.</p>\n" +
        "<h3>What should I tell my healthcare provider before taking FARXIGA?</h3>\n" +
        "<h4>Before you take FARXIGA, tell your healthcare provider:</h4>\n" +
        "<ul class=\"orange-bulleted-list\">\n" +
        "<li><span class=\"bold-text\">all of your medical conditions,</span> including problems with your kidneys, liver, bladder, or pancreas</li>\n" +
        "<li><span class=\"bold-text\">if you have had, or have risk factors for, ketoacidosis</span> (including type 1 diabetes, are eating less due to illness, surgery, or a change in your diet, are going to have surgery, or binge drink)</li>\n" +
        "<li><span class=\"bold-text\">if you are pregnant, or plan to become pregnant.</span> FARXIGA may harm your unborn baby</li>\n" +
        "<li><span class=\"bold-text\">if you are breastfeeding, or plan to breastfeed.</span> It is unknown if FARXIGA passes into your breast milk</li>\n" +
        "<li><span class=\"bold-text\">about all the medicines you take,</span> including prescription and nonprescription medicines, vitamins, and herbal supplements</li>\n" +
        "</ul>\n" +
        "<h2 class=\"what-is-farxiga-isi\" id=\"what-is-farxiga-isi\">What is FARXIGA?</h2>\n" +
        "<p>FARXIGA is a prescription medicine used to:</p>\n" +
        "<ul class=\"orange-bulleted-list\">\n" +
        "<li>improve blood sugar control along with diet and exercise in adults with  <span class=\"nowrap\">type 2 diabetes</span></li>\n" +
        "<li>reduce the risk of hospitalization for heart failure in adults with type 2 diabetes and known cardiovascular disease or multiple cardiovascular  <span class=\"nowrap\">risk factors</span></li>\n" +
        "</ul>\n" +
        "\n" +
        "<p class=\"extra-marbtm25\">FARXIGA should not be used to treat people with type 1 diabetes or diabetic ketoacidosis (increased ketones in your blood or urine).</p>\n" +
        "<p class=\"bold-text\">Please see full <a href=\"http://www.azpicentral.com/pi.html?product=farxiga&amp;country=us&amp;popup=no\" target=\"_blank\" class=\"pdflink nowrap\">Prescribing Information</a> and <a href=\"http://www.azpicentral.com/pi.html?product=farxiga_med&amp;country=us&amp;popup=no\" target=\"_blank\" class=\"pdflink nowrap\">Medication Guide</a> for FARXIGA.</p>\n" +
        "<p class=\"normal-content fda-line\"><span class=\"italic-text \">You may report side effects related to AstraZeneca products by</span> <span class=\"nowrap\"><span class=\"italic-text \">clicking </span><a href=\"http://us-aereporting.astrazeneca.com\" target=\"_blank\">here</a></span>.</p>\n" +
        "</div>";
};

/** @ignore */
TGE.AdFooter.__sInstance = null;

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

    // Determine the panel type
    var style;
    if(TGE.RemoteSettings.HasSetting("legalTextStyle"))
    {
        style = TGE.RemoteSettings("legalTextStyle");
    }
    else
    {
        style = getQueryString()["legalTextStyle"];
        if(!style)
        {
            style = (TGE.RemoteSettings.HasSetting("useLegalText") && TGE.RemoteSettings("useLegalText")) ? "simple" : "none";
        }
    }

    // If the style is "none" then don't create anything
    if(style === "none")
    {
        return null;
    }

    // Create the footer object and add it to the full stage.
    game._mFullStage.addChild(new TGE.AdFooter().setup({
        style: style
    }));
};

/**
 * Returns the single instance of the TGE.AdFooter object.
 * @returns {TGE.AdFooter|null} The single instance of the TGE.AdFooter object, or null if an instance of the button has not been created yet.
 */
TGE.AdFooter.GetInstance = function()
{
    return TGE.AdFooter.__sInstance;
}

TGE.AdFooter.Destroy = function()
{
    if(TGE.AdFooter.__sInstance!==null)
    {
        TGE.AdFooter.__sInstance.removeFromScene();

        // Reset the game stage size in case it was previously a panel footer. Admittedly this makes the assumption that
        // only the ad footer can control the game stage size, which although currently true may not be the case in the
        // future. When other use cases arise we'll need to figure out a good way for multiple features to request changes
        // to game stage height without conflict.
        TGE.Game.GetInstance()._mFullStage.setGameStageHeight(1);
    }
}

TGE.AdFooter.prototype =
{
    setup: function(params)
    {
        // Initialize members and settings based on the style
        switch(params.style)
        {
            case "isiPanel":
            {
                this.expandable = true;
                this.panelSettings = {
                    expandedSize: 0.92, // in percent (leave some clearance so the ad close button isn't confused with panel close)
                    padding: 4, // css percent. This is the padding around the text in the panel.
                    toggleButtonRadius: 0.03
                };
            }
            break;

            case "simple":
            default:
            {
                this.expandable = false;
                this.panelSettings = null;
            }
                break;
        }

        // Proceed with setup...
        if(this.expandable)
        {
            var settings = this.panelSettings;

            // Push the game stage up to make room for the top of the panel
            TGE.Game.GetInstance()._mFullStage.setGameStageHeight(1 - this._panelCollapsedSize());

            if(GameConfig.COLOR_DEFS && GameConfig.COLOR_DEFS["tge_isi_background"])
            {
                params.colorDef = "tge_isi_background"
            }
            else
            {
                params.backgroundColor = "#ffffff";
            }

            params.registrationX = 0;
            params.registrationY = 0;
            params.layout = function() {
                this.adjustPanelPosition();
            };

            // Important Safety Information header
            this.panelHeaderText = this.addChild(new TGE.Text().setup({
                text: "Important Safety Information",
                textColor: this._headerColor(),
                fontSize: 14,
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

            // A draw listener for the expand/collapse button
            this.addEventListener("drawbegin", this._onDrawBegin);

            // A resize listener is necessary since responsive css behavior doesn't align with TGE responsive behavior
            this.addEventListener("resize", this._onResize);

            // If we're in the CB editor, apply the header colorDef every frame
            if(TGE.InCreativeBuilder())
            {
                this.addEventListener("update", this._updateHeaderColor);
            }
        }
        else
        {
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

        // NOTE: the iframe size/positioning is done differently here compared to the expanded state, where the iframe
        // only occupies space on top of the actual panel area. However there was a very annoying bug on iOS (likely
        // v12 and under), where the contents of the iframe where rendered invisible if the top setting of the iframe
        // was below a certain percentage of the screen. The only successful workaround was to cover the entire viewport
        // with the iframe (disabling all user input), and sizing/positioning the content div over just the panel.

        // Create an iframe to host the html. This is the only effective way to ignore any parent css rules.
        var shoulder = 1;
        var panelHeight = Math.floor(this._panelCollapsedSize() * this.height);
        var panelWidth = Math.floor(this.width);
        var topClearance = Math.floor((settings.toggleButtonRadius * 3.5) * this._uiScalingDimension());
        this.htmlPanel = document.createElement('iframe');
        this.htmlPanel.setAttribute("style",
            //"background: red; " +
            "user-select: none; " +
            "pointer-events: none; " +
            "border: none; " +
            "margin: 0px; " +
            "padding: 0px; " +
            "position: absolute; " +
            "top: 0px; " +
            "left: " + shoulder + "px; " +
            "overflow: hidden; " +
            "width: " + (panelWidth - shoulder * 2) + "px; " +
            "height: " + this.height + "px;");
        TGE.Game.GameDiv().appendChild(this.htmlPanel);

        // Now write the legal text into its own div
        var doc = this.htmlPanel.contentWindow.document;
        doc.open();
        doc.write("<style>body {margin: 0px; overflow: hidden;}</style><div style='position: absolute; top: " +
            (this.height - panelHeight + topClearance) + "px; height: " + (panelHeight - topClearance - 5) + "px; " +
            //"background: red; " +
            "color: black; overflow-x: hidden; overflow-y: hidden; font-family: Arial; font-size: " + this._fontSize() + "px; " +
            "padding: 0% " + this.panelSettings.padding + "% " + " 0% " + this.panelSettings.padding + "%;" +
            "'>" +
            GameConfig.TEXT_DEFS["tge_isi_text"].text +
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
        var topSpace = Math.floor(this.height - this._panelExpandedSize() * this.height);
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
        doc.write("<style>body {margin: 0px;}</style><div style='color: black; height: 98%; overflow-x: hidden; overflow-y: scroll; font-family: Arial; font-size: " + this._fontSize() + "px; " +
            "padding: 0% " + this.panelSettings.padding + "% " + " 0% " + this.panelSettings.padding + "%;" +
            "'>" +
            GameConfig.TEXT_DEFS["tge_isi_text"].text +
            "</div>");
        doc.close();
    },

    adjustPanelPosition: function()
    {
        this.x = 0;
        this.y = this._mFullStage.height * (1 - (this.expanded ? this._panelExpandedSize() : this._panelCollapsedSize()));
        this.width = this._mFullStage.width;
        this.height = this._mFullStage.height;
    },

    cleanup: function()
    {
        this._removeIFrame();
    },

    /** @ignore
     * Claim this object is cached so that the Creative Builder will request a re-cache on changes like text updates.
     */
    isCached: function()
    {
        return true;
    },

    /** @ignore
     * This prompts the html panel to update.
     */
    cache: function(obj)
    {
        this.makeHtmlPanel();
    },

    _removeIFrame: function()
    {
        if(this.htmlPanel)
        {
            this.htmlPanel.remove();
            this.htmlPanel = null;
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
            ctx.fillStyle = this._headerColor();
            ctx.fill();

            ctx.beginPath();
            ctx.strokeStyle = this._backgroundColor();
            ctx.lineWidth = Math.round(1.75 * window.devicePixelRatio);
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
                TGE.Analytics.CustomEvent("footer" + (this.expanded ? "Collapse" : "Expand"));
                this.togglePanel();
            }
        }
    },

    _onResize: function(event)
    {
        // Make sure that the amount of space the footer pushes the game stage into hasn't changed
        var gameStageSize = this._mFullStage.gameStage.getHeight();
        var requiredSize = this.expandable ?  (1 - this._panelCollapsedSize()) : 1;
        if(gameStageSize !== requiredSize)
        {
            this._mFullStage.setGameStageHeight(requiredSize);
        }

        if(this.expandable)
        {
            // The way TGE elements behave responsively aren't in lock-step with the way the native html elements react
            // responsively, so it's easiest that we simply rebuild the whole html content on a resize.
            this.makeHtmlPanel();
        }
    },

    _uiScalingDimension: function()
    {
        return Math.min(this._portraitTablet() ? this.width * 0.8 : this.width, this.height);
    },

    _panelCollapsedSize: function()
    {
        // Don't take up as much of the screen in landscape, since it's already very limited
        return this._mFullStage.width > this._mFullStage.height ? 0.20 : 0.25;
    },

    _panelExpandedSize: function()
    {
        // Allow some additional close button clearance in landscape
        return this.panelSettings.expandedSize * (this._mFullStage.width > this._mFullStage.height ? 0.9 : 1);
    },

    _fontSize: function()
    {
        // As portrait aspect ratio approaches more of a square (like on tablet), use the landscape font size
        var landscape = this._mFullStage.width > this._mFullStage.height || this._portraitTablet();
        var width = this.htmlPanel.offsetWidth;
        var divisor = landscape ? 62 : 32;

        return Math.round(width/divisor);
    },

    _backgroundColor: function()
    {
        return (GameConfig.COLOR_DEFS && GameConfig.COLOR_DEFS["tge_isi_background"]) || "#ffffff";
    },

    _headerColor: function()
    {
        return (GameConfig.COLOR_DEFS && GameConfig.COLOR_DEFS["tge_isi_header"]) || "#000000";
    },

    _updateHeaderColor: function()
    {
        this.panelHeaderText.textColor = this._headerColor();
    },

    _portraitTablet: function()
    {
        return this._mFullStage.width <= this._mFullStage.height &&
            this._mFullStage.width * 1.34 > this._mFullStage.height;
    },

    /**
     * If the footer is removed we need to clear the singleton reference.
     */
    removeFromScene: function()
    {
        TGE.AdFooter.superclass.removeFromScene.call(this);

        this.cleanup();

        if(TGE.AdFooter.__sInstance===this)
        {
            TGE.AdFooter.__sInstance = null;
        }
    }
}
extend(TGE.AdFooter,TGE.DisplayObjectContainer);