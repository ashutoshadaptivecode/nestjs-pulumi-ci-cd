FROM node:16

# Create app directory

WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY . .

# WORKDIR /app

RUN npm run build




# COPY --from=build /dist ./dist
# COPY --from=build /node_modules ./node_modules