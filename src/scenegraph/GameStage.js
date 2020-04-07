TGE.GameStage = function(trueStage)
{
    TGE.GameStage.superclass.constructor.call(this);

    this.stage = this;

    this._mFullStage = trueStage;
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
    }
}
extend(TGE.GameStage, TGE.DisplayObjectContainer);