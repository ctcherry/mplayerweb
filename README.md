mplayerweb
==========

A node.js web app wrapped around an mplayer instance that allows for remotely controlling the mplayer. It is assumed that the machine running this has both a display and speakers hooked up.

The background mplayer instance is run in slave mode with -idle and a few other parameters passed in. HTTP requests are turned into slave mode commands and fed into its STDIN. mplayer's STDOUT is monitored for information indicating its status, such as idle, playing, and the current media if it is playing. The front end performs long-polling to keep the display of this status information up to date.

Usage
-----
    git clone https://github.com/ctcherry/mplayerweb
    cd mplayerweb
    cp config.js.sample config.js
    vim config.js
    nohup node mplayerweb.js &


Assumptions
-----------
This app is early in its life so it makes quite a few assumptions.

* Your media is under 1 directory, and has 2 sub directories named "TV" and "Movies"
* The "TV" sub directory contains a sub directory for each series, and in that sub directory is all of the episode files, 1 per episode, no other kinds of files like subtitles should be present.
* There should be some kind of window manager running already, it seems to work best with that. I tested it with [dwm](http://dwm.suckless.org/)

Tips from my setup
------------------

I'm running this on a small form factor computer with a low power Sandy Bridge generation CPU (Core i3-2100T @ 2.50GHz). This CPU supports VAAPI acceleration, and to get that in mplayer you need to custom compile it from here: http://gitorious.org/vaapi/mplayer.

With the VAAPI patch mplayer consumes 1-2% CPU playing back a 8gig 1080p with DTS audio, very smooth playback.

I mount a media share over SMB on to this computer from a seperate server.

Mplayer config (~/.mplayer/config):

    # Set audio output to HDMI out, you can get this from the cmd: aplay -l
    ao=alsa:device=hw=0.7

    # Make sure we select the audio track for english, sometimes if you don't
    # do this you get directors commentary or another language
    alang=en

    # Hardware accelerated
    vo=vaapi

    # Fullscreen
    fs=yes

    # Disable subtitles
    nosub=yes

    # Allow DTS and AC-3 (Dolby Digital) pass through
    afm=hwac3