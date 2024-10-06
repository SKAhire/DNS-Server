import * as dgram from 'dgram'; // Importing UDP module from Node.js to handle UDP sockets
import express from 'express';  // Importing Express to handle HTTP requests
import cors from 'cors';  // Importing CORS to handle cross-origin requests from the frontend

// ---------------------- DNS Resolver (UDP) ----------------------

// Create the UDP server to act as the DNS Resolver
const udpServer: dgram.Socket = dgram.createSocket('udp4');  // Creating a UDP socket using IPv4

// Sample DNS records (hardcoded)
// These are mappings of domain names to IP addresses, similar to how an actual DNS Resolver works
const dnsRecords: { [domain: string]: { ip: string, ttl: number, type: string } } = {
  'google.com': { ip: '172.217.14.206', ttl: 3600, type: 'A' },  // A record for google.com
  'example.com': { ip: '93.184.216.34', ttl: 3600, type: 'A' },  // A record for example.com
  'yahoo.com': { ip: '98.137.11.164', ttl: 3600, type: 'A' }     // A record for yahoo.com
};

// Event listener for error handling on the UDP server
udpServer.on('error', (err: Error) => {
  console.error(`server error:\n${err.stack}`);  // Log error stack
  udpServer.close();  // Close the server on error
});

// Event listener for handling incoming messages (DNS queries)
udpServer.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  
  // Extract domain from the received message
  const domain = msg.toString();

  // Look up the domain in the DNS records
  const record = dnsRecords[domain];

  // If the domain is found in the records
  if (record) {
    // Create a response containing the IP address and send it back to the client
    const response = Buffer.from(record.ip);
    udpServer.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) console.error('Failed to send DNS response');  // Log any errors in sending the response
    });
  } else {
    // If the domain is not found, respond with "Domain not found"
    console.log(`Domain ${domain} not found in records.`);
    const response = Buffer.from('Domain not found');
    udpServer.send(response, rinfo.port, rinfo.address);  // Send response
  }
});

// Event listener for when the UDP server starts listening on the specified port
udpServer.on('listening', () => {
  const address = udpServer.address();  // Get server address info
  console.log(`UDP server listening ${address.address}:${address.port}`);
});

// Bind the UDP server to port 53 (standard DNS port)
udpServer.bind(53, () => console.log("DNS is on port 53"));

// ---------------------- HTTP Server (Express) ----------------------

// Create the HTTP server using Express
const httpServer = express();

// Enable CORS for cross-origin requests (useful when connecting from a React frontend)
httpServer.use(cors());

// Create a UDP client to send DNS queries to the UDP server
const udpClient = dgram.createSocket('udp4');

// Route to handle DNS lookup requests from the frontend
httpServer.get('/dns-lookup', (req, res) => {
  const domain = req.query.domain as string | undefined;  // Extract domain query parameter from the URL

  // Validate if domain is provided in the request
  if (!domain) {
    res.status(400).json({ error: 'Domain query parameter is missing or invalid' });  // Return error if missing
    return;
  }

  // Prepare the domain query to be sent to the UDP server
  const message = Buffer.from(domain);
  let responseSent = false;  // Flag to track whether a response has been sent

  // Send the domain query to the local UDP DNS Resolver
  udpClient.send(message, 53, 'localhost', (err) => {
    if (err) {
      // If sending the message fails, return an error response
      res.status(500).json({ error: 'UDP message failed' });
    } else {
      console.log(`UDP message sent for domain: ${domain}`);

      // Listen for a response from the UDP server
      udpClient.once('message', (msg) => {
        if (!responseSent) {  // Ensure only one response is sent
          const ip = msg.toString();  // Convert the received buffer to a string (the IP address)
          res.json({ message: 'Domain resolved', domain, ip });  // Send the IP as the response
          responseSent = true;  // Mark response as sent
        }
      });

      // Add a timeout in case the UDP server doesn't respond within 2 seconds
      setTimeout(() => {
        if (!responseSent) {  // Ensure the timeout doesn't send another response if already sent
          res.status(504).json({ error: 'No response from DNS Resolver' });  // Return timeout error
          responseSent = true;  // Mark response as sent
        }
      }, 2000);  // Timeout period of 2 seconds
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
