/**
 <p>The CameraShake class provides a template that allows you to add a "shake" effect to a display object and its children.</p>
 <p>The CameraShake object must be extended so that the specifics of the "shake" effect can be defined by overriding the updateMembers function. TGE provides the subclasses {@link TGE.NoiseShake} and {@link TGE.SpringShake}</p>

 * @class
 * @property {Object} target The target object for the effect
 * @property {Number} duration The desired duration of the shake. Usage is subclass dependent.
 * @property {Number} delay A delay that can be applied before the shake starts (in seconds).
 * @property {Boolean} loop A flag indicating whether or not the effect should loop.
 * @property {Array} exclusionList A list of cameraShakeTags that will be used to exclude appropriately tagged children of the display from the effect.
 * @property {Function} onComplete An optional callback function that will be fired when the shake is complete.
 * @constructor
 */
TGE.CameraShake = function()
{
	//Public Members
	this.target = null;
	this.duration = 1;
	this.delay = 0;
	this.loop = false;
	this.exclusionList = [];
	this.onComplete = null;

	//Private Members
	this._mPreviousX   = 0;
	this._mPreviousY   = 0;
	this._mX           = 0;
	this._mY           = 0;
	this._mTimeElapsed = 0;
	this._mFinished    = false;
}

TGE.CameraShake.prototype =
{
	/**
     * The setup method can be used initialize multiple parameters of an object with a single call.
     * @param {Object} params Information used to initialize the object.
     * @param {Number} [params.duration] The duration the shake effect will last in seconds.
     * @param {Number} [params.delay] The number of seconds to wait before starting the shake effect.
     * @param {Boolean} [params.loop] A flag indicating whether or not the effect should loop.
     * @param {Array} [params.exclusionList] A list of camera shake tags denoting types of objects that should ignore the camera shake effect.
     * @param {Function} [params.onComplete] An optional callback function that will be fired when the shake is complete.
     * @return {TGE.CameraShake} Returns this object.
     */
	setup: function(params)
	{
		this.target = params.target;

		// Duration
        typeof(params.duration)==="number" ? this.duration = params.duration : 1;
        // Delay
        typeof(params.delay)==="number" ? this.delay = params.delay : 0;
        // Loop
        typeof(params.loop)==="boolean" ? this.loop = params.loop : false;
        // Completion Handler
        typeof(params.onComplete)==="function" ? this.onComplete = params.onComplete : null;
		// Exclusion List
		Array.isArray(params.exclusionList) ? this.exclusionList = params.exclusionList : [];

		for (var i = 0; i < this.exclusionList.length; i++)
		{
			var exclusion = this.exclusionList[i];
			if (typeof(exclusion) == "object" && !exclusion.isDescendantOf(this.target))
			{
				TGE.Debug.Log(TGE.Debug.LOG_WARNING,"One or more objects in the TGE.CameraShake exclusion list are not direct children of the object");
			}
		}

        return this;
	},

	/**
	 * Indicates whether or not the camera shake is complete.
	 * @returns {Boolean} Whether or not the camera shake is complete.
	 */
	finished: function()
	{
		return this._mFinished;
	},

	/**
	 * Updates the private members of the CameraShake object. Should be overwritten by subclasses to create custom camera shake effects.
	 * @param {Number} elapsedTime The number of seconds that have elapsed since the last call to this function.
	 */
	updateMembers: function(elapsedTime)
	{
		console.log("updateMembers should be overridden by a subclass");
	},

	/**
	 * Stops the current shake effect and moves the target object back to it's unshaken location.
	 */
	stop: function()
	{
		this.target.x -= this._mX;
		this.target.y -= this._mY;

		//Check to see if we have excluded objects
		if (this.exclusionList != null && this.exclusionList.length > 0)
		{
			for(var i = 0; i < this.target.numChildren(false); i++)
			{
				var child = this.target.getChildAt(i);
				if (this.exclusionList.indexOf(child.cameraShakeTag) != -1 || this.exclusionList.indexOf(child) != -1) //Object is excluded from shake
				{
					child.x += this._mX;
					child.y += this._mY;
				}
			}
		}

		this._mFinished = true;
	},

	/** ignore */
	_update: function(elapsedTime)
	{
		if (this._mFinished)
			return;

		this._mTimeElapsed += elapsedTime;

		if (this._mTimeElapsed < this.delay) //Hasn't started yet
			return;

		//Update the member variables (exact logic is subclass specific)
		this.updateMembers(elapsedTime);

		//Apply the updated positions to the target
		var deltaX = this._mX - this._mPreviousX;
		var deltaY = this._mY - this._mPreviousY;
		this.target.x += deltaX;
		this.target.y += deltaY;

		//Check to see if we have excluded objects
		if (this.exclusionList != null && this.exclusionList.length > 0)
		{
			for(var i = 0; i < this.target.numChildren(false); i++)
			{
				var child = this.target.getChildAt(i);
				if (this.exclusionList.indexOf(child.cameraShakeTag) != -1 || this.exclusionList.indexOf(child) != -1) //Object is excluded from shake
				{
					child.x -= deltaX;
					child.y -= deltaY;
				}
			}
		}

		if (this._mFinished)
		{
			if (this.onComplete != null)
				this.onComplete();
		}
	}
}

