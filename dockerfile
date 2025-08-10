FROM node:16-alpine
COPY ./package.json ./
COPY ./package-lock.json ./
COPY tsconfig.json ./
RUN npm install
COPY ./ ./
RUN npm run build
EXPOSE 3000 2222
CMD ["npm", "start"]