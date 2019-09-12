/**
 <p>The CrossfadeSprite class is sprite that can crossfade between images.</p>
 * @class
 * @extends TGE.Sprite
 * @constructor
 */
TGE.CrossfadeSprite = function ()
{
    TGE.CrossfadeSprite.superclass.constructor.call(this);

    // Private members
    this._mCrossfadeTexture = null;
    this._mCrossfadeCellWidth = 0;
    this._mCrossfadeCellHeight = 0;
    this._mCrossfadeOffsetX = 0;
    this._mCrossfadeOffsetY = 0;
    this._mCrossfadeCoordinateCache = null;
    this._mCrossfadeImg = null;
    this._mCrossfadeAlpha = 0;
    this._mCrossfadeDuration = 0;
    this._mCrossfadeDefaultDuration = 0.5;
    this._mCrossfadeUpdate = null;

    return this;
}

TGE.CrossfadeSprite.prototype =
    {
        setup: function (params)
        {
            TGE.CrossfadeSprite.superclass.setup.call(this, params);

            this.intendedWidth = typeof(params.width) === "number" ? params.width : null;
            this.intendedHeight = typeof(params.height) === "number" ? params.height : null;

            return this;
        },

        /**
         * Prepares the specified image to be crossfaded into the sprite object.
         * @param {String} img An image id string indicating the desired image to load from the {@link TGE.AssetManager} singleton.
         * @param {Number} [duration=0.5] The duration of the crossfade tween.
         */
        crossfade: function (img, duration)
        {
            this._mCrossfadeTexture = null;

            // Is the image specified an actual image asset or the id string?
            if (typeof img === "string")
            {
                this._mCrossfadeTexture = TGE.AssetManager.GetTexture(img);
            }

            if (this._mCrossfadeTexture && (this._mCrossfadeTexture.htmlImageWidth <= 0 || this._mCrossfadeTexture.htmlImageHeight <= 0))
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.Crossfade sprite has invalid dimensions ("+ this._mCrossfadeTexture.htmlImageWidth
                    +"x" + this._mCrossfadeTexture.htmlImageHeight + "), image likely did not load");
                this._mCrossfadeTexture = null;
            }

            if (this._mCrossfadeTexture)
            {
                this._mCrossfadeDuration = (typeof(duration) === "number" ? duration : this._mCrossfadeDefaultDuration);
                this._mCrossfadeImg = img;
                this._mCrossfadeOffsetX = 0;
                this._mCrossfadeOffsetY = 0;

                if (this._mCrossfadeTexture.spriteSheet)
                {
                    var spriteSheetInfo = TGE.AssetManager.Get(img);

                    this._mCrossfadeCellWidth = spriteSheetInfo.width;
                    this._mCrossfadeCellHeight = spriteSheetInfo.height;

                    this._mCrossfadeCoordinateCache = [];
                    this._mCrossfadeCoordinateCache = [[Math.round(spriteSheetInfo.x), Math.round(spriteSheetInfo.y)]];
                    this._mCrossfadeDrawWidth = this._mCrossfadeOriginalWidth = Math.round(this._mCrossfadeCellWidth);
                    this._mCrossfadeDrawHeight = this._mCrossfadeOriginalHeight = Math.round(this._mCrossfadeCellHeight);

                    if (spriteSheetInfo.hasOwnProperty("offsetX"))
                    {
                        this._mCrossfadeOffsetX = spriteSheetInfo.offsetX;
                        this._mCrossfadeOffsetY = spriteSheetInfo.offsetY;
                        this._mCrossfadeDrawWidth = spriteSheetInfo.drawWidth;
                        this._mCrossfadeDrawHeight = spriteSheetInfo.drawHeight;
                    }
                }
                else
                {
                    this._mCrossfadeDrawWidth = this._mCrossfadeOriginalWidth = Math.round(this._mCrossfadeTexture.htmlImageWidth);
                    this._mCrossfadeDrawHeight = this._mCrossfadeOriginalHeight = Math.round(this._mCrossfadeTexture.htmlImageHeight);
                    this._mCrossfadeCellWidth = this._mCrossfadeTexture.htmlImageWidth;
                    this._mCrossfadeCellHeight = this._mCrossfadeTexture.htmlImageHeight;
                    this._mCrossfadeCoordinateCache = [];
                    this._mCrossfadeCoordinateCache = [[0, 0]];
                }

                // Since we're not requiring an initial 'image' to be passed in, if there's no width/height at this point, set the official width/height to the width/height of the crossfade image
                if (this._mRendererTexture === null)
                {
                    this.width = this.intendedWidth ? this.intendedWidth : this._mCrossfadeCellWidth;
                    this.height = this.intendedHeight ? this.intendedHeight : this._mCrossfadeCellHeight;

                    // Sometimes we're calling this function directly from setup(), and in that case, there would be no parent object yet
                    if (this.parent)
                    {
                        this.handleEvent(TGE._ResizeEvent);
                    }
                }

                if (this._mCrossfadeUpdate)
                {
                    this.removeEventListener("update", this._mCrossfadeUpdate);
                }

                this._mCrossfadeUpdate = this.addEventListener("update", this._updateCrossfade.bind(this));
            }
        },

        /** @ignore */
        _updateCrossfade: function (event)
        {
            this._mCrossfadeAlpha += event.elapsedTime / this._mCrossfadeDuration * this.alpha;

            if (this._mCrossfadeAlpha >= this.alpha)
            {
                this._finishCrossfade();
            }
        },

        /** @ignore */
        _finishCrossfade: function ()
        {
            this.removeEventListener("update", this._mCrossfadeUpdate);

            this._mCrossfadeTexture = null;
            this._mCrossfadeUpdate = null;
            this._mCrossfadeAlpha = 0;

            var width = this.intendedWidth ? this.intendedWidth : this.width;
            var height = this.intendedHeight ? this.intendedHeight : this.height;

            this.setSizedImage(this._mCrossfadeImg, width, height);
        },

        /** @ignore */
        _objectDraw: function (renderer)
        {
            // If the base object is semi-transparent, do a true crossfade so that the semi-transparency is maintained.
            // Otherwise, do a half crossfade so the image maintains its opacity throughout the tween.
            if (this.alpha < 1)
            {
                renderer._mCanvasContext.globalAlpha = this.alpha - this._mCrossfadeAlpha;
            }

            // Do the Sprite drawing
            TGE.CrossfadeSprite.superclass._objectDraw.call(this, renderer);

            // Draw the image on the canvas
            if (this._mCrossfadeTexture !== null)
            {
                var scaleX = this.width / this._mCrossfadeOriginalWidth;
                var scaleY = this.height / this._mCrossfadeOriginalHeight;
                var sx = (this._mCrossfadeCoordinateCache[0][0] >> 0);
                var sy = (this._mCrossfadeCoordinateCache[0][1] >> 0);
                var dx = this._mCrossfadeOffsetX * scaleX;
                var dy = this._mCrossfadeOffsetY * scaleY;
                var dWidth = this._mCrossfadeDrawWidth * scaleX;
                var dHeight = this._mCrossfadeDrawHeight * scaleY;

                renderer._mCanvasContext.globalAlpha = this._mCrossfadeAlpha;

                renderer.drawImage(this._mCrossfadeTexture, sx, sy, this._mCrossfadeDrawWidth, this._mCrossfadeDrawHeight, dx, dy, dWidth, dHeight);
            }
        },
    }
extend(TGE.CrossfadeSprite, TGE.Sprite);