set "ver=0.3.4"

copy /b KeyframedAnimation.js+KeyframedAnimationPlayer.js+SpriteAnimation.js+ScreenEntity.js+GameWorldEntity.js+Screen.js+ScreenManager.js+Misc.js+Achievements.js+Utilities.js+SHA1Hash.js tge-%ver%-bridge.js
java -jar ..\yuicompressor-2.4.7.jar --charset utf-8 -o tge-%ver%-bridge.min.js tge-%ver%-bridge.js

copy tge-%ver%-bridge.min.js ..\..\TGL\lib\tge
copy tge-%ver%-bridge.js ..\..\TGL\lib-debug\tge
