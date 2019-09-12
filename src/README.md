#TGE

The TreSensa Game Engine is a **free**, **fast** and **mobile ready**(yes really mobile ready) solution for creating HTML5 games. It can be used independently or with TreSensa's services (leaderboards, analytics, TGS Widget, etc). To get Started with TGE, check the TGE section in the [*developer resources* article](https://developer.tresensa.com/developer-resources-tools-and-documentation/)

## Steps for doing local development
You can download this and the other libraries ([TGL](https://github.com/tresensa/tgl) and [TGS](https://github.com/tresensa/tgs)) from their separate repos but we reccomend another approach: Use Bower to install all the libraries at once and easily keep them up to date. Instructions below:

#### Step 1: Install Bower
If you don't have Bower installed, you can install it using [Node JS](http://nodejs.org/download/). Once Node is is installed, type:

`npm install -g bower`

***Note**: Windows users have to install some extra software for Bower to run correctly. Refer to [Bower's github readme](https://github.com/bower/bower) for instructions in the section titled "Windows users"*

#### Step 2: Install Tresensa Libraries
cd into your game project root and type:

`bower install tresensa/tgs tresensa/tge tresensa/tgl`

#### Step 3: Link libraries to your game
Go to js/GameConfig.js (click [here](https://developer.tresensa.com/start-here/step1) if you don't know what that file is) file and add the follow Object Property:

`LIB_DIR: "bower_components/",`

This will link the libraries to your game.

If the project is already using bower, the libraries can be added to the project's bower.json and installed with just `bower install`.

#### Step 4: Make sure TGL is loaded remotely
If you were previously using remote libraries, make sure to adjust your index.html so that TGL is loaded locally instead of remotely:

`<script type="text/javascript" src="bower_components/tgl/tgl.boot.min.js"></script>`

#### Step 5: Keep libraries up to date
Keeping the Tresensa libs up to date is easy, just cd into your game project root directory and type

`bower update`

You're all set to use the libraries! Check out our [developer tutorials site](http://developer.tresensa.com) or hit the [forums](http://forum.tresensa.com/) if you have a question.