import * as dgram from 'dgram'; // Importing for UDP
import express from 'express';  // HTTP Server
import cors from 'cors';  // Import CORS

// Create the UDP server
const udpServer: dgram.Socket = dgram.createSocket('udp4');

// UDP server event handlers
udpServer.on('error', (err: Error) => {
  console.error(`server error:\n${err.stack}`);
  udpServer.close();
});

udpServer.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  // Respond back via HTTP (send response from here)
});

udpServer.on('listening', () => {
  const address = udpServer.address();
  console.log(`UDP server listening ${address.address}:${address.port}`);
});

udpServer.bind(53, () => console.log("DNS is on port 53"));

// Create HTTP server using Express
const httpServer = express();
httpServer.use(cors());  // Enable CORS
const udpClient = dgram.createSocket('udp4');  // UDP Client for sending DNS queries

// Set up route to handle domain lookup from React frontend
httpServer.get('/dns-lookup', (req, res) => {
  const domain = req.query.domain as string | undefined;

if (!domain) {
  res.status(400).json({ error: 'Domain query parameter is missing or invalid' });
  return;
};

  // Send the domain query to the UDP server
  const message = Buffer.from(domain);
  udpClient.send(message, 53, 'localhost', (err) => {
    if (err) {
      res.status(500).json({ error: 'UDP message failed' });
    } else {
      console.log(`UDP message sent for domain: ${domain}`);

      // Mock response for now, send back success to React frontend
      res.json({ message: 'UDP query sent', domain });
    }
  });
});

// Listen for HTTP requests
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
