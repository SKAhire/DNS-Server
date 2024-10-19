import * as dgram from 'dgram'; // Importing UDP module from Node.js to handle UDP sockets
import express from 'express';  // Importing Express to handle HTTP requests
import cors from 'cors';  // Importing CORS to handle cross-origin requests from the frontend

// ---------------------- Root Server (UDP) ----------------------

// Create the UDP server to act as the Root Server
const udpServer: dgram.Socket = dgram.createSocket('udp4');  // Creating a UDP socket using IPv4

// Sample DNS records (hardcoded)
// These are mappings of TLDs (top-level domains) to TLD server IP addresses
const dnsRecords: { [tld: string]: { tldServerIp: string, ttl: number, type: string } } = {
  ".com": { tldServerIp: "192.168.1.100", ttl: 3600, type: "NS" },  // NS record for .com
  ".org": { tldServerIp: "192.168.1.101", ttl: 3600, type: "NS" },  // NS record for .org
  ".net": { tldServerIp: "192.168.1.102", ttl: 3600, type: "NS" },  // NS record for .net
};

// Event listener for handling incoming messages (DNS queries)
udpServer.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
  console.log(`Root server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

  // Step 1: Parse the incoming DNS query message
  const query = JSON.parse(msg.toString());
  const domain = query.questions[0].domain;  // Extract the domain name from the query
  const tld = domain.slice(domain.lastIndexOf("."));  // Extract the TLD (e.g., .com)

  console.log(`Received query for domain: ${domain} (TLD: ${tld})`);

  // Step 2: Look up the TLD in the DNS records
  const record = dnsRecords[tld];

  // Step 3: Send a response back to the DNS resolver
  if (record) {
    // If the TLD is found, send back the TLD server IP
    const response = { tldServerIp: record.tldServerIp, ttl: record.ttl, type: record.type };
    udpServer.send(Buffer.from(JSON.stringify(response)), rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error('Failed to send DNS response');
      } else {
        console.log(`Sent TLD server IP for ${tld}: ${record.tldServerIp}`);
      }
    });
  } else {
    // If the TLD is not found, respond with an error
    const errorResponse = { error: 'TLD not found' };
    udpServer.send(Buffer.from(JSON.stringify(errorResponse)), rinfo.port, rinfo.address);
    console.log(`TLD ${tld} not found in records.`);
  }
});

// Event listener for when the UDP server starts listening on the specified port
udpServer.on('listening', () => {
  const address = udpServer.address();  // Get server address info
  console.log(`Root server listening on ${address.address}:${address.port}`);
});

// Event listener for error handling on the UDP server
udpServer.on('error', (err: Error) => {
  console.error(`server error:\n${err.stack}`);  // Log error stack
  udpServer.close();  // Close the server on error
});

// Bind the UDP server to port 3001
udpServer.bind(3001, () => console.log("Root DNS server running on port 3001"));
