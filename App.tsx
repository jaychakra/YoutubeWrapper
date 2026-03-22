const injectedJS = `
(function() {

// HTML Blocks related to shorts selector
const SELECTORS = [
  'ytd-rich-section-renderer',
  'ytm-rich-section-renderer',
  'ytm-reel-shelf-renderer',
  'ytd-reel-shelf-renderer',
  '[aria-label="Shorts"]',
  'a[href^="/shorts"]'  
];

// HTML Blocks for top feed filter
SELECTORS.push('ytm-feed-filter-chip-bar-renderer'); 

// HTML Blocks related to action button
SELECTORS.push('ytm-slim-video-action-bar-renderer'); 

// HTML Blocks related to carousel view
SELECTORS.push('yt-video-metadata-carousel-view-model'); 


// HTML Blocks related to chips below the video scroll
SELECTORS.push('ytm-chip-cloud-renderer'); 

// HTML Blocks related to Subscribe Button
SELECTORS.push('.slim-owner-subscribe-button'); 

// HTML block to open youtube app
SELECTORS.push('a[href^="intent://"]'); 


function processNode(node) {
  if (!node || node.nodeType !== 1) return;

  SELECTORS.forEach(sel => {
    if (node.matches?.(sel)) node.remove();
  });

  SELECTORS.forEach(sel => {
    node.querySelectorAll?.(sel).forEach(el => el.remove());
  });
  
  document.querySelectorAll?.('.pivot-shorts').forEach(el => {
    el.closest('ytm-pivot-bar-item-renderer')?.remove();
  });
}

// Initial pass
processNode(document);

// Incremental observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    m.addedNodes.forEach(processNode);
  });
});
observer.observe(document.body,{childList:true,subtree:true});



// function removeShorts(){
  
//   // Remove all the selectors
//   SELECTORS.forEach(sel => {
//     document.querySelectorAll(sel).forEach(el => el.remove());
//   });

//   // Remove bottom shorts tab
//   document
//     .querySelectorAll('.pivot-shorts')
//     .forEach(el => {
//       const tab = el.closest('ytm-pivot-bar-item-renderer');
//       if (tab) tab.remove();
//     });
// }

// removeShorts();

// const observer = new MutationObserver(removeShorts);
// observer.observe(document.body,{childList:true,subtree:true});


// Lock Orientation
function send(msg){
  window.ReactNativeWebView.postMessage(msg);
}

// Add behaviour for full screen 
/* detect fullscreen enter/exit */
document.addEventListener("fullscreenchange", () => {

  if (document.fullscreenElement) {
    send("fullscreen-enter");
  } else {
    send("fullscreen-exit");
  }

});

/* safari / youtube variants */
document.addEventListener("webkitfullscreenchange", () => {

  if (document.webkitFullscreenElement) {
    send("fullscreen-enter");
  } else {
    send("fullscreen-exit");
  }

});

})();
true;
`;

import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import Orientation from "react-native-orientation-locker";
import type {WebView as WebViewType} from "react-native-webview";

import React, {useRef, useEffect} from "react";
import {BackHandler} from "react-native";


const handleMessage = (event:any) => {

  const msg = event.nativeEvent.data;

  if (msg === "fullscreen-enter") {
    Orientation.unlockAllOrientations();
    Orientation.lockToLandscape();
  }

  if (msg === "fullscreen-exit") {
    Orientation.lockToPortrait();
  }

};

export default function App() {
  const webViewRef = useRef<WebViewType>(null);
  
  useEffect(() => {

    const backAction = () => {

      if (webViewRef.current) {
        // webViewRef.current.goBack();
        webViewRef.current.injectJavaScript(
          "window.history.back(); true;"
        );
        return true;   // consume the back gesture
      }

      return false;
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => sub.remove();

  }, []);


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        javaScriptEnabled
        style={{flex:1}}
        source={{ uri: "https://m.youtube.com" }}
        injectedJavaScript={injectedJS}
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
}