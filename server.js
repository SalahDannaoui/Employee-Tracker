const cTable = require('console.table');
const inquirer = require('inquirer');
const mysql = require('mysql2');
const express = require('express');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'TQ17DANdg1917',
        database: 'company_db'
    },
);

db.connect((error) => {
    if (error) throw error;
    mainQuestions();
});

const mainQuestions = () => {
    inquirer.prompt([
        {
            name: "answer",
            type: "list",
            message: "What would you like to do?",
            choices: [
                "View All Departments",
                "View All Roles",
                "View All Employees",
                "Add a Department",
                "Add a Role",
                "Add an Employee",
                "Update an Employee Role",
                "Update an Employee's Manager",
                "Quit"
            ]
        }
    ])
        .then((inquirerData) => {

            if (inquirerData.answer === "View All Departments") {
                view_allDepartments();
            }

            if (inquirerData.answer === "View All Roles") {
                view_allRoles();
            }

            if (inquirerData.answer === "View All Employees") {
                view_allEmployees();
            }

            if (inquirerData.answer === "Add a Department") {
                add_department();
            }

            if (inquirerData.answer === "Add a Role") {
                add_role();
            }

            if (inquirerData.answer === "Add an Employee") {
                add_employee();
            }

            if (inquirerData.answer === "Update an Employee Role") {
                update_employeeRole();
            }

            if (inquirerData.answer === "Update an Employee's Manager") {
                update_employeeManager();
            }

            if (inquirerData.answer === "Quit") {
                db.end();
            }

        });
}


function view_allDepartments() {
    db.query(`SELECT id, name FROM department`, function (err, department_results) {
        console.log('');
        console.table(department_results);
        console.log('');
        mainQuestions();
    });

}

function view_allRoles() {
    const SQLquery = `SELECT role.id, title, salary, department.name AS department 
    FROM role 
    JOIN department 
    ON role.department_id = department.id`;

    db.query(SQLquery, function (err, role_results) {
        console.log('');
        console.table(role_results);
        console.log('');
        mainQuestions();
    });

}

function view_allEmployees() {
    const SQLquery = `SELECT  e.id, e.first_name, e.last_name, 
    role.title, department.name AS department, role.salary,
    CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    INNER JOIN role
    ON role_id = role.id
    INNER JOIN department
    ON role.department_id = department.id
    LEFT JOIN employee m
    ON e.manager_id = m.id`;

    db.query(SQLquery, function (err, employee_results) {
        console.log('');
        console.table(employee_results);
        console.log('');
        mainQuestions();
    });

}


function add_department() {
    inquirer.prompt([
        {
            name: 'department',
            type: 'input',
            message: 'What is the department name?',
        }
    ])
        .then((response) => {
            const SQLquery = `INSERT INTO department (name)
            VALUES ("${response.department}")`;

            db.query(SQLquery, function (err, results) {
                console.info(`Added ${response.department} to the database`);
                mainQuestions();
            });
        });
};

function add_role() {

    db.query("SELECT name FROM department", function (err, department_results) {

        inquirer.prompt([
            {
                name: 'role',
                type: 'input',
                message: "What is the new role's name?",
            },
            {
                name: 'salary',
                type: 'input',
                message: "What is the salary of the new role?",
            },
            {
                name: 'department',
                type: 'list',
                message: "What is the department of the new role?",
                choices: department_results,
            }
        ])
            .then((inquirerData) => {

                db.query(`SELECT id FROM department WHERE name = "${inquirerData.department}"`, function (err, department_result) {
                    
                    const SQLquery = `INSERT INTO role (title, salary, department_id)
                    VALUES ("${inquirerData.role}", ${inquirerData.salary}, ${department_result[0].id})`;

                    db.query(SQLquery, function (err, results) {
                        console.log(`Added ${inquirerData.role} to the database`);
                        mainQuestions();
                    });
                });
            });

    });
};

