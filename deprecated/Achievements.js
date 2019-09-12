
TGE.Achievement = function(id,name,description,imageID)
{
    this._id = id;
    this._earned = false;

    this.name = name;
    this.description = description;
    this.imageID = imageID;

    return this;
}

TGE.Achievement.prototype =
{
    _id: null,

    earned: function()
    {
        this._earned = true;
    },

    hasBeenEarned: function()
    {
        return this._earned;
    },

    id: function()
    {
        return this._id;
    }
}



TGE.Achievements = function()
{
    this.lockedIconID = null;
    this.earnedAchievementCallback = null;

    return this;
}

TGE.Achievements.HigherScoresAreBetter = true;
TGE.Achievements.BestScore = null;

/** @ignore */
TGE.Achievements._FRIENDSTER_API_URL = "http://www.littlegrey.net/temp/tresensa/friendster";

/**
 * Static method for doing a quick score submit to partners without needing a persistent TGE.Achievements instance.
 */
TGE.Achievements.SubmitScore = function(score)
{
    var a = new TGE.Achievements();
    a.submitScore(score);
}

/**
 * Call to open the achievements screen. Some distribution partners will implement their own achievements screen.
 * If the game is being played on a partner site that has their own achievements screen implementation, it will be
 * shown. Otherwise the default action will be called.
 * @param defaultAction
 */
TGE.Achievements.ShowAchievementsScreen = function(defaultAction)
{
    defaultAction.call();
}

TGE.Achievements.EnableParterUI = function(enable)
{

}

TGE.Achievements.prototype =
{
    _achievements: [],
    _achievementIDs: [],

    createAchievement: function(id,name,description,imageID)
    {
        this._achievements[id] = new TGE.Achievement(id,name,description,imageID);
        this._achievementIDs.push(id);
    },

    saveCompletedAchievements: function()
    {
        // For now we're using a cookie
        var achString = "";
        var len = this._achievementIDs.length;
        for(var a=0; a<len; a++)
        {
            var ach = this.getAchievementAt(a);
            if(ach.hasBeenEarned())
            {
                achString += a;
                achString += " ";
            }
        }

        // Now make it non-obvious what the string represents to prevent easy hacking
        var string2 = "";
        len = achString.length;
        for(c=0; c<len; c++)
        {
            if(achString.charAt(c)===" ")
            {
                string2 += Math.floor(Math.random()*10).toString();
            }
            else
            {
                string2 += String.fromCharCode(achString.charCodeAt(c)+50);
            }
        }

        // Save to a cookie
        if(string2.length>0)
        {
            var exdate = new Date();
            var exdays = 999;
            exdate.setDate(exdate.getDate() + exdays);
            var c_value = string2 + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            document.cookie = "tgeachv1" + "=" + c_value;
        }
    },

    loadCompletedAchievements: function()
    {
        // For now we're using a cookie
        var achString = null;
        var i, x, y, ARRcookies = document.cookie.split(";");
        for (i = 0; i < ARRcookies.length; i++)
        {
            x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
            y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
            x = x.replace(/^\s+|\s+$/g, "");
            if (x == "tgeachv1")
            {
                achString = y;
            }
        }

        // Did we get anything?
        if(achString)
        {
            var actualString = "";
            len = achString.length;
            for(c=0; c<len; c++)
            {
                var test = achString.charCodeAt(c);
                if(achString.charCodeAt(c)<=57)
                {
                    actualString += " ";
                }
                else
                {
                    actualString += String.fromCharCode(achString.charCodeAt(c)-50);
                }
            }

            var achs = actualString.split(" ");
            for(var a=0; a<achs.length; a++)
            {
                if(achs[a].length>0)
                {
                    this.earnedAchievementAt(parseInt(achs[a]),true);
                }
            }
        }
    },

    clearAchievements: function()
    {
        // Save to a cookie
        var exdate = new Date();
        var exdays = 999;
        exdate.setDate(exdate.getDate() + exdays);
        var c_value = "" + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
        document.cookie = "tgeachv1" + "=" + c_value;
    },

    numberOfAchievements: function()
    {
        return this._achievementIDs.length;
    },

    getAchievement: function(id)
    {
        return this._achievements[id];
    },

    getAchievementAt: function(i)
    {
        return this.getAchievement(this._achievementIDs[i]);
    },

    earnedAchievementAt: function(index,silent)
    {
        this.earnedAchievement(this._achievementIDs[index],silent);
    },

    earnedAchievement: function(id,silent)
    {
        silent = typeof silent === "undefined" ? false : silent;

        var ach = this._achievements[id];
        if(ach)
        {
            // Don't re-submit achievements internally
            if(!ach.hasBeenEarned())
            {
                ach.earned();

                // Callback?
                if(!silent && this.earnedAchievementCallback)
                {
                    this.earnedAchievementCallback.call(null,ach);
                }

                // Submit to partner sites
                this.submitAchievementToPartner(ach,silent);

                this.saveCompletedAchievements();
            }
        }
    },

    submitScore: function(score)
    {
        // Did the user get a new highscore?
        var newHighscore = false;
        if(TGE.Achievements.BestScore===null)
        {
            TGE.Achievements.BestScore = score;
            newHighscore = false;
        }
        else if(TGE.Achievements.HigherScoresAreBetter && score>TGE.Achievements.BestScore)
        {
            TGE.Achievements.BestScore = score;
            newHighscore = true;
        }
        else if(!TGE.Achievements.HigherScoresAreBetter && score<TGE.Achievements.BestScore)
        {
            TGE.Achievements.BestScore = score;
            newHighscore = true;
        }        
    },

    submitAchievementToPartner: function(achievement,silent)
    {

    }
}
