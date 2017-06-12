#! /bin/bash -eux

cat greasemonkey/hdr.js > Netflix_Bring_Stars_Back.user.js
cat common/bsb.js >> Netflix_Bring_Stars_Back.user.js

cat common/bsb.js > webext/bsb.js