function add_employee() {

    db.query("SELECT * FROM role", function (err, roles_results) {

        const rolesArray = roles_results.map(({ id, title }) => ({ name: title, id: id }));

        db.query("SELECT * FROM employee", function (err, managers_results) {

            const managersArray = managers_results.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, id: id }));
            
            const noneManager = {
                name: "None",
                id: null,
            }

            managersArray.push(noneManager);

            inquirer.prompt([
                {
                    name: 'first_name',
                    type: 'input',
                    message: "What is the employee's first name?",
                },
                {
                    name: 'last_name',
                    type: 'input',
                    message: "What is the employee's last name?",
                },
                {
                    name: 'role',
                    type: 'list',
                    message: "What is the employee's role?",
                    choices: rolesArray,
                },
                {
                    name: 'manager_fullname',
                    type: 'list',
                    message: "Who is the employee's manager?",
                    choices: managersArray,
                }
            ])
                .then((inquirerData) => {

                    const roleID = rolesArray.filter(function (element) {
                        if (element.name === inquirerData.role) {
                            return element.id
                        }

                    });

                    let SQLquery;
                    if (inquirerData.manager_fullname != 'None') {
                        const managerID = managersArray.filter(function (element) {
                            if (element.name === inquirerData.manager_fullname) {
                                return element.id
                            }

                        });

                        SQLquery = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                        VALUES ("${inquirerData.first_name}", "${inquirerData.last_name}", ${roleID[0].id}, ${managerID[0].id})`;
                    } else {
                        SQLquery = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                        VALUES ("${inquirerData.first_name}", "${inquirerData.last_name}", ${roleID[0].id}, NULL)`;
                    }

                    db.query(SQLquery, function (err, results) {
                        console.log(`Added ${inquirerData.first_name} ${inquirerData.last_name} to the database`);
                        mainQuestions();
                    });
                });
        });
    });
};

function update_employeeRole() {

    // select an employee to update and their new role and this information is updated in the database 
    db.query("SELECT * FROM role", function (err, roles_results) {
        const rolesArray = roles_results.map(({ id, title }) => ({ name: title, id: id }));

        db.query("SELECT * FROM employee", function (err, employees_results) {

            const employeesArray = employees_results.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, id: id }));
            inquirer.prompt([

                {
                    name: 'employee_fullname',
                    type: 'list',
                    message: "Which employee's role do you want to change?",
                    choices: employeesArray,
                },
                {
                    name: 'role',
                    type: 'list',
                    message: "What is the employee's new role?",
                    choices: rolesArray,
                }
            ])
                .then((inquirerData) => {

                    const roleID = rolesArray.filter(function (element) {
                        if (element.name === inquirerData.role) {
                            return element.id
                        }

                    });

                    const employeeID = employeesArray.filter(function (element) {
                        if (element.name === inquirerData.employee_fullname) {
                            return element.id
                        }

                    });

                    const SQLquery = `UPDATE employee
                    SET role_id = ${roleID[0].id}
                    WHERE id = ${employeeID[0].id}`;

                    db.query(SQLquery, function (err, results) {
                        console.log(`Updated ${inquirerData.employee_fullname} in the database`);
                        mainQuestions();
                    });
                });
        });
    });
};

function update_employeeManager() {
    db.query("SELECT * FROM employee", function (err, employees_results) {

        const employeesArray = employees_results.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, id: id }));
        
        inquirer.prompt([

            {
                name: 'employee',
                type: 'list',
                message: "Which employee's manager do you want to change?",
                choices: employeesArray,
            },
            {
                name: 'manager',
                type: 'list',
                message: "Who is the employee's new manager?",
                choices: employeesArray,
            }
        ])
            .then((inquirerData) => {

                const managerID = employeesArray.filter(function (element) {
                    if (element.name === inquirerData.manager) {
                        return element.id
                    }

                });

                const employeeID = employeesArray.filter(function (element) {
                    if (element.name === inquirerData.employee) {
                        return element.id
                    }

                });

                const SQLquery = `UPDATE employee
                SET manager_id = ${managerID[0].id}
                WHERE id = ${employeeID[0].id}`;

                db.query(SQLquery, function (err, results) {
                    console.log(`Updated ${inquirerData.employee} in the database`);
                    mainQuestions();
                });
            });
    });
};