/**
 <p>The NoiseShake class is a TGE provided subclass of the CameraShake object.</p>
 <p>The NoiseShake moves the object to a random value in the range [-intensity*target.width, intensity*target.width]. The shake effect can be applied to
 only a single axis (or with different magnitudes) using the intensityX/intensityY parameters.</p>

 * @class
 * @property {Object} target The target object for the effect
 * @property {Number} duration The desired duration of the shake.
 * @property {Number} delay A delay that can be applied before the shake starts (in seconds).
 * @property {Boolean} loop A flag indicating whether or not the effect should loop.
 * @property {Number} intensityX Sets the intensity value of the shake along the X axis.
 * @property {Number} intensityY Sets the intensity value of the shake along the Y axis.
 * @property {Number} period The number of seconds inbetween shake updates (default is once per frame).
 * @property {Number} easeInTime The time it takes for the effect to build to its target intensity.
 * @property {Number} easeOutTime The time it takes for the effect to wind down from its target intensity to 0.
 * @property {Array} exclusionList A list of cameraShakeTags that will be used to exclude appropriately tagged children of the display from the effect.
 * @property {Function} onComplete An optional callback function that will be fired when the shake is complete.
 * @constructor
 */
TGE.NoiseShake = function()
{
	TGE.NoiseShake.superclass.constructor.call(this);

	this.intensityX = 0;
	this.intensityY = 0;

	this.easeInTime  = 0;
	this.easeOutTime = 0;

	this.period = -1;

	this._mPeriodsExecuted  = 0;
	this._mIntensityX		= 0;
	this._mIntensityY		= 0;
}

TGE.NoiseShake.prototype =
{
	/**
     * The setup method can be used initialize multiple parameters of an object with a single call.
     * @param {Object} params Information used to initialize the object.
     * @param {Number} [params.duration] The duration the shake effect will last in seconds.
     * @param {Number} [params.delay] The number of seconds to wait before starting the shake effect.
     * @param {Boolean} [params.loop] A flag indicating whether or not the effect should loop.
     * @param {Array} [params.exclusionList] A list of camera shake tags denoting types of objects that should ignore the camera shake effect.
     * @param {Function} [params.onComplete] An optional callback function that will be fired when the shake is complete.
     * @param {Number} [params.intensity] Sets the intensity value of the shake for both axes.
     * @param {Number} [params.intensityX] Sets the intensity value of the shake for only the X direction.
     * @param {Number} [params.intensityY] Sets the intensity value of the shake for only the Y direction.
     * @param {Number} [params.period] Sets the number of seconds inbetween shake updates (default is once per frame)
     * @param {Number} [params.easeInTime] The time it takes for the effect to build to its target intensity
     * @param {Number} [params.easeOutTime] The time it takes for the effect to wind down from its target intensity to 0
     * @return {TGE.CameraShake} Returns this object.
     */
	setup: function(params)
	{
		TGE.NoiseShake.superclass.setup.call(this,params);

		if(typeof(params.intensity)==="number")
		{
			this.intensityX = params.intensity;
			this.intensityY = params.intensity;
		}
		typeof(params.intensityX)==="number" ? this.intensityX = params.intensityX : this.intensityX;
		typeof(params.intensityY)==="number" ? this.intensityY = params.intensityY : this.intensityY;

		typeof(params.period)==="number" ? this.period = params.period : this.period;

		typeof(params.easeInTime)==="number" ? this.easeInTime = params.easeInTime : this.easeInTime;
		typeof(params.easeOutTime)==="number" ? this.easeOutTime = params.easeOutTime : this.easeOutTime;

		return this;
	},

	/**
	 * Changes the x/y member variables of the shake to values in the range [-intensity*target.width, intensity*target.width].
	 * @param {Number} elapsedTime The number of seconds that have elapsed since the last call to this function.
	 */
	updateMembers: function(elapsedTime)
	{
		this._mPreviousX = this._mX;
		this._mPreviousY = this._mY;

		if (this._mTimeElapsed > this.delay + this.duration) //Finished
		{
			this._mX = 0;
			this._mY = 0;

			if (!this.loop)
				this._mFinished = true;
			else
				this._mTimeElapsed = this.delay;
		}
		else
		{
			if (this._mTimeElapsed-this.delay < this.easeInTime)
			{
				this._mIntensityX = this.intensityX * ((this._mTimeElapsed-this.delay) / this.easeInTime);
				this._mIntensityY = this.intensityY * ((this._mTimeElapsed-this.delay) / this.easeInTime);
			}
			else if (this._mTimeElapsed-this.delay > this.duration-this.easeOutTime)
			{
				var t = this._mTimeElapsed - this.delay - (this.duration-this.easeOutTime);
				this._mIntensityX = this.intensityX - (this.intensityX * (t/this.easeOutTime));
				this._mIntensityY = this.intensityY - (this.intensityY * (t/this.easeOutTime));
			}
			else
			{
				this._mIntensityX = this.intensityX;
				this._mIntensityY = this.intensityY;
			}

			if (this._mTimeElapsed > this._mPeriodsExecuted*this.period) //Aways true if period <= 0
			{
				this._mX = Math.random()*this._mIntensityX*this.target.width*2 - this._mIntensityX*this.target.width;
				this._mY = Math.random()*this._mIntensityY*this.target.width*2 - this._mIntensityY*this.target.width;
				this._mPeriodsExecuted++;
			}
		}
	}
}

