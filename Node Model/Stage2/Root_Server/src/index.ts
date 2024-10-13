import * as dgram from 'dgram'; // Importing UDP module from Node.js to handle UDP sockets
import express from 'express';  // Importing Express to handle HTTP requests
import cors from 'cors';  // Importing CORS to handle cross-origin requests from the frontend

// ---------------------- Root Server (UDP) ----------------------

// Create the UDP server to act as the Root Server
const udpServer: dgram.Socket = dgram.createSocket('udp4');  // Creating a UDP socket using IPv4

// Sample DNS records (hardcoded)
// These are mappings of domain names to IP addresses, similar to how an actual Root Server works
const dnsRecords: { [domain: string]: { tldServerIp: string} } = {
    ".com": { tldServerIp: "192.168.1.100" },
    ".org": { tldServerIp: "192.168.1.101" },
    ".net": { tldServerIp: "192.168.1.102" },
    ".edu": { tldServerIp: "192.168.1.103" }
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
    const response = Buffer.from(record.tldServerIp);
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
udpServer.bind(3001, () => console.log("DNS is on port 3001"));

// ---------------------- HTTP Server (Express) ----------------------

// Create the HTTP server using Express
const httpServer = express();

// Enable CORS for cross-origin requests (useful when connecting from a React frontend)
httpServer.use(cors());

// Create a UDP client to send DNS queries to the UDP server
const udpClient = dgram.createSocket('udp4');


const message = Buffer.from('testing');
let responseSent = false;  // Flag to track whether a response has been sent
 // Send the domain query to the local UDP Root Server
 udpClient.send(message, 53, 'localhost', (err) => {
  if (err) {
    // If sending the message fails, return an error response
    console.log("Error: ", err)
  } else {
    // console.log(`UDP message sent for domain: ${domain}`);

    // Listen for a response from the UDP server
    udpClient.once('message', (msg) => {
      if (!responseSent) {  // Ensure only one response is sent
        const ip = msg.toString();  // Convert the received buffer to a string (the IP address)
        // res.json({ message: 'Domain resolved', domain, ip });  // Send the IP as the response
        responseSent = true;  // Mark response as sent
      }
    });

    // Add a timeout in case the UDP server doesn't respond within 2 seconds
    setTimeout(() => {
      if (!responseSent) {  // Ensure the timeout doesn't send another response if already sent
        // res.status(504).json({ error: 'No response from Root Server' });  // Return timeout error
        responseSent = true;  // Mark response as sent
      }
    }, 2000);  // Timeout period of 2 seconds
  }
});

