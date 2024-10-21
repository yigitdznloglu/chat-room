# Chat-Room Web App

This project is a chat-room web application built with a Node.js backend and a React frontend. The project uses MongoDB for data storage and Docker + Docker Compose for containerization.

## Project Structure

```plaintext
chat-room
├── backend
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── secret
│   ├── utils
│   ├── .env
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
├── frontend
│   ├── public
│   ├── src
│   ├── .env
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

## Environment Variables
### Backend


`NODE_ENV`: Environment (production or development)  
`PORT`: Port on which the backend server runs  
`MONGO_URI`: MongoDB connection URI  
`FRONTEND_URL`: URL of the frontend application  
`JWT_SECRET`: Secret key for JWT

-  Example Backend .env

    ```
    NODE_ENV=production
    PORT=3009
    MONGO_URI=mongodb://localhost:27017/chat-room
    FRONTEND_URL=http://localhost:3000
    JWT_SECRET=6381677e383361cbc57818ffbaab41492a5856ae6bf9badf9448ca24ae2281b7a4589a35c347f8b04b23d86cf77cc6b8f26fe1783cfa2095a462f3efb322405b
    ```
### Frontend

`REACT_APP_BACKEND_URL`: URL of the backend API

-  Example Frontend .env

    ```
    REACT_APP_BACKEND_URL=http://localhost:3009
    ```

## Start the application
Navigate to the root directory of the project and run:
```
docker-compose up --build
```
### This command will:
- Build the Docker images for both the backend and frontend.
- Start the MongoDB, backend, and frontend services.

## Access the application
Once the services are up and running, you can access the application:

`Frontend`: http://localhost:3000  
`Backend API`: http://localhost:3009