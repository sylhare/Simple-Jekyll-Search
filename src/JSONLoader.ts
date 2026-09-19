type Callback = (error: Error | null, data: any) => void;

export function load(location: string, callback: Callback): void {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', location, true);
  xhr.onreadystatechange = createStateChangeListener(xhr, callback);
  xhr.send();
}

function createStateChangeListener(xhr: XMLHttpRequest, callback: Callback): () => void {
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
