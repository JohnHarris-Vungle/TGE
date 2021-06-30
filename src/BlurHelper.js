/**
 * `BlurHelper` is a TGE-agnostic helper class to assist in creating canvas-based blur effects with a fallback for
 * platforms like Safari where canvas filters are not supported.
 * Typically you would use it by creating a new instance of `BlurHelper` in the setup function of a `DisplayObject`.
 * After `BlurHelper` has been instantiated, you can call the drawBlurredImage method anywhere you might use ctx.drawImage()
 * - Blur can be adjusted in real time through the `blurAmount` property, all internal updates are handled automatically though a Setter.
 * - If you run into performance issues, check whether you are setting the BlurHelper to a larger width/height than needed.
 * - Don't change smoothingQuality unless you run into serious performance issues specifically on Safari as it drastically lowers quality.
 * @class TGE.BlurHelper
 * @param {object} params - Information used to initialize the text container.
 * @param {number} params.width - The width of the output image, pre-blur application
 * @param {number} params.height - The height of the output image, pre-blur application
 * @param {number} [params.blurAmount=0] - How many pixels of blur to apply.
 * @param {boolean} [params.fillToEdge=false] - If set to true, it will keep cut off excess blur and increase size to attempt to fill its container
 * @param {string} [params.smoothingQuality=high] - Sets the imageSmoothingQuality when using the fallback approach.
 * @param {boolean} [params.debugMode=false] - Helper visuals for debugging issues with blurred objects. Don't rely on this existing.
 */

TGE.BlurHelper = function (params)
{
    // This ratio approximates the ratio of pixels influenced per unit of blur.
    // We use this to scale things up and prevent transparency leaking through when fillToEdge is true.
    this.SIZE_UP_MULTIPLIER = 6;

    this.fillToEdge = typeof params.fillToEdge === "boolean" ? params.fillToEdge : false;
    this.smoothingQuality = params.smoothingQuality ? params.smoothingQuality : 'high';
    this.debugMode = typeof params.debugMode === "boolean" ? params.debugMode : false;

    this._offscreenCanvasComposite = document.createElement('canvas');
    this.filterSupported = !!this._offscreenCanvasComposite.getContext('2d').filter;

    if (!this.filterSupported)
    {
        this._offscreenCanvasA = document.createElement('canvas');
        this._offscreenCanvasB = document.createElement('canvas');
    }

    this._setBlur(params.blurAmount ? params.blurAmount : 0);

    this.applySizes(
        params.width ? params.width : 256,
        params.height ? params.height : 256
    );

    Object.defineProperty(this, "blurAmount", {
        get: function ()
        {
            return this._originalBlurValue;
        },
        set: function (amount)
        {
            if (this._originalBlurValue === amount) return;
            this._setBlur(amount);
            this._calculateSizes();
        }
    });
}

