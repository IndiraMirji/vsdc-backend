const mongoose = require("mongoose");
const bcyrpt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:["admin","staff"],
        default:"staff"
    },
    isActive:{
        type:Boolean,
        default:true
    }
}, {
timestamps:true
}
);

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return;
    this.password = await bcyrpt.hash(this.password, 10);
    
});


userSchema.methods.comparePassword = async function(enteredpassword){
    return await bcyrpt.compare(enteredpassword,this.password);
}

module.exports = mongoose.model("User",userSchema);