import * as dgram from 'dgram'; // Importing UDP module from Node.js to handle UDP sockets

// ---------------------- Authoritative oriative Server (UDP) ----------------------

// Create the UDP server to act as the Authoritative Server
const udpServer: dgram.Socket = dgram.createSocket('udp4');  // Creating a UDP socket using IPv4
interface AuthDnsRecord {
  ip: string;
  ttl: number;
  type: string;
}

interface AuthDomainRecords {
  domains: Record<string, AuthDnsRecord>;
}

interface AuthDnsRecords {
  [key: string]: AuthDomainRecords;
}

// Sample DNS records (hardcoded)
// These are mappings of authoritative servers to their domain records
const authDnsRecords: AuthDnsRecords = {
  "203.0.113.1": {  // Authoritative server IP for domains under .com
    "domains": {
      "google.com": { "ip": "142.250.72.14", "ttl": 3600, "type": "A" },
      "amazon.com": { "ip": "205.251.242.103", "ttl": 3600, "type": "A" }
    }
  },
  "203.0.113.3": {  // Authoritative server IP for domains under .org
    "domains": {
      "wikipedia.org": { "ip": "208.80.154.224", "ttl": 3600, "type": "A" },
      "openstreetmap.org": { "ip": "130.117.76.9", "ttl": 3600, "type": "A" }
    }
  },
  "203.0.113.5": {  // Authoritative server IP for domains under .net
    "domains": {
      "example.net": { "ip": "93.184.216.34", "ttl": 3600, "type": "A" },
      "test.net": { "ip": "192.0.2.123", "ttl": 3600, "type": "A" }
    }
  }
};


// Event listener for handling incoming messages (DNS queries)
udpServer.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
  console.log(`Authoritative Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

  // Step 1: Parse the incoming DNS query message
  const query = JSON.parse(msg.toString());
  const domain = query.questions[0].domain;  // Extract the domain name from the query
  const authObj = query.questions[0].authServerIP;
  const authParse = JSON.parse(authObj);
  const actualIP = authParse.authServerIp; 
  const record = authDnsRecords[actualIP].domains[domain]
  console.log(record, "this are record")
  if (record) {
    // If the Authoritative is found, send back the Authoritative server IP
    const response = { ip: record.ip, ttl: record.ttl, type: record.type };
    udpServer.send(Buffer.from(JSON.stringify(response)), rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error('Failed to send DNS response');
      } else {
        console.log(`Sent Auth server IP for ${domain}: ${record}`);
      }
    });
  } else {
    // If the Authoritative is not found, respond with an error
    const errorResponse = { error: 'Authoritative not found' };
    udpServer.send(Buffer.from(JSON.stringify(errorResponse)), rinfo.port, rinfo.address);
    console.log(`Auth server for ${domain} not found in records.`);
  }

});

// Event listener for when the UDP server starts listening on the specified port
udpServer.on('listening', () => {
  const address = udpServer.address();  // Get server address info
  console.log(`Authoritative Server listening on ${address.address}:${address.port}`);
});

// Event listener for error handling on the UDP server
udpServer.on('error', (err: Error) => {
  console.error(`server error:\n${err.stack}`);  // Log error stack
  udpServer.close();  // Close the server on error
});

// Bind the UDP server to port 7499
udpServer.bind(7499, () => console.log("Root DNS server running on port 7499"));
