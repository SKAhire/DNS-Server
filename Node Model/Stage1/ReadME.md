# DNS Server Project - Stage 1

## Overview
This project is a simple DNS server implementation using Node.js, UDP, Express, and React.js. The goal of Stage 1 is to build a basic DNS server that accepts domain name input from a user, processes it through a UDP server, and returns the corresponding IP address.

### Key Components:
1. **Frontend (React)**: Takes the domain name as input from the user and displays the resolved IP address or an error message.
2. **Backend (Node.js with Express and UDP)**:
   - **UDP DNS Server**: Listens for domain name queries on port 53 and responds with the corresponding IP address from a predefined set of DNS records.
   - **UDP Client**: Sends domain queries from the Express server to the UDP DNS server.
   - **Express HTTP Server**: Receives HTTP requests from the React frontend and forwards them to the UDP client.

---

## Stage 1 - Completed Features

### DNS Records
The UDP server maintains a small set of DNS records for testing purposes, including:
- `google.com`
- `example.com`
- `yahoo.com`

These records map to their respective IP addresses and are hardcoded in the server.

### UDP DNS Server
- Listens on **port 53** (the standard DNS port).
- Receives domain queries via UDP.
- Checks the domain in a predefined set of DNS records.
- Responds with the associated IP address or an error message if the domain is not found.

### Express HTTP Server
- Provides an endpoint `/dns-lookup` for domain lookups.
- Receives domain name from the React frontend and forwards it to the UDP DNS server.
- Returns the resolved IP address or error message back to the frontend.

### React Frontend
- Simple user interface that allows users to input a domain name (e.g., `google.com`).
- Sends a request to the `/dns-lookup` endpoint.
- Displays the resolved IP address or an error message in an alert.
- Redirects the user to the resolved IP address if the lookup is successful.

---
