import * as dgram from 'dgram'; // Importing UDP module from Node.js to handle UDP sockets
import express from 'express';  // Importing Express to handle HTTP requests
import cors from 'cors';  // Importing CORS to handle cross-origin requests from the frontend

// ---------------------- DNS Server (UDP) ----------------------

// Create the UDP server to act as the DNS server
const udpServer: dgram.Socket = dgram.createSocket('udp4');  // Creating a UDP socket using IPv4

// Sample DNS records (mock for now)
const dnsRecords: { [domain: string]: { ip: string, ttl: number, type: string } } = {
  'google.com': { ip: '172.217.14.206', ttl: 3600, type: 'A' },  // A record for google.com
  'example.com': { ip: '93.184.216.34', ttl: 3600, type: 'A' },  // A record for example.com
  'yahoo.com': { ip: '98.137.11.164', ttl: 3600, type: 'A' },     // A record for yahoo.com
  'wikipedia.org': { ip: '208.80.154.224', ttl: 3600, type: 'A' },     // A record for wikipedia.org
  'archive.org': { ip: '207.241.224.2', ttl: 3600, type: 'A' },     // A record for archive.org
  'openstreetmap.org': { ip: '130.117.76.9', ttl: 3600, type: 'A' },     // A record for openstreetmap.org
};

// Create the HTTP server using Express
const httpServer = express();
httpServer.use(cors()); // Enable CORS

// Create a UDP client for communication with the Root Server
const udpClient = dgram.createSocket('udp4');

// Route to handle DNS lookup requests from the frontend
httpServer.get('/dns-lookup', (req, res) => {
  const domain = req.query.domain as string | undefined;  // Extract domain query parameter from the URL

  // Validate if domain is provided in the request
  if (!domain) {
    res.status(400).json({ error: 'Domain query parameter is missing or invalid' });
    return;
  }

  // Step 1: Prepare the query object
  const query = { 
    id: Date.now(), // Unique Transaction ID (using timestamp for simplicity)
    flags: 0,      // Flags for query/response
    questions: [{ domain, type: 'A' }]  // A record type query
  };

  const message = Buffer.from(JSON.stringify(query));
  let responseSent = false;  // Flag to track whether a response has been sent

  // Send the domain query to the Root Server (on port 3001, assuming the root server listens there)
  udpClient.send(message, 3001, 'localhost', (err) => {
    if (err) {
      // If sending the message fails, return an error response
      res.status(500).json({ error: 'Failed to send message to Root Server' });
    } else {
      console.log(`Message sent to Root Server for domain: ${domain}`);

      // Listen for a response from the Root Server (which contains the TLD Server IP)
      udpClient.once('message', (msg) => {
        if (!responseSent) {
          const tldServerIp = msg.toString();  // This is the TLD Server IP (mock)
          console.log(`Received TLD server IP: ${tldServerIp}`);

          // Step 2: Forward the query to the TLD server (simulated for now)
          // For this mock, we'll assume the same TLD server is storing the actual IP (from `dnsRecords`)
          const record = dnsRecords[domain];

          if (record) {
            // Send the IP to the client
            res.json({ message: 'Domain resolved', domain, ip: record.ip });
          } else {
            res.status(404).json({ error: 'Domain not found in TLD Server' });
          }

          responseSent = true;  // Mark response as sent
        }
      });

      // Add a timeout in case the Root Server doesn't respond within 2 seconds
      setTimeout(() => {
        if (!responseSent) {
          res.status(504).json({ error: 'No response from Root Server' });
          responseSent = true;
        }
      }, 2000);  // Timeout of 2 seconds
    }
  });
});

// Start the HTTP server on port 5000
httpServer.listen(5000, () => {
  console.log('HTTP server running on port 5000');
});


// use this to check if your udp is working properly or not(if you don't have telnet, netcat, etc)
// just paste this lines as it is in powershell make sure the check if you are using correct port(port can be any thing my is 53)
// $udpClient = New-Object System.Net.Sockets.UdpClient
// $serverAddress = [System.Net.IPAddress]::Parse("127.0.0.1")
// $remoteEndPoint = New-Object System.Net.IPEndPoint($serverAddress, 53)
// $message = [System.Text.Encoding]::ASCII.GetBytes("Hello from PowerShell")
// $udpClient.Send($message, $message.Length, $remoteEndPoint)
// $udpClient.Close()
