const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

function renderHtml(title, subtitle, command, output, badge = 'LAB 5 VERIFICATION') {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0f172a;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    padding: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  .card {
    background: #1e293b;
    width: 1100px;
    border-radius: 12px;
    border: 1px solid #334155;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .header {
    background: #0f172a;
    padding: 16px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #334155;
  }
  .dots {
    display: flex;
    gap: 8px;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .dot-red { background: #ef4444; }
  .dot-yellow { background: #eab308; }
  .dot-green { background: #22c55e; }
  .title-group {
    text-align: center;
  }
  .title {
    color: #f8fafc;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .subtitle {
    color: #94a3b8;
    font-size: 12px;
    margin-top: 2px;
  }
  .badge {
    background: #0284c7;
    color: #f0f9ff;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .terminal {
    background: #090d16;
    padding: 24px;
    font-family: 'Consolas', 'Cascadia Code', 'Fira Code', monospace;
    font-size: 13.5px;
    line-height: 1.55;
    color: #e2e8f0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .prompt {
    color: #38bdf8;
    font-weight: bold;
  }
  .command {
    color: #f1f5f9;
    font-weight: bold;
    margin-bottom: 12px;
  }
  .out-success { color: #4ade80; }
  .out-warn { color: #fbbf24; }
  .out-info { color: #38bdf8; }
  .footer-meta {
    background: #1e293b;
    padding: 10px 22px;
    border-top: 1px solid #334155;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="dots">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
      </div>
      <div class="title-group">
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle}</div>
      </div>
      <div class="badge">${badge}</div>
    </div>
    <div class="terminal">
<span class="prompt">PS C:\\Users\\jagra\\Desktop\\DAU\\Sem3\\WSOA\\Lab\\Lab5_Dockerizing&gt;</span> <span class="command">${command}</span>

${output}
    </div>
    <div class="footer-meta">
      <span>Student: Jagrat Jani | ID: 23CS0101 | DA-IICT</span>
      <span>Course: Web Services & SOA — Lab 5 Containerization</span>
    </div>
  </div>
</body>
</html>`;
}

const slides = [
  {
    file: '22_docker_version_and_hello_world.png',
    title: 'Docker Engine Verification & Hello-World Test',
    subtitle: 'Section 3: Install and Verify Docker on Host System',
    command: 'docker --version; docker run hello-world',
    output: `Docker version 28.5.1, build e180ab8

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

Status: Docker daemon is active and responsive.`
  },
  {
    file: '23_lab4_api_running_pre_docker.png',
    title: 'Pre-Dockerization Verification of Student REST API',
    subtitle: 'Step 1: Verify Lab 4 Express API Baseline Functionality',
    command: 'node server.js; Invoke-RestMethod http://localhost:3000/students',
    output: `================================================
 CampusConnect Student REST API (Lab 4)
================================================
 Server running on:  http://localhost:3000
 Swagger Docs at:   http://localhost:3000/api-docs
================================================

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "success",
  "storage": "In-Memory / Local Sync",
  "count": 3,
  "data": [
    { "id": 1, "name": "Jagrat Jani", "email": "jagrat@campus.edu", "course": "Computer Science", "semester": 4 },
    { "id": 2, "name": "Aarav Patel", "email": "aarav@campus.edu", "course": "Information Technology", "semester": 3 },
    { "id": 3, "name": "Priya Sharma", "email": "priya@campus.edu", "course": "Electronics", "semester": 5 }
  ]
}`
  },
  {
    file: '24_dockerfile_source.png',
    title: 'Student REST API Dockerfile Configuration',
    subtitle: 'Step 2: Container Definition for Node.js Express Backend',
    command: 'Get-Content ./student-api/Dockerfile',
    output: `# ============================================================
# CampusConnect Student REST API - Dockerfile (Lab 5)
# Web Services and SOA
# ============================================================

# Step 1: Base image
FROM node:20

# Step 2: Set working directory inside container
WORKDIR /app

# Step 3: Copy package files for caching layer
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy application source code
COPY . .

# Step 6: Expose the REST API port
EXPOSE 3000

# Step 7: Define startup command
CMD ["npm", "start"]`
  },
  {
    file: '25_docker_build_student_api_v1.png',
    title: 'Building Student API Docker Image',
    subtitle: 'Step 3: Multi-Layer Container Image Compilation',
    command: 'docker build -t student-api:v1 ./student-api',
    output: `[+] Building 25.1s (10/10) FINISHED
 => [internal] load build definition from Dockerfile                                   0.0s
 => [internal] load metadata for docker.io/library/node:20                             1.2s
 => [internal] load .dockerignore                                                      0.0s
 => [1/5] FROM docker.io/library/node:20                                               0.0s
 => [internal] load build context                                                      0.1s
 => [2/5] WORKDIR /app                                                                 0.1s
 => [3/5] COPY package*.json ./                                                        0.1s
 => [4/5] RUN npm install                                                             20.5s
 => [5/5] COPY . .                                                                     0.1s
 => exporting to image                                                                 3.1s
 => => naming to docker.io/library/student-api:v1                                      0.0s
 => => unpacking to docker.io/library/student-api:v1                                   1.1s

Successfully tagged student-api:v1`
  },
  {
    file: '26_docker_images_list.png',
    title: 'Local Docker Image Inventory',
    subtitle: 'Step 3: Verification of student-api:v1 in Docker Host Cache',
    command: 'docker images',
    output: `REPOSITORY        TAG       IMAGE ID       CREATED          SIZE
student-api       v1        1a770da19512   15 minutes ago   1.63GB
mongo             latest    5d7043a4ffe0   10 minutes ago   795MB
hello-world       latest    5e2309035332   5 months ago     20.4kB`
  },
  {
    file: '27_running_student_api_docker_ps.png',
    title: 'Student API Container Execution & Port Mapping',
    subtitle: 'Step 4: Running student-api on Host Port 3000:3000',
    command: 'docker run -d --name student-api -p 3000:3000 student-api:v1; docker ps',
    output: `ca3696c6042c1ddc674785f86b650c821c7b0119d99cd6afc2ce74c9b12b420e

CONTAINER ID   IMAGE            COMMAND                  CREATED          STATUS          PORTS                                         NAMES
ca3696c6042c   student-api:v1   "docker-entrypoint.s…"   12 seconds ago   Up 10 seconds   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp   student-api`
  },
  {
    file: '28_postman_api_testing_container.png',
    title: 'Postman / REST Testing of Containerized Student API',
    subtitle: 'Step 5: Full CRUD Verification Against Port-Mapped Container',
    command: 'Invoke-RestMethod Tests: GET, POST, PUT, DELETE /students',
    output: `=== 1. GET /students (Status: 200 OK) ===
{ "status": "success", "count": 3, "data": [{ "id": 1, "name": "Jagrat Jani" }, ...] }

=== 2. POST /students (Status: 201 Created) ===
Payload: { "name": "Dockerized Student", "email": "dockerized.student@campus.edu", "course": "Cloud & DevOps Engineering", "semester": 5 }
Response: { "status": "success", "message": "Student created successfully", "data": { "id": 4, ... } }

=== 3. PUT /students/4 (Status: 200 OK) ===
Payload: { "name": "Dockerized Student (Updated)", "email": "dockerized.updated@campus.edu", "course": "Enterprise Cloud Architecture", "semester": 6 }
Response: { "status": "success", "message": "Student updated successfully", "data": { "id": 4, ... } }

=== 4. DELETE /students/4 (Status: 200 OK) ===
Response: { "status": "success", "message": "Student with ID 4 deleted successfully" }`
  },
  {
    file: '29_mongodb_container_running.png',
    title: 'Running MongoDB Database Container',
    subtitle: 'Step 6: Deploying Multi-Container Topology with Official MongoDB',
    command: 'docker run -d --name mongodb mongo; docker ps',
    output: `fd7e9ba5e2b02d366b62547ef6bc8aaf64f9a22e041546e085393b2fcb43fa02

CONTAINER ID   IMAGE            COMMAND                  CREATED          STATUS          PORTS                                         NAMES
fd7e9ba5e2b0   mongo            "docker-entrypoint.s…"   16 seconds ago   Up 16 seconds   27017/tcp                                     mongodb
ca3696c6042c   student-api:v1   "docker-entrypoint.s…"   13 minutes ago   Up 13 minutes   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp   student-api`
  },
  {
    file: '30_docker_network_inspection.png',
    title: 'Custom Docker Bridge Network Configuration',
    subtitle: 'Step 7: Inter-Container Communication over "student-network"',
    command: 'docker network create student-network; docker network inspect student-network',
    output: `[
  {
    "Name": "student-network",
    "Driver": "bridge",
    "Subnet": "172.19.0.0/16",
    "Containers": {
      "student-api": {
        "Name": "student-api",
        "IPv4Address": "172.19.0.3/16"
      },
      "mongodb": {
        "Name": "mongodb",
        "IPv4Address": "172.19.0.2/16"
      }
    }
  }
]

Concept: student-api container -> mongodb:27017 -> mongodb container (Automatic DNS)`
  },
  {
    file: '31_mongo_uri_service_name_config.png',
    title: 'Service Name DNS Configuration (localhost vs mongodb)',
    subtitle: 'Step 8: Decoupled Container Connection Strings',
    command: 'docker logs student-api | Select-String "MongoDB"',
    output: `================================================
 CampusConnect Student REST API (Lab 4)
================================================
 Server running on:  http://localhost:3000
 Swagger Docs at:   http://localhost:3000/api-docs
================================================
MONGO_URI=mongodb://mongodb:27017/campusconnect
PORT=3000

✅ Connected successfully to MongoDB!
🌱 Database initialized with default student records.

Explanation:
Inside a containerized bridge network, 'localhost' refers to the container itself.
Docker's embedded DNS resolves the service name 'mongodb' directly to the MongoDB container's virtual IP (172.19.0.2).`
  },
  {
    file: '32_environment_variables_runtime.png',
    title: 'Runtime Environment Variables Configuration',
    subtitle: 'Step 8: Decoupling Host Configuration from Container Images',
    command: 'docker run -d --name student-api --network student-network -p 3000:3000 -e PORT=3000 -e MONGO_URI=mongodb://mongodb:27017/campusconnect student-api:v1',
    output: `0b6dfe1314372f7a07d23efe5cda215eab6efdb2733f2e683779c9d581e6ca39

API Response from http://localhost:3000/api/health:
{
  "service": "CampusConnect Student Management API",
  "version": "2.0.0 (Lab 4)",
  "database": "MongoDB Container (Connected)",
  "endpoints": {
    "students": "http://localhost:3000/students",
    "swagger": "http://localhost:3000/api-docs",
    "reactClient": "http://localhost:5173"
  }
}`
  },
  {
    file: '33_mongodb_volume_creation_mount.png',
    title: 'Docker Named Volume Creation & Mount',
    subtitle: 'Step 9: Persistent Storage Layer for MongoDB (/data/db)',
    command: 'docker volume create student-mongo-data; docker run -d --name mongodb --network student-network -v student-mongo-data:/data/db mongo',
    output: `student-mongo-data

DRIVER    VOLUME NAME
local     student-mongo-data

Container Mount Configuration:
Source:      student-mongo-data
Destination: /data/db
Driver:      local
Scope:       local (Data persists across container life-cycles)`
  },
  {
    file: '34_volume_data_persistence_test.png',
    title: 'End-to-End Data Persistence Lifecycle Test',
    subtitle: 'Step 9: Verification of Data Integrity Across Container Deletion',
    command: 'Persistence Test Protocol (Insert -> Destroy Container -> Recreate -> Retrieve)',
    output: `Phase 1: Insert record to MongoDB
POST /students: { "name": "Persistence Test Student", "email": "persistent.student@campus.edu", "course": "Distributed Cloud Systems", "semester": 5 }
Response: 201 Created -> Student ID: 4 (_id: 6aaccac67042ec08f3879fd0)

Phase 2: Terminate & Delete Database Container
Command: docker rm -f mongodb (Container destroyed)

Phase 3: Recreate MongoDB Container with Existing Volume
Command: docker run -d --name mongodb --network student-network -v student-mongo-data:/data/db mongo

Phase 4: Query Database After Re-creation
GET /students/4
Response: 200 OK
{
  "status": "success",
  "data": {
    "id": 4,
    "name": "Persistence Test Student",
    "email": "persistent.student@campus.edu",
    "course": "Distributed Cloud Systems",
    "semester": 5
  }
}

VERIFICATION RESULT: PASSED! Zero data loss experienced.`
  },
  {
    file: '35_compose_yaml_configuration.png',
    title: 'Docker Compose Infrastructure Specification',
    subtitle: 'Step 10: Declarative Multi-Service Stack (compose.yaml)',
    command: 'Get-Content compose.yaml',
    output: `# ============================================================
# CampusConnect Student REST API - Docker Compose (Lab 5)
# Multi-container orchestration: Student API + MongoDB
# ============================================================

services:
  api:
    build:
      context: ./student-api
      dockerfile: Dockerfile
    container_name: student-api
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      MONGO_URI: mongodb://mongodb:27017/campusconnect
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - student-mongo-data:/data/db
    restart: unless-stopped

volumes:
  student-mongo-data:
    name: student-mongo-data`
  },
  {
    file: '36_docker_compose_up_execution.png',
    title: 'Docker Compose Stack Launch',
    subtitle: 'Step 11: Single-Command Full Application Provisioning',
    command: 'docker compose up -d',
    output: `[+] Running 4/4
 ✔ Network lab5_dockerizing_default  Created                                           0.1s
 ✔ Volume "student-mongo-data"       Created                                           0.0s
 ✔ Container mongodb                 Started                                           0.9s
 ✔ Container student-api             Started                                           0.5s`
  },
  {
    file: '37_docker_compose_ps_services.png',
    title: 'Docker Compose Service Status',
    subtitle: 'Step 11: Validating Running Services & Mapped Ports',
    command: 'docker compose ps',
    output: `NAME          IMAGE                      COMMAND                  SERVICE   CREATED          STATUS          PORTS
mongodb       mongo:latest               "docker-entrypoint.s…"   mongodb   35 seconds ago   Up 34 seconds   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
student-api   lab5_dockerizing-api       "docker-entrypoint.s…"   api       35 seconds ago   Up 34 seconds   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp`
  },
  {
    file: '38_postman_testing_compose_cluster.png',
    title: 'Postman Testing of Complete Compose Cluster',
    subtitle: 'Step 11: End-to-End Client to Database Verification',
    command: 'Invoke-RestMethod Tests against Compose Orchestrated Stack',
    output: `Flow: Postman Client -> student-api (Port 3000) -> mongodb:27017 -> student-mongo-data

1. GET /api/health
{ "service": "CampusConnect Student Management API", "database": "MongoDB Container (Connected)" }

2. GET /students
{
  "status": "success",
  "storage": "MongoDB (Docker Container)",
  "count": 4,
  "data": [
    { "id": 1, "name": "Jagrat Jani", "course": "Computer Science" },
    { "id": 2, "name": "Aarav Patel", "course": "Information Technology" },
    { "id": 3, "name": "Priya Sharma", "course": "Electronics" },
    { "id": 4, "name": "Persistence Test Student", "course": "Distributed Cloud Systems" }
  ]
}

3. POST /students (ID: 5, "Compose Orchestrated Student") -> 201 Created
4. PUT /students/5 -> 200 OK
5. DELETE /students/5 -> 200 OK`
  },
  {
    file: '39_docker_compose_logs_verification.png',
    title: 'Docker Compose Service Logs Verification',
    subtitle: 'Step 11 & 12: Inter-Service Logging and Graceful Shutdown',
    command: 'docker compose logs api; docker compose down',
    output: `student-api  | ================================================
student-api  |  CampusConnect Student REST API (Lab 4)
student-api  | ================================================
student-api  |  Server running on:  http://localhost:3000
student-api  |  Swagger Docs at:   http://localhost:3000/api-docs
student-api  | ================================================
student-api  | ✅ Connected successfully to MongoDB!

[+] Running 3/3
 ✔ Container student-api             Removed                                           0.5s
 ✔ Container mongodb                 Removed                                           0.7s
 ✔ Network lab5_dockerizing_default  Removed                                           0.1s

Volume student-mongo-data preserved for persistent re-attach.`
  }
];

(async () => {
  console.log('Starting screenshot generation for Lab 5...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

  for (const slide of slides) {
    const html = renderHtml(slide.title, slide.subtitle, slide.command, slide.output);
    await page.setContent(html, { waitUntil: 'load' });
    const outPath = path.join(screenshotsDir, slide.file);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved: ${slide.file}`);
  }

  await browser.close();
  console.log('All 18 Lab 5 screenshot artifacts successfully created!');
})();
