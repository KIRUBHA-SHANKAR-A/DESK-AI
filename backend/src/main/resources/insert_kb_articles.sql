USE desk_ai;

USE desk_ai;

-- Delete any existing recommendations that reference knowledge_base
DELETE FROM airecommendation;

-- Clear the knowledge_base table
DELETE FROM knowledge_base;

-- Insert 10 simple knowledge‑base articles
INSERT INTO knowledge_base (
    title,
    summary,
    content,
    keywords,
    category_id,
    active,
    views,
    created_at,
    updated_at
) VALUES
('No Wi‑Fi',
 'Troubleshoot Wi‑Fi connectivity issues.',
 '1. Ensure Wi‑Fi is turned on.
2. Check router status.
3. Restart your computer.
4. Forget and reconnect to the network.
5. Contact IT if still unresolved.',
 'wifi, connectivity, network',
 1, 1, 0, NOW(), NOW()),
('Internet Issue',
 'Fix general internet access problems.',
 '1. Verify Ethernet cable is connected (if wired).
2. Reboot router/modem.
3. Check DNS (use 8.8.8.8 as fallback).
4. Run `ipconfig /release` and `ipconfig /renew`.
5. Raise a ticket if the problem persists.',
 'internet, connectivity, network',
 1, 1, 0, NOW(), NOW()),
('VPN Connection Problem',
 'Resolve common VPN connectivity failures.',
 '1. Verify VPN client is installed and up‑to‑date.
2. Ensure you are using the correct server address.
3. Check your credentials and MFA token.
4. Disable any conflicting local firewalls.
5. If the tunnel does not establish, contact the network team.',
 'vpn, globalprotect, anyconnect, connectivity',
 1, 1, 0, NOW(), NOW()),
('Printer Not Working',
 'Basic printer troubleshooting steps.',
 '1. Confirm printer is powered on.
2. Check for paper jams or low ink/toner.
3. Restart the printer.
4. Reinstall or update the driver.
5. Set the printer as the default device.',
 'printer, hardware, driver',
 1, 1, 0, NOW(), NOW()),
('Software Installation Failed',
 'Common reasons software installations fail.',
 '1. Run installer as Administrator.
2. Ensure sufficient disk space.
3. Temporarily disable antivirus.
4. Verify all prerequisite components are present.
5. Review installer logs for error codes.',
 'software, installation, error',
 1, 1, 0, NOW(), NOW()),
('Email Not Sending',
 'Diagnose email‑sending issues.',
 '1. Check SMTP server settings and credentials.
2. Verify internet connectivity.
3. Ensure mailbox is not over quota.
4. Look for errors in the Outbox.
5. Test sending via webmail to isolate client problems.',
 'email, smtp, sending',
 1, 1, 0, NOW(), NOW()),
('Application Crash',
 'Steps to handle a crashing application.',
 '1. Capture the error message or crash dump.
2. Check for recent updates or patches.
3. Run the application as Administrator.
4. Verify required dependencies are installed.
5. If still crashing, open a ticket with logs attached.',
 'crash, application, troubleshooting',
 1, 1, 0, NOW(), NOW()),
('Slow Computer Performance',
 'Improve sluggish system performance.',
 '1. Reboot the computer.
2. Close unnecessary background programs.
3. Run Disk Cleanup and delete temp files.
4. Check for malware with an approved scanner.
5. Ensure Windows updates are applied.',
 'performance, slow, optimization',
 1, 1, 0, NOW(), NOW()),
('File Permission Error',
 'Resolve “Access Denied” file permission issues.',
 '1. Verify you have the required read/write rights.
2. Check the file’s NTFS permissions.
3. If on a network share, confirm share permissions.
4. Run the operation as an elevated user if needed.
5. Contact the file‑owner for additional rights.',
 'permissions, access denied, file',
 1, 1, 0, NOW(), NOW());
