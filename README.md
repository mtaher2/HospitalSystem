# Hospital Management System

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

A comprehensive hospital management system built with Node.js and MySQL, designed to streamline hospital operations and improve patient care management.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Git](https://git-scm.com/) (Latest version)
- [Node.js](https://nodejs.org/) (LTS version)
- [MySQL](https://www.mysql.com/) (Latest version)
- A modern web browser

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/mtaher2/HospitalSystem.git
cd HospitalSystem
```

### 2. Install Dependencies
```bash
npm install
```

## Configuration

### Database Setup
1. Create a `.env` file in the project root:
```bash
touch .env
```

2. Add your configuration details:
```env
DB_HOST=your_mysql_host
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

Pass_key=your_google_passKey
email_send=your_email
```

## Usage

Start the server:
```bash
npm start
```
The application will be available at: http://localhost:3000

## Contributing

### Sprint Workflow
1. Start in the sprint branch "SprintXX"
2. Create a new branch (one for each sprint task). Give it a good name.
3. Checkout the new branch, you should only commit to this branch until the task is complete and tested.
4. Complete the sprint task, making commits often (be sure to write good commit messages).
5. Test your new code, do not merge anything until it is working correctly.
6. Make sure SprintXX is up to date with the remote and merge SprintXX into your task branch (DO NOT merge your task branch into SprintXX yet).
7. Test again to ensure others' changes do not break your code.
8. If everything is working, merge back into SprintXX. Only fast forwards are allowed.

### General Contribution Guidelines
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by Avatar Team</sub>
</div>


