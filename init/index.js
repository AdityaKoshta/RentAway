const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require("../MODELS/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
.then(()=>{
    console.log("Connected to DB");
}).catch((err)=>{
    console.log(err);
})

async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB = async () =>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "6746931b75956d2dc8f5e683"}));
    await Listing.insertMany(initData.data);
    console.log("Data was Initialized");
}

initDB();