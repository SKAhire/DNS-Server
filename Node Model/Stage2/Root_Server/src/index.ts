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

  // Extract the domain from the received message
  const domain = msg.toString().trim();  // E.g., "google.com"

  // Extract the top-level domain (TLD) from the domain
  const tld = domain.slice(domain.lastIndexOf("."));  // E.g., ".com"
  // Look up the TLD in the DNS records
  const record = dnsRecords[tld];

  // If the TLD is found in the records
  if (record) {
      // Create a response containing the TLD server IP and send it back to the client
      const response = Buffer.from(record.tldServerIp);
      udpServer.send(response, rinfo.port, rinfo.address, (err) => {
          if (err) console.error('Failed to send DNS response');
      });
  } else {
      // If the TLD is not found, respond with "TLD not found"
      console.log(`TLD ${tld} not found in records.`);
      const response = Buffer.from('TLD not found');
      udpServer.send(response, rinfo.port, rinfo.address);
  }
});


// Event listener for when the UDP server starts listening on the specified port
udpServer.on('listening', () => {
  const address = udpServer.address();  // Get server address info
  console.log(`UDP server listening ${address.address}:${address.port}`);
});

// Bind the UDP server to port 53 (standard DNS port)
udpServer.bind(3001, () => console.log("DNS is on port 3001"));