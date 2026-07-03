/**
 * notificationService.js — Phase 3: Event-Driven Automation Engine
 *
 * Subscribes to the eventBus and dispatches real-time parallel notifications.
 * Failures here are logged but never crash the server or block the HTTP request.
 */

const axios = require('axios');
const eventBus = require('./eventBus');
const { sendContactEmail } = require('./emailService'); // Re-use standard email transport for now
const Log = require('../models/Log');

// ── Webhook Dispatcher (Slack / MS Teams) ───────────────────────────
async function dispatchWebhook(url, payload) {
    if (!url) return;
    try {
        // Send a simple formatted message (Slack compatible)
        await axios.post(url, {
            text: `*${payload.title}*\n${payload.message}`,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*${payload.title}*\n${payload.message}`
                    }
                }
            ]
        }, { timeout: 3000 });
    } catch (err) {
        console.error(`[Webhook Failed] ${url}:`, err.message);
    }
}

// ── Badge Printer Dispatcher (Raw TCP) ──────────────────────────────
async function printBadge(ip, port, format, data) {
    if (!ip || format === 'none') return;
    
    if (format === 'pdf') {
        // In a real implementation, this would generate a PDF via Puppeteer/PDFKit
        // and optionally send to a CUPS print server or save to an S3 bucket.
        console.log(`[Printer] Generated PDF badge for ${data.name} (simulated)`);
        return;
    }

    // Raw ZPL over TCP (Zebra standard)
    if (format === 'zpl') {
        const zpl = `
^XA
^FO50,50^A0N,50,50^FD${data.name}^FS
^FO50,110^A0N,30,30^FD${data.company || 'Visitor'}^FS
^FO50,160^A0N,30,30^FDIn: ${data.timeIn}^FS
^FO50,220^B3N,N,100,Y,N^FD${data.id}^FS
^XZ
        `.trim();
        
        try {
            const net = require('net');
            const client = new net.Socket();
            client.setTimeout(3000); // 3s timeout so we don't hang
            
            client.connect(port || 9100, ip, () => {
                client.write(zpl);
                client.end();
                console.log(`[Printer] ZPL sent to ${ip}:${port}`);
            });
            
            client.on('error', (err) => {
                console.error(`[Printer Failed] ${ip}:${port}:`, err.message);
                client.destroy();
            });
            
            client.on('timeout', () => {
                console.error(`[Printer Timeout] ${ip}:${port}`);
                client.destroy();
            });
        } catch (e) {
            console.error('[Printer Exception]', e);
        }
    }
}

// ── Event Handlers ──────────────────────────────────────────────────

eventBus.on('checkin', async ({ log, project, group }) => {
    // 1. Host Notification (if enabled by Visitor Group config)
    if (group && group.notify_host) {
        const title = `${log.visitor_group || 'Visitor'} Checked In`;
        const msg = `${log.name} from ${log.trade || 'N/A'} arrived at ${log.time_in}.`;
        
        // Parallel dispatch
        Promise.all([
            // Webhooks
            dispatchWebhook(project.webhook_slack, { title, message: msg }),
            dispatchWebhook(project.webhook_teams, { title, message: msg }),
            // Email to Admin
            project.admin_email ? sendContactEmail(project.admin_email, `Automated Alert:\n\n${title}\n${msg}`) : Promise.resolve()
        ]).catch(e => console.error('[Host Notification Error]', e));

        // Mark as notified in DB asynchronously
        Log.findByIdAndUpdate(log._id, { host_notified: true }).exec().catch(e => {});
    }

    // 2. Auto-Print Badge (if enabled)
    if (group && group.print_badge && project.printer_ip) {
        await printBadge(project.printer_ip, project.printer_port, project.badge_format, {
            name: log.name,
            company: log.trade,
            timeIn: log.time_in,
            id: log._id.toString().slice(-6)
        });
        
        Log.findByIdAndUpdate(log._id, { badge_printed: true }).exec().catch(e => {});
    }
});

eventBus.on('delivery', async ({ log, project, recipientName }) => {
    const title = `📦 Delivery Arrived`;
    const msg = `A parcel for ${recipientName || 'Front Desk'} has arrived (Ref: ${log.parcel_ref || 'Unknown'}). Checked in at ${log.time_in}.`;

    // Dispatch Webhooks
    Promise.all([
        dispatchWebhook(project.webhook_slack, { title, message: msg }),
        dispatchWebhook(project.webhook_teams, { title, message: msg }),
        project.admin_email ? sendContactEmail(project.admin_email, `Automated Alert:\n\n${title}\n${msg}`) : Promise.resolve()
    ]).catch(e => console.error('[Delivery Notification Error]', e));
});

module.exports = {
    dispatchWebhook,
    printBadge
};