extend(TGE.NoiseShake, TGE.CameraShake);

/**
 <p>The SpringShake class is a TGE provided subclass of the CameraShake object.</p>
 <p>The SpringShake moves the object based around the spring equation  a = -(kx + cv)/m.</p>

 * @class
 * @property {Object} target The target object for the effect
 * @property {Number} delay A delay that can be applied before the shake starts (in seconds).
 * @property {Boolean} loop A flag indicating whether or not the effect should loop.
 * @property {Number} initialDeflection A uniform amount to pull the target in both the X and Y directions to start the spring motion.
 * @property {Number} initialDeflectionX The amount to pull the target in the X direction to start the spring motion.
 * @property {Number} initialDeflectionY The amount to pull the target in the Y direction to start the spring motion.
 * @property {Number} initialVelocity A starting velocity in both the X and Y directions to start the spring motion.
 * @property {Number} initialVelocityX The starting velocity of the target in the X direction.
 * @property {Number} initialVelocityY The starting velocity of the target in the Y direction.
 * @property {Number} mass The mass of the target object for the purpose of the spring equation.
 * @property {Number} springConstant The spring constant (k). Springs with higher constants have more intense oscillations
 * @property {Number} dampingConstant The damping constant (c). The damping constant determines how quickly the spring will come to rest.
 * @property {Number} finishThreshold A threshold value (for deflection and velocity) that when reached will terminate the spring effect.
 * @property {Array} exclusionList A list of cameraShakeTags that will be used to exclude appropriately tagged children of the display from the effect.
 * @property {Function} onComplete An optional callback function that will be fired when the shake is complete.
 * @constructor
 */
TGE.SpringShake = function()
{
	TGE.SpringShake.superclass.constructor.call(this);

	this.initialDeflectionX = 0;
	this.initialDeflectionY = 0;

	this.initialVelocityX = 0;
	this.initialVelocityY = 0;

	this.mass = 0;
	this.springConstant = 0;
	this.dampingConstant = 0;

	this.finishThreshold = 5;

	this._mAccelerationX = 0;
	this._mAccelerationY = 0;
	this._mVelocityX = 0;
	this._mVelocityY = 0;

	this._mInitiallyDeflected = false;
}

