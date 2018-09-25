//set-up express app
const express = require('express');
const app = express();

//set up server
const PORT = process.env.PORT || 4001;
//db skeleton
let sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

//body-parsing middleware
const bodyParser = require('body-parser');
app.use(bodyParser.json());
//logging middleware
const morgan = require('morgan');
app.use(morgan('tiny'));

app.use(express.static('public'));


//Router
const apiRouter = express.Router();
app.use('/api', apiRouter)

//get all employees
apiRouter.get('/employees', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (error, rows) => {
    res.status(200).send({employees : rows})
  })
})

//creates a new employee and adds it
apiRouter.post('/employees', (req, res, next) => {
  const sql = `INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)`
  const values = {
    $name : req.body.employee.name,
    $position : req.body.employee.position,
    $wage : req.body.employee.wage
  };
  db.run(sql, values, function(error) {
    if (error) {
      res.sendStatus(400);
    }
    let newEmployee = this.lastID;
    db.get(`SELECT * FROM Employee WHERE id = ${newEmployee}`, (error, row) => {
      if (error) {
        throw error;
      } else if (!row) {
        res.sendStatus(400);
      }
      res.status(201).send({employee : row})
    })
  })
})

//get employee by id
apiRouter.get('/employees/:id', (req, res, next) => {
  let employeeId = Number(req.params.id)
  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send({employee : row})
  })
})

//update employee
apiRouter.put('/employees/:id', (req, res, next) => {
  let employeeId = Number(req.params.id);
  const sql = `UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE Employee.id = ${employeeId}`;
  const values = {
    $name : req.body.employee.name,
    $position : req.body.employee.position,
    $wage : req.body.employee.wage
  };
  db.run(sql, values, function(error) {
    if (error) {
      res.sendStatus(400);
      return;
    }
    db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
      if (!row) {
        res.sendStatus(404);
        return;
      }
      res.status(200).send({employee : row})
    })
  })
})

//delete an employee
apiRouter.delete('/employees/:id', (req, res, next) => {
  let employeeId = Number(req.params.id);
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = ${employeeId}`, (error) => {
    if (error) {
      res.sendStatus(404);
      return;
    }
    db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
      res.status(200).send({employee : row})
    })
  })
})

//get an employee's timesheet
apiRouter.get('/employees/:id/timesheets', (req, res, next) => {
  let employeeId = Number(req.params.id);
  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    db.all(`SELECT * FROM Timesheet WHERE employee_id = ${employeeId}`, (error, rows) => {
      res.status(200).send({timesheets : rows})
    })
  })
})

//create new timesheet for employee
apiRouter.post('/employees/:id/timesheets', (req, res, next) => {
  let employeeId = req.params.id;

  const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)`
  const values = {
    $hours : req.body.timesheet.hours,
    $rate : req.body.timesheet.rate,
    $date : req.body.timesheet.date,
    $employee_id : employeeId
  };

  db.run(sql, values, function(error) {
    if (error) {
      res.sendStatus(400);
      return;
    }
    db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
      if (!row) {
        res.sendStatus(404);
      }
      let newTimesheetId = this.lastID
      db.get(`SELECT * FROM Timesheet WHERE id = ${newTimesheetId}`, (error, row) => {
        res.status(201).send({timesheet : row})
      })
    })
  })
})


