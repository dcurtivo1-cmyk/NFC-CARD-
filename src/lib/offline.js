let registration;

export async function savePageOffline(id) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return false;
  try {
    registration ||= navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
    });
    await registration;
    let ready;
    let readyTimeout;
    try {
      ready = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => {
          readyTimeout = setTimeout(
            () => reject(new Error("Offline setup timed out")),
            20_000,
          );
        }),
      ]);
    } finally {
      clearTimeout(readyTimeout);
    }
    return await new Promise((resolve) => {
      const channel = new MessageChannel();
      const finish = (value) => {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(value);
      };
      const timeout = setTimeout(() => finish(false), 10_000);
      channel.port1.onmessage = (event) => finish(event.data?.ready === true);
      ready.active.postMessage({ type: "SAVE_PUBLIC_PAGE", id }, [
        channel.port2,
      ]);
    });
  } catch {
    registration = undefined;
    return false;
  }
}