TGE.SpringShake.prototype =
{
	/**
	 * The setup method can be used to initialize multiple parameters of the object with a single call
	 * @param {Object} params Information used to initialize the object.
     * @param {Number} [params.duration] The duration the shake effect will last in seconds.
     * @param {Number} [params.delay] The number of seconds to wait before starting the shake effect.
     * @param {Boolean} [params.loop] A flag indicating whether or not the effect should loop.
     * @property {Number} [params.initialDeflection] A uniform amount to pull the target in both the X and Y directions to start the spring motion.
	 * @property {Number} [params.initialDeflectionX] The amount to pull the target in the X direction to start the spring motion.
	 * @property {Number} [params.initialDeflectionY] The amount to pull the target in the Y direction to start the spring motion.
	 * @property {Number} [params.initialVelocity] A starting velocity in both the X and Y directions to start the spring motion.
	 * @property {Number} [params.initialVelocityX] The starting velocity of the target in the X direction.
	 * @property {Number} [params.initialVelocityY] The starting velocity of the target in the Y direction.
	 * @property {Number} [params.mass] The mass of the target object for the purpose of the spring equation.
	 * @property {Number} [params.springConstant] The spring constant (k).
	 * @property {Number} [params.dampingConstant] The damping constant (c).
	 * @property {Number} [params.finishThreshold] A threshold value (for deflection and velocity) that when reached will terminate the spring effect.
     * @param {Array} [params.exclusionList] A list of camera shake tags denoting types of objects that should ignore the camera shake effect.
     * @param {Function} [params.onComplete] An optional callback function that will be fired when the shake is complete.
     * @return {TGE.CameraShake} Returns this object.
	 */
	setup: function(params)
	{
		TGE.SpringShake.superclass.setup.call(this,params);

		if(typeof(params.initialDeflection)==="number")
		{
			this.initialDeflectionX = params.initialDeflection;
			this.initialDeflectionY = params.initialDeflection;
		}
		typeof(params.initialDeflectionX)==="number" ? this.initialDeflectionX = params.initialDeflectionX : this.initialDeflectionX;
		typeof(params.initialDeflectionY)==="number" ? this.initialDeflectionY = params.initialDeflectionY : this.initialDeflectionY;

		if(typeof(params.initialVelocity)==="number")
		{
			this.initialVelocityX = params.initialVelocity;
			this.initialVelocityY = params.initialVelocity;
		}
		typeof(params.initialVelocityX)==="number" ? this.initialVelocityX = params.initialVelocityX : this.initialVelocityX;
		typeof(params.initialVelocityY)==="number" ? this.initialVelocityY = params.initialVelocityY : this.initialVelocityY;

		typeof(params.mass)==="number" ? this.mass = params.mass : this.mass;
		typeof(params.springConstant)==="number" ? this.springConstant = params.springConstant : this.springConstant;
		typeof(params.dampingConstant)==="number" ? this.dampingConstant = params.dampingConstant : this.dampingConstant;

		typeof(params.finishThreshold)==="number" ? this.finishThreshold = params.finishThreshold : this.finishThreshold;

		return this;
	},

	/**
	 * Updates all of the member variables based on the spring equation: a = -(kx + cv)/m
	 * @param {Number} elapsedTime The number of seconds that have elapsed since the last call to this function.
	 */
	updateMembers: function(elapsedTime)
	{
		// PAN-398 Cap the elapsedTime. Since this is a realistic physics simulation we can allow large jumps in the update intervals
		elapsedTime = Math.min(elapsedTime,0.03);

		this._mPreviousX = this._mX;
		this._mPreviousY = this._mY;

		if (this._mInitiallyDeflected == false)
		{
			this._mX = this.initialDeflectionX;
			this._mY = this.initialDeflectionY;
			this._mVelocityX = this.initialVelocityX;
			this._mVelocityY = this.initialVelocityY;

			this._mInitiallyDeflected = true;
		}
		else
		{
			this._mVelocityX += this._mAccelerationX*elapsedTime;
			this._mVelocityY += this._mAccelerationY*elapsedTime;
			this._mX += this._mVelocityX * elapsedTime;
			this._mY += this._mVelocityY * elapsedTime;

			this._mAccelerationX = -(this.springConstant*this._mX + this.dampingConstant*this._mVelocityX) / this.mass;
			this._mAccelerationY = -(this.springConstant*this._mY + this.dampingConstant*this._mVelocityY) / this.mass;
		}

		//Termination condition
		if (Math.abs(this._mAccelerationX) <= this.finishThreshold && 
			Math.abs(this._mAccelerationY) <= this.finishThreshold && 
			Math.abs(this._mVelocityX) <= this.finishThreshold && 
			Math.abs(this._mVelocityY) <= this.finishThreshold &&
			Math.abs(this._mX) <= this.finishThreshold &&
			Math.abs(this._mY) <= this.finishThreshold)
		{
			this._mX = 0;
			this._mY = 0;

			if (!this.loop)
				this._mFinished = true;
			else
				this._mInitiallyDeflected = false;
		}
	}
}

extend(TGE.SpringShake, TGE.CameraShake);