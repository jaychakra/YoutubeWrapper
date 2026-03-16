const injectedJS = `
(function() {

function removeShorts(){

  // Remove Shorts in between videos
  document.querySelectorAll('ytd-rich-section-renderer').forEach(e=>e.remove());
  document.querySelectorAll('ytm-rich-section-renderer').forEach(e=>e.remove());

  document.querySelectorAll('a[href^="/shorts"]').forEach(e=>e.remove());

  // Remove bottom shorts tab
  document
    .querySelectorAll('.pivot-shorts')
    .forEach(el => {
      const tab = el.closest('ytm-pivot-bar-item-renderer');
      if (tab) tab.remove();
    });

  // Remove Action buttons
  document.querySelectorAll('ytm-slim-video-action-bar-renderer').forEach(e=>e.remove());

  // Remove comments
  document.querySelectorAll('yt-video-metadata-carousel-view-model').forEach(e=>e.remove());
  
  // Remove chips below the video scroll
  document.querySelectorAll('ytm-chip-cloud-renderer').forEach(e=>e.remove());

  // slim-owner-subscribe-button
    document.querySelectorAll('.slim-owner-subscribe-button').forEach(e=>e.remove());


}

removeShorts();

const observer = new MutationObserver(removeShorts);
observer.observe(document.body,{childList:true,subtree:true});


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