# 📌 Project Documentation

## 📖 Introduction

This document serves as the official project documentation. It will organize all relevant information, from the project's conception to its final implementation.

## 🎯 Project Objectives

The main objective of this project is to develop a customized ERP and CRM system for a KiteSurf school located in Nuevo Portal, Huelva. To achieve this, we will leverage Odoo's functionalities, adapting and customizing them to meet the specific needs of the business. A key aspect of the project is the integration of the ERP with the existing WordPress website, ensuring seamless synchronization between both platforms. The ultimate goal is to achieve efficient school management through an optimized and fully integrated technological solution.

## 🛠️ Technologies Used

- 🏗️ Odoo
- 🗄️ PostgreSQL
- 🐳 Docker
- 🐍 Python 3.12
- 🌐 PHP
- 🎨 HTML
- 🎭 CSS

## 📂 Project Structure

The project is managed as a Git repository under the main folder **flecha-extreme**, which represents the company's name. Inside this folder, the structure is organized into three main directories:

1. **📦 Docker**: Contains the `docker-compose.yml` file and the volumes for the Docker container where the PostgreSQL database used by Odoo is hosted.
2. **📜 odoo**: Stores the entire Odoo system, including customized addons and the ERP source code.
3. **🌍 Flecha Extreme**: This folder is dedicated to the company's website, containing the source code and necessary files for its WordPress-based implementation.

This structure ensures clear and modular organization of the project, facilitating maintenance and the integration between Odoo and the company's website.

## 💻 Installing Odoo on Mac

### 1️⃣ Obtain the Odoo Source Code

You can clone the official Odoo repository using Git:

```bash
git clone https://github.com/odoo/odoo.git
```

### 2️⃣ Set Up the Environment

- **🐍 Python**: Odoo requires Python 3.12. Verify the installed version with:
  ```bash
  python3 --version
  ```

- **🐳 PostgreSQL with Docker**: Instead of installing PostgreSQL manually, we use a Docker container with a `docker-compose.yml` file that specifies the database settings.

- **🌍 Creating a Virtual Environment**: To ensure that Odoo uses the correct Python version and to avoid conflicts with other dependencies, a virtual environment must be created inside the `odoo` directory. Navigate to the `odoo` directory and run the following command:
  ```bash
  python3.12 -m venv <environment_name>
  ```
  This will create a virtual environment with Python 3.12. Once created, activate it using:
  ```bash
  source <environment_name>/bin/activate
  ```
  With the virtual environment activated, install the necessary base tools by running:
  ```bash
  python3 -m pip install setuptools wheel
  ```

- **📦 Installing Dependencies**: Now that the virtual environment is activated and set up in the `odoo` directory, install the required dependencies by executing:
  ```bash
  pip install -r requirements.txt
  ```
  This ensures that all the dependencies required by Odoo are installed within the virtual environment without affecting other system configurations.

### 3️⃣ Configure Odoo

- Create an Odoo configuration file (`odoo.conf`) inside the `odoo` directory with the following settings:
  ```ini
  [options]
  http_port = 8071
  addons_path = addons
  db_host = your_host
  db_port = 5432
  db_user = your_user
  db_password = your_password
  db_name = your_db
  ```
- Ensure that the PostgreSQL container is running before starting Odoo.

### 4️⃣ Docker Configuration

To manage the PostgreSQL database used by Odoo, we use a Docker container defined in the `docker-compose.yml` file:

```yaml
services:
  db:
    image: postgres:latest
    container_name: your_container
    restart: always
    environment:
      POSTGRES_DB: your_db
      POSTGRES_USER: your_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - ./volumes/postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
volumes:
    postgres_data:
```

This file ensures data persistence and the correct database environment configuration for Odoo.

### 5️⃣ Running Odoo

- Once dependencies are configured and PostgreSQL is running via Docker, you can start Odoo by running:
  ```bash
  python3 odoo-bin -c odoo.conf
  ```
- Access Odoo's web interface at `http://localhost:8071`.

## ✅ Implemented Features

(List and describe the features that have already been developed.)

## 🚀 Features in Development

(List and describe the features currently in progress.)

## 🔀 Version Control and Planning

- Use of Git branches: `Main`, `Release`, `Feature`

## 📝 Notes and Learnings

(Add any relevant information regarding the development process, future improvements, fixed issues, etc.)

## 📚 References

(List any reference materials or external documentation used.)

