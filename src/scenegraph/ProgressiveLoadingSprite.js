/**
 <p>The ProgressiveLoadingSprite class is a crossfade sprite that displays and fades in a high-res version of an image once a certain asset list is loaded.</p>
 * @class
 * @extends TGE.CrossfadeSprite
 * @constructor
 */
TGE.ProgressiveLoadingSprite = function ()
{
    TGE.ProgressiveLoadingSprite.superclass.constructor.call(this);
    return this;
}

TGE.ProgressiveLoadingSprite.prototype =
    {
        /**
         * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
         * @param {Object} params Information used to initialize the object.
         * @param {String} [params.lowResImage] An image id string indicating the lower resolution image to display while the higher resolution image loads.
         * @param {String} [params.highResImage] An image id string indicating the higher resolution image that should fade overtop of the low resolution image when it loads.
         * @deprecated @param {Number} [params.assetList] No longer need the asset list number, and will crossfade as soon as the asset is loaded
         * @param {Number} [params.duration] The duration of the crossfade between lowResImage and highResImage when highResImage is finished loading.
         * @return {TGE.ProgressiveLoadingSprite} Returns this object.
         */
        setup: function (params)
        {

            params.image = (typeof(params.lowResImage) === "string" && !getQueryString()["draft"]) ? params.lowResImage : null;

            TGE.ProgressiveLoadingSprite.superclass.setup.call(this, params);

            var assetList = typeof(params.assetList) === "number" ? params.assetList : null;
            var duration = typeof(params.duration) === "number" ? params.duration : null;
            typeof(params.highResImage) === "string" ? this.setHighResImage(params.highResImage, assetList, duration) : null;

            return this;
        },

        setHighResImage: function (highResImage, assetList, duration)
        {
            if (highResImage)
            {
                if (TGE.Game.GetInstance().isAssetLoaded(highResImage))
                {
                    this.image = highResImage;
                }
                else
                {
                    TGE.Game.GetInstance().waitForAsset(highResImage, this.crossfade.bind(this, highResImage, duration), false);
                }
            }
        }
    }
extend(TGE.ProgressiveLoadingSprite, TGE.CrossfadeSprite);

Object.defineProperty(TGE.ProgressiveLoadingSprite.prototype, 'highResImage', {
    set: function(highResImage)
    {
        this.setHighResImage(highResImage);
    }
});