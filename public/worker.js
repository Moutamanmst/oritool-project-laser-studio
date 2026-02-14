// worker.js - background worker for admin dashboard polling
let intervalId = null;
self.onmessage = function (e) {
    if (e.data === 'start') {
        // Send a tick immediately and then every 5 seconds
        self.postMessage('tick');
        intervalId = setInterval(() => {
            self.postMessage('tick');
        }, 5000);
    } else if (e.data === 'stop') {
        if (intervalId) clearInterval(intervalId);
    }
};
