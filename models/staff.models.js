const mongoose = require("mongoose");
const staffSchema = new mongoose.Schema({
    staffId:{
        type:String,
        required:true,
        unique:true,
    },
    name: {
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    phone:{
        type:Number,
        required:true,
    },
    department:{
        type:String,
        required:true,
        enum:["Radiologist", "Typist","Receptionist", "PRO","Helper","Other"]
    },
    joiningDate: {
        type:Date,
        required: true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    sundayDuty:{
        type:Boolean,
        default:false
    }
}, 
{ timestamps: true}
);

module.exports = mongoose.model("Staff", staffSchema);