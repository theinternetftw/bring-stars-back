// ==UserScript==
// @name        Bring Stars Back (Netflix)
// @namespace   theinternetftw.com
// @include     https://www.netflix.com/browse
// @include     https://www.netflix.com/browse/*
// @include     https://www.netflix.com/title/*
// @version     1.0.1
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

function loadOptions(onLoad) {
  return false; // edit bsbOptions by hand in the greasemonkey script.
}

function remoteGet(url, onLoad) {
  GM_xmlhttpRequest({
    url: url,
    method: 'GET',
    onload: function(resp) {
      if (resp.status != 200) {
        console.log('[bsb] bad status ' + resp.status + ' when loading ' + url);
        onLoad(new DOMParser().parseFromString('', 'text/html'));
      } else {
        onLoad(resp.responseXML || new DOMParser().parseFromString(resp.responseText, 'text/html'));
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