//update employee timesheet
apiRouter.put('/employees/:employeeId/timesheets/:timesheetId', (req, res, next) => {
  let employeeId = req.params.employeeId;
  let timesheetId = req.params.timesheetId;
  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id`;
    const values = {
      $hours : req.body.timesheet.hours,
      $rate : req.body.timesheet.rate,
      $date : req.body.timesheet.date,
      $employee_id : employeeId
    };
    db.run(sql, values, function(error) {
      if (error) {
        res.sendStatus(400);
        return;
      }
      db.get(`SELECT * FROM Timesheet WHERE id = ${timesheetId}`, (error, row) => {
        if (!row) {
          res.sendStatus(404);
          return;
        }
        res.status(200).send({timesheet : row})
      })
    })
  })
})

//delete timesheet
apiRouter.delete('/employees/:employeeId/timesheets/:timesheetId', (req, res, next) => {
  let employeeId = req.params.employeeId;
  let timesheetId = req.params.timesheetId;
  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    db.get(`SELECT * FROM Timesheet WHERE id = ${timesheetId}`, (error, row) => {
      if (!row) {
        res.sendStatus(404);
        return;
      }
      db.run(`DELETE FROM Timesheet WHERE id = ${timesheetId}`, (error, row) => {
        res.status(204).send();
      })
    })
  })
})

//get all menus
apiRouter.get('/menus', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (error, rows) => {
    res.status(200).send({menus : rows})
  })
})

//create a new menu
apiRouter.post('/menus', (req, res, next) => {
  const sql = `INSERT INTO Menu (title) VALUES ($title)`
  const values = {
    $title : req.body.menu.title
  }
  db.run(sql, values, function(error) {
    if (error) {
      res.sendStatus(400);
      return;
    }
    const newMenuId = this.lastID;
    db.get(`SELECT * FROM Menu WHERE id = ${newMenuId}`, (error, row) => {
      res.status(201).send({menu : row})
    })
  })
})


//get menu by id
apiRouter.get('/menus/:id', (req, res, next) => {
  let menuId = Number(req.params.id);
  db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send({menu : row})
  })
})

apiRouter.put('/menus/:id', (req, res, next) => {
  let menuId = Number(req.params.id);
  const sql = `UPDATE Menu SET title = $title WHERE Menu.id = ${menuId}`
  const values = {
    $title : req.body.menu.title
  }
  db.run(sql, values, function(error) {
    if (error) {
      res.sendStatus(400);
    }
    db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, (error, row) => {
      if (!row) {
        res.sendStatus(404);
      }
      res.status(200).send({menu : row})
    })
  })
})
//delete a menu so long as it does not have menuItems
apiRouter.delete('/menus/:id', (req, res, next) => {
  let menuId = Number(req.params.id);
  db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    db.get(`SELECT * FROM MenuItem WHERE menu_id = ${menuId}`, (error, row) => {
      if (row) {
        res.sendStatus(400);
        return;
      }
      db.run(`DELETE FROM Menu WHERE id = ${menuId}`, (error, row) => {
        res.status(204).send();
      })
    })
  })
})

//get all menuItems
apiRouter.get('/menus/:menuId/menu-items', (req, res, next) => {
  const menuId = Number(req.params.menuId)
  db.get(`SELECT * FROM Menu WHERE id=${menuId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    db.all(`SELECT * FROM MenuItem WHERE menu_id=${menuId}`, (error, rows) => {
      res.status(200).send({menuItems : rows})
    })
  })
})

//create a new menuItem
apiRouter.post('/menus/:menuId/menu-items', (req, res, next) => {
  const menuId = Number(req.params.menuId);
  db.get(`SELECT * FROM Menu WHERE id=${menuId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)`;
    const values = {
      $name : req.body.menuItem.name,
      $description : req.body.menuItem.description,
      $inventory : req.body.menuItem.inventory,
      $price : req.body.menuItem.price,
      $menu_id : menuId
    }
    db.run(sql, values, function(error) {
      if (error) {
        res.sendStatus(400);
        return;
      }
      let newMenuItemId = this.lastID;
      db.get(`SELECT * FROM MenuItem WHERE id=${newMenuItemId}`, (error, row) => {
        res.status(201).send({menuItem : row})
      })
    })
  })
})
//update a menuItem
apiRouter.put('/menus/:menuId/menu-items/:menuItemId', (req, res, next) => {
  let menuId = Number(req.params.menuId);
  let menuItemId = Number(req.params.menuItemId);
  db.get(`SELECT * FROM Menu WHERE id=${menuId}`, (error, row) => {
    if (!row) {
      res.sendStatus(404);
      return;
    }
    const sql = `UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE MenuItem.id=${menuItemId}`;
    const values = {
      $name : req.body.menuItem.name,
      $description : req.body.menuItem.description,
      $inventory : req.body.menuItem.inventory,
      $price : req.body.menuItem.price
    };
    db.run(sql, values, function(error) {
      if (error) {
        res.sendStatus(400);
        return;
      }
      db.get(`SELECT * FROM MenuItem WHERE id=${menuItemId}`, (error, row) => {
        if (!row) {
          res.sendStatus(404);
          return;
        }
        res.status(200).send({menuItem : row})
      })
    })
  })
})

//delete a menu item
apiRouter.delete('/menus/:menuId/menu-items/:menuItemId', (req, res, next) => {
  let menuId = Number(req.params.menuId);
  let menuItemId = Number(req.params.menuItemId);
  db.get(`SELECT * FROM Menu WHERE id=${menuId}`, (error, row) => {
    if (!row) {
      res.sendStatus(400);
      return;
    }
    db.get(`SELECT * FROM MenuItem WHERE id=${menuItemId}`, (error, row) => {
      if (!row) {
        res.sendStatus(404);
        return;
      }
      db.run(`DELETE FROM MenuItem WHERE id=${menuItemId}`, (error, row) => {
        if (error) {
          res.sendStatus(404);
          return;
        }
        res.status(204).send();
      })
    })
  })
})

//start server listening
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});


module.exports = app;
