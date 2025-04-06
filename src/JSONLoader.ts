/* eslint-disable @typescript-eslint/no-unused-vars */
/* globals ActiveXObject:false */

interface XHR extends XMLHttpRequest {
  readyState: number;
  status: number;
  responseText: string;
}

interface WindowWithActiveX extends Window {
  ActiveXObject: new (type: string) => XHR;
}

type Callback = (error: Error | null, data: any) => void;

export function load(location: string, callback: Callback): void {
  const xhr = getXHR();
  xhr.open('GET', location, true);
  xhr.onreadystatechange = createStateChangeListener(xhr, callback);
  xhr.send();
}

function createStateChangeListener(xhr: XHR, callback: Callback): () => void {
  return function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        callback(null, JSON.parse(xhr.responseText));
      } catch (err) {
        callback(err instanceof Error ? err : new Error(String(err)), null);
      }
    }
  };
}

function getXHR(): XHR {
  return window.XMLHttpRequest 
    ? new window.XMLHttpRequest() 
    : new ((window as unknown) as WindowWithActiveX).ActiveXObject('Microsoft.XMLHTTP');
} 