# Express API

This application is built with [Express](https://expressjs.com) 4.x

Before installing, download and install Node.js. Node.js 0.10 or higher is required.

## Installation

1. Git clone or pull this source.
2. Run `npm install` to install dependencies.
3. Run `npm start` to start the server.

Run at: http://localhost:3000 or according to your port settings.

## Configuration

Create `.env` file, then setup the 'Datasources' and any other
configuration relevant for your application.

## How to use

### Access Token

Request `POST` token with your credentials to get your access token, `http://localhost:3000/token`

The response you get in the form of a json object are:<br />
`request_time` is the time your request in unix<br />
`response_code` is response status code<br />
`success` is a status of the success of the request, `true` or `false`<br />
`total_data` is the number of response data obtained<br />
`data` is the result data, contains: user id, token, token expire, refresh token, refresh token expire<br />

### Get List of All Data

Request `GET` list of all data (example: users) with header bearer type auth token, `http://localhost:3000/users`

The response you get in the form of a json object are:<br />
`request_time` is the time your request in unix<br />
`response_code` is response status code<br />
`success` is a status of the success of the request, `true` or `false`<br />
`total_data` is the number of response data obtained<br />
`data` is the result data, contains array of object data. The number of data is limited to a maximum of 20 data<br />
`paging` is pagination info, contains: current, next, previous, first, last. It can be helpful to create pagination on Frontend App<br />

### Get Detail of Data

Request `GET` detail of data by id (example: users) with header bearer type auth token, `http://localhost:3000/users/2`

The response you get in the form of a json object are:<br />
`request_time` is the time your request in unix<br />
`response_code` is response status code<br />
`success` is a status of the success of the request, `true` or `false`<br />
`total_data` is the number of response data obtained<br />
`data` is the result data, contains object row of data. The number of data is limited to a maximum of 20 data<br />

### Create New Data

Request `POST` to create new data (example: users) with header bearer type auth token, `http://localhost:3000/users`

The response you get in the form of a json object are:<br />
`request_time` is the time your request in unix<br />
`response_code` is response status code<br />
`success` is a status of the success of the request, `true` or `false`<br />
`total_data` is the number of response data obtained<br />
`data` is the result data, contains last inserted data id<br />

### Update Existing Data

Request `PUT` to update existing data by id (example: users) with header bearer type auth token, `http://localhost:3000/users/id`

The response you get in the form of a json object are:<br />
`request_time` is the time your request in unix<br />
`response_code` is response status code<br />
`success` is a status of the success of the request, `true` or `false`<br />
`total_data` is the number of response data obtained<br />
`data` is the result data, contains last updated data id<br />

### Delete Existing Data

Request `DELETE` to delete existing data by id (example: users) with header bearer type auth token, `http://localhost:3000/users/id`

The response you get in the form of a json object are:<br />
`request_time` is the time your request in unix<br />
`response_code` is response status code<br />
`success` is a status of the success of the request, `true` or `false`<br />
`total_data` is the number of response data obtained<br />
`data` is the result data, contains last deleted data id<br />
