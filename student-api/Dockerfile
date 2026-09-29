# ============================================================
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
CMD ["npm", "start"]
