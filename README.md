# Hospital System

## Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (LTS version)
- Access to an online MySQL database

## Setup Instructions

### 1. Clone the Repository

Clone this repository to your local machine:

```bash
git clone https://github.com/mohamed-medhat-taher/HospitalSystem.git
cd HospitalSystem
```

## 2. Install Dependencies

Install the required Node.js dependencies using npm:

```bash
npm install
```

This will install all the necessary packages defined in `package.json`.

## 3. Configure Database

Ensure you have the necessary credentials for your MySQL server, including the host, username, password, and database name.

### 3.1 Configure `.env` File

Create a `.env` file in the project root directory and add your MySQL database credentials:

```bash
touch .env
```

Then open the '.env' file and add the following:

```env
DB_HOST=your_mysql_host
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
```

## Run the Server
```bash
<npm start>
```

You should see a message like this:
Server is running on http://localhost:3000


