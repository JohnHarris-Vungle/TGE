
TGE.SpriteAnimation = function(spriteHost,image,rows,columns,numFrames,fps,looping)
{
    this.mFPS = fps;
    this.mNumberOfFrames = numFrames;
    this.mLooping = looping;

    this.mAge = 0;
    this.mPaused = false;
    this.mFinishedCallback = null;
    this.mFrameOffset = 0;
    this.mCurrentFrame = 0;

    this.mSprite = new TGE.Sprite();
    this.mSprite.setImage(image,rows,columns);
    this.mSprite.visible = false;
    spriteHost.addChild(this.mSprite);

    // The animation's registration point should match the host
    this.mSprite.registrationX = spriteHost.registrationX;
    this.mSprite.registrationY = spriteHost.registrationY;
}


TGE.SpriteAnimation.prototype =
{
    Play: function(finishedCallback)
    {
        this.mAge = 0;
        this.mFinishedCallback = finishedCallback;
        this.mSprite.setSpriteIndex(0);
        this.mSprite.visible = true;
    },

    Pause: function()
    {
        this.mPaused = true;
    },

    Stop: function()
    {
        this.mSprite.visible = false;
    },

    Resume: function()
    {
        this.mPaused = false;
    },

    SetAnimationIndexOffset: function(offset)
    {
        this.mFrameOffset = offset;
    },

    Update: function(elapsedTime)
    {
        if(!this.mPaused)
        {
            this.mAge += elapsedTime;
        }

        var frameLength = 1.0/this.mFPS;
        var framesPlayed = Math.floor(this.mAge / frameLength);

        // Set the current frame
        this.mCurrentFrame = 0;
        if(this.mLooping || framesPlayed<this.mNumberOfFrames)
        {
            this.mCurrentFrame = framesPlayed % this.mNumberOfFrames;
        }
        else
        {
            this.mCurrentFrame = this.mNumberOfFrames-1;

            // If there is a function to call when finished, call it
            if(this.mFinishedCallback!=null)
            {
                this.mFinishedCallback.call();
                this.mFinishedCallback = null;
            }
        }

        this.mCurrentFrame += this.mFrameOffset;
        this.mSprite.setSpriteIndex(this.mCurrentFrame);
    }
}