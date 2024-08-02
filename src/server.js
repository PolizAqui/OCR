const express = require('express')
const app =  express()
const cors = require('cors')
const _var = require('./global/_var')


/******** DEPENDECY  ********/

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors());


/********* ROUTES **********/

const routes = require('./routes/ocr.routes')

/********* SERVER *********/

app.listen(_var.PORT, (err) => {
    if (err) throw err;
    console.log(`Servidor inicializado en: http://localhost:${_var.PORT}`);
})

app.use(routes)