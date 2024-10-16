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
    ".com": {
      "domains": {
        "google.com": { "authServerIp": "203.0.113.1", "ttl": 3600, "type": "A" },
        "amazon.com": { "authServerIp": "203.0.113.2", "ttl": 3600, "type": "A" }
      }
    },
    ".org": {
      "domains": {
        "wikipedia.org": { "authServerIp": "203.0.113.3", "ttl": 3600, "type": "A" },
        "openstreetmap.org": { "authServerIp": "203.0.113.4", "ttl": 3600, "type": "A" }
      }
    },
    ".net": {
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
  const tld = domain.slice(domain.lastIndexOf("."));  // Extract the TLD (e.g., .com)

  console.log(`Received query for domain: ${domain} (TLD: ${tld})`);

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
