TGE.GameStage = function(fullStage)
{
    TGE.GameStage.superclass.constructor.call(this);

    this.stage = this;

    this._mFullStage = fullStage;
    this._mHeightRatio = 1.0; // 100%

    this.registrationX = this.registrationY = 0;
    this.layout = this._layoutFunction.bind(this);

    return this;
}

TGE.GameStage.prototype =
{
    /**
     * Indicates whether the game view is currently in landscape orientation
     * @returns {Boolean} Returns true if the game is in landscape
     */
    isLandscape: function()
    {
        return this.height < this.width;
    },

    /**
     * Indicates whether or not the mouse (or other user input device) is currently down.
     * @return {Boolean} Whether or not the mouse (or other user input device) is currently down.
     */
    isMouseDown: function()
    {
        return this._mFullStage._mMouseDown;
    },

    /** @ignore */
    _setHeight: function(height)
    {
        this._mHeightRatio = height;

        // Force it to resize
        this._layoutFunction();
    },

    /** @ignore */
    _layoutFunction: function()
    {
        this.x = this.parent.percentageOfWidth(this.registrationX);
        this.y = this.parent.percentageOfHeight(this.registrationY);
        this.width = this.parent.width;
        this.height = this.parent.height * this._mHeightRatio;
        this.scale = 1;
    },

    /**
     * (documented in superclass)
     * @ignore
     */
    getBounds: function()
    {
        // PAN-354 overriding this function to always return the intended stage dimensions without querying children
        return TGE.GameStage.superclass.getBounds.call(this, true);
    },
}
extend(TGE.GameStage, TGE.DisplayObjectContainer);