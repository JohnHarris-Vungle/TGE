/**
 * @class Similar to a ScreenEntity except that it is positioned in world space and viewed via the game's camera. Subsequently the screen position of a GameWorldEntity is relative to the location of the game camera.
 * @constructor
 * @extends TGE.ScreenEntity
 */
TGE.GameWorldEntity = function(game)
{
    TGE.ScreenEntity.call(this,game);

    this.worldPosition = new TGE.Point();

    // A GameWorldEntity is dependent on the camera position, so listen for changes
    this.addEventListener("camerachange",this._updateScreenPosition);
}

TGE.GameWorldEntity.prototype =
{
    _mLockXPosition: false,

    /**
     * Initializes the basic properties of a ScreenEntity object.
     * @param x {Number} The horizontal position of the object in the game world.
     * @param y {Number} The vertical position of the object in the game world.
     * @param [imageID] {String} The id of the image used to represent this object. If an image is set using this function it can only be a single frame (1x1 compound image).
     * @param [layerID] {String} The id of the layer to add this object to. If not specified, the object will be added to the default back layer.
     * @return {TGE.ScreenEntity}
     */
    Setup: function(x,y,imageID,layerID)
    {
        this.mLayer = layerID;
        this.SetWorldPosition(x,y);
        this.setImage(this.mGame.GetImage(imageID));
        this.mGame.getLayer(this.mLayer).addChild(this);

        return this;
    },

    /**
     * Sets the position of the entity within world space.
     * @param x {Number} Desired x-coordinate of the entity in world space.
     * @param y {Number} Desired y-coordinate of the entity in world space.
     */
    SetWorldPosition: function(x,y)
    {
        this.worldPosition.x = x;
        this.worldPosition.y = y;
    },

    /**
     * Each side of the viewport can be flagged such that if the entity moves beyond that side, it will be flagged for removal from the game.
     * Useful for side-scrolling or launch style games where objects are no longer needed once they move off screen in a particular direction.
     * @param top {Boolean} If set to true the entity will be flagged for removal if it moves beyond the top of the visible viewing area.
     * @param right {Boolean} If set to true the entity will be flagged for removal if it moves past the right side of the visible viewing area.
     * @param bottom {Boolean} If set to true the entity will be flagged for removal if it moves below the bottom of the visible viewing area.
     * @param left {Boolean} If set to true the entity will be flagged for removal if it moves past the left side of the visible viewing area.
     */
    CullToCamera: function(top,right,bottom,left)
    {
        // If a side is set to true, the object will be removed from the
        // scene as soon as it passes out of the camera's view on that side
        this._mCameraCulling = [top,right,bottom,left];
    },

    /**
     * Returns the coordinates of the entity within the game world.
     * @return {Vector} A 2D Sylvester vector object.
     */
    WorldPosition: function()
    {
        return this.mWorldPosition;
    },

    /* This function's behavior is probably too specific to be documented as a core feature */
    /** @ignore */
    LockXPosition: function()
    {
        this._mLockXPosition = true;
    },

    /** @ignore */
    _updateScreenPosition: function(event)
    {
        // Update the screen position
        var x = this._mLockXPosition ? this.worldPosition.x : (this.stage.width/2)+(this.worldPosition.x-event.cx);
        var y = (this.stage.height/2)-(this.worldPosition.y-event.cy);
        this.x = x;
        this.y = y;
    }
}
extend(TGE.GameWorldEntity, TGE.ScreenEntity, null);
