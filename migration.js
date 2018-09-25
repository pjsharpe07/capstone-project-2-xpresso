//create db skeleton
let sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./database.sqlite');

//create all tables
db.serialize(() => {
  //create employee table
  db.run('DROP TABLE IF EXISTS Employee', error => {
    if (error) {
      throw(error);
    }
	})
  db.run(`CREATE TABLE Employee (id integer PRIMARY KEY, name text NOT NULL, position text NOT NULL, wage integer NOT NULL, is_current_employee integer DEFAULT 1)`
  )
  //create Timesheet table
  db.run('DROP TABLE IF EXISTS Timesheet', error => {
    if (error) {
      throw(error);
    }
	})
  db.run(`CREATE TABLE Timesheet (id integer PRIMARY KEY, hours integer NOT NULL, rate integer NOT NULL, date integer NOT NULL, employee_id integer NOT NULL, FOREIGN KEY (employee_id) REFERENCES Employee(employee_id))`
  )
  //create menu table
  db.run('DROP TABLE IF EXISTS Menu', error => {
    if (error) {
      throw(error);
    }
	})
  db.run(`CREATE TABLE Menu (id integer PRIMARY KEY, title text NOT NULL)`
  )
  //create menuItem table
  db.run('DROP TABLE IF EXISTS MenuItem', error => {
    if (error) {
      throw(error);
    }
	})
  db.run(`CREATE TABLE MenuItem (id integer PRIMARY KEY, name text NOT NULL, description text, inventory integer NOT NULL, price integer NOT NULL, menu_id integer NOT NULL, FOREIGN KEY (menu_id) REFERENCES Menu(id))`
  )
});
