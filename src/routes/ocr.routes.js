const express =  require('express');
const router = express.Router()
const { OCR_ROUTE } = require('../global/_var')

/******* CONTROLLER *******/

const getInfoController = require('../controllers/getInfo.Controller')


router.post(OCR_ROUTE,getInfoController.uploadArchive)

module.exports = router;