# 📌 Project Documentation

## 📖 Introduction
This document serves as the official documentation for the project. It will organize all relevant information, from the project's inception to its final implementation.

## 🎯 Project Objectives
The main objective of this project is to develop a customized ERP and CRM system for a KiteSurf school located in Nuevo Portal, Huelva. To achieve this, we will leverage Odoo's functionalities, adapting and customizing them to meet the specific needs of the business. A key aspect of the project is integrating the ERP with the company's existing WordPress website, ensuring smooth synchronization between both platforms. The ultimate goal is to create an efficient management system through an optimized and fully integrated technological solution.

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

This structure ensures a clear and modular organization of the project, facilitating maintenance and the integration between Odoo and the company's website.

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
   - **🐳 PostgreSQL with Docker**: Instead of installing PostgreSQL manually, we use a Docker container with a `docker-compose.yml` file that defines the database settings.
   - **📦 Dependencies**: Install the required dependencies by navigating to the Odoo directory and running:
     ```bash
     pip3 install -r requirements.txt
     ```

### 3️⃣ Configure Odoo
   - Create an Odoo configuration file (`odoo.conf`) inside the `odoo` directory with the following settings:
     ```ini
     [options]
     http_port = 8071
     addons_path = adding
     db_host = localhost
     db_port = 5432
     db_user = flecha-extreme
     db_password = 0091Robe*#
     db_name = postgres
     ```
   - Ensure that the PostgreSQL container is running before starting Odoo.

### 4️⃣ Docker Configuration
To manage the PostgreSQL database used by Odoo, we use a Docker container defined in the `docker-compose.yml` file:
   ```yaml
   services:
     db:
       image: postgres:latest
       container_name: odoo_db
       restart: always
       environment:
         POSTGRES_DB: postgres
         POSTGRES_USER: flecha-extreme
         POSTGRES_PASSWORD: 0091Robe*#
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

