import * as dgram from 'dgram';  // Importing UDP module from Node.js to handle UDP sockets
import express from 'express';   // Importing Express to handle HTTP requests
import cors from 'cors';         // Importing CORS to handle cross-origin requests from the frontend

// ---------------------- DNS Server (UDP) ----------------------

// Create the UDP server to act as the DNS server
const udpServer: dgram.Socket = dgram.createSocket('udp4');  // Creating a UDP socket using IPv4


// Create the HTTP server using Express
const httpServer = express();
httpServer.use(cors());  // Enable CORS

// Create a UDP client for communication with the Root Server
const udpClient = dgram.createSocket('udp4');

// Route to handle DNS lookup requests from the frontend
httpServer.get('/dns-lookup', async (req, res) => {
  const domain = req.query.domain as string | undefined;

  // Validate if the domain is provided in the request
  if (!domain) {
    res.status(400).json({ error: 'Domain query parameter is missing or invalid' });
    return;
  }

  // Step 1: Prepare the query object
  const query = {
    id: Date.now(),  // Unique Transaction ID (using timestamp for simplicity)
    flags: 0,        // Flags for query/response
    questions: [{ domain, type: 'A' }]  // A record type query
  };

  const rootMessage = Buffer.from(JSON.stringify(query));
  let tldServerIp: string | undefined;

  async function sendDnsQuery(message: Buffer, port: number, host: string): Promise<string> {
    return new Promise((resolve, reject) => {
      udpClient.send(message, port, host, (err) => {
        if (err) {
          return reject(err);
        }
        udpClient.once('message', (msg) => resolve(msg.toString()));  // Resolve when message is received
      });
  
      setTimeout(() => reject(new Error('Timeout')), 2000);  // Timeout after 2 seconds
    });
  }
  try {
    
    tldServerIp = await sendDnsQuery(rootMessage, 3001, 'localhost')  // This is the TLD Server IP (mock)
    console.log(`Received TLD server IP: ${tldServerIp}`);
  
    if (tldServerIp !== undefined) {
      // Step 2: Prepare the TLD query object
      const tldQuery = {
        id: Date.now(),  // Unique Transaction ID
        flags: 0,        // Flags for query/response
        questions: [{ domain, type: 'A', tldServerIp }]  // A record type query
      };
  
      const tldMessage = Buffer.from(JSON.stringify(tldQuery));
  
      try {
        const authServerIP: string | undefined = await sendDnsQuery(tldMessage, 3013, 'localhost')
        if(authServerIP !== undefined){
           // Step 3: Prepare the Authoritative query object
      const authQuery = {
        id: Date.now(),  // Unique Transaction ID
        flags: 0,        // Flags for query/response
        questions: [{ domain, type: 'A', tldServerIp, authServerIP }]  // A record type query
      };
  
      const authMessage = Buffer.from(JSON.stringify(authQuery));
  
          console.log(authServerIP, 'authserverIP')
            // Step 3: Forward the query to the Auth server (simulated for now)
            const record : string | undefined = await sendDnsQuery(authMessage, 7499, 'localhost')
            console.log(record, 'this is record')
            if (record) {
              res.json({ message: 'Domain resolved', domain, ip: record });
            } else {
              res.status(404).json({ error: 'Domain not found in TLD Server' });
            }
        }
      } catch (error) {
        console.log(error)
      }
    }
  } catch (error) {
  console.log(error)   
  }
  
});

// Start the HTTP server on port 5000
httpServer.listen(5000, () => {
  console.log('HTTP server running on port 5000');
});


