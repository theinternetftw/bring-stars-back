// ==UserScript==
// @name        Bring Stars Back (Netflix)
// @namespace   theinternetftw.com
// @include     https://www.netflix.com/
// @include     https://www.netflix.com/browse
// @include     https://www.netflix.com/browse/*
// @include     https://www.netflix.com/title/*
// @connect     netflix.com
// @version     1.0.9
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

function loadOptions(onLoad) {
  return false; // edit bsbOptions by hand in the greasemonkey script.
}

function remoteGetJSON(url, onLoad) {
  GM_xmlhttpRequest({
    url: url,
    method: 'GET',
    onload: function(resp) {
      if (resp.status != 200) {
        console.log('[bsb] bad status ' + resp.status + ' when loading ' + url);
        onLoad({});
      } else {
        onLoad(JSON.parse(resp.responseText));
      }
    },
  });
}

function loadRatingsCache(onLoad) {
  var cacheJSON = GM_getValue('bsbRatingsCache');
  onLoad(cacheJSON ? JSON.parse(cacheJSON) : {});
}
function saveRatingsCache(cache) {
  GM_setValue('bsbRatingsCache', JSON.stringify(cache));
}
