# Transaction Tracker - Quickstart Guide

This guide provides step-by-step instructions to set up, run, and test the Transaction Tracker application. Follow the steps below to get started quickly.

---

## Prerequisites

Ensure you have the following installed before proceeding:

1. **[Node.js](https://nodejs.org/en/download)**  
   - Version: `v22.3.0` or later.
2. **[Docker](https://docs.docker.com/engine/install/)**  
   - Installed and running.
3. **Etherscan API Key**  
   - Get your API key by following [this guide](https://docs.etherscan.io/getting-started/viewing-api-usage-statistics).

---

## Environment Setup

If the `.env` file is not included in your repository, create a local copy using the following command:

```bash
cp .env-sample .env
```

### Configure `.env`
1. Add your **Etherscan API key** to the `.env` file:
   ```plaintext
   ETHERSCAN_API_KEY=your_api_key_here
   ```
2. (Optional) Set the starting block for processing:
   ```plaintext
   APP_START_BLOCK=your_starting_block_number
   ```

---

## Installation

Install the necessary dependencies using:

```bash
npm install
```

---

## Running the Application

### **Production Mode**

1. Start the application using Docker Compose:

   ```bash
   docker compose up
   ```

2. Once the application is initialized, you can access:
   - **Swagger API Documentation**: [http://localhost:3000/documentation](http://localhost:3000/documentation)
   - **PhpMyAdmin Interface**: [http://localhost:8080](http://localhost:8080)
     - Username: root
     - Password: abc123
  
---

### **Development Mode**

1. Start the required Docker services:

   ```bash
   docker compose up redis db phpmyadmin
   ```

2. Start the application in development mode:

   ```bash
   npm run start:dev
   ```

3. Access the following once initialized:
   - **Swagger API Documentation**: [http://localhost:3000/documentation](http://localhost:3000/documentation)

---

## Testing

### **Unit Tests**

Run all unit tests with:

```bash
npm run test
```

To see all the unit tests (in verbose mode):

```bash
npm run test:verbose
```

### **Integration (e2e) Tests**

1. Ensure the following Docker services are running before testing:
   ```bash
   docker compose up redis db phpmyadmin
   ```

2. Run end-to-end tests with:

   ```bash
   npm run test:e2e
   ```

---

## Additional Features

### **API Documentation**
The Swagger UI for the API can be accessed at:  
[http://localhost:3000/documentation](http://localhost:3000/documentation)

### **BullMQ Dashboard**
Monitor and manage background queues via the BullMQ Dashboard:  
[http://localhost:3000/sync/queues](http://localhost:3000/sync/queues)

### **Detailed Writeup Explaining Architectural Decisions & More**
[https://docs.google.com/document/d/19VTtZc78U4LMXLZIaYyzk-t05kSo8XQFT5ERwjKouOs/edit?tab=t.0#heading=h.whizzzusmaeu](https://docs.google.com/document/d/19VTtZc78U4LMXLZIaYyzk-t05kSo8XQFT5ERwjKouOs/edit?tab=t.0#heading=h.whizzzusmaeu)

---

## Troubleshooting

- If you encounter issues during testing or setup, ensure that all required Docker containers (`redis`, `db`, `phpmyadmin`) are running.
- Verify that all `.env` variables are correctly configured.

---

### **Happy Tracking!** 🚀
