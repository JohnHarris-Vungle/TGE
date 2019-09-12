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

    // Event listeners
    this.addEventListener("update",this._onUpdate);
}

/** @ignore */
TGE.AdFooter._sInstance = null;

/**
 * Creates an instance of the TGE.AdFooter object and adds it to the scene.
 * @returns {TGE.AdFooter|null} The instance of the TGE.AdFooter object, or null if it was too early to add it to the scene.
 */
TGE.AdFooter.Create = function()
{
    // We want this function to also add the text to the scene, so make sure the scene is ready
    if(!TGE.Game.GetInstance() || !TGE.Game.GetInstance().stage)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AdFooter.Create was called too early - wait until the TGE game object has been launched");
        return null;
    }

    // If this is being called twice, nuke the old one
    if(TGE.AdFooter._sInstance!==null)
    {
        TGE.AdFooter._sInstance.markForRemoval();
        TGE.AdFooter._sInstance = null;
    }

    // Create the instance and add it to the stage
    var adFooter = TGE.Game.GetInstance().stage.addChild(new TGE.AdFooter().setup({
        //backgroundColor: "pink",
		registrationX: 0.5,
        registrationY: 1,
        width: 125,
        height: 125,
        layout: function() {
            this.x = this.stage.width/2;
            this.y = this.stage.height*0.995;
            this.width = this.stage.width;
            this.height = this.stage.height*0.05;
        }
    }));

    adFooter.text = adFooter.addChild(new TGE.Text().setup({
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

/**
 * Returns the single instance of the TGE.AdFooter object.
 * @returns {TGE.AdFooter|null} The single instance of the TGE.AdFooter object, or null if an instance of the button has not been created yet.
 */
TGE.AdFooter.GetInstance = function()
{
    return TGE.AdFooter._sInstance;
}

TGE.AdFooter.prototype =
{
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

    /**
     * If the footer is removed we need to clear the singleton reference.
     */
    removeFromScene: function()
    {
        TGE.AdFooter.superclass.removeFromScene.call(this);

        if (TGE.AdFooter._sInstance===this)
        {
            TGE.AdFooter._sInstance = null;
        }
    }
}
extend(TGE.AdFooter,TGE.DisplayObjectContainer);