require('dotenv').config();

/******** SERVER ******* */
const PORT = process.env.PORT;

/********** DATABASE **********/
const PG_HOST = process.env.PG_HOST;
const PG_USER = process.env.PG_USER;
const PG_PASS = process.env.PG_PASS;
const PG_NAME = process.env.PG_NAME;

/************ AWS **********/
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION

/*********** KEY ********* */
const PG_KEY = process.env.PG_KEY;

/*********** ROUTE *********/
const OCR_ROUTE = process.env.OCR_ROUTE;

module.exports = {
    //SERVER
    PORT,
    //DATABASE
    PG_HOST,
    PG_USER,
    PG_PASS,
    PG_NAME,
    //KEY
    PG_KEY,
    //OCR ROUTE
    OCR_ROUTE,
    //AWS
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION
};
