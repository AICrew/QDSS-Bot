const express = require('express');
const admin = express.Router();
const passwordProtected = require('express-password-protect');
const dashboard = require('../dashboard-client.js');


// Admin
const Admin = {
  username: process.env.ADMIN,
  password: process.env.AdminPassword,
  maxAge: 86400000 // 1 day
}

admin.use(passwordProtected(Admin));

admin.get('/richieste', (req, res) => {
  const db = dashboard.client.database.open();
  db.allAsync("SELECT * FROM Richieste")
    .then( (rows) => 
    {
      if (rows !== undefined && rows.length > 0) 
      {
        const request = new Array();
  
        for (let i = 0; i < rows.length; i++) {
          request.push({ requestId: rows[i].RequestID, user: rows[i].User, messaggio: rows[i].Messaggio, status: rows[i].Status });
        }
        requestParsed = JSON.stringify(request);
        res.render('richieste', { richieste: requestParsed, path: req.path });
      }
    }).catch( (error) => console.error(error))
    .finally( () => db.close() );
});

admin.post('/richieste', (req, res) => {
  const RequestID = req.body.RequestID;
  const Status = req.body.Status;
  if (Status && RequestID)
  {
    const db = dashboard.client.database.open();
    db.runAsync('UPDATE Richieste SET Status = ? WHERE RequestID = ?', [Status, RequestID])
      .catch( (error) => console.error(error))
      .finally( () => db.close() );
  }
  res.redirect('/admin/richieste');
});

module.exports = admin;