TGE.BlurHelper.prototype = {

    /**
     * Use this method to change sizes at runtime.
     * It will handle updating internal size calculations.
     * @param {number} [width] - Set the new base width of the BlurHelper
     * @param {number} [height] - Set the new base height of the BlurHelper
     */
    applySizes: function (width, height)
    {
        width = Math.ceil(width);
        height = Math.ceil(height);
        if (width === this.width && height === this.height) return;

        if (width) this.width = width;
        if (height) this.height = height;

        if (!this.filterSupported)
        {
            this._offscreenCanvasA.width = this._offscreenCanvasB.width = Math.ceil(width / 2) + 2;
            this._offscreenCanvasA.height = this._offscreenCanvasB.height = Math.ceil(height / 2) + 2;
        }

        this._calculateSizes()
    },

    /**
     * This composites the image blurred to an offscreen canvas and draws it into your target canvas context.
     * Call this method anywhere you might use `ctx.drawImage()`.
     * This function will recomposite the blur effect on every call and is useful for frequently changing use cases such as video.
     * @param {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas} image - An element to draw into the context.
     * @param {CanvasRenderingContext2D} destinationCTX - The canvas context you want to draw into
     * @param {number} sx - Source x coordinate
     * @param {number} sy - Source y coordinate
     * @param {number} sw - Source rect width
     * @param {number} sh - Source rect height
     * @param {number} dx - Destination x coordinate
     * @param {number} dy - Destination y coordinate
     * @param {number} dw - Destination rect width
     * @param {number} dh - Destination rect height
     */
    drawBlurredImage: function (image, destinationCTX, sx, sy, sw, sh, dx, dy, dw, dh)
    {
        if (image instanceof HTMLVideoElement ? image.videoWidth && image.videoHeight : image.width && image.height)
        {
            this.compositeBlur(image, sx, sy, sw, sh);
            this.drawCompositedBlur(destinationCTX, dx, dy, dw, dh);
        }
    },

    /**
     * This composites the image blurred to an offscreen canvas and returns a reference to that canvas.
     * Often used in conjunction with the `drawCompositedBlur` method. If you adjust blur/sizes infrequently,
     * you can use this when changing blur or dimensions to cache it and draw it repeatedly with `drawCompositedBlur`.
     * Use the returned canvas reference with care as it's managed internally by the class.
     * @param {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas} image - An element to draw into the context.
     * @param {number} sx - Source x coordinate
     * @param {number} sy - Source y coordinate
     * @param {number} sw - Source rect width
     * @param {number} sh - Source rect height
     * @returns {HTMLCanvasElement}
     */
    compositeBlur: function (image, sx, sy, sw, sh)
    {
        if (this.filterSupported)
        {
            this._compositeBlurFilter(image, sx, sy, sw, sh);
        }
        else
        {
            // As a fallback, notably for Safari, use a downscale+upscale image resizing approach.
            this._compositeBlurResize(image, sx, sy, sw, sh);
        }

        if (this.debugMode) this._compositeDebugDraw();

        return this._offscreenCanvasComposite;
    },

    /**
     * This draws a previously composited blurred image into your target canvas context. You'll want to call `compositeBlur` first.
     * @param {CanvasRenderingContext2D} destinationCTX - The canvas context you want to draw into
     * @param {number} dx - Destination x coordinate
     * @param {number} dy - Destination y coordinate
     * @param {number} dw - Destination rect width
     * @param {number} dh - Destination rect height
     */
    drawCompositedBlur: function(destinationCTX, dx, dy, dw, dh)
    {
        var compositeWidth = dw / this.width * this.compositeWidth;
        var compositeHeight = dh / this.height * this.compositeHeight;
        var offsetX = (compositeWidth - dw) / 2;
        var offsetY = (compositeHeight - dh) / 2;

        destinationCTX.drawImage(
            this._offscreenCanvasComposite, 0, 0, this.compositeWidth, this.compositeHeight,
            dx - offsetX, dy - offsetY, compositeWidth, compositeHeight
        );
    },

    /**
     * Call this function when the object using the BlurHelper is cleared up in order to prevent orphaned canvases
     */
    cleanupCanvases: function() {
        this._offscreenCanvasComposite.remove();

        if (!this.filterSupported)
        {
            this._offscreenCanvasA.remove();
            this._offscreenCanvasB.remove();
        }
    },

    _setBlur: function (amount)
    {
        // The two methods of blurring change differently
        // I manually plotted visually equivalent blur amounts between the two methods
        // and found an equation that very closely approximated the visual relationship curve
        this._blurAmount = (this.filterSupported) ? amount : Math.round(0.8 * Math.pow(amount, 1.2));
        this._originalBlurValue = amount;

        // Set filter up front in case of startup costs
        // Currently disabled since it seems the canvas context
        // won't preserve this and it needs to be re-called every frame anyways
        // if (this.filterSupported) {
        //     this._offscreenCanvasComposite.getContext('2d').filter = 'blur(' + this._blurAmount + 'px)';
        // }
    },

    _calculateSizes: function ()
    {
        this._offscreenCanvasComposite.width = this.compositeWidth = this.fillToEdge ? this.width : this.width + this.SIZE_UP_MULTIPLIER * this._originalBlurValue;
        this._offscreenCanvasComposite.height = this.compositeHeight = this.fillToEdge ? this.height : this.height + this.SIZE_UP_MULTIPLIER * this._originalBlurValue;

        this.xCompositeOffset = (this.compositeWidth - this.width) / 2;
        this.yCompositeOffset = (this.compositeHeight - this.height) / 2;

        this._sizeUpAmount = this.fillToEdge ? this.SIZE_UP_MULTIPLIER * this._originalBlurValue : -1 * this._originalBlurValue;

        if (!this.filterSupported) this._calculateResizeMethodSizes();
    },

    _calculateResizeMethodSizes: function ()
    {
        // Add blank padding so when resizing up the browser will blur edges properly
        var blankPadding = this._blurAmount !== 0 ? 1 : 0;
        // Offset by half a pixel to get additional blurring and faded edges
        var halfPixelOffset = this._blurAmount !== 0 ? 0.5 : 0;
        var addedSize = 2 * blankPadding + 2 * halfPixelOffset;

        var smallWidthBase = Math.max(this.width / (1 + this._blurAmount), 4);
        var smallHeightBase = Math.max(this.height / (1 + this._blurAmount), 4);

        this._smallA_width = Math.floor(smallWidthBase);
        this._smallA_height = Math.floor(smallHeightBase);
        this._smallA_offset = blankPadding + halfPixelOffset;
        this._smallA_sw = this._smallA_width + addedSize;
        this._smallA_sh = this._smallA_height + addedSize;

        this._smallB_width = (smallWidthBase === this._smallA_width) ? smallWidthBase + 1 : Math.ceil(smallWidthBase);
        this._smallB_height = (smallHeightBase === this._smallA_height) ? smallHeightBase + 1 : Math.ceil(smallHeightBase);
        this._smallB_offset = blankPadding + halfPixelOffset;
        this._smallB_sw = this._smallB_width + addedSize;
        this._smallB_sh = this._smallB_height + addedSize;

        var scaleRatioWidth = (this.width + this._sizeUpAmount) / this._smallA_width;
        var scaleRatioHeight = (this.height + this._sizeUpAmount) / this._smallA_height;

        this._smallA_dw = this._getNearestEvenPadding(scaleRatioWidth * this._smallA_sw, this.width);
        this._smallA_dh = this._getNearestEvenPadding(scaleRatioHeight * this._smallA_sh, this.height);
        this._smallA_dx = (this.compositeWidth - this._smallA_dw) / 2;
        this._smallA_dy = (this.compositeHeight - this._smallA_dh) / 2;

        this._smallB_dw = this._getNearestEvenPadding(scaleRatioWidth * this._smallB_sw, this.width);
        this._smallB_dh = this._getNearestEvenPadding(scaleRatioHeight * this._smallB_sh, this.height);
        this._smallB_dx = (this.compositeWidth - this._smallB_dw) / 2;
        this._smallB_dy = (this.compositeHeight - this._smallB_dh) / 2;

        this._smallB_dxOffset = (this._smallA_dx - this._smallB_dx) / 2;
        this._smallB_dyOffset = (this._smallA_dy - this._smallB_dy) / 2;
    },

    _compositeBlurFilter: function (image, sx, sy, sw, sh)
    {
        var compositeCTX = this._offscreenCanvasComposite.getContext('2d');

        compositeCTX.clearRect(0, 0, this.compositeWidth, this.compositeHeight);
        compositeCTX.filter = 'blur(' + this._blurAmount + 'px)';
        compositeCTX.globalAlpha = 1;

        this._drawVideoSafeImage(
            compositeCTX, image, sx, sy, sw, sh,
            this.xCompositeOffset - this._sizeUpAmount / 2, this.yCompositeOffset - this._sizeUpAmount / 2,
            this.width + this._sizeUpAmount, this.height + this._sizeUpAmount
        );

        if (this.blurAmount === 0 || this.fillToEdge) return;

        // Draw image a second time so opacity more closely matches the resize approaches visuals
        compositeCTX.globalAlpha = 0.8;
        this._drawVideoSafeImage(
            compositeCTX, image, sx, sy, sw, sh,
            this.xCompositeOffset - this._sizeUpAmount / 2, this.yCompositeOffset - this._sizeUpAmount / 2,
            this.width + this._sizeUpAmount, this.height + this._sizeUpAmount
        );
    },

    _compositeBlurResize: function (image, sx, sy, sw, sh)
    {
        var compositeCTX = this._offscreenCanvasComposite.getContext('2d');

        if (this.blurAmount === 0) {
            this._drawVideoSafeImage(
                compositeCTX, image, sx, sy, sw, sh,
                this.xCompositeOffset, this.yCompositeOffset - this._sizeUpAmount / 2,
                this.width + this._sizeUpAmount, this.height + this._sizeUpAmount
            );
            return;
        }

        var ctxSmallA = this._offscreenCanvasA.getContext('2d');
        ctxSmallA.imageSmoothingQuality = this.smoothingQuality;
        ctxSmallA.clearRect(0, 0, this.width, this.height);
        this._drawVideoSafeImage(ctxSmallA, image, sx, sy, sw, sh, this._smallA_offset, this._smallA_offset, this._smallA_width, this._smallA_height);

        var ctxSmallB = this._offscreenCanvasB.getContext('2d');
        ctxSmallB.imageSmoothingQuality = this.smoothingQuality;
        ctxSmallB.clearRect(0, 0, this.width, this.height);
        this._drawVideoSafeImage(ctxSmallB, image, sx, sy, sw, sh, this._smallB_offset, this._smallB_offset, this._smallB_width, this._smallB_height);

        compositeCTX.imageSmoothingQuality = this.smoothingQuality;
        compositeCTX.globalCompositeOperation = 'source-over';
        compositeCTX.globalAlpha = 1;
        compositeCTX.clearRect(0, 0, this.compositeWidth, this.compositeHeight);

        compositeCTX.drawImage(
            this._offscreenCanvasA,
            0, 0, this._smallA_sw, this._smallA_sh,
            this._smallA_dx, this._smallA_dy, this._smallA_dw, this._smallA_dh
        );

        compositeCTX.globalAlpha = 0.5;
        compositeCTX.drawImage(
            this._offscreenCanvasB,
            0, 0, this._smallB_sw, this._smallB_sh,
            this._smallB_dx, this._smallB_dy, this._smallB_dw, this._smallB_dh
        );

        compositeCTX.globalCompositeOperation = 'source-atop';

        compositeCTX.globalAlpha = 0.33;
        compositeCTX.drawImage(
            this._offscreenCanvasB,
            0, 0, this._smallB_sw, this._smallB_sh,
            this._smallB_dx - this._smallB_dxOffset, this._smallB_dy - this._smallB_dyOffset, this._smallB_dw, this._smallB_dh
        );

        compositeCTX.globalAlpha = 0.25;
        compositeCTX.drawImage(
            this._offscreenCanvasB,
            0, 0, this._smallB_sw, this._smallB_sh,
            this._smallB_dx + this._smallB_dxOffset, this._smallB_dy + this._smallB_dyOffset, this._smallB_dw, this._smallB_dh
        );

    },

    _compositeDebugDraw: function ()
    {
        var compositeCTX = this._offscreenCanvasComposite.getContext('2d');
        if (this.filterSupported) compositeCTX.filter = 'none';
        compositeCTX.save();
        compositeCTX.globalCompositeOperation = 'source-over';
        compositeCTX.globalAlpha = 1;
        compositeCTX.lineWidth = 2;
        compositeCTX.beginPath();
        compositeCTX.strokeStyle = 'red';
        compositeCTX.rect(this.xCompositeOffset + 1, this.yCompositeOffset + 1, this.width - 2, this.height - 2);
        compositeCTX.stroke();
        compositeCTX.closePath();
        compositeCTX.beginPath();
        compositeCTX.strokeStyle = 'cyan';
        compositeCTX.rect(1, 1, this.compositeWidth - 2, this.compositeWidth - 2);
        compositeCTX.stroke();
        compositeCTX.closePath();
        compositeCTX.restore();
    },

    _getNearestEvenPadding: function (paddedSize, size)
    {
        paddedSize = Math.floor(paddedSize);
        if ((paddedSize - size) % 2 !== 0) paddedSize += 1;
        return paddedSize;
    },

    // This is a wrapper for drawImage to avoid issues when drawing from a video Source on older versions of iOS
    _drawVideoSafeImage: function (ctx, src, sx, sy, sw, sh, dx, dy, dw, dh) {
        if (src instanceof HTMLVideoElement
            && TGE.BrowserDetect.oniOS
            && parseInt(TGE.BrowserDetect.OSversion.match(/\d+$/)[0], 10) < 13)
        {
            ctx.drawImage(src, dx, dy, dw, dh);
        } else
        {
            ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
        }
    },
};