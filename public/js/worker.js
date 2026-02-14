
// worker.js
// Runs in a background thread to poll for new appointments.
// This allows the check to continue even when the main tab is throttled/backgrounded.

// Notify main thread that worker is running
postMessage({ type: 'connection_status', status: 'loaded' });

let lastCount = -1;

function pollAppointments() {
    fetch('/api/appointments/count')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok: ' + response.status);
            return response.json();
        })
        .then(data => {
            const count = data.count;

            if (lastCount === -1) {
                // First successful poll: Initialize
                lastCount = count;
                postMessage({ type: 'init', count: count });
            } else if (count > lastCount) {
                // Count increased: New appointment(s)!
                lastCount = count;
                postMessage({ type: 'new_appointment', count: count });
            } else if (count < lastCount) {
                // Count decreased (deleted items): Just update local state, no notification
                lastCount = count;
                postMessage({ type: 'update', count: count });
            }
            // Always send heartbeat
            postMessage({ type: 'heartbeat', count: count });
        })
        .catch(error => {
            // REPORT ERROR
            postMessage({ type: 'error', error: error.message });
        });
}

// Start polling immediately
pollAppointments();

// Poll every 5 seconds
setInterval(pollAppointments, 5000);
