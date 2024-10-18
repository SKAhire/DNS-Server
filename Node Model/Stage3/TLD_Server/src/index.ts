import * as dgram from 'dgram'; // Importing UDP module from Node.js to handle UDP sockets

// ---------------------- TLD Server (UDP) ----------------------

// Create the UDP server to act as the TLD Server
const udpServer: dgram.Socket = dgram.createSocket('udp4');  // Creating a UDP socket using IPv4
interface DnsRecord {
  authServerIp: string;
  ttl: number;
  type: string;
}

interface DomainRecords {
  domains: Record<string, DnsRecord>;
}

interface DnsRecords {
  [key: string]: DomainRecords;
}
// Sample DNS records (hardcoded)
// These are mappings of TLDs (top-level domains) to TLD server IP addresses
const dnsRecords: DnsRecords  = {
    "192.168.1.100": {
      "domains": {
        "google.com": { "authServerIp": "203.0.113.1", "ttl": 3600, "type": "A" },
        "amazon.com": { "authServerIp": "203.0.113.2", "ttl": 3600, "type": "A" }
      }
    },
    "192.168.1.101": {
      "domains": {
        "wikipedia.org": { "authServerIp": "203.0.113.3", "ttl": 3600, "type": "A" },
        "openstreetmap.org": { "authServerIp": "203.0.113.4", "ttl": 3600, "type": "A" }
      }
    },
    "192.168.1.102": {
      "domains": {
        "example.net": { "authServerIp": "203.0.113.5", "ttl": 3600, "type": "A" },
        "test.net": { "authServerIp": "203.0.113.6", "ttl": 3600, "type": "A" }
      }
    }
  };

// Event listener for handling incoming messages (DNS queries)
udpServer.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
  console.log(`TLD Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

  // Step 1: Parse the incoming DNS query message
  const query = JSON.parse(msg.toString());
  const domain = query.questions[0].domain;  // Extract the domain name from the query
  const tldIp = query.questions[0].tldServerIp;  // Extract the TLD (e.g., .com)
  // Parse the string to an object
  const parsedTldIp = JSON.parse(tldIp);

  // Access the actual IP from the parsed object
  const actualTldIp = parsedTldIp.tldServerIp;
  const record = dnsRecords[actualTldIp]?.domains[domain];
  // Step 3: Send a response back to the DNS resolver
  if (record) {
    console.log(record, "this are record")
    // If the TLD is found, send back the TLD server IP
    const response = { authServerIp: record.authServerIp, ttl: record.ttl, type: record.type };
    udpServer.send(Buffer.from(JSON.stringify(response)), rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error('Failed to send DNS response');
      } else {
        console.log(`Sent Auth server IP for ${actualTldIp}: ${record.authServerIp}`);
      }
    });
  } else {
    // If the TLD is not found, respond with an error
    const errorResponse = { error: 'TLD not found' };
    udpServer.send(Buffer.from(JSON.stringify(errorResponse)), rinfo.port, rinfo.address);
    console.log(`Auth server for ${actualTldIp} not found in records.`);
  }

});

// Event listener for when the UDP server starts listening on the specified port
udpServer.on('listening', () => {
  const address = udpServer.address();  // Get server address info
  console.log(`TLD Server listening on ${address.address}:${address.port}`);
});

// Event listener for error handling on the UDP server
udpServer.on('error', (err: Error) => {
  console.error(`server error:\n${err.stack}`);  // Log error stack
  udpServer.close();  // Close the server on error
});

// Bind the UDP server to port 3013
udpServer.bind(3013, () => console.log("Root DNS server running on port 3013"));
