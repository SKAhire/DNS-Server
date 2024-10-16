# DNS Server Project - Stage 2

## Overview

Stage 2 of the DNS project focuses on introducing the **Root Server** into the architecture. The Root Server helps forward DNS queries to appropriate TLD (Top-Level Domain) servers. In this stage, the Root Server is responsible for handling requests from the DNS Resolver and responding with the IP address of the relevant TLD Server.

### Key Features Implemented:
1. A **Root Server** using UDP that processes incoming DNS queries.
2. The **DNS Resolver** sends requests to the Root Server.
3. The Root Server responds with the appropriate TLD Server IP based on the domain's TLD (e.g., `.com`, `.org`).
4. Basic UDP communication between DNS Resolver and Root Server.
5. Mock data to simulate the behavior of TLD Servers.

## Root Server

The Root Server handles the initial domain lookup by determining the correct TLD Server (e.g., `.com`, `.org`, `.net`). The server runs on **UDP** and listens for incoming requests from the DNS Resolver.

### Mock TLD Records:

const dnsRecords: { [domain: string]: { tldServerIp: string, ttl: number, type: string } } = {
  ".com": { tldServerIp: "192.168.1.100", ttl: 3600, type: "NS" },
  ".org": { tldServerIp: "192.168.1.101", ttl: 3600, type: "NS" },
  ".net": { tldServerIp: "192.168.1.102", ttl: 3600, type: "NS" },
  ".edu": { tldServerIp: "192.168.1.103", ttl: 3600, type: "NS" }
};

When a domain like google.com is requested, the Root Server will parse the TLD (.com in this case) and respond with the associated TLD Server IP (192.168.1.100).

### DNS Resolver
The DNS Resolver, initially developed in Stage 1, is updated in Stage 2 to forward DNS queries to the Root Server. Once it receives the TLD Server IP from the Root Server, it will resolve the domain by requesting the TLD Server (mocked for now).