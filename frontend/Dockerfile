FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# copy source code to container
COPY . .

# vite's default port
EXPOSE 5173

# boot vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]