import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface RichHtmlProps {
  html: string;
  style?: any;
  testID?: string;
  fontSize?: number;
  lineHeight?: number;
}

export const RichHtml: React.FC<RichHtmlProps> = ({ html, style, testID, fontSize, lineHeight }) => {
  const [contentHeight, setContentHeight] = useState(200);

  if (Platform.OS === 'web') {
    return (
      <div
        data-testid={testID}
        style={{ width: '100%', ...style }}
        dangerouslySetInnerHTML={{ __html: html || '' }}
      />
    ) as unknown as React.ReactElement; // satisfy RN types
  }

  const wrapped = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
          overflow-x: hidden;
        }
        .ck-content { 
          padding: 12px; 
          font-size: ${fontSize || 16}px; 
          line-height: ${lineHeight ? lineHeight / (fontSize || 16) : 1.6}; 
          word-wrap: break-word;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        blockquote { 
          border-left: 3px solid #e0e0e0; 
          margin: 8px 0; 
          padding: 8px 12px; 
          color: #555; 
          background: #fafafa; 
        }
        h2 { 
          font-size: 22px; 
          margin: 16px 0 8px; 
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        h3 { 
          font-size: 18px; 
          margin: 14px 0 6px; 
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        p { 
          margin: 8px 0; 
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .marker-yellow { background-color: #FFF59D; }
      </style>
    </head>
    <body>
      <div class="ck-content" id="content">${html || ''}</div>
      <script>
        function updateHeight() {
          const content = document.getElementById('content');
          const height = Math.max(content.scrollHeight, content.offsetHeight);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'height',
            height: height
          }));
        }
        updateHeight();
        window.addEventListener('resize', updateHeight);
      </script>
    </body>
  </html>`;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'height') {
        setContentHeight(Math.max(message.height + 20, 200)); // Add some padding
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: wrapped }}
        style={[styles.webview, { height: contentHeight }]}
        javaScriptEnabled={true}
        domStorageEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  webview: { width: '100%', backgroundColor: 'transparent' },
});